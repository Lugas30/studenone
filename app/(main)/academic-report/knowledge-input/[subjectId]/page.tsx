// knowledgeInputPage.tsx
"use client";

import React from "react";
import { Table, Button, Space, Typography, Layout, Divider } from "antd";
import type { ColumnsType } from "antd/es/table";

// --- 1. DEFINISI TIPE (TYPESCRIPT) ---
interface StudentPerformance {
  key: string; // Menambahkan key untuk Table Ant Design
  fullName: string;
  uh: number[]; // UH1, UH2, UH3, UH4
  uhAvrg: number; // Rata-rata UH
  t: number[]; // T1, T2
  tAvrg: number; // Rata-rata T
  uts: number;
  uas: number;
  final: number;
  predicate: string; // Predikat (A, B, C)
  desc: string; // Deskripsi (Excellent, Great, Good)
}

// --- 2. DATA DUMMY ---
const studentData: StudentPerformance[] = [
  {
    key: "1",
    fullName: "Aathirah Dhanesa Prayuda",
    uh: [90, 90, 85, 90],
    uhAvrg: 90,
    t: [90, 90],
    tAvrg: 90,
    uts: 90,
    uas: 90,
    final: 90,
    predicate: "A",
    desc: "Excellent",
  },
  {
    key: "2",
    fullName: "Abyan Mufid Shaquille",
    uh: [90, 75, 90, 90],
    uhAvrg: 90,
    t: [90, 90],
    tAvrg: 90,
    uts: 90,
    uas: 90,
    final: 90,
    predicate: "B",
    desc: "Great",
  },
  {
    key: "3",
    fullName: "Ahza Danendra Abdillah",
    uh: [90, 80, 90, 90],
    uhAvrg: 90,
    t: [90, 90],
    tAvrg: 90,
    uts: 90,
    uas: 90,
    final: 90,
    predicate: "C",
    desc: "Good",
  },
  {
    key: "4",
    fullName: "Akhtar Khairazky Subiyanto",
    uh: [80, 90, 90, 90],
    uhAvrg: 90,
    t: [90, 90],
    tAvrg: 90,
    uts: 90,
    uas: 90,
    final: 90,
    predicate: "B",
    desc: "Great",
  },
  {
    key: "5",
    fullName: "Aldebaran Kenan Arrazka",
    uh: [80, 90, 80, 79],
    uhAvrg: 79,
    t: [79, 79],
    tAvrg: 79,
    uts: 79,
    uas: 79,
    final: 79,
    predicate: "A",
    desc: "Excellent",
  },
  {
    key: "6",
    fullName: "Byanca Alesha El Ilbar",
    uh: [90, 89, 89, 78],
    uhAvrg: 78,
    t: [78, 78],
    tAvrg: 78,
    uts: 78,
    uas: 78,
    final: 78,
    predicate: "B",
    desc: "Great",
  },
  {
    key: "7",
    fullName: "Cherilyn Nafeeza Ardiansyah",
    uh: [80, 90, 90, 90],
    uhAvrg: 90,
    t: [90, 90],
    tAvrg: 90,
    uts: 90,
    uas: 90,
    final: 90,
    predicate: "A",
    desc: "Excellent",
  },
  {
    key: "8",
    fullName: "Falisha Tanzeela Rahman",
    uh: [90, 90, 90, 80],
    uhAvrg: 80,
    t: [80, 80],
    tAvrg: 80,
    uts: 80,
    uas: 80,
    final: 80,
    predicate: "B",
    desc: "Great",
  },
  {
    key: "9",
    fullName: "Shane Marshall Yusuf",
    uh: [80, 80, 90, 80],
    uhAvrg: 80,
    t: [80, 80],
    tAvrg: 80,
    uts: 80,
    uas: 80,
    final: 80,
    predicate: "A",
    desc: "Excellent",
  },
];

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// --- 3. KOMPONEN TAMPILAN (REACT COMPONENT) ---
const KnowledgeInputPage: React.FC = () => {
  const handleAction = (fullName: string) => {
    console.log(`Submitting data for: ${fullName}`);
    // Implementasi logika submit di sini
  };

  // Definisi kolom tabel
  const columns: ColumnsType<StudentPerformance> = [
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      fixed: "left",
      width: 200,
    },
    // Kolom UH (Ulangan Harian)
    {
      title: "Ulangan Harian",
      key: "uh",
      children: [
        {
          title: "UH1",
          dataIndex: ["uh", 0],
          key: "uh1",
          align: "center",
          width: 60,
        },
        {
          title: "UH2",
          dataIndex: ["uh", 1],
          key: "uh2",
          align: "center",
          width: 60,
        },
        {
          title: "UH3",
          dataIndex: ["uh", 2],
          key: "uh3",
          align: "center",
          width: 60,
        },
        {
          title: "UH4",
          dataIndex: ["uh", 3],
          key: "uh4",
          align: "center",
          width: 60,
        },
        {
          title: "Avrg",
          dataIndex: "uhAvrg",
          key: "uhAvrg",
          align: "center",
          width: 70,
          className: "average-cell",
        },
      ],
    },
    // Kolom T (Tugas)
    {
      title: "Tugas",
      key: "t",
      children: [
        {
          title: "T1",
          dataIndex: ["t", 0],
          key: "t1",
          align: "center",
          width: 60,
        },
        {
          title: "T2",
          dataIndex: ["t", 1],
          key: "t2",
          align: "center",
          width: 60,
        },
        {
          title: "Avrg",
          dataIndex: "tAvrg",
          key: "tAvrg",
          align: "center",
          width: 70,
          className: "average-cell",
        },
      ],
    },
    // Kolom UTS, UAS, Final, Predicate, Desc
    { title: "UTS", dataIndex: "uts", key: "uts", align: "center", width: 60 },
    { title: "UAS", dataIndex: "uas", key: "uas", align: "center", width: 60 },
    {
      title: "Final",
      dataIndex: "final",
      key: "final",
      align: "center",
      width: 70,
    },
    {
      title: "Predicate",
      dataIndex: "predicate",
      key: "predicate",
      align: "center",
      width: 100,
    },
    {
      title: "Desc",
      dataIndex: "desc",
      key: "desc",
      align: "center",
      width: 100,
    },
    // Kolom Actions
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => handleAction(record.fullName)}
          style={{ width: "80px" }}
        >
          Submit
        </Button>
      ),
    },
  ];

  return (
    // Menggunakan style inline untuk layout, dan style tag untuk CSS kustom
    <Layout
      style={{ padding: "24px", backgroundColor: "#fff", minHeight: "100vh" }}
    >
      {/* CSS Kustom untuk kolom Average */}
      <style jsx global>{`
        .average-cell {
          background-color: #f7f7f7 !important; /* Warna latar belakang abu-abu muda/kuning pucat */
          font-weight: bold;
        }
        /* Mengatasi border Ant Design pada kolom average untuk tampilan yang lebih rapi */
        .ant-table-wrapper .ant-table-thead > tr > th.average-cell {
          background-color: #f7f7f7 !important;
        }
      `}</style>

      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        {/* Header Section */}
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
                Knowledge Input
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

        {/* Subject Info */}
        <Text strong style={{ fontSize: "18px" }}>
          Subject : PKN
        </Text>

        {/* Table Content */}
        <Content>
          <Table
            columns={columns}
            dataSource={studentData}
            rowKey="key"
            bordered
            pagination={false}
            size="small"
            scroll={{ x: 1300 }} // Untuk memastikan scroll horizontal jika tabel terlalu lebar
            style={{ marginTop: "16px" }}
          />
        </Content>
      </Space>
    </Layout>
  );
};

export default KnowledgeInputPage;
