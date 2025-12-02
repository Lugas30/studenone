"use client";
// src/pages/HomeroomNotesPage.tsx

import React, { useState, Key } from "react";
import {
  Layout,
  Typography,
  Input, // Menggunakan Input untuk TextArea
  Select,
  Button,
  Table,
  Divider,
  message,
  // InputNumber tidak lagi digunakan
} from "antd";
import type { ColumnsType } from "antd/es/table";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search, TextArea } = Input; // Destructure TextArea
const { Option } = Select;

// ===========================================
// 1. DATA DUMMY & TIPE DATA (Diperbarui untuk Homeroom Notes - Teks)
// ===========================================

// Tipe data untuk Homeroom Notes - menggunakan string untuk catatan
interface HomeroomNotesData {
  key: Key;
  fullName: string;
  note: string; // Tipe diubah dari number menjadi string
}

// Data Konstan
const classInfo = {
  academicYear: "2024-2025 (Ganjil)",
  className: "ABDULLAH BIN MUHAMMAD (P2B)",
};

const students = [
  "Aathirah Dhanesa Prayuda",
  "Abyan Mufid Shaqille",
  "Ahza Danendra Abdillah",
  "Akhtar Khairazky Subiyanto",
  "Aldebaran Kenan Arrazka",
  "Byanca Alesha El Ilbar",
  "Cherilyn Nafeeza Ardiansyah",
  "Falisha Tanzeela Rahman",
  "Shane Marshall Yusuf",
];

// Data awal untuk Homeroom Notes
const initialHomeroomNotesData: HomeroomNotesData[] = students.map(
  (name, index) => {
    // Contoh data awal (Abyan memiliki catatan teks)
    let note = "";

    if (name === "Abyan Mufid Shaqille") {
      note = "Telah menunjukkan perkembangan baik dalam komunikasi lisan.";
    } else if (name === "Cherilyn Nafeeza Ardiansyah") {
      note = "Perlu fokus pada ketepatan waktu dalam mengumpulkan tugas.";
    }

    return {
      key: index.toString(),
      fullName: name,
      note: note,
    };
  }
);

// ===========================================
// 2. KOMPONEN DAN LOGIC
// ===========================================

const HomeroomNotesPage: React.FC = () => {
  const [homeroomNotesData, setHomeroomNotesData] = useState<
    HomeroomNotesData[]
  >(initialHomeroomNotesData);
  const [loading, setLoading] = useState<boolean>(false);

  // --- LOGIC PERUBAHAN DATA HOMEROOM NOTES ---

  const handleDataChange = (
    name: string,
    value: string // Menerima string dari TextArea
  ) => {
    setHomeroomNotesData((prevData) =>
      prevData.map((record) =>
        record.fullName === name ? { ...record, note: value } : record
      )
    );
  };

  // --- LOGIC SUBMIT ---

  const handleSubmit = (record: HomeroomNotesData) => {
    setLoading(true);
    message.loading({
      content: `Submitting Homeroom Notes data for ${record.fullName}...`,
      key: "submitKey",
    });

    // Simulasi API call
    setTimeout(() => {
      setLoading(false);
      message.success({
        content: `Data Homeroom Notes ${record.fullName} berhasil disimpan!`,
        key: "submitKey",
        duration: 2,
      });
      console.log("Submitted Homeroom Notes Data:", record);
    }, 1500);
  };

  // --- DEFINISI KOLOM HOMEROOM NOTES (Menggunakan TextArea) ---

  const columns: ColumnsType<HomeroomNotesData> = [
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      width: "30%", // Lebar disesuaikan agar TextArea memiliki ruang
      fixed: "left", // Mempertahankan nama di sisi kiri saat scroll
    },
    {
      title: "NOTE (N)",
      dataIndex: "note",
      key: "note",
      width: "55%", // Lebar ekstra untuk teks
      render: (note: string, record) => (
        <TextArea
          value={note}
          placeholder="Masukkan catatan homeroom..."
          rows={2} // Menjaga baris tetap rapi
          style={{ width: "100%", minWidth: 150 }}
          onChange={(e) => handleDataChange(record.fullName, e.target.value)}
          disabled={loading}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: "15%",
      fixed: "right", // Mempertahankan tombol di sisi kanan
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleSubmit(record)}
          disabled={loading}
        >
          Submit
        </Button>
      ),
    },
  ];

  // --- RENDER HALAMAN UTAMA ---

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {/* Header/Breadcrumb Area */}
      <Header
        style={{
          padding: "0 20px",
          background: "white",
          height: 40,
          lineHeight: "40px",
        }}
      >
        <Text type="secondary" style={{ fontSize: 12 }}>
          Home / Academic Report / Homeroom Notes
        </Text>
      </Header>

      <Content style={{ padding: "20px" }}>
        {/* Title and Academic Year */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 20,
          }}
        >
          <Title level={1} style={{ margin: 0 }}>
            Homeroom Notes Report
          </Title>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>
            {classInfo.academicYear}
          </Text>
        </div>

        {/* Filter & Search Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            marginBottom: 30,
          }}
        >
          <Search
            placeholder="Search student records..."
            style={{ width: 300, marginRight: 10 }}
            allowClear
          />
          <Select
            defaultValue="Classroom"
            style={{ width: 120, marginRight: 10 }}
          >
            <Option value="Classroom">Classroom</Option>
            {/* Add more options here */}
          </Select>
          <Button
            type="primary"
            // Menggunakan warna hijau dari AttitudesReportPage
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
          >
            Apply Filter
          </Button>
        </div>

        {/* Class Title */}
        <Title level={4} style={{ marginBottom: 15 }}>
          Class : {classInfo.className}
        </Title>
        <Divider style={{ marginTop: 0, marginBottom: "20px" }} />

        {/* --- Bagian Homeroom Notes --- */}
        <Title level={3} style={{ marginTop: 0, marginBottom: 15 }}>
          Student Notes
        </Title>
        <Table
          columns={columns}
          dataSource={homeroomNotesData}
          rowKey="fullName"
          pagination={false}
          bordered={true}
          size="middle"
          loading={loading}
          // Menambahkan scrollX agar kolom nama dan aksi tetap terlihat jika lebar layar terbatas
          scroll={{ x: 800 }}
          style={{ marginBottom: 40 }}
        />

        <div style={{ height: "50px" }} />
      </Content>
    </Layout>
  );
};

export default HomeroomNotesPage;
