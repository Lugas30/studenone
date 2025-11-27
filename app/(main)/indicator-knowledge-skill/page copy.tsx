"use client";
// src/pages/knowledge-skill-input.tsx - Style Disesuaikan dengan GradeClassroomPage

import React, { useState, useMemo } from "react";
import Head from "next/head";
import {
  Table,
  Input,
  Button,
  Select,
  Space,
  Breadcrumb,
  Typography,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title } = Typography;
const { Option } = Select;

// 1. Tipe Data (Disesuaikan untuk Knowledge & Skill Indicators)
// =============================================================================
interface SubjectData {
  id: number;
  subject: string;
  teacher: string;
  grade: number;
  semester: "Ganjil" | "Genap";
  // Menambahkan Indicator sesuai dengan kebutuhan halaman
  knowledgeIndicator: string;
  skillIndicator: string;
}

// 2. Data Dummy (Disesuaikan dengan Gambar)
// =============================================================================
const DUMMY_DATA: SubjectData[] = [
  // Data Grade 2 (Sesuai Gambar)
  {
    id: 1,
    subject: "PKN",
    teacher: "Aulia Rahman",
    grade: 2,
    semester: "Ganjil",
    // Data Knowledge & Skill Sesuai Gambar
    knowledgeIndicator:
      "Knowing the basic state of Pancasila, understanding ...",
    skillIndicator: "Reading the 'Pancasila', singing the 'Indonesia ...",
  },
  {
    id: 2,
    subject: "PAI",
    teacher: "Siti Aminah",
    grade: 2,
    semester: "Ganjil",
    knowledgeIndicator: "-", // Sesuai Gambar
    skillIndicator: "-", // Sesuai Gambar
  },
  {
    id: 3,
    subject: "Bahasa Indonesia",
    teacher: "Aulia Rahman",
    grade: 2,
    semester: "Ganjil",
    knowledgeIndicator: "-", // Sesuai Gambar
    skillIndicator: "-", // Sesuai Gambar
  },
  {
    id: 4,
    subject: "Matematika",
    teacher: "Fanny Ghaisani",
    grade: 2,
    semester: "Ganjil",
    knowledgeIndicator: "-", // Sesuai Gambar
    skillIndicator: "-", // Sesuai Gambar
  },
  {
    id: 5,
    subject: "Science",
    teacher: "Budi Santoso",
    grade: 2,
    semester: "Ganjil",
    knowledgeIndicator: "-", // Sesuai Gambar
    skillIndicator: "-", // Sesuai Gambar
  },

  // Data Tambahan untuk Grade lain
  {
    id: 6,
    subject: "English",
    teacher: "Joko Widodo",
    grade: 1,
    semester: "Ganjil",
    knowledgeIndicator: "Basic greetings",
    skillIndicator: "Introducing self",
  },
  {
    id: 7,
    subject: "Social Studies",
    teacher: "Megawati",
    grade: 3,
    semester: "Ganjil",
    knowledgeIndicator: "Understanding simple maps",
    skillIndicator: "Drawing neighborhood maps",
  },
  {
    id: 8,
    subject: "Fisika",
    teacher: "Dr. Einstein",
    grade: 3,
    semester: "Ganjil",
    knowledgeIndicator: "Konsep dasar gaya",
    skillIndicator: "Menganalisis gerak lurus",
  },
];

const gradeOptions = [1, 2, 3]; // Daftar Grade yang tersedia

// 3. Komponen Halaman Utama
// =============================================================================
const KnowledgeSkillPage: React.FC = () => {
  const [selectedGrade, setSelectedGrade] = useState<number>(2); // Default ke Grade 2
  const [searchTerm, setSearchTerm] = useState("");

  // Handle ketika tombol 'Input' atau 'View' diklik
  const handleAction = (action: "Input" | "View", record: SubjectData) => {
    alert(`${action} mata pelajaran: ${record.subject} oleh ${record.teacher}`);
  };

  // Definisi Kolom Tabel Ant Design (Disesuaikan untuk Knowledge & Skill)
  const columns: ColumnsType<SubjectData> = [
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      sorter: (a, b) => a.subject.localeCompare(b.subject),
      width: "15%", // Dikecilkan untuk memberi ruang Knowledge/Skill
    },
    {
      title: "Teacher",
      dataIndex: "teacher",
      key: "teacher",
      width: "15%", // Dikecilkan
    },
    {
      title: "Knowledge", // Kolom Baru
      dataIndex: "knowledgeIndicator",
      key: "knowledgeIndicator",
      width: "25%",
      // Menggunakan render untuk memastikan tampilan "-" jika data kosong (meskipun sudah di dummy)
      render: (text: string) => text || "-",
    },
    {
      title: "Skill", // Kolom Baru
      dataIndex: "skillIndicator",
      key: "skillIndicator",
      width: "25%",
      render: (text: string) => text || "-",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" onClick={() => handleAction("Input", record)}>
            Input
          </Button>
          <Button
            // Warna View dikembalikan menjadi hijau (#52c41a)
            type="primary"
            style={{
              backgroundColor: "#52c41a",
              borderColor: "#52c41a",
              color: "white",
            }}
            onClick={() => handleAction("View", record)}
          >
            View
          </Button>
        </Space>
      ),
      width: "20%", // Dikecilkan
    },
  ];

  // Logika Filtering dan Searching menggunakan useMemo
  const filteredData = useMemo(() => {
    // 1. Filter berdasarkan Grade yang dipilih
    const gradeFiltered = DUMMY_DATA.filter(
      (item) => item.grade === selectedGrade
    );

    // 2. Filter berdasarkan Search Term (Subject atau Teacher)
    if (!searchTerm) {
      return gradeFiltered;
    }

    const lowerCaseSearch = searchTerm.toLowerCase();
    return gradeFiltered.filter(
      (item) =>
        item.subject.toLowerCase().includes(lowerCaseSearch) ||
        item.teacher.toLowerCase().includes(lowerCaseSearch)
    );
  }, [selectedGrade, searchTerm]);

  // Aksi ketika tombol Apply Filter diklik
  const handleApplyFilter = () => {
    console.log(`Filter applied for Grade: ${selectedGrade}`);
  };

  const currentAcademicYear = "2024-2025";
  const currentSemester = "Ganjil";

  return (
    <>
      <Head>
        <title>Indicator Input | Knowledge & Skill</title>
      </Head>

      {/* Konten Halaman */}
      <div>
        {/* 1. Breadcrumb (Style Mirip GradeClassroomPage) */}
        <Breadcrumb
          items={[{ title: "Home" }, { title: "Indicator Input" }]} // Disesuaikan dengan gambar
        />

        {/* 2. Title dan Tahun Akademik (Style Mirip GradeClassroomPage) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "16px 0 24px 0",
          }}
        >
          <Title level={1} style={{ margin: 0 }}>
            Knowledge & Skill
          </Title>
          <Title level={3} style={{ color: "#888", margin: 0 }}>
            <span style={{ fontWeight: 700, color: "#333" }}>
              {currentAcademicYear}
            </span>{" "}
            ({currentSemester})
          </Title>
        </div>

        {/* 3. Filter and Search Section (Toolbar Ramping) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          {/* Group Kiri: Search Input */}
          <Input
            placeholder="Search customer 100 records..." // Disesuaikan dengan Gambar
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Group Kanan: Filter dan Tombol */}
          <Space>
            <Select
              placeholder="Grade" // Disesuaikan dengan Gambar
              style={{ width: 120 }}
              value={selectedGrade}
              onChange={(value) => setSelectedGrade(value)}
            >
              {gradeOptions.map((grade) => (
                <Option key={grade} value={grade}>
                  Grade
                </Option> // Opsi disederhanakan menjadi "Grade" saja
              ))}
            </Select>
            <Button
              type="primary"
              onClick={handleApplyFilter}
              // Warna Apply Filter disesuaikan menjadi hijau (#52c41a)
              style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
            >
              Apply Filter
            </Button>
            {/* Tombol Search (Dihilangkan, tidak ada di gambar) */}
          </Space>
        </div>

        {/* 4. Grade Indicator & Table Container */}
        <div
          style={{
            border: "1px solid #f0f0f0",
            borderRadius: "4px",
            backgroundColor: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            padding: "24px 24px 16px 24px",
            marginBottom: "24px",
          }}
        >
          {selectedGrade !== undefined && (
            <Title
              level={4}
              style={{
                fontWeight: 600,
                marginBottom: "16px",
                padding: "0 0 8px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              Grade : {selectedGrade}
            </Title>
          )}

          {/* Table Section */}
          <Table<SubjectData>
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={false}
            size="large"
            style={{ width: "100%", marginTop: "8px" }}
          />
        </div>
      </div>
    </>
  );
};

export default KnowledgeSkillPage;
