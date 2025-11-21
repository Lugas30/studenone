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
// 1. DATA DUMMY & TYPESCRIPT INTERFACE
// =======================================================

// Interface untuk Siswa di Grade Awal
export interface CurrentStudent {
  nis: string;
  studentName: string;
}

// Interface untuk Siswa yang Sudah Ditempatkan di Kelas
export interface PlacedStudent extends CurrentStudent {
  classId: string; // Kelas tujuan (misal: P3A)
}

// Data Dummy Siswa di Grade 3
const studentsInGrade3: CurrentStudent[] = [
  { nis: "790841", studentName: "Aathirah Dhanesa Prayuda" },
  { nis: "790842", studentName: "Abyan Mufid Shaquille" },
  { nis: "798699", studentName: "Ahza Danendra Abdillah" },
  { nis: "790752", studentName: "Akhtar Khairazky Subiyanto" },
  { nis: "790955", studentName: "Aldeberan Kenan Arrazka" },
  { nis: "790780", studentName: "Bima Satria Nusantara" },
  { nis: "790781", studentName: "Citra Dewi Lestari" },
];

// Data Dummy Siswa yang Sudah Ditempatkan
const placedStudentsInitial: PlacedStudent[] = [
  { nis: "790841", studentName: "Fatah Al Amin", classId: "P3A" },
  { nis: "790842", studentName: "Sakilah Mawadah", classId: "P3A" },
  { nis: "798699", studentName: "Azzahra Mutia", classId: "P3A" },
];

const totalStudentsInGrade3 = 10; // Sesuai gambar
const currentGrade = 3;
const initialClass = "P3A";

export type GradeValue = number | string;

export interface PlacementState {
  currentGrade: number;
  targetClass: string;
  students: CurrentStudent[];
  placedStudents: PlacedStudent[];
  selectedStudentsToPlace: string[];
  totalStudentsInCurrentGrade: number;
}

// =======================================================
// 2. KOMPONEN UTAMA NEXT.JS/REACT
// =======================================================

const { Title, Text } = Typography;
const { Content } = Layout;

// Opsi Grade dan Class
const gradeOptions = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}));

const classOptions = [
  { value: "P3A", label: "P3A" },
  { value: "P3B", label: "P3B" },
  { value: "P3C", label: "P3C" },
];

const StudentPlacementPage: React.FC = () => {
  const [state, setState] = useState<PlacementState>({
    currentGrade: currentGrade,
    targetClass: initialClass,
    students: studentsInGrade3,
    placedStudents: placedStudentsInitial,
    selectedStudentsToPlace: placedStudentsInitial.map((s) => s.nis),
    totalStudentsInCurrentGrade: totalStudentsInGrade3,
  });

  // State pencarian untuk tabel kiri (Students in grade)
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>("");
  // State pencarian untuk tabel kanan (Class Placement)
  const [placedSearchTerm, setPlacedSearchTerm] = useState<string>("");

  // Handler perubahan Grade Awal
  const handleCurrentGradeChange = (value: GradeValue) => {
    // Reset state penempatan ketika grade diubah
    setState((prev) => ({
      ...prev,
      currentGrade: Number(value),
      // Dummy: Ganti siswa untuk grade baru
      students: studentsInGrade3,
      placedStudents: [],
      selectedStudentsToPlace: [],
    }));
  };

  const handleApplyGrade = () => {
    notification.info({
      message: "Grade Diterapkan",
      description: `Menampilkan siswa untuk grade ${state.currentGrade}.`,
    });
  };

  const handleTargetClassChange = (value: string) => {
    setState((prev) => ({
      ...prev,
      targetClass: value,
    }));
  };

  // Handler Checkbox di kolom kiri
  const handleStudentSelection = (
    checked: boolean,
    student: CurrentStudent
  ) => {
    setState((prev) => {
      let updatedSelected: string[];
      if (checked) {
        if (!prev.selectedStudentsToPlace.includes(student.nis)) {
          updatedSelected = [...prev.selectedStudentsToPlace, student.nis];
        } else {
          updatedSelected = prev.selectedStudentsToPlace;
        }
      } else {
        updatedSelected = prev.selectedStudentsToPlace.filter(
          (nis) => nis !== student.nis
        );
      }
      return {
        ...prev,
        selectedStudentsToPlace: updatedSelected,
      };
    });
  };

  // Handler Tombol Add to Class
  const handleAddToClass = () => {
    setState((prev) => {
      // Siswa yang dipilih yang belum ada di daftar placed
      const newStudentsToPlace = prev.students
        .filter(
          (s) =>
            prev.selectedStudentsToPlace.includes(s.nis) &&
            !prev.placedStudents.some((ps) => ps.nis === s.nis)
        )
        .map((s) => ({
          nis: s.nis,
          studentName: s.studentName,
          classId: prev.targetClass, // Tambahkan classId saat dipindahkan
        }));

      // Gabungkan data
      const updatedPlacedStudents = [
        ...prev.placedStudents.filter(
          (s) => !newStudentsToPlace.some((n) => n.nis === s.nis)
        ), // Pastikan tidak ada duplikasi
        ...newStudentsToPlace,
      ];

      // Update selectedStudentsToPlace agar sesuai dengan placedStudents
      const updatedSelected = updatedPlacedStudents.map((s) => s.nis);

      notification.success({
        message: "Siswa Ditambahkan",
        description: `${newStudentsToPlace.length} siswa ditambahkan ke kelas ${prev.targetClass}.`,
      });

      return {
        ...prev,
        placedStudents: updatedPlacedStudents,
        selectedStudentsToPlace: updatedSelected,
      };
    });
  };

  // Handler Tombol Cancel (X) di kolom kanan
  const handleCancelPlacement = (record: PlacedStudent) => {
    setState((prev) => ({
      ...prev,
      placedStudents: prev.placedStudents.filter((s) => s.nis !== record.nis),
      selectedStudentsToPlace: prev.selectedStudentsToPlace.filter(
        (nis) => nis !== record.nis
      ),
    }));
  };

  const handleSaveChanges = () => {
    notification.success({
      message: "Penempatan Berhasil Disimpan",
      description: `${state.placedStudents.length} siswa telah ditempatkan di kelas ${state.targetClass}.`,
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

  // Filter data untuk tabel kanan (Class Placement)
  const filteredPlacedStudents = state.placedStudents.filter(
    (student) =>
      student.nis.toLowerCase().includes(placedSearchTerm.toLowerCase()) ||
      student.studentName.toLowerCase().includes(placedSearchTerm.toLowerCase())
  );

  // --- Kolom Table untuk Students in grade : 3 ---
  const studentsColumns: TableProps<CurrentStudent>["columns"] = [
    {
      title: (
        <Checkbox
          checked={
            // Cek apakah semua siswa yang terfilter sudah terpilih
            filteredStudents.length > 0 &&
            filteredStudents.every((s) =>
              state.selectedStudentsToPlace.includes(s.nis)
            )
          }
          indeterminate={
            // Cek apakah sebagian siswa terfilter terpilih
            filteredStudents.some((s) =>
              state.selectedStudentsToPlace.includes(s.nis)
            ) &&
            !filteredStudents.every((s) =>
              state.selectedStudentsToPlace.includes(s.nis)
            )
          }
          onChange={(e) => {
            if (e.target.checked) {
              // Tambahkan semua NIS dari filteredStudents ke selectedStudentsToPlace
              setState((prev) => ({
                ...prev,
                selectedStudentsToPlace: [
                  ...new Set([
                    ...prev.selectedStudentsToPlace,
                    ...filteredStudents.map((s) => s.nis),
                  ]),
                ],
              }));
            } else {
              // Hapus semua NIS dari filteredStudents dari selectedStudentsToPlace
              const filteredNis = filteredStudents.map((s) => s.nis);
              setState((prev) => ({
                ...prev,
                selectedStudentsToPlace: prev.selectedStudentsToPlace.filter(
                  (nis) => !filteredNis.includes(nis)
                ),
              }));
            }
          }}
        />
      ),
      dataIndex: "nis",
      key: "checkbox",
      width: 40,
      render: (text: string, record: CurrentStudent) => (
        <Checkbox
          checked={state.selectedStudentsToPlace.includes(record.nis)}
          onChange={(e) => handleStudentSelection(e.target.checked, record)}
        />
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
  ];

  // --- Kolom Table untuk Class Placement ---
  const placedColumns: TableProps<PlacedStudent>["columns"] = [
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
      title: "Cancel",
      key: "cancel",
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={
            <CloseCircleOutlined
              style={{ fontSize: "18px", color: "#e74c3c" }}
            />
          }
          onClick={() => handleCancelPlacement(record)}
          style={{ padding: 0 }}
        />
      ),
    },
  ];

  return (
    <Layout
      style={{
        minHeight: "100vh",
        backgroundColor: "#fff",
      }}
    >
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
          Student Placement
        </Title>
        <Text strong style={{ fontSize: "24px" }}>
          2024-2025
        </Text>
      </div>

      {/* --- Pilihan Grade Awal --- */}
      <Row gutter={16} align="middle" style={{ marginBottom: 30 }}>
        <Col>
          <Text>Please set grade first</Text>
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
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
          >
            Apply Grade
          </Button>
        </Col>
      </Row>

      {/* --- Kolom Siswa Grade Saat Ini & Penempatan Kelas --- */}
      <Row gutter={24}>
        {/* --- Kolom Kiri: Students in grade : 3 --- */}
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

            <Table<CurrentStudent>
              columns={studentsColumns}
              dataSource={filteredStudents}
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
              <Button
                type="primary"
                onClick={handleAddToClass}
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              >
                Add to Class
              </Button>
            </div>
          </Card>
        </Col>

        {/* --- Kolom Kanan: Class Placement --- */}
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
                      Class Placement
                    </Title>
                    <Select
                      value={state.targetClass}
                      onChange={handleTargetClassChange}
                      options={classOptions}
                      style={{ width: 100 }}
                    />
                  </Space>
                </Col>
                <Col>
                  <Text>
                    Student Total :{" "}
                    {
                      // Hanya hitung siswa yang sudah ditempatkan di kelas TARGET saat ini
                      state.placedStudents.filter(
                        (s) => s.classId === state.targetClass
                      ).length
                    }
                  </Text>
                </Col>
              </Row>
              <Input
                placeholder="Search by NIS or Name"
                prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                value={placedSearchTerm}
                onChange={(e) => setPlacedSearchTerm(e.target.value)}
                style={{ marginTop: 16 }}
              />
            </div>

            <Table<PlacedStudent>
              columns={placedColumns}
              // Filter data yang ditampilkan hanya untuk kelas yang dipilih
              dataSource={filteredPlacedStudents.filter(
                (s) => s.classId === state.targetClass
              )}
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
              {/* Bagian ini kosong untuk menyamakan tinggi card kiri/kanan */}
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
              Please kindly check before submit the **placement** !
            </Text>
            <div style={{ marginTop: 16 }}>
              <Button
                type="primary"
                size="large"
                onClick={handleSaveChanges}
                style={{
                  backgroundColor: "#1890ff",
                  borderColor: "#1890ff",
                  height: "40px",
                }}
              >
                Save Changes
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

export default StudentPlacementPage;
