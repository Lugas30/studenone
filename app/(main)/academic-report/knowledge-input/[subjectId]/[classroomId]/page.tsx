// knowledgeInputPage.tsx
"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Typography,
  Layout,
  Divider,
  Input,
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

// --- KONFIGURASI API ---
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- 1. DEFINISI TIPE (TYPESCRIPT) ---

// Tipe untuk data yang dimuat dari API
interface Subject {
  id: number;
  name: string;
  kkm: number;
  grade: string;
}

interface Predicate {
  id: number;
  predicate: string;
  descriptive: string;
  min_value: number;
  max_value: number;
}

interface StudentAPI {
  id: number; // student_classroom_id
  student_id: number;
  classroom_id: number;
  academic_year_id: number;
  student: {
    id: number;
    fullname: string;
    grade: string;
  };
}

interface KnowledgeScore {
  id?: number; // Ada jika sudah tersimpan (report ID)
  uh1: number;
  uh2: number;
  uh3: number;
  uh4: number;
  uh_avg: number;
  t1: number;
  t2: number;
  avg: number;
  uts: number;
  uas: number;
  final: number;
  predicate: string;
  description: string;
}

// Tipe data yang digunakan di tabel (gabungan student info + score)
interface StudentPerformance extends KnowledgeScore {
  key: string;
  studentId: number; // ID Siswa
  fullName: string;
  isLoaded: boolean; // Status untuk input: true jika data sudah dimuat/disimpan
}

// --- 2. FUNGSI PERHITUNGAN DAN PENCARIAN PREDICATE (DIPINDAHKAN KELUAR KOMPONEN) ---

/**
 * Fungsi untuk menghitung rata-rata dari nilai yang valid (0-100)
 */
const calculateAvg = (values: number[]): number => {
  const validValues = values.filter(
    (v) => v !== undefined && v !== null && v > 0 && v >= 0 && v <= 100
  );

  if (validValues.length === 0) return 0;

  const sum = validValues.reduce((acc, curr) => acc + curr, 0);
  return Math.round(sum / validValues.length);
};

/**
 * Fungsi untuk mendapatkan Predikat dan Deskripsi berdasarkan nilai akhir.
 */
const getPredicateByScore = (score: number, predicates: Predicate[]) => {
  if (score === 0 || predicates.length === 0)
    return { predicate: "", description: "" };

  const found = predicates.find(
    (p) => score >= p.min_value && score <= p.max_value
  );

  return found
    ? { predicate: found.predicate, description: found.descriptive }
    : { predicate: "D", description: "Perlu Perbaikan/Bimbingan" };
};

// --- 3. KOMPONEN UTAMA ---

const KnowledgeInputPage: React.FC = () => {
  const params = useParams();
  const subjectId = params.subjectId as string;
  const classroomId = params.classroomId as string;

  // State Data
  const [subjectInfo, setSubjectInfo] = useState<Subject | null>(null);
  const [predicates, setPredicates] = useState<Predicate[]>([]);
  const [studentData, setStudentData] = useState<StudentPerformance[]>([]);

  // State UI/Loading
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submittingStudentId, setSubmittingStudentId] = useState<number | null>(
    null
  );

  const parsedSubjectId = useMemo(() => parseInt(subjectId), [subjectId]);
  const parsedClassroomId = useMemo(() => parseInt(classroomId), [classroomId]);

  // --- FUNGSI UTILITY: MENGHITUNG ULANG PERFORMA ---

  /**
   * Hitung ulang rata-rata dan predikat setelah input nilai.
   * Fungsi ini sekarang menerima 'predicates' sebagai argumen untuk memutus dependency loop.
   */
  const recalculatePerformance = useCallback(
    (
      data: StudentPerformance,
      currentPredicates: Predicate[]
    ): StudentPerformance => {
      // Hanya hitung jika ada nilai yang dimasukkan
      if (
        data.uh1 === 0 &&
        data.uh2 === 0 &&
        data.uh3 === 0 &&
        data.uh4 === 0 &&
        data.t1 === 0 &&
        data.t2 === 0 &&
        data.uts === 0 &&
        data.uas === 0
      ) {
        return {
          ...data,
          uh_avg: 0,
          avg: 0,
          final: 0,
          predicate: "",
          description: "",
        };
      }

      const uhValues = [data.uh1, data.uh2, data.uh3, data.uh4];
      const uhAvrg = calculateAvg(uhValues);

      const tValues = [data.t1, data.t2];
      const tAvrg = calculateAvg(tValues);

      const finalValues = [uhAvrg, tAvrg, data.uts, data.uas].filter(
        (v) => v > 0
      );
      const finalScore = calculateAvg(finalValues);

      // Gunakan currentPredicates yang dikirim sebagai argumen
      const { predicate, description } = getPredicateByScore(
        finalScore,
        currentPredicates
      );

      return {
        ...data,
        uh_avg: uhAvrg,
        avg: tAvrg,
        final: finalScore,
        predicate,
        description,
      };
    },
    [] // Array dependency kosong karena semua dependency (predicates) sudah dipindahkan ke argumen
  );

  // --- 4. DATA FETCHING (useEffect) ---

  useEffect(() => {
    if (!API_URL || !subjectId || !classroomId) {
      setApiError("ID Subjek atau ID Kelas tidak valid.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setApiError(null);

      try {
        // 1. Fetch Subjek & Predikat (paralel)
        const [subjectsRes, predicatesRes] = await Promise.all([
          axios.get(`${API_URL}/subjects`),
          axios.get(`${API_URL}/predicate-kktps`),
        ]);

        // Set Predikat (diurutkan descending berdasarkan min_value)
        const sortedPredicates: Predicate[] = predicatesRes.data.data.sort(
          (a: Predicate, b: Predicate) => b.min_value - a.min_value
        );
        setPredicates(sortedPredicates); // Mengatur state predicates

        // Cari Subjek yang Sesuai
        const subject = subjectsRes.data.data.find(
          (s: Subject) => s.id === parsedSubjectId
        );
        if (subject) {
          setSubjectInfo(subject);
          toast.success(`Berhasil memuat Subjek: ${subject.name}`, {
            autoClose: 2000,
          });
        } else {
          throw new Error("Subjek tidak ditemukan.");
        }

        // 2. Fetch Data Siswa dan Nilai yang Sudah Ada (sequential)
        const [studentsRes, scoresRes] = await Promise.all([
          axios.get(
            `${API_URL}/student/classroom?classroom=${parsedClassroomId}`
          ),
          axios.get(`${API_URL}/report-knowledge`),
        ]);

        const loadedScoresMap = scoresRes.data.data
          .filter(
            (score: any) =>
              score.subject_id === parsedSubjectId &&
              score.classroom_id === parsedClassroomId
          )
          .reduce((acc: { [key: number]: KnowledgeScore }, score: any) => {
            acc[score.student_id] = {
              uh1: score.uh1,
              uh2: score.uh2,
              uh3: score.uh3,
              uh4: score.uh4,
              uh_avg: score.uh_avg,
              t1: score.t1,
              t2: score.t2,
              avg: score.avg,
              uts: score.uts,
              uas: score.uas,
              final: score.final,
              predicate: score.predicate,
              description: score.description,
              id: score.id,
            };
            return acc;
          }, {});

        const initialData = studentsRes.data.data.map((s: StudentAPI) => {
          const existingScore = loadedScoresMap[s.student.id];

          const baseData: KnowledgeScore = existingScore || {
            uh1: 0,
            uh2: 0,
            uh3: 0,
            uh4: 0,
            uh_avg: 0,
            t1: 0,
            t2: 0,
            avg: 0,
            uts: 0,
            uas: 0,
            final: 0,
            predicate: "",
            description: "",
            id: existingScore?.id,
          };

          const studentPerformance: StudentPerformance = {
            key: String(s.student.id),
            studentId: s.student.id,
            fullName: s.student.fullname,
            ...baseData,
            isLoaded: !!existingScore,
          };

          // Panggil recalculatePerformance dengan passing sortedPredicates
          return recalculatePerformance(studentPerformance, sortedPredicates);
        });

        setStudentData(initialData);
        toast.success(`Berhasil memuat ${initialData.length} data siswa.`, {
          autoClose: 2000,
        });
      } catch (error: any) {
        const errorMessage =
          error.message ||
          error.response?.data?.message ||
          "Gagal memuat data dari API.";
        setApiError(errorMessage);
        toast.error(`Error: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Dependency array HANYA bergantung pada nilai-nilai dari URL dan turunan parsialnya, serta fungsi fetcher yang stabil.
  }, [
    subjectId,
    classroomId,
    parsedSubjectId,
    parsedClassroomId,
    recalculatePerformance,
  ]);

  // --- HANDLER PERUBAHAN INPUT ---

  const handleInputChange = useCallback(
    (value: string, key: string, dataIndex: keyof KnowledgeScore) => {
      let cleanValue = value.replace(/[^0-9]/g, "");
      let numValue = cleanValue === "" ? 0 : parseInt(cleanValue);

      if (numValue < 0) {
        numValue = 0;
      } else if (numValue > 100) {
        numValue = 100;
      }

      setStudentData((prevData) => {
        return prevData.map((item) => {
          if (item.key === key) {
            let updatedItem: StudentPerformance = {
              ...item,
              [dataIndex]: numValue,
            };
            // Recalculate Performance DENGAN MENGGUNAKAN state predicates terbaru
            return recalculatePerformance(updatedItem, predicates);
          }
          return item;
        });
      });
    },
    [recalculatePerformance, predicates] // predicates diperlukan di sini karena digunakan di dalam callback
  );

  // --- HANDLER SUBMIT DATA NILAI ---

  const handleSubmit = async (record: StudentPerformance) => {
    setSubmittingStudentId(record.studentId);

    const payload = {
      subject_id: parsedSubjectId,
      student_id: record.studentId,
      classroom_id: parsedClassroomId,
      grade: subjectInfo?.grade ? parseInt(subjectInfo.grade) : 0,

      uh1: record.uh1,
      uh2: record.uh2,
      uh3: record.uh3,
      uh4: record.uh4,
      uh_avg: record.uh_avg,
      t1: record.t1,
      t2: record.t2,
      avg: record.avg,
      uts: record.uts,
      uas: record.uas,
      final: record.final,
      predicate: record.predicate,
      description: record.description,
    };

    try {
      const response = await axios.post(`${API_URL}/report-knowledge`, payload);

      if (response.status === 201 || response.status === 200) {
        toast.success(
          `✅ Nilai ${record.fullName} berhasil disimpan/diperbarui!`
        );

        setStudentData((prevData) =>
          prevData.map((item) =>
            item.key === record.key
              ? { ...item, isLoaded: true, id: response.data.id }
              : item
          )
        );
      } else {
        toast.warn(
          `⚠️ Gagal menyimpan nilai ${record.fullName}. Status: ${response.status}`
        );
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Terjadi kesalahan saat menyimpan data.";
      toast.error(`❌ Error saat submit ${record.fullName}: ${errorMsg}`);
    } finally {
      setSubmittingStudentId(null);
    }
  };

  // --- DEFINISI KOLOM TABEL (useMemo) ---
  // ... (Kolom tabel tidak berubah dari versi sebelumnya)
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
        fixed: "left",
        width: 200,
      },
      {
        title: "Ulangan Harian (UH)",
        key: "uh",
        children: [
          {
            title: "UH1",
            dataIndex: "uh1",
            key: "uh1",
            align: "center",
            width: 70,
            render: (text, record) => (
              <Input
                className="hide-number-spinner"
                value={text === 0 ? "" : text}
                onChange={(e) =>
                  handleInputChange(e.target.value, record.key, "uh1")
                }
                style={{ textAlign: "center", padding: "4px 8px" }}
                placeholder="-"
              />
            ),
          },
          {
            title: "UH2",
            dataIndex: "uh2",
            key: "uh2",
            align: "center",
            width: 70,
            render: (text, record) => (
              <Input
                className="hide-number-spinner"
                value={text === 0 ? "" : text}
                onChange={(e) =>
                  handleInputChange(e.target.value, record.key, "uh2")
                }
                style={{ textAlign: "center", padding: "4px 8px" }}
                placeholder="-"
              />
            ),
          },
          {
            title: "UH3",
            dataIndex: "uh3",
            key: "uh3",
            align: "center",
            width: 70,
            render: (text, record) => (
              <Input
                className="hide-number-spinner"
                value={text === 0 ? "" : text}
                onChange={(e) =>
                  handleInputChange(e.target.value, record.key, "uh3")
                }
                style={{ textAlign: "center", padding: "4px 8px" }}
                placeholder="-"
              />
            ),
          },
          {
            title: "UH4",
            dataIndex: "uh4",
            key: "uh4",
            align: "center",
            width: 70,
            render: (text, record) => (
              <Input
                className="hide-number-spinner"
                value={text === 0 ? "" : text}
                onChange={(e) =>
                  handleInputChange(e.target.value, record.key, "uh4")
                }
                style={{ textAlign: "center", padding: "4px 8px" }}
                placeholder="-"
              />
            ),
          },
          {
            title: "Avrg",
            dataIndex: "uh_avg",
            key: "uh_avg",
            align: "center",
            width: 70,
            className: "average-cell",
            render: (text) => <Text strong>{text || "-"}</Text>,
          },
        ],
      },
      {
        title: "Tugas (T)",
        key: "t",
        children: [
          {
            title: "T1",
            dataIndex: "t1",
            key: "t1",
            align: "center",
            width: 70,
            render: (text, record) => (
              <Input
                className="hide-number-spinner"
                value={text === 0 ? "" : text}
                onChange={(e) =>
                  handleInputChange(e.target.value, record.key, "t1")
                }
                style={{ textAlign: "center", padding: "4px 8px" }}
                placeholder="-"
              />
            ),
          },
          {
            title: "T2",
            dataIndex: "t2",
            key: "t2",
            align: "center",
            width: 70,
            render: (text, record) => (
              <Input
                className="hide-number-spinner"
                value={text === 0 ? "" : text}
                onChange={(e) =>
                  handleInputChange(e.target.value, record.key, "t2")
                }
                style={{ textAlign: "center", padding: "4px 8px" }}
                placeholder="-"
              />
            ),
          },
          {
            title: "Avrg",
            dataIndex: "avg",
            key: "avg",
            align: "center",
            width: 70,
            className: "average-cell",
            render: (text) => <Text strong>{text || "-"}</Text>,
          },
        ],
      },
      {
        title: "UTS",
        dataIndex: "uts",
        key: "uts",
        align: "center",
        width: 70,
        render: (text, record) => (
          <Input
            className="hide-number-spinner"
            value={text === 0 ? "" : text}
            onChange={(e) =>
              handleInputChange(e.target.value, record.key, "uts")
            }
            style={{ textAlign: "center", padding: "4px 8px" }}
            placeholder="-"
          />
        ),
      },
      {
        title: "UAS",
        dataIndex: "uas",
        key: "uas",
        align: "center",
        width: 70,
        render: (text, record) => (
          <Input
            className="hide-number-spinner"
            value={text === 0 ? "" : text}
            onChange={(e) =>
              handleInputChange(e.target.value, record.key, "uas")
            }
            style={{ textAlign: "center", padding: "4px 8px" }}
            placeholder="-"
          />
        ),
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
        dataIndex: "description",
        key: "description",
        align: "center",
        width: 150,
        className: "average-cell",
        render: (text) => <Text>{text || "-"}</Text>,
      },
      {
        title: "Aksi",
        key: "actions",
        fixed: "right",
        width: 120,
        align: "center",
        render: (_, record) => (
          <Button
            type={record.isLoaded ? "default" : "primary"}
            onClick={() => handleSubmit(record)}
            loading={submittingStudentId === record.studentId}
            disabled={submittingStudentId !== null}
            style={{ width: "100px" }}
          >
            {record.isLoaded ? "Update" : "Simpan"}
          </Button>
        ),
      },
    ],
    [handleInputChange, submittingStudentId]
  );

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
          description={`Gagal mengambil data dari API: ${apiError}.`}
          type="error"
          showIcon
        />
      </Layout>
    );
  }

  return (
    <Layout
      style={{ padding: "24px", backgroundColor: "#fff", minHeight: "100vh" }}
    >
      <ToastContainer position="top-right" autoClose={3000} />

      <style jsx global>{`
        .average-cell {
          background-color: #f0f0f0 !important;
          font-weight: bold;
        }
        .ant-table-wrapper .ant-table-thead > tr > th.average-cell {
          background-color: #e6e6e6 !important;
        }
        .ant-table-cell .ant-input {
          padding: 4px 8px;
          height: 32px;
        }
        .hide-number-spinner::-webkit-outer-spin-button,
        .hide-number-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .hide-number-spinner {
          -moz-appearance: textfield;
        }
        .bg-green-50 {
          background-color: #f6ffed !important;
        }
      `}</style>

      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Header style={{ backgroundColor: "#fff", padding: 0, height: "auto" }}>
          <Space direction="vertical" size={4} style={{ display: "flex" }}>
            <Text type="secondary" style={{ fontSize: "14px" }}>
              Home / Academic Report / Knowledge Input
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
                Input Nilai Pengetahuan
              </Title>
              <Title
                level={2}
                style={{ margin: 0, fontSize: "24px", fontWeight: "normal" }}
              >
                2024-2025 (Ganjil)
              </Title>
            </div>
          </Space>
          <Divider style={{ margin: "16px 0 8px 0" }} />
        </Header>

        <Text strong style={{ fontSize: "18px" }}>
          Subject: {subjectInfo?.name || "Loading..."} (KKM:{" "}
          {subjectInfo?.kkm || "-"})
        </Text>

        {/* Keperluan Testing */}
        {/* <Text type="secondary">
          Kelas ID: **{classroomId}**, Subjek ID: **{subjectId}**
        </Text> */}

        <Content>
          <Table
            columns={columns}
            dataSource={studentData}
            rowKey="key"
            bordered
            pagination={false}
            size="small"
            scroll={{ x: 1400 }}
            style={{ marginTop: "16px" }}
            rowClassName={(record) => (record.isLoaded ? "bg-green-50" : "")}
          />
        </Content>

        <Divider />
        <Title level={4}>Keterangan Predikat:</Title>
        <Space wrap>
          {predicates.map((p) => (
            <Text key={p.id} code>
              {p.predicate} ({p.min_value}-{p.max_value}): {p.descriptive}
            </Text>
          ))}
        </Space>
      </Space>
    </Layout>
  );
};

export default KnowledgeInputPage;
