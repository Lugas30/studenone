"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Typography,
  Card,
  Space,
  Breadcrumb,
  Button,
  Table,
  Tag,
  Input,
  Tooltip,
  Select,
} from "antd";
import type { TableProps } from "antd";
import { ArrowLeftOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  console.error("NEXT_PUBLIC_API_URL is not defined in .env");
}

// --- TIPE DATA GLOBAL ---

type IndicatorValue = "T" | "C" | "I" | null | undefined;

interface ParamsData {
  grade: string;
  subjectId: string;
  periode: string;
  // 💡 PERBAIKAN: Tambahkan classroomId
  classroomId: string;
}

interface IndicatorField {
  id: number;
  ic: number; // Indicator Count (1, 2, 3, ...)
  indicator: string; // Deskripsi indikator (untuk tooltip)
  domain: string;
}

// StudentData menggunakan index signature untuk properti indikator dinamis
interface StudentData {
  key: string;
  student_id: number;
  fullName: string;
  comment: string;
  // Memungkinkan akses objek dengan string key (e.g., 'indi1', 'indi6', 'comment')
  [key: string]: IndicatorValue | string | number | undefined;
}

// --- DESKRIPSI & OPSI GLOBAL ---

const indicatorOptions = [
  { value: "T", label: "T", color: "green" },
  { value: "C", label: "C", color: "blue" },
  { value: "I", label: "I", color: "orange" },
];

// --- KOMPONEN UTAMA ---

const PIDReportInputPage: React.FC = () => {
  const params = useParams<{
    grade: string;
    subjectId: string;
    periode: string;
    // 💡 PERBAIKAN: Tangkap classroomId dari URL
    classroomId: string;
  }>();
  const router = useRouter();
  const [paramsData, setParamsData] = useState<ParamsData | null>(null);
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [indicatorFields, setIndicatorFields] = useState<IndicatorField[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectName, setSubjectName] = useState<string>("");

  // 💡 PERUBAHAN: State loading per siswa (key: boolean)
  const [loadingStudent, setLoadingStudent] = useState<Record<string, boolean>>(
    {}
  );

  // --- FUNGSI UTILITY ---

  const formatPeriodeDisplay = (periode: string): string => {
    const parts = periode.split("_");
    if (parts.length === 2) {
      return (
        parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + " " + parts[1]
      );
    }
    return periode;
  };

  const getIndicatorDescription = (index: number): string => {
    const field = indicatorFields.find((f) => f.ic === index);
    return field
      ? field.indicator
      : `Deskripsi Indi ${index} (Data API Belum Tersedia)`;
  };

  // --- FETCH DATA (STUDENTS & INDICATORS + SAVED DATA) ---

  // 💡 PERBAIKAN: Tambahkan classroomId sebagai parameter di fetchData
  const fetchData = useCallback(
    async (
      grade: string,
      subjectId: string,
      periode: string,
      classroomId: string
    ) => {
      setLoading(true);
      try {
        const subjectIdNum = parseInt(subjectId);
        // const classroomIdNum = parseInt(classroomId); // Tidak wajib, tapi bisa digunakan jika perlu

        // --- 1. Fetch Indicators (Menentukan struktur kolom) ---
        const indicatorRes = await axios.get(
          `${API_URL}/indicator-field-table?grade=${grade}&subject_id=${subjectId}&priode=${periode}`
        );
        const fetchedIndicatorFields: IndicatorField[] = indicatorRes.data;
        setIndicatorFields(fetchedIndicatorFields);

        // --- 2. Fetch Subjects (Untuk mendapatkan nama mata pelajaran) ---
        const subjectRes = await axios.get(`${API_URL}/subjects`);
        const subjectData = subjectRes.data.data.find(
          (subj: any) => subj.id === subjectIdNum
        );
        setSubjectName(
          subjectData ? subjectData.name : `Subjek ID ${subjectId}`
        );

        // --- 3. Fetch Data Laporan Tersimpan ---
        // 💡 PERBAIKAN: Pastikan menggunakan classroomId yang benar di sini
        const reportRes = await axios.get(
          `${API_URL}/report-pid?classroom_id=${classroomId}&subject_id=${subjectId}&periode=${periode}`
        );
        const savedReportData: any[] = reportRes.data;

        // --- 4. Fetch Daftar Siswa (PERUBAHAN UTAMA) ---
        // 💡 PERBAIKAN: Gunakan classroomId yang benar untuk memuat daftar siswa
        const studentRes = await axios.get(
          `${API_URL}/student/classroom?classroom=${classroomId}`
        );

        const newStudentsData: StudentData[] = studentRes.data.data.map(
          (item: any) => {
            const student_id = item.student_id;

            const savedReport = savedReportData.find(
              (report) => report.student.id === student_id
            );

            const studentIndicators: { [key: string]: IndicatorValue } = {};
            let studentComment = "";

            fetchedIndicatorFields.forEach((indicator: IndicatorField) => {
              const indiKey = `indi${indicator.ic}`;
              let predicate: IndicatorValue = null;

              if (savedReport) {
                const savedIndicator = savedReport.indicators.find(
                  (si: any) => si.indicator_id === indicator.id
                );
                if (savedIndicator) {
                  predicate = savedIndicator.predicate;
                  studentComment = savedIndicator.description || "";
                }
              }
              studentIndicators[indiKey] = predicate;
            });

            return {
              key: student_id.toString(),
              student_id: student_id,
              fullName: item.student.fullname,
              comment: studentComment,
              ...studentIndicators, // Gabungkan data indikator dinamis
            } as StudentData;
          }
        );

        setStudentsData(newStudentsData);
        toast.success(
          `Berhasil memuat ${newStudentsData.length} data siswa dan nilai tersimpan.`
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Gagal memuat data dari API.");
        setStudentsData([]);
      } finally {
        setLoading(false);
      }
    },
    [API_URL]
  );

  useEffect(() => {
    const grade = params.grade;
    const subjectId = params.subjectId;
    const periode = params.periode;
    // 💡 PERBAIKAN: Ambil classroomId dari params
    const classroomId = params.classroomId;

    // 💡 PERBAIKAN: Periksa apakah semua parameter lengkap
    if (grade && subjectId && periode && classroomId) {
      // 💡 Simpan classroomId di state
      setParamsData({ grade, subjectId, periode, classroomId });
      // 💡 Panggil fetchData dengan classroomId
      fetchData(grade, subjectId, periode, classroomId);
    } else {
      setParamsData(null);
      setLoading(false);
      toast.error("Parameter navigasi tidak lengkap.");
    }
  }, [params, fetchData]);

  // --- HANDLERS ---

  const handleCommentChange = useCallback((key: string, value: string) => {
    setStudentsData((prevData) =>
      prevData.map((student) =>
        student.key === key ? { ...student, comment: value } : student
      )
    );
  }, []);

  const handleIndicatorChange = useCallback(
    (key: string, indicatorName: string, value: IndicatorValue) => {
      setStudentsData((prevData) =>
        prevData.map((student) =>
          student.key === key ? { ...student, [indicatorName]: value } : student
        )
      );
    },
    []
  );

  // 💡 PERUBAHAN: Fungsi handleSubmit untuk POST/PUT data
  const handleSubmit = async (key: string) => {
    const student = studentsData.find((s) => s.key === key);

    // 💡 PERBAIKAN: Pastikan paramsData.classroomId juga ada
    if (!student || !paramsData || !paramsData.classroomId) return;

    // 1. Validasi Indikator
    const indicatorsToSubmit: {
      indicator_id: number;
      predicate: string;
      description: string;
    }[] = [];
    let isValid = true;

    for (const indicatorField of indicatorFields) {
      const indiKey = `indi${indicatorField.ic}`;
      const predicate = student[indiKey] as IndicatorValue;

      if (!predicate) {
        toast.warn(
          `Predikat Indi ${indicatorField.ic} untuk ${student.fullName} wajib diisi.`
        );
        isValid = false;
        return;
      }

      indicatorsToSubmit.push({
        indicator_id: indicatorField.id,
        predicate: predicate,
        description: student.comment || "No description provided.",
      });
    }

    if (!isValid || indicatorsToSubmit.length === 0) {
      if (isValid) toast.error("Gagal kirim: Data indikator tidak ditemukan.");
      return;
    }

    // 2. Siapkan Payload
    const payload = {
      periode: paramsData.periode,
      // 💡 PERBAIKAN: Gunakan classroomId dari paramsData
      classroom_id: parseInt(paramsData.classroomId),
      subject_id: parseInt(paramsData.subjectId),
      student_id: student.student_id,
      indicators: indicatorsToSubmit,
    };

    // Set loading hanya untuk siswa ini
    setLoadingStudent((prev) => ({ ...prev, [key]: true }));

    try {
      // Menggunakan POST untuk POST (tambah) dan PUT (edit/timpa)
      await axios.post(`${API_URL}/report-pid`, payload);

      // Tentukan apakah ini update atau insert untuk pesan toast
      const actionType = student.comment ? "diperbarui" : "disimpan";

      toast.success(
        `Data PID untuk ${student.fullName} berhasil ${actionType}!`
      );

      // Muat ulang data untuk melihat perubahan (misalnya, jika data dikosongkan/di-reset)
      await fetchData(
        paramsData.grade,
        paramsData.subjectId,
        paramsData.periode,
        // 💡 Panggil fetchData dengan classroomId
        paramsData.classroomId
      );
    } catch (error) {
      console.error("Error submitting data:", error);
      toast.error(
        `Gagal menyimpan/memperbarui data PID untuk ${student.fullName}.`
      );
    } finally {
      // Matikan loading hanya untuk siswa ini
      setLoadingStudent((prev) => ({ ...prev, [key]: false }));
    }
  };

  // --- MEMOIZED DATA & COLUMN RENDER ---

  const periodeDisplay = useMemo(() => {
    return paramsData ? formatPeriodeDisplay(paramsData.periode) : "N/A";
  }, [paramsData]);

  // Fungsi pembantu untuk merender kolom Indikator
  const renderIndicatorColumn = (index: number) => {
    const indicatorKey = `indi${index}`;
    const indicatorTitle = `Indi ${index}`;

    return {
      title: (
        <Tooltip title={getIndicatorDescription(index)} placement="top">
          <Space size={4}>
            <span>{indicatorTitle}</span>
            <QuestionCircleOutlined
              style={{ color: "#ccc", cursor: "pointer" }}
            />
          </Space>
        </Tooltip>
      ),
      dataIndex: indicatorKey,
      key: indicatorKey,
      width: 100,
      align: "center" as const,
      render: (indi: IndicatorValue, record: StudentData) => (
        <Select
          value={indi}
          style={{ width: "100%" }}
          onChange={(value) =>
            handleIndicatorChange(
              record.key,
              indicatorKey,
              value as IndicatorValue
            )
          }
          optionLabelProp="label"
          placeholder="-"
        >
          {indicatorOptions.map((option) => (
            <Option
              key={option.value}
              value={option.value}
              label={option.value}
            >
              <Tag
                color={option.color}
                style={{ margin: 0, width: 30, textAlign: "center" }}
              >
                {option.label}
              </Tag>
            </Option>
          ))}
        </Select>
      ),
    };
  };

  // Membuat columns DYNAMIC berdasarkan indicatorFields
  const columns: TableProps<StudentData>["columns"] = useMemo(() => {
    // 1. Kolom Statis (Nama Siswa)
    const staticColumns: TableProps<StudentData>["columns"] = [
      {
        title: "Full Name",
        dataIndex: "fullName",
        key: "fullName",
        width: "15%",
        fixed: "left",
        sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      },
    ];

    // 2. Kolom Dinamis (Indikator) - Dibuat berdasarkan SEMUA indicatorFields
    const dynamicIndicatorColumns = indicatorFields
      .sort((a, b) => a.ic - b.ic) // Urutkan berdasarkan ic
      .map((field) => renderIndicatorColumn(field.ic));

    // 3. Kolom Statis Akhir (Description & Actions)
    const finalStaticColumns: TableProps<StudentData>["columns"] = [
      {
        title: "Description",
        dataIndex: "comment",
        key: "comment",
        width: "35%",
        render: (text, record) => (
          <TextArea
            value={text}
            onChange={(e) => handleCommentChange(record.key, e.target.value)}
            rows={2}
            placeholder="Masukkan deskripsi atau komentar..."
            style={{ width: "100%" }}
          />
        ),
      },
      {
        title: "Actions",
        key: "actions",
        fixed: "right",
        width: 100,
        render: (_, record) => (
          <Button
            type="primary"
            onClick={() => handleSubmit(record.key)}
            size="small"
            // 💡 PERUBAHAN: Cek status loading spesifik untuk siswa ini
            loading={!!loadingStudent[record.key]}
          >
            Submit
          </Button>
        ),
      },
    ];

    // Gabungkan semua kolom
    return [
      ...staticColumns,
      ...dynamicIndicatorColumns,
      ...finalStaticColumns,
    ];
  }, [indicatorFields, handleCommentChange, handleSubmit, loadingStudent]);

  return (
    <div style={{ padding: "24px" }}>
      <ToastContainer />

      {/* HEADER & NAVIGASI */}
      <Breadcrumb style={{ marginBottom: "10px" }}>
        <Breadcrumb.Item>PID Report</Breadcrumb.Item>
        <Breadcrumb.Item>Assessment</Breadcrumb.Item>
        <Breadcrumb.Item>Input</Breadcrumb.Item>
      </Breadcrumb>

      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        style={{ marginBottom: "20px", paddingLeft: 0 }}
      >
        Kembali ke Assessment
      </Button>

      <Title level={2} style={{ margin: 0 }}>
        Input Report PID
      </Title>

      <hr style={{ margin: "20px 0" }} />

      {/* DETAIL PARAMETER INPUT */}
      <Card
        title="Detail Input Laporan"
        style={{ marginBottom: 24, maxWidth: 800 }}
      >
        {paramsData ? (
          <Space direction="vertical" size="middle">
            <Text>
              <Text strong>Tingkat Kelas (Grade):</Text> {paramsData.grade}
            </Text>
            <Text>
              <Text strong>Classroom ID (untuk Fetch Siswa):</Text>{" "}
              {paramsData.classroomId}
            </Text>
            <Text>
              <Text strong>
                Mata Pelajaran (Subject ID: {paramsData.subjectId}):
              </Text>{" "}
              {subjectName}
            </Text>
            <Text>
              <Text strong>Periode Triwulan:</Text> {periodeDisplay}
              <Text type="secondary" style={{ marginLeft: "10px" }}>
                (Format API: **{paramsData.periode}**)
              </Text>
            </Text>
            <Title level={4} style={{ marginTop: "20px", marginBottom: "0px" }}>
              Tabel Input Nilai (Subjek: {subjectName})
            </Title>
          </Space>
        ) : (
          <Text type="danger">
            Kesalahan: Parameter navigasi tidak lengkap atau tidak valid.
          </Text>
        )}
      </Card>

      {/* TABEL INPUT NILAI SISWA */}
      <Card title="Data Nilai Siswa" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={studentsData}
          pagination={false}
          // Gunakan state loading umum untuk initial load
          loading={loading}
          // Scroll x disesuaikan dengan perkiraan jumlah kolom
          scroll={{
            x:
              1400 +
              (indicatorFields.length > 5
                ? (indicatorFields.length - 5) * 100
                : 0),
          }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default PIDReportInputPage;
