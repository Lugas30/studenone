"use client";
// src/pages/HealthAttendancePage.tsx

import React, { useState, Key } from "react";
import {
  Layout,
  Typography,
  Input,
  Select,
  Button,
  Table,
  Space,
  Divider,
  message,
  InputNumber, // Ditambahkan untuk input angka
} from "antd";
import type { ColumnsType } from "antd/es/table";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// ===========================================
// 1. DATA DUMMY & TIPE DATA (Diperbarui untuk Health & Attendance)
// ===========================================

// Tipe data untuk bagian Health & Attendance
interface HealthAttendanceData {
  key: Key;
  fullName: string;
  sickness: number; // Jumlah Sakit (S)
  permit: number; // Jumlah Izin (I)
  absent: number; // Jumlah Tanpa Keterangan (A)
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

// Data awal untuk Health & Attendance
const initialHealthAttendanceData: HealthAttendanceData[] = students.map(
  (name, index) => {
    // Contoh data awal (Abyan 1 izin, Cherilyn 2 sakit)
    let sickness = 0;
    let permit = 0;
    let absent = 0;

    if (name === "Abyan Mufid Shaqille") {
      permit = 1;
    } else if (name === "Cherilyn Nafeeza Ardiansyah") {
      sickness = 2;
    }

    return {
      key: index.toString(),
      fullName: name,
      sickness: sickness,
      permit: permit,
      absent: absent,
    };
  }
);

// ===========================================
// 2. KOMPONEN DAN LOGIC
// ===========================================

const HealthAttendancePage: React.FC = () => {
  const [healthAttendanceData, setHealthAttendanceData] = useState<
    HealthAttendanceData[]
  >(initialHealthAttendanceData);
  const [loading, setLoading] = useState<boolean>(false);

  // --- LOGIC PERUBAHAN DATA HEALTH & ATTENDANCE ---

  const handleDataChange = (
    name: string,
    key: keyof Omit<HealthAttendanceData, "key" | "fullName">,
    value: number | null // Menerima number atau null dari InputNumber
  ) => {
    // Pastikan nilai adalah number (gunakan 0 jika null)
    const numericValue = value === null ? 0 : value;

    setHealthAttendanceData((prevData) =>
      prevData.map((record) =>
        record.fullName === name ? { ...record, [key]: numericValue } : record
      )
    );
  };

  // --- LOGIC SUBMIT ---

  const handleSubmit = (record: HealthAttendanceData) => {
    setLoading(true);
    message.loading({
      content: `Submitting Health & Attendance data for ${record.fullName}...`,
      key: "submitKey",
    });

    // Simulasi API call
    setTimeout(() => {
      setLoading(false);
      message.success({
        content: `Data Health & Attendance ${record.fullName} berhasil disimpan!`,
        key: "submitKey",
        duration: 2,
      });
      console.log("Submitted Health & Attendance Data:", record);
    }, 1500);
  };

  // --- DEFINISI KOLOM HEALTH & ATTENDANCE ---

  const columns: ColumnsType<HealthAttendanceData> = [
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      width: "40%",
    },
    {
      title: "SICKNESS (S)",
      dataIndex: "sickness",
      key: "sickness",
      align: "center",
      width: "15%",
      render: (sickness: number, record) => (
        <InputNumber
          value={sickness}
          min={0}
          style={{ width: "100%", minWidth: 60 }}
          onChange={(value) =>
            handleDataChange(record.fullName, "sickness", value)
          }
          disabled={loading}
        />
      ),
    },
    {
      title: "PERMIT (I)",
      dataIndex: "permit",
      key: "permit",
      align: "center",
      width: "15%",
      render: (permit: number, record) => (
        <InputNumber
          value={permit}
          min={0}
          style={{ width: "100%", minWidth: 60 }}
          onChange={(value) =>
            handleDataChange(record.fullName, "permit", value)
          }
          disabled={loading}
        />
      ),
    },
    {
      title: "ABSENT (A)",
      dataIndex: "absent",
      key: "absent",
      align: "center",
      width: "15%",
      render: (absent: number, record) => (
        <InputNumber
          value={absent}
          min={0}
          style={{ width: "100%", minWidth: 60 }}
          onChange={(value) =>
            handleDataChange(record.fullName, "absent", value)
          }
          disabled={loading}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: "15%",
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
      {/* Header/Breadcrumb Area (Gaya AttitudesReportPage) */}
      <Header
        style={{
          padding: "0 20px",
          background: "white",
          height: 40,
          lineHeight: "40px",
        }}
      >
        <Text type="secondary" style={{ fontSize: 12 }}>
          Home / Academic Report / Health & Attendance
        </Text>
      </Header>

      <Content style={{ padding: "20px" }}>
        {/* Title and Academic Year (Gaya AttitudesReportPage) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 20,
          }}
        >
          <Title level={1} style={{ margin: 0 }}>
            Health & Attendance Report
          </Title>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>
            {classInfo.academicYear}
          </Text>
        </div>

        {/* Filter & Search Bar (Gaya AttitudesReportPage) */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            marginBottom: 30,
          }}
        >
          <Search
            placeholder="Search customer 100 records..."
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

        {/* --- Bagian Health & Attendance --- */}
        <Title level={3} style={{ marginTop: 0, marginBottom: 15 }}>
          Student Attendance
        </Title>
        <Table
          columns={columns}
          dataSource={healthAttendanceData}
          rowKey="fullName"
          pagination={false}
          bordered={true} // Implementasi gaya AttitudesReportPage
          size="middle" // Implementasi gaya AttitudesReportPage
          loading={loading}
          style={{ marginBottom: 40 }}
        />

        <div style={{ height: "50px" }} />
      </Content>
    </Layout>
  );
};

export default HealthAttendancePage;
