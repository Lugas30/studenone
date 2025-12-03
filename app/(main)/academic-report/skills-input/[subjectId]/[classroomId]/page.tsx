"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Typography,
  Layout,
  Divider,
  InputNumber,
  Spin,
  Alert,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useParams } from "next/navigation";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// Pastikan variabel lingkungan (NEXT_PUBLIC_API_URL) sudah terdefinisi
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ===================================
// 1. DEFINISI TIPE & INTERFACE
// ===================================
interface AcademicInfo {
  year: string;
  semester: string;
  academicId: number | null;
}

interface Predicate {
  id: number;
  predicate: string;
  descriptive: string;
  min_value: number;
  max_value: number;
  academic_id: number;
}

interface StudentPerformance {
  key: string;
  studentId: number;
  grade: string | number;
  fullName: string;

  perf: number[];
  perfAvrg: number;
  prod: number[];
  prodAvrg: number;
  proj: number[];
  projAvrg: number;
  final: number;
  predicate: string;
  desc: string;
}

interface ApiErrorResponse {
  message?: string;
}

// ===================================
// 2. FUNGSI UTILITY (PERHITUNGAN)
// ===================================

/**
 * Menghitung rata-rata nilai dan menentukan nilai akhir (final) serta predikat.
 * @param data Data performa siswa saat ini.
 * @param predicates Daftar predikat yang aktif.
 * @returns StudentPerformance yang diperbarui.
 */
const calculatePerformanceMetrics = (
  data: StudentPerformance,
  predicates: Predicate[]
): StudentPerformance => {
  const avg = (arr: number[]) => {
    const validValues = arr.filter(
      (v) => v !== undefined && v !== null && !isNaN(v) && v >= 0 && v <= 100
    );
    if (validValues.length === 0) return 0;
    return parseFloat(
      (validValues.reduce((a, b) => a + b, 0) / validValues.length).toFixed(1)
    );
  };

  const perfAvrg = avg(data.perf);
  const prodAvrg = avg(data.prod);
  const projAvrg = avg(data.proj);

  // Hitung Nilai Akhir: rata-rata dari tiga rata-rata yang nilainya > 0
  const averages = [perfAvrg, prodAvrg, projAvrg].filter((v) => v > 0);
  const final =
    averages.length > 0
      ? parseFloat(
          (averages.reduce((a, b) => a + b, 0) / averages.length).toFixed(0)
        )
      : 0;

  let predicate = "";
  let desc = "";

  const sortedPredicates = [...predicates].sort(
    (a, b) => b.min_value - a.min_value
  );

  const matchedPredicate = sortedPredicates.find(
    (p) => final >= p.min_value && final <= p.max_value
  );

  if (matchedPredicate) {
    predicate = matchedPredicate.predicate;
    desc = matchedPredicate.descriptive;
  } else if (final === 0) {
    predicate = "-";
    desc = "-";
  } else {
    // Fallback jika tidak ada predikat yang cocok dan nilai > 0
    predicate = "D";
    desc = "Perlu Perbaikan/Bimbingan";
  }

  return {
    ...data,
    perfAvrg,
    prodAvrg,
    projAvrg,
    final,
    predicate,
    desc,
  };
};

// ===================================
// 3. FUNGSI API (HELPER UNTUK KOMPONEN)
// ===================================

/**
 * Menampilkan notifikasi toast.
 */
const showToast = (
  message: string,
  type: "success" | "error" | "info" | "default" | "warn" = "success"
) => {
  switch (type) {
    case "success":
      toast.success(message, { autoClose: 2000 });
      break;
    case "error":
      toast.error(message, { autoClose: 3000 });
      break;
    case "info":
      toast.info(message, { autoClose: 2000 });
      break;
    case "warn":
      toast.warn(message, { autoClose: 3000 });
      break;
    default:
      toast(message);
  }
};

/**
 * Mengambil informasi tahun akademik yang aktif.
 */
const fetchActiveAcademicInfo = async (): Promise<AcademicInfo> => {
  try {
    const response = await api.get("/academic-years");
    const activeYear = response.data.data.find(
      (item: any) => item.is_active === true
    );
    if (!activeYear) {
      throw new Error("Tahun akademik aktif tidak ditemukan.");
    }
    const semester = activeYear.is_ganjil
      ? "Ganjil"
      : activeYear.is_genap
      ? "Genap"
      : "N/A";

    return {
      year: activeYear.year,
      semester: semester,
      academicId: activeYear.id,
    };
  } catch (error) {
    showToast("Gagal mengambil data Tahun Akademik.", "error");
    return { year: "N/A", semester: "N/A", academicId: null };
  }
};

/**
 * Mengambil data predikat/KKM.
 */
const fetchPredicateData = async (): Promise<Predicate[]> => {
  try {
    const response = await api.get("/predicate-kktps");
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data.map((item: any) => ({
        id: item.id,
        predicate: item.predicate,
        descriptive: item.descriptive,
        min_value: item.min_value,
        max_value: item.max_value,
        academic_id: item.academic_id,
      })) as Predicate[];
    }
    return [];
  } catch (error) {
    showToast("Gagal mengambil data Predikat/KKM.", "error");
    return [];
  }
};

/**
 * Mengambil nama mata pelajaran berdasarkan ID.
 */
const fetchSubjectName = async (subjectId: string): Promise<string> => {
  try {
    const response = await api.get("/subjects");
    const subjectData = response.data.data.find(
      (item: any) => item.id === parseInt(subjectId)
    );
    return subjectData ? subjectData.name : "Mata Pelajaran Tidak Ditemukan";
  } catch (error) {
    showToast("Gagal mengambil data Mata Pelajaran.", "error");
    return "Loading...";
  }
};

/**
 * Mengambil data siswa dan menggabungkannya dengan nilai yang sudah tersimpan.
 */
const fetchStudentData = async (
  classroomId: string,
  subjectId: string,
  predicates: Predicate[]
): Promise<StudentPerformance[]> => {
  try {
    const studentResponse = await api.get(
      `/student/classroom?classroom=${classroomId}`
    );
    const students: StudentPerformance[] = studentResponse.data.data.map(
      (item: any) => ({
        key: item.student.id.toString(),
        studentId: item.student.id,
        grade: item.student.grade,
        fullName: item.student.fullname,
        perf: [0, 0, 0],
        prod: [0, 0, 0],
        proj: [0, 0, 0],
        perfAvrg: 0,
        prodAvrg: 0,
        projAvrg: 0,
        final: 0,
        predicate: "",
        desc: "",
      })
    );

    // Ambil data nilai yang sudah disubmit
    const reportResponse = await api.get(`/report-skill`);
    const submittedReports: any[] = reportResponse.data.data;

    // Gabungkan data siswa dengan nilai yang sudah ada
    const mergedData = students.map((student) => {
      const report = submittedReports.find(
        (r) =>
          r.student_id === student.studentId &&
          r.subject_id === parseInt(subjectId) &&
          r.classroom_id === parseInt(classroomId)
      );

      if (report) {
        // Jika ada laporan nilai, muat nilai dari laporan tersebut
        const loadedData: StudentPerformance = {
          ...student,
          perf: [report.perf1 || 0, report.perf2 || 0, report.perf3 || 0],
          prod: [report.prod1 || 0, report.prod2 || 0, report.prod3 || 0],
          proj: [report.proj1 || 0, report.proj2 || 0, report.proj3 || 0],
          perfAvrg: report.avrg_perf,
          prodAvrg: report.avrg_prod,
          projAvrg: report.avrg_proj,
          final: report.final,
          predicate: report.predicate,
          desc: report.description,
        };
        return loadedData;
      }
      // Jika belum ada nilai, hitung metrik awal (semua 0)
      return calculatePerformanceMetrics(student, predicates);
    });

    return mergedData;
  } catch (error) {
    showToast(
      "Gagal mengambil data Siswa atau Nilai yang sudah tersimpan.",
      "error"
    );
    return [];
  }
};

/**
 * Mengirim atau memperbarui nilai siswa ke API.
 */
const submitStudentScore = async (
  data: StudentPerformance,
  subjectId: string,
  classroomId: string
) => {
  const payload = {
    subject_id: parseInt(subjectId),
    student_id: data.studentId,
    classroom_id: parseInt(classroomId),
    grade: parseInt(data.grade.toString()),

    perf1: data.perf[0],
    perf2: data.perf[1],
    perf3: data.perf[2],
    avrg_perf: data.perfAvrg,
    prod1: data.prod[0],
    prod2: data.prod[1],
    prod3: data.prod[2],
    avrg_prod: data.prodAvrg,
    proj1: data.proj[0],
    proj2: data.proj[1],
    proj3: data.proj[2],
    avrg_proj: data.projAvrg,

    final: data.final,
    predicate: data.predicate,
    description: data.desc,
  };

  try {
    // Asumsi API menggunakan POST untuk create/update (upsert)
    await api.post("/report-skill", payload);
    showToast(
      `✅ Nilai ${data.fullName} berhasil disimpan/diperbarui!`,
      "success"
    );
  } catch (error) {
    let errorMessage = `❌ Gagal menyimpan nilai ${data.fullName}. Cek koneksi atau format data API.`;

    if (axios.isAxiosError(error) && error.response) {
      const apiError = error.response.data as ApiErrorResponse;

      if (apiError && apiError.message) {
        errorMessage = apiError.message;
      }
    }

    showToast(errorMessage, "error");
    throw error;
  }
};

// ===================================
// 4. KOMPONEN EDITABLE CELL
// ===================================

interface EditableCellProps {
  value: number;
  dataIndex: string;
  index: number;
  record: StudentPerformance;
  onChange: (
    key: string,
    dataIndex: string,
    arrayIndex: number,
    newValue: number
  ) => void;
}

/**
 * Komponen sel tabel yang dapat diedit menggunakan InputNumber Ant Design.
 */
const EditableCell: React.FC<EditableCellProps> = ({
  value,
  dataIndex,
  index,
  record,
  onChange,
}) => {
  // Tampilkan string kosong jika nilainya 0, undefined, atau null agar placeholder berfungsi
  const displayValue =
    value === undefined || value === null || value === 0 ? "" : value;

  return (
    <InputNumber
      min={0}
      max={100}
      value={displayValue as any} // Cast ke any karena value bisa string kosong ("")
      onChange={(newValue) => {
        if (newValue === null || newValue === undefined) {
          onChange(record.key, dataIndex, index, 0);
        } else if (typeof newValue === "number") {
          // Bulatkan nilai ke bilangan bulat dan pastikan di antara 0-100
          const clampedValue = Math.min(100, Math.max(0, Math.round(newValue)));
          onChange(record.key, dataIndex, index, clampedValue);
        }
      }}
      style={{ width: "100%", textAlign: "center", padding: "4px 8px" }}
      controls={false} // Sembunyikan tombol naik/turun
      precision={0} // Pastikan input bilangan bulat
      size="small"
      className="hide-number-spinner"
      placeholder="-"
    />
  );
};

// ===================================
// 5. KOMPONEN UTAMA
// ===================================

const SkillsInputPage: React.FC = () => {
  const params = useParams();
  const subjectId = Array.isArray(params.subjectId)
    ? params.subjectId[0]
    : (params.subjectId as string);
  const classroomId = Array.isArray(params.classroomId)
    ? params.classroomId[0]
    : (params.classroomId as string);

  const [studentData, setStudentData] = useState<StudentPerformance[]>([]);
  const [academicInfo, setAcademicInfo] = useState<AcademicInfo>({
    year: "N/A",
    semester: "N/A",
    academicId: null,
  });
  const [subjectName, setSubjectName] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const [predicates, setPredicates] = useState<Predicate[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submittingStudentId, setSubmittingStudentId] = useState<number | null>(
    null
  );

  /**
   * Efek untuk memuat data awal (Info Akademik, Predikat, Nama Mapel, Data Siswa).
   */
  useEffect(() => {
    if (!subjectId || !classroomId) {
      setApiError("Parameter Subject ID atau Classroom ID hilang.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setApiError(null);
      try {
        const [activeInfo, predicateData, name] = await Promise.all([
          fetchActiveAcademicInfo(),
          fetchPredicateData(),
          fetchSubjectName(subjectId),
        ]);

        setAcademicInfo(activeInfo);
        setPredicates(predicateData);
        setSubjectName(name);

        if (predicateData.length === 0) {
          showToast(
            "Peringatan: Data Predikat/KKM kosong. Menggunakan logika fallback.",
            "warn"
          );
        }

        const data = await fetchStudentData(
          classroomId,
          subjectId,
          predicateData
        );
        setStudentData(data);

        showToast(`Berhasil memuat ${data.length} data siswa.`, "success");
      } catch (error: any) {
        const errorMessage =
          error.message ||
          error.response?.data?.message ||
          "Gagal memuat data dari API.";
        setApiError(errorMessage);
        showToast(`Error: ${errorMessage}`, "error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [subjectId, classroomId]);

  /**
   * Handler saat nilai input berubah. Akan menghitung ulang metrik.
   */
  const handleValueChange = useCallback(
    (key: string, dataIndex: string, arrayIndex: number, newValue: number) => {
      setStudentData((prevData) => {
        const newData = prevData.map((item) => {
          if (item.key === key) {
            const updatedItem: StudentPerformance = { ...item };

            // Update array nilai (perf, prod, proj) pada index tertentu
            if (["perf", "prod", "proj"].includes(dataIndex)) {
              const currentArray = [...(updatedItem as any)[dataIndex]];
              currentArray[arrayIndex] = newValue;
              (updatedItem as any)[dataIndex] = currentArray;
            }

            // Hitung ulang semua metrik dan predikat
            return calculatePerformanceMetrics(updatedItem, predicates);
          }
          return item;
        });
        return newData;
      });
    },
    [predicates]
  );

  /**
   * Handler untuk tombol Simpan/Update. Mengirim data ke API.
   */
  const handleAction = useCallback(
    async (data: StudentPerformance) => {
      setSubmittingStudentId(data.studentId);
      if (!subjectId || !classroomId) {
        showToast("Parameter Subject ID atau Classroom ID hilang.", "error");
        setSubmittingStudentId(null);
        return;
      }

      try {
        await submitStudentScore(data, subjectId, classroomId);
      } catch (error) {
        // Error sudah ditangani dan di-toast di fungsi submitStudentScore
      } finally {
        setSubmittingStudentId(null);
      }
    },
    [subjectId, classroomId]
  );

  /**
   * Definisi kolom-kolom tabel.
   */
  const columns: ColumnsType<StudentPerformance> = useMemo(
    () => [
      {
        title: "No",
        key: "index",
        width: 50,
        fixed: "left",
        align: "center",
        render: (_, __, index) => index + 1,
      },
      {
        title: "Nama Siswa",
        dataIndex: "fullName",
        key: "fullName",
        fixed: "left", // Kolom tetap di kiri saat scroll
        width: 200,
      },
      {
        title: "Kinerja (Perf)",
        key: "perf",
        children: [
          {
            title: "P1",
            dataIndex: ["perf", 0],
            key: "perf1",
            align: "center",
            width: 70,
            render: (text, record) => (
              <EditableCell
                value={record.perf[0]}
                dataIndex="perf"
                index={0}
                record={record}
                onChange={handleValueChange}
              />
            ),
          },
          {
            title: "P2",
            dataIndex: ["perf", 1],
            key: "perf2",
            align: "center",
            width: 70,
            render: (text, record) => (
              <EditableCell
                value={record.perf[1]}
                dataIndex="perf"
                index={1}
                record={record}
                onChange={handleValueChange}
              />
            ),
          },
          {
            title: "P3",
            dataIndex: ["perf", 2],
            key: "perf3",
            align: "center",
            width: 70,
            render: (text, record) => (
              <EditableCell
                value={record.perf[2]}
                dataIndex="perf"
                index={2}
                record={record}
                onChange={handleValueChange}
              />
            ),
          },
          {
            title: "Avrg",
            dataIndex: "perfAvrg",
            key: "perfAvrg",
            align: "center",
            width: 70,
            className: "average-cell",
            render: (text) => <Text strong>{text || "-"}</Text>,
          },
        ],
      },
      {
        title: "Produk (Prod)",
        key: "prod",
        children: [
          {
            title: "P1",
            dataIndex: ["prod", 0],
            key: "prod1",
            align: "center",
            width: 70,
            render: (text, record) => (
              <EditableCell
                value={record.prod[0]}
                dataIndex="prod"
                index={0}
                record={record}
                onChange={handleValueChange}
              />
            ),
          },
          {
            title: "P2",
            dataIndex: ["prod", 1],
            key: "prod2",
            align: "center",
            width: 70,
            render: (text, record) => (
              <EditableCell
                value={record.prod[1]}
                dataIndex="prod"
                index={1}
                record={record}
                onChange={handleValueChange}
              />
            ),
          },
          {
            title: "P3",
            dataIndex: ["prod", 2],
            key: "prod3",
            align: "center",
            width: 70,
            render: (text, record) => (
              <EditableCell
                value={record.prod[2]}
                dataIndex="prod"
                index={2}
                record={record}
                onChange={handleValueChange}
              />
            ),
          },
          {
            title: "Avrg",
            dataIndex: "prodAvrg",
            key: "prodAvrg",
            align: "center",
            width: 70,
            className: "average-cell",
            render: (text) => <Text strong>{text || "-"}</Text>,
          },
        ],
      },
      {
        title: "Proyek (Proj)",
        key: "proj",
        children: [
          {
            title: "P1",
            dataIndex: ["proj", 0],
            key: "proj1",
            align: "center",
            width: 70,
            render: (text, record) => (
              <EditableCell
                value={record.proj[0]}
                dataIndex="proj"
                index={0}
                record={record}
                onChange={handleValueChange}
              />
            ),
          },
          {
            title: "P2",
            dataIndex: ["proj", 1],
            key: "proj2",
            align: "center",
            width: 70,
            render: (text, record) => (
              <EditableCell
                value={record.proj[1]}
                dataIndex="proj"
                index={1}
                record={record}
                onChange={handleValueChange}
              />
            ),
          },
          {
            title: "P3",
            dataIndex: ["proj", 2],
            key: "proj3",
            align: "center",
            width: 70,
            render: (text, record) => (
              <EditableCell
                value={record.proj[2]}
                dataIndex="proj"
                index={2}
                record={record}
                onChange={handleValueChange}
              />
            ),
          },
          {
            title: "Avrg",
            dataIndex: "projAvrg",
            key: "projAvrg",
            align: "center",
            width: 70,
            className: "average-cell",
            render: (text) => <Text strong>{text || "-"}</Text>,
          },
        ],
      },
      {
        title: "Nilai Akhir",
        dataIndex: "final",
        key: "final",
        align: "center",
        width: 90,
        className: "average-cell",
        render: (text) => (
          <Text strong type="danger">
            {text || "-"}
          </Text>
        ),
      },
      {
        title: "Predikat",
        dataIndex: "predicate",
        key: "predicate",
        align: "center",
        width: 80,
        className: "average-cell",
        render: (text) => <Text strong>{text || "-"}</Text>,
      },
      {
        title: "Deskripsi",
        dataIndex: "desc",
        key: "desc",
        align: "center",
        width: 150,
        className: "average-cell",
        render: (text) => <Text>{text || "-"}</Text>,
      },
      {
        title: "Aksi",
        key: "actions",
        fixed: "right", // Kolom tetap di kanan saat scroll
        width: 120,
        align: "center",
        render: (_, record) => (
          <Button
            type="primary"
            onClick={() => handleAction(record)}
            loading={submittingStudentId === record.studentId}
            disabled={submittingStudentId !== null}
            style={{ width: "100px" }}
          >
            {record.predicate === "" ? "Simpan" : "Update"}
          </Button>
        ),
      },
    ],
    [handleValueChange, handleAction, submittingStudentId]
  );

  // ===================================
  // 6. RENDER KONDISIONAL (LOADING/ERROR)
  // ===================================

  if (loading && !apiError) {
    return (
      <Layout style={{ padding: "24px", minHeight: "100vh" }}>
        <Spin tip="Memuat Data Siswa dan Subjek..." size="large">
          <Alert
            message="Sedang memuat data dari API..."
            description={`Memuat data mata pelajaran (ID: ${subjectId}) dan siswa dari Kelas (ID: ${classroomId}).`}
            type="info"
            showIcon
          />
        </Spin>
      </Layout>
    );
  }

  if (apiError) {
    return (
      <Layout style={{ padding: "24px", minHeight: "100vh" }}>
        <Alert
          message="Error Saat Memuat Data"
          description={`Gagal mengambil data dari API: ${apiError}. Pastikan API sudah berjalan dan parameter URL (Subject ID/Classroom ID) valid.`}
          type="error"
          showIcon
        />
      </Layout>
    );
  }

  // ===================================
  // 7. RENDER UTAMA
  // ===================================

  return (
    <Layout
      style={{ padding: "24px", backgroundColor: "#fff", minHeight: "100vh" }}
    >
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Gaya CSS untuk tampilan tabel */}
      <style jsx global>{`
        .average-cell {
          background-color: #f0f0f0 !important;
          font-weight: bold;
        }
        .ant-table-wrapper .ant-table-thead > tr > th.average-cell {
          background-color: #e6e6e6 !important;
        }
        .ant-table-cell .ant-input,
        .ant-table-cell .ant-input-number {
          padding: 4px 8px;
          height: 32px;
          border-radius: 6px;
        }
        /* Menyembunyikan spinner pada InputNumber untuk tampilan yang lebih rapi */
        .hide-number-spinner::-webkit-outer-spin-button,
        .hide-number-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .hide-number-spinner {
          -moz-appearance: textfield;
        }
      `}</style>

      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Header style={{ backgroundColor: "#fff", padding: 0, height: "auto" }}>
          <Space direction="vertical" size={4} style={{ display: "flex" }}>
            <Text type="secondary" style={{ fontSize: "14px" }}>
              Home / Academic Report / Skills Input
            </Text>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Title
                level={1}
                style={{ margin: 0, fontSize: "30px", fontWeight: "bold" }}
              >
                Input Nilai Keterampilan
              </Title>
              <Title
                level={2}
                style={{ margin: 0, fontSize: "24px", fontWeight: "normal" }}
              >
                {academicInfo.year} ({academicInfo.semester})
              </Title>
            </div>
          </Space>
          <Divider style={{ margin: "16px 0 8px 0" }} />
        </Header>

        <Text strong style={{ fontSize: "18px" }}>
          Subject: {subjectName}
        </Text>

        <Content>
          {/* Bagian Keterangan Predikat/KKM */}
          <Title level={4} style={{ marginTop: "16px" }}>
            Keterangan Predikat:
          </Title>
          <Space wrap>
            {predicates
              .sort((a, b) => b.min_value - a.min_value)
              .map((p) => (
                <Text key={p.id} code>
                  {p.predicate} ({p.min_value}-{p.max_value}): {p.descriptive}
                </Text>
              ))}
          </Space>
          <Divider style={{ margin: "8px 0 16px 0" }} />

          {/* Tabel Input Nilai */}
          <Table
            columns={columns}
            dataSource={studentData}
            rowKey="key"
            bordered
            pagination={false}
            size="small"
            scroll={{ x: 1300 }} // Mengaktifkan scroll horizontal
            style={{ marginTop: "8px" }}
            locale={{
              emptyText: "Tidak ada data siswa dalam kelas ini.", // Pesan jika data kosong
            }}
          />
        </Content>
      </Space>
    </Layout>
  );
};

export default SkillsInputPage;
