// src/app/academic-report/skills-input/[subjectId]/[classroomId]/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Table,
  Button,
  Typography,
  Layout,
  Input,
  Form,
  Spin,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import { toast } from "react-toastify";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// --- API Configuration ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  message.error("NEXT_PUBLIC_API_URL is not defined in .env");
}

// =================================================================
// 1. TYPE DEFINITIONS
// =================================================================

interface AcademicYear {
  id: number;
  year: string;
  is_ganjil: boolean;
  is_genap: boolean;
  is_active: boolean;
}

interface Subject {
  id: number;
  name: string;
  grade: string;
  kkm: number;
}

interface StudentData {
  id: number; // student_classroom id
  student_id: number;
  classroom_id: number;
  semester: string;
  student: {
    id: number; // student id
    fullname: string;
    grade: string;
  };
  classroom: {
    id: number;
    class_name: string;
  };
}

interface ReportSkillData {
  id?: number; // report_skill id, null if not submitted yet
  student_id: number;
  fullname: string; // aggregated for easier mapping

  perf1: number | "";
  perf2: number | "";
  perf3: number | "";
  avrg_perf: number;

  prod1: number | "";
  prod2: number | "";
  prod3: number | "";
  avrg_prod: number;

  proj1: number | "";
  proj2: number | "";
  proj3: number | "";
  avrg_proj: number;

  final: number;
  predicate: string;
  description: string;
}

// =================================================================
// 2. HELPER FUNCTIONS
// =================================================================

const calculateAvg = (p1: number, p2: number, p3: number): number => {
  // Hanya hitung rata-rata dari nilai yang valid (angka > 0)
  const scores = [p1, p2, p3].filter((n) => !isNaN(n) && n > 0);
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / scores.length);
};

const calculateFinalAvg = (
  avgP: number,
  avgD: number,
  avgJ: number
): number => {
  // Hanya hitung rata-rata dari Average (yang nilainya > 0)
  const avgs = [avgP, avgD, avgJ].filter((n) => n > 0);
  if (avgs.length === 0) return 0;
  const sum = avgs.reduce((acc, avg) => acc + avg, 0);
  return Math.round(sum / avgs.length);
};

const getSemesterName = (academicYear: AcademicYear | null): string => {
  if (!academicYear) return "";
  return academicYear.is_ganjil
    ? "Ganjil"
    : academicYear.is_genap
    ? "Genap"
    : "";
};

const getPredicateAndDesc = (finalScore: number, kkm: number = 70) => {
  let predicate = "-";
  let description = "Nilai belum dimasukkan";

  if (finalScore === 0) return { predicate, description };

  // Logic Predicate (example: based on KKM and common grading scale)
  if (finalScore >= kkm + 10) {
    predicate = "A";
    description = "Excellent";
  } else if (finalScore >= kkm + 5) {
    predicate = "B";
    description = "Great";
  } else if (finalScore >= kkm) {
    predicate = "C";
    description = "Good";
  } else {
    predicate = "D";
    description = "Need Improvement";
  }

  return { predicate, description };
};

/**
 * MENGUBAH NILAI KOSONG ('') MENJADI 0 (NOL) AGAR LOLOS VALIDASI REQUIRED DI SERVER.
 * Nilai yang sudah berupa angka akan tetap dikirim sebagai angka.
 */
const formatScore = (score: number | "") => (score === "" ? 0 : Number(score));

// =================================================================
// 3. MAIN COMPONENT
// =================================================================

const SkillsInputPage: React.FC = () => {
  const params = useParams();
  const subjectId = params.subjectId as string;
  const classroomId = params.classroomId as string;

  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [studentsData, setStudentsData] = useState<ReportSkillData[]>([]);

  // 1. Fetch Basic Data
  const fetchData = useCallback(async () => {
    if (!API_BASE_URL) return;

    try {
      setLoading(true);

      // --- Fetch Academic Year ---
      const academicRes = await axios.get(`${API_BASE_URL}/academic-years`);
      const activeAcademicYear = academicRes.data.find(
        (a: AcademicYear) => a.is_active
      );
      setAcademicYear(activeAcademicYear || null);

      // --- Fetch Subject Name & Grade ---
      const subjectRes = await axios.get(`${API_BASE_URL}/subjects`);
      const selectedSubject = subjectRes.data.data.find(
        (s: Subject) => s.id.toString() === subjectId
      );
      setSubject(selectedSubject || null);

      const grade = selectedSubject?.grade || "1";
      const kkm = selectedSubject?.kkm || 70;

      // --- Fetch Students in Classroom ---
      const studentsRes = await axios.get(
        `${API_BASE_URL}/student/classroom?classroom=${classroomId}`
      );
      const students: StudentData[] = studentsRes.data.data || [];

      if (students.length === 0) {
        setStudentsData([]);
        toast.info("Tidak ada data siswa ditemukan di kelas ini.");
        setLoading(false);
        return;
      }

      // --- Fetch Previous Submitted Scores ---
      const scoresRes = await axios.get(
        `${API_BASE_URL}/report-skill?classroom_id=${classroomId}&subject_id=${subjectId}&grade=${grade}`
      );
      const submittedScores: ReportSkillData[] = scoresRes.data || [];

      // --- Merge Student Data with Scores ---
      const mergedData: ReportSkillData[] = students.map((student) => {
        const existingScore = submittedScores.find(
          (score) => score.student_id === student.student_id
        );

        const initialValues = {
          perf1: existingScore?.perf1 ?? "",
          perf2: existingScore?.perf2 ?? "",
          perf3: existingScore?.perf3 ?? "",
          prod1: existingScore?.prod1 ?? "",
          prod2: existingScore?.prod2 ?? "",
          prod3: existingScore?.prod3 ?? "",
          proj1: existingScore?.proj1 ?? "",
          proj2: existingScore?.proj2 ?? "",
          proj3: existingScore?.proj3 ?? "",
        };

        const avrg_perf = calculateAvg(
          Number(initialValues.perf1),
          Number(initialValues.perf2),
          Number(initialValues.perf3)
        );
        const avrg_prod = calculateAvg(
          Number(initialValues.prod1),
          Number(initialValues.prod2),
          Number(initialValues.prod3)
        );
        const avrg_proj = calculateAvg(
          Number(initialValues.proj1),
          Number(initialValues.proj2),
          Number(initialValues.proj3)
        );

        const final = calculateFinalAvg(avrg_perf, avrg_prod, avrg_proj);
        const { predicate, description } = getPredicateAndDesc(final, kkm);

        return {
          id: existingScore?.id,
          student_id: student.student_id,
          fullname: student.student.fullname,
          ...initialValues,
          avrg_perf,
          avrg_prod,
          avrg_proj,
          final,
          predicate,
          description,
        };
      });

      setStudentsData(mergedData);

      // Set initial form values
      const initialFormValues = mergedData.reduce((acc, student, index) => {
        acc[`${index}_perf1`] = student.perf1;
        acc[`${index}_perf2`] = student.perf2;
        acc[`${index}_perf3`] = student.perf3;
        acc[`${index}_prod1`] = student.prod1;
        acc[`${index}_prod2`] = student.prod2;
        acc[`${index}_prod3`] = student.prod3;
        acc[`${index}_proj1`] = student.proj1;
        acc[`${index}_proj2`] = student.proj2;
        acc[`${index}_proj3`] = student.proj3;
        return acc;
      }, {} as Record<string, any>);

      form.setFieldsValue(initialFormValues);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error(
        "Gagal memuat data. Silakan cek koneksi API dan parameter URL."
      );
    } finally {
      setLoading(false);
    }
  }, [classroomId, subjectId, form]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Logic to handle score changes and update calculated fields
  const handleScoreChange = useCallback(() => {
    const values = form.getFieldsValue();
    const kkm = subject?.kkm || 70;

    const updatedData: ReportSkillData[] = studentsData.map(
      (student, index) => {
        // Ambil nilai input, pastikan diubah menjadi 0 jika null/kosong untuk perhitungan sementara
        const perf1 = Number(values[`${index}_perf1`]) || 0;
        const perf2 = Number(values[`${index}_perf2`]) || 0;
        const perf3 = Number(values[`${index}_perf3`]) || 0;

        const prod1 = Number(values[`${index}_prod1`]) || 0;
        const prod2 = Number(values[`${index}_prod2`]) || 0;
        const prod3 = Number(values[`${index}_prod3`]) || 0;

        const proj1 = Number(values[`${index}_proj1`]) || 0;
        const proj2 = Number(values[`${index}_proj2`]) || 0;
        const proj3 = Number(values[`${index}_proj3`]) || 0;

        // Hitung rata-rata berdasarkan nilai yang ADA (> 0)
        const avrg_perf = calculateAvg(perf1, perf2, perf3);
        const avrg_prod = calculateAvg(prod1, prod2, prod3);
        const avrg_proj = calculateAvg(proj1, proj2, proj3);

        const final = calculateFinalAvg(avrg_perf, avrg_prod, avrg_proj);
        const { predicate, description } = getPredicateAndDesc(final, kkm);

        return {
          ...student,
          // Simpan kembali nilai input sebagai string/number (bukan hanya number) agar bisa kosong ('')
          perf1:
            values[`${index}_perf1`] === 0 ? 0 : values[`${index}_perf1`] || "",
          perf2:
            values[`${index}_perf2`] === 0 ? 0 : values[`${index}_perf2`] || "",
          perf3:
            values[`${index}_perf3`] === 0 ? 0 : values[`${index}_perf3`] || "",
          avrg_perf,
          prod1:
            values[`${index}_prod1`] === 0 ? 0 : values[`${index}_prod1`] || "",
          prod2:
            values[`${index}_prod2`] === 0 ? 0 : values[`${index}_prod2`] || "",
          prod3:
            values[`${index}_prod3`] === 0 ? 0 : values[`${index}_prod3`] || "",
          avrg_prod,
          proj1:
            values[`${index}_proj1`] === 0 ? 0 : values[`${index}_proj1`] || "",
          proj2:
            values[`${index}_proj2`] === 0 ? 0 : values[`${index}_proj2`] || "",
          proj3:
            values[`${index}_proj3`] === 0 ? 0 : values[`${index}_proj3`] || "",
          avrg_proj,
          final,
          predicate,
          description,
        };
      }
    );

    setStudentsData(updatedData);
  }, [studentsData, form, subject]);

  // 3. Handle Submit
  const handleSaveScore = async (studentData: ReportSkillData) => {
    if (!API_BASE_URL || !academicYear || !subject) {
      toast.error("Data akademik/subjek belum lengkap.");
      return;
    }

    // 1. Check minimal ada satu input nilai.
    const scoreFields = [
      studentData.perf1,
      studentData.perf2,
      studentData.perf3,
      studentData.prod1,
      studentData.prod2,
      studentData.prod3,
      studentData.proj1,
      studentData.proj2,
      studentData.proj3,
    ];

    const hasAnyScore = scoreFields.some((score) => score !== "");
    if (!hasAnyScore) {
      toast.warn(`Tidak ada nilai yang diinput untuk ${studentData.fullname}.`);
      return;
    }

    // 2. Check input yang ADA adalah angka 0-100.
    const invalidScore = scoreFields.find(
      (score) =>
        score !== "" &&
        (isNaN(Number(score)) || Number(score) < 0 || Number(score) > 100)
    );
    if (invalidScore !== undefined) {
      toast.error(
        `Nilai yang dimasukkan '${invalidScore}' untuk ${studentData.fullname} tidak valid (harus angka 0-100).`
      );
      return;
    }

    // Construct Payload
    const payload = {
      subject_id: subject.id,
      student_id: studentData.student_id,
      classroom_id: Number(classroomId),
      grade: Number(subject.grade),

      // Menggunakan formatScore: '' diubah menjadi 0 untuk lolos validasi required server.
      perf1: formatScore(studentData.perf1),
      perf2: formatScore(studentData.perf2),
      perf3: formatScore(studentData.perf3),
      avrg_perf: studentData.avrg_perf,

      prod1: formatScore(studentData.prod1),
      prod2: formatScore(studentData.prod2),
      prod3: formatScore(studentData.prod3),
      avrg_prod: studentData.avrg_prod,

      proj1: formatScore(studentData.proj1),
      proj2: formatScore(studentData.proj2),
      proj3: formatScore(studentData.proj3),
      avrg_proj: studentData.avrg_proj,

      final: studentData.final,
      predicate: studentData.predicate,
      description: studentData.description,
    };

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/report-skill`,
        payload
      );

      if (response.data?.id) {
        setStudentsData((prev) =>
          prev.map((s) =>
            s.student_id === studentData.student_id
              ? { ...s, id: response.data.id }
              : s
          )
        );
      }

      toast.success(
        `✅ Nilai ${studentData.fullname} berhasil ${
          studentData.id ? "diperbarui" : "disimpan"
        }!`
      );
    } catch (error: any) {
      console.error("Submission failed:", error.response?.data || error);
      // Tampilkan error yang lebih spesifik jika ada dari server
      const errorMessage =
        error.response?.data?.message || error.response?.data?.errors
          ? error.response.data.message ||
            Object.values(error.response.data.errors).flat().join(", ")
          : "Error koneksi/server yang tidak diketahui.";

      toast.error(
        `❌ Gagal menyimpan nilai ${studentData.fullname}: ${errorMessage}`
      );
    } finally {
      setLoading(false);
    }
  };

  // 4. Table Columns (Input Form)
  const columns: ColumnsType<ReportSkillData> = useMemo(
    () => [
      {
        title: "Full Name",
        dataIndex: "fullname",
        key: "fullname",
        fixed: "left",
        width: 200,
        render: (text) => <Text strong>{text}</Text>,
      },
      // --- Grouping: Performance ---
      {
        title: "Performance",
        children: [
          {
            title: "Perf1",
            key: "perf1",
            width: 70,
            align: "center",
            render: (_, record, index) => renderInput(index, "perf1"),
          },
          {
            title: "Perf2",
            key: "perf2",
            width: 70,
            align: "center",
            render: (_, record, index) => renderInput(index, "perf2"),
          },
          {
            title: "Perf3",
            key: "perf3",
            width: 70,
            align: "center",
            render: (_, record, index) => renderInput(index, "perf3"),
          },
          {
            title: "AvgR",
            dataIndex: "avrg_perf",
            key: "AvgR_Perf",
            width: 70,
            align: "center",
            className: "avg-column",
          },
        ],
      },
      // --- Grouping: Production ---
      {
        title: "Production",
        children: [
          {
            title: "Prod1",
            key: "prod1",
            width: 70,
            align: "center",
            render: (_, record, index) => renderInput(index, "prod1"),
          },
          {
            title: "Prod2",
            key: "prod2",
            width: 70,
            align: "center",
            render: (_, record, index) => renderInput(index, "prod2"),
          },
          {
            title: "Prod3",
            key: "prod3",
            width: 70,
            align: "center",
            render: (_, record, index) => renderInput(index, "prod3"),
          },
          {
            title: "AvgR",
            dataIndex: "avrg_prod",
            key: "AvgR_Prod",
            width: 70,
            align: "center",
            className: "avg-column",
          },
        ],
      },
      // --- Grouping: Project ---
      {
        title: "Project",
        children: [
          {
            title: "Proj1",
            key: "proj1",
            width: 70,
            align: "center",
            render: (_, record, index) => renderInput(index, "proj1"),
          },
          {
            title: "Proj2",
            key: "proj2",
            width: 70,
            align: "center",
            render: (_, record, index) => renderInput(index, "proj2"),
          },
          {
            title: "Proj3",
            key: "proj3",
            width: 70,
            align: "center",
            render: (_, record, index) => renderInput(index, "proj3"),
          },
          {
            title: "AvgR",
            dataIndex: "avrg_proj",
            key: "AvgR_Proj",
            width: 70,
            align: "center",
            className: "avg-column",
          },
        ],
      },
      // --- Final Data ---
      {
        title: "Final",
        dataIndex: "final",
        key: "Final",
        width: 70,
        align: "center",
      },
      {
        title: "Predicate",
        dataIndex: "predicate",
        key: "Predicate",
        width: 90,
        align: "center",
      },
      { title: "Desc", dataIndex: "description", key: "Desc", width: 100 },
      {
        title: "Actions",
        key: "Actions",
        fixed: "right",
        width: 100,
        render: (_, record) => (
          <Button
            type={record.id ? "default" : "primary"}
            size="small"
            onClick={() => handleSaveScore(record)}
            loading={loading}
          >
            {record.id ? "Update" : "Submit"}
          </Button>
        ),
      },
    ],
    [loading, studentsData, subject]
  );

  // Input Render Function
  const renderInput = (index: number, field: keyof ReportSkillData) => {
    return (
      <Form.Item
        name={`${index}_${field}`}
        noStyle
        rules={[
          {
            pattern: /^(100|[1-9]?[0-9])$/,
            message: "",
          },
        ]}
      >
        <Input
          type="number"
          min={0}
          max={100}
          style={{ width: "100%", textAlign: "center" }}
          onChange={handleScoreChange}
          className="score-input-no-spin"
        />
      </Form.Item>
    );
  };

  if (loading && studentsData.length === 0) {
    return (
      <Layout style={{ padding: 24, background: "#fff", minHeight: "100vh" }}>
        <Spin tip="Memuat data nilai dan siswa..." size="large" />
      </Layout>
    );
  }

  const semesterName = getSemesterName(academicYear);
  const academicYearText = academicYear
    ? `${academicYear.year} (${semesterName})`
    : "N/A";
  const subjectName = subject?.name || "Mata Pelajaran";
  const grade = subject?.grade || "-";

  return (
    <Layout style={{ padding: "24px 0", background: "#fff" }}>
      {/* Header Halaman */}
      <Header
        style={{
          background: "#fff",
          padding: 0,
          height: "auto",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ paddingLeft: 24 }}>
            <Text type="secondary">Home / Academic Report / Skills Input</Text>
            <Title level={1} style={{ margin: "8px 0 0 0" }}>
              Skills Input
            </Title>
          </div>
          <Title level={2} style={{ margin: "16px 24px 0 0", color: "#555" }}>
            {academicYearText}
          </Title>
        </div>
        <Title level={4} style={{ margin: "16px 24px 0 24px" }}>
          Subject : {subjectName} (Grade: {grade} | Class ID: {classroomId})
        </Title>
      </Header>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #f0f0f0",
          margin: "0 24px 24px 24px",
        }}
      />

      {/* Konten Form dan Tabel */}
      <Content style={{ padding: "0 24px", minHeight: 280 }}>
        <Form form={form} initialValues={{}} layout="inline">
          <Table<ReportSkillData>
            columns={columns}
            dataSource={studentsData.map((data, index) => ({
              ...data,
              key: index,
            }))}
            bordered
            pagination={false}
            scroll={{ x: 1500 }}
            size="middle"
            loading={loading}
            className="skills-input-table"
          />
        </Form>
      </Content>

      {/* --- Styling Khusus (Menyembunyikan Tombol Spin Input) --- */}
      <style global jsx>{`
        /* Styling untuk membuat kolom AvgR berwarna abu-abu muda */
        .skills-input-table .ant-table-thead .avg-column,
        .skills-input-table .ant-table-tbody .avg-column {
          background-color: #f7f7f7 !important;
          font-weight: bold;
        }

        /* Styling header */
        .skills-input-table .ant-table-thead > tr > th {
          text-align: center;
        }

        /* Layouting Form di dalam tabel */
        .skills-input-table .ant-form-item {
          margin-bottom: 0 !important;
        }

        /* CSS untuk MENYEMBUNYIKAN TOMBOL SPIN */
        .score-input-no-spin::-webkit-outer-spin-button,
        .score-input-no-spin::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .score-input-no-spin[type="number"] {
          -moz-appearance: textfield; /* Firefox */
          text-align: center;
          padding: 4px 8px !important;
        }
      `}</style>
    </Layout>
  );
};

export default SkillsInputPage;
