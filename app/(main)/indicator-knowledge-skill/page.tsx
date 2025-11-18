"use client";
// src/pages/knowledge-skill-input.tsx

import React, { useState, useMemo } from "react";
import Head from "next/head";
import { Table, Input, Button, Select, Space, Breadcrumb } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

// 1. Tipe Data
// =============================================================================
interface SubjectData {
  id: number;
  subject: string;
  teacher: string;
  grade: number;
  semester: "Ganjil" | "Genap";
}

// 2. Data Dummy
// =============================================================================
const DUMMY_DATA: SubjectData[] = [
  // Data Grade 2 (Sesuai Gambar)
  {
    id: 1,
    subject: "PKN",
    teacher: "Aulia Rahman",
    grade: 2,
    semester: "Ganjil",
  },
  {
    id: 2,
    subject: "PAI",
    teacher: "Siti Aminah",
    grade: 2,
    semester: "Ganjil",
  },
  {
    id: 3,
    subject: "Bahasa Indonesia",
    teacher: "Aulia Rahman",
    grade: 2,
    semester: "Ganjil",
  },
  {
    id: 4,
    subject: "Matematika",
    teacher: "Fanny Ghaisani",
    grade: 2,
    semester: "Ganjil",
  },
  {
    id: 5,
    subject: "Science",
    teacher: "Budi Santoso",
    grade: 2,
    semester: "Ganjil",
  },

  // Data Tambahan untuk Grade lain
  {
    id: 6,
    subject: "English",
    teacher: "Joko Widodo",
    grade: 1,
    semester: "Ganjil",
  },
  {
    id: 7,
    subject: "Social Studies",
    teacher: "Megawati",
    grade: 3,
    semester: "Ganjil",
  },
  {
    id: 8,
    subject: "Fisika",
    teacher: "Dr. Einstein",
    grade: 3,
    semester: "Ganjil",
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

  // Definisi Kolom Tabel Ant Design
  const columns: ColumnsType<SubjectData> = [
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      sorter: (a, b) => a.subject.localeCompare(b.subject),
      width: "30%",
    },
    {
      title: "Teacher",
      dataIndex: "teacher",
      key: "teacher",
      width: "30%",
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
      width: "40%",
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
    // Dalam aplikasi nyata, ini adalah tempat untuk memuat data dari API
    // Untuk contoh ini, kita hanya melakukan re-render filter yang sudah di-handle oleh useMemo
    console.log(`Filter applied for Grade: ${selectedGrade}`);
  };

  return (
    <>
      <Head>
        <title>Indicator Input | Knowledge & Skill</title>
      </Head>

      <div style={{ background: "#fff", minHeight: "100vh" }}>
        {/* Breadcrumb Section (Identik dengan Gambar) */}
        <div
          style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0" }}
        >
          <Breadcrumb>
            <Breadcrumb.Item>Home</Breadcrumb.Item>
            <Breadcrumb.Item>Indicator Input</Breadcrumb.Item>
          </Breadcrumb>
        </div>

        <div style={{ padding: "24px" }}>
          {/* Header Section */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h1 style={{ fontSize: "24px", margin: 0 }}>Knowledge & Skill</h1>
            <h2 style={{ fontSize: "18px", margin: 0 }}>2024-2025 (Ganjil)</h2>
          </div>

          {/* Filter and Search Section */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <Input
              placeholder="Search customer 100 records..."
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              placeholder="Grade"
              style={{ width: 120 }}
              value={selectedGrade}
              onChange={(value) => setSelectedGrade(value)}
            >
              {gradeOptions.map((grade) => (
                <Select.Option key={grade} value={grade}>
                  Grade {grade}
                </Select.Option>
              ))}
            </Select>
            <Button
              type="primary"
              // Menggunakan warna hijau sesuai gambar
              style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              onClick={handleApplyFilter}
            >
              Apply Filter
            </Button>
          </div>

          {/* Grade Indicator */}
          {selectedGrade !== undefined && (
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "normal",
                marginBottom: "16px",
              }}
            >
              Grade : {selectedGrade}
            </h2>
          )}

          {/* Table Section */}
          <Table<SubjectData>
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={false}
            style={{ width: "100%" }}
            // Menghilangkan garis pinggir jika diinginkan (opsional)
            // className="knowledge-skill-table"
          />
        </div>
      </div>
    </>
  );
};

export default KnowledgeSkillPage;
