"use client";

import React, { useState } from "react";
import {
  Layout,
  Typography,
  Select,
  Button,
  Row,
  Col,
  Card,
  Input,
  Table,
  Checkbox,
  Space,
  notification,
} from "antd";
import { SearchOutlined, CloseCircleOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";

// =======================================================
// 1. DATA DUMMY & TYPESCRIPT INTERFACE (Digabungkan)
// =======================================================

export interface Student {
  nis: string;
  studentName: string;
  status: "Active" | "Graduate";
}

export interface PromotedStudent {
  nis: string;
  studentName: string;
  status: "Graduate";
}

// Data Dummy Identik dengan Gambar
const studentsInGrade2: Student[] = [
  { nis: "790841", studentName: "Aathirah Dhanesa Prayuda", status: "Active" },
  { nis: "790842", studentName: "Abyan Mufid Shaquille", status: "Active" },
  { nis: "798699", studentName: "Ahza Danendra Abdillah", status: "Active" },
  {
    nis: "790752",
    studentName: "Akhtar Khairazky Subiyanto",
    status: "Active",
  },
  { nis: "790955", studentName: "Aldeberan Kenan Arrazka", status: "Active" },
  // Tambahkan data lain untuk simulasi
  { nis: "791001", studentName: "Bima Satria Nusantara", status: "Active" },
  { nis: "791002", studentName: "Citra Dewi Lestari", status: "Active" },
];

const promotedStudentsInitial: PromotedStudent[] = [
  {
    nis: "790841",
    studentName: "Aathirah Dhanesa Prayuda",
    status: "Graduate",
  },
  { nis: "790842", studentName: "Abyan Mufid Shaquille", status: "Graduate" },
  {
    nis: "798699",
    studentName: "Ahza Danendra Abdillah Mutia",
    status: "Graduate",
  }, // Nama diperpanjang agar mirip gambar
];

const totalStudentsInGrade2 = 128;
const currentGrade = 2;
const nextGrade = 3;

export type GradeValue = number | string;

export interface PromotionState {
  currentGrade: number;
  newGrade: number;
  students: Student[];
  promotedStudents: PromotedStudent[];
  selectedStudentsToPromote: string[];
  totalStudentsInCurrentGrade: number;
}

// =======================================================
// 2. KOMPONEN UTAMA NEXT.JS/REACT
// =======================================================

const { Title, Text } = Typography;
const { Content } = Layout;

// Fungsi untuk mendapatkan opsi grade
const gradeOptions = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}));

const PromotionGraduationPage: React.FC = () => {
  const [state, setState] = useState<PromotionState>({
    currentGrade: currentGrade,
    newGrade: nextGrade,
    students: studentsInGrade2,
    promotedStudents: promotedStudentsInitial,
    selectedStudentsToPromote: promotedStudentsInitial.map((s) => s.nis),
    totalStudentsInCurrentGrade: totalStudentsInGrade2,
  });
  // State pencarian untuk tabel kiri
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>("");
  // State pencarian BARU untuk tabel kanan
  const [promotedSearchTerm, setPromotedSearchTerm] = useState<string>("");

  // Handler perubahan Grade Awal
  const handleCurrentGradeChange = (value: GradeValue) => {
    // Reset state promosi ketika grade diubah
    setState((prev) => ({
      ...prev,
      currentGrade: Number(value),
      // Dummy: Reset siswa untuk grade baru
      students: studentsInGrade2,
      promotedStudents: [],
      selectedStudentsToPromote: [],
    }));
  };

  const handleApplyGrade = () => {
    notification.info({
      message: "Grade Diterapkan",
      description: `Menampilkan siswa untuk grade ${state.currentGrade}.`,
    });
  };

  // Handler Checkbox di kolom kiri
  const handleStudentSelection = (checked: boolean, student: Student) => {
    setState((prev) => {
      let updatedSelected: string[];
      if (checked) {
        if (!prev.selectedStudentsToPromote.includes(student.nis)) {
          updatedSelected = [...prev.selectedStudentsToPromote, student.nis];
        } else {
          updatedSelected = prev.selectedStudentsToPromote;
        }
      } else {
        updatedSelected = prev.selectedStudentsToPromote.filter(
          (nis) => nis !== student.nis
        );
      }
      return {
        ...prev,
        selectedStudentsToPromote: updatedSelected,
      };
    });
  };

  // Handler Tombol Add to New Grade
  const handleAddToNewGrade = () => {
    setState((prev) => {
      // Siswa yang dipilih yang belum ada di daftar promoted
      const newStudentsToPromote = prev.students
        .filter(
          (s) =>
            prev.selectedStudentsToPromote.includes(s.nis) &&
            !prev.promotedStudents.some((ps) => ps.nis === s.nis)
        )
        .map((s) => ({
          nis: s.nis,
          studentName: s.studentName,
          status: "Graduate" as const,
        }));

      // Gabungkan dan pastikan NIS unik (untuk mencegah duplikasi jika kode diubah)
      const updatedPromotedStudents = [
        ...prev.promotedStudents,
        ...newStudentsToPromote,
      ];

      // Update selectedStudentsToPromote agar sesuai dengan promotedStudents
      const updatedSelected = updatedPromotedStudents.map((s) => s.nis);

      return {
        ...prev,
        promotedStudents: updatedPromotedStudents,
        selectedStudentsToPromote: updatedSelected,
      };
    });
  };

  // Handler Tombol Cancel (X) di kolom kanan
  const handleCancelPromotion = (record: PromotedStudent) => {
    setState((prev) => ({
      ...prev,
      promotedStudents: prev.promotedStudents.filter(
        (s) => s.nis !== record.nis
      ),
      selectedStudentsToPromote: prev.selectedStudentsToPromote.filter(
        (nis) => nis !== record.nis
      ),
    }));
  };

  const handleSubmitPromotion = () => {
    notification.success({
      message: "Promosi & Kelulusan Berhasil",
      description: `${state.promotedStudents.length} siswa berhasil dipromosikan ke Grade ${state.newGrade}.`,
      duration: 3,
    });
  };

  // Filter data untuk tabel kiri (Students in grade)
  const filteredStudents = state.students.filter(
    (student) =>
      student.nis.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      student.studentName
        .toLowerCase()
        .includes(currentSearchTerm.toLowerCase())
  );

  // Filter data untuk tabel kanan (New Grade)
  const filteredPromotedStudents = state.promotedStudents.filter(
    (student) =>
      student.nis.toLowerCase().includes(promotedSearchTerm.toLowerCase()) ||
      student.studentName
        .toLowerCase()
        .includes(promotedSearchTerm.toLowerCase())
  );

  // --- Kolom Table untuk Students in grade : 2 ---
  const studentsColumns: TableProps<Student>["columns"] = [
    {
      title: (
        <Checkbox
          checked={
            state.selectedStudentsToPromote.length > 0 &&
            filteredStudents.every((s) =>
              state.selectedStudentsToPromote.includes(s.nis)
            )
          }
          onChange={(e) => {
            // Logika select all/unselect all pada data yang terfilter
            if (e.target.checked) {
              const newSelected = filteredStudents
                .map((s) => s.nis)
                .filter(
                  (nis) => !state.selectedStudentsToPromote.includes(nis)
                );
              setState((prev) => ({
                ...prev,
                selectedStudentsToPromote: [
                  ...prev.selectedStudentsToPromote,
                  ...newSelected,
                ],
              }));
            } else {
              setState((prev) => ({
                ...prev,
                selectedStudentsToPromote:
                  prev.selectedStudentsToPromote.filter(
                    (nis) => !filteredStudents.map((s) => s.nis).includes(nis)
                  ),
              }));
            }
          }}
        />
      ),
      dataIndex: "nis",
      key: "checkbox",
      width: 40,
      render: (text: string, record: Student) => (
        <Checkbox
          checked={state.selectedStudentsToPromote.includes(record.nis)}
          onChange={(e) => handleStudentSelection(e.target.checked, record)}
        >
          {/* Checkbox di Antd memiliki header kosong jika tidak ada title, jadi kita taruh NIS di kolom berikutnya */}
        </Checkbox>
      ),
    },
    {
      title: "NIS",
      dataIndex: "nis",
      key: "nis",
    },
    {
      title: "Student Name",
      dataIndex: "studentName",
      key: "studentName",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
    },
  ];

  // --- Kolom Table untuk New Grade ---
  const promotedColumns: TableProps<PromotedStudent>["columns"] = [
    {
      title: "NIS",
      dataIndex: "nis",
      key: "nis",
    },
    {
      title: "Student Name",
      dataIndex: "studentName",
      key: "studentName",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Cancel",
      key: "cancel",
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={
            <CloseCircleOutlined
              style={{ fontSize: "18px", color: "#ff4d4f" }}
            />
          }
          onClick={() => handleCancelPromotion(record)}
          style={{ padding: 0 }}
        />
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#fff" }}>
      {/* --- Header --- */}
      <div
        style={{
          padding: "0 0 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Promotion & Graduation
        </Title>
        <Text strong style={{ fontSize: "24px" }}>
          2024-2025
        </Text>
      </div>

      {/* --- Pilihan Grade Awal --- */}
      <Row gutter={16} align="middle" style={{ marginBottom: 30 }}>
        <Col>
          <Text>Please set grade before first</Text>
        </Col>
        <Col>
          <Select
            value={state.currentGrade}
            onChange={handleCurrentGradeChange}
            options={gradeOptions}
            style={{ width: 80 }}
          />
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={handleApplyGrade}
            style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}
          >
            Apply Grade
          </Button>
        </Col>
      </Row>

      {/* --- Kolom Siswa Grade Saat Ini & Grade Baru --- */}
      <Row gutter={24}>
        {/* --- Kolom Kiri: Students in grade : 2 --- */}
        <Col span={12}>
          <Card
            style={{ border: "1px solid #d9d9d9", borderRadius: 2 }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={4} style={{ margin: 0 }}>
                    Students in grade : {state.currentGrade}
                  </Title>
                </Col>
                <Col>
                  <Text>
                    Student Total : {state.totalStudentsInCurrentGrade}
                  </Text>
                </Col>
              </Row>
              <Input
                placeholder="Search by NIS or Name"
                prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                value={currentSearchTerm}
                onChange={(e) => setCurrentSearchTerm(e.target.value)}
                style={{ marginTop: 16 }}
              />
            </div>

            <Table<Student>
              columns={studentsColumns}
              dataSource={filteredStudents}
              rowKey="nis"
              pagination={false}
              size="middle" // Agar padding table sesuai gambar
              scroll={{ y: 300 }}
              style={{ border: "none" }}
            />

            <div
              style={{
                padding: 16,
                textAlign: "center",
                borderTop: "1px solid #f0f0f0",
              }}
            >
              <Button
                type="primary"
                onClick={handleAddToNewGrade}
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              >
                Add to New Grade
              </Button>
            </div>
          </Card>
        </Col>

        {/* --- Kolom Kanan: New Grade --- */}
        <Col span={12}>
          <Card
            style={{ border: "1px solid #d9d9d9", borderRadius: 2 }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Space>
                    <Title level={4} style={{ margin: 0 }}>
                      New Grade
                    </Title>
                    <Select
                      value={state.newGrade}
                      onChange={(value) =>
                        setState((prev) => ({
                          ...prev,
                          newGrade: Number(value),
                        }))
                      }
                      options={gradeOptions.filter(
                        (opt) => opt.value !== state.currentGrade
                      )}
                      style={{ width: 80 }}
                    />
                  </Space>
                </Col>
                <Col>
                  <Text>Student Total : {state.promotedStudents.length}</Text>
                </Col>
              </Row>
              {/* === INPUT PENCARIAN BARU UNTUK TABEL KANAN === */}
              <Input
                placeholder="Search by NIS or Name"
                prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                value={promotedSearchTerm}
                onChange={(e) => setPromotedSearchTerm(e.target.value)}
                style={{ marginTop: 16 }}
              />
              {/* ============================================== */}
            </div>

            <Table<PromotedStudent>
              columns={promotedColumns}
              // Gunakan filteredPromotedStudents yang baru
              dataSource={filteredPromotedStudents}
              rowKey="nis"
              pagination={false}
              size="middle"
              scroll={{ y: 300 }}
              style={{ border: "none" }}
            />
            <div
              style={{
                padding: 16,
                textAlign: "center",
                borderTop: "1px solid #f0f0f0",
              }}
            >
              {/* Tempat kosong untuk konsistensi tata letak, atau bisa ditambahkan tombol lain jika diperlukan */}
            </div>
          </Card>
        </Col>
      </Row>

      {/* --- Footer Submit --- */}
      <Row justify="center" style={{ marginTop: 30 }}>
        <Col span={24}>
          <div
            style={{
              backgroundColor: "#fffbe6",
              border: "1px solid #ffe58f",
              padding: 16,
              borderRadius: 2,
              textAlign: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <Text type="warning" strong style={{ color: "#faad14" }}>
              Please kindly check before submit the **Promotion & Graduation** !
            </Text>
            <div style={{ marginTop: 16 }}>
              <Button
                type="primary"
                size="large"
                onClick={handleSubmitPromotion}
                style={{
                  backgroundColor: "#1890ff",
                  borderColor: "#1890ff",
                  height: "40px",
                }}
              >
                Submit Promotion
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <style jsx global>{`
        /* Mengganti warna header table Ant Design agar lebih mirip gambar */
        .ant-table-thead > tr > th {
          background-color: #f7f7f7 !important;
        }
        /* Menghapus border luar table */
        .ant-table-container {
          border: none !important;
        }
      `}</style>
    </Layout>
  );
};

export default PromotionGraduationPage;
