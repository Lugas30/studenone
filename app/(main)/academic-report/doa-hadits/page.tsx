"use client";
// src/pages/DoaHaditsPage.tsx (Implementasi gaya AttitudesReportPage)

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
} from "antd";
import type { ColumnsType } from "antd/es/table";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// ===========================================
// 1. DATA DUMMY & TIPE DATA (Diperbarui untuk implementasi Select)
// ===========================================

// Menggunakan tipe data yang lebih umum, mirip dengan AttitudesReportPage
type DoaHaditsPredicate = "A" | "B" | "C" | "D";
const PREDICATE_OPTIONS: DoaHaditsPredicate[] = ["A", "B", "C", "D"];

interface DoaData {
  key: Key;
  fullName: string;
  doaBeforeMeal: DoaHaditsPredicate;
  doaAfterMeal: DoaHaditsPredicate;
  doaEnterRestroom: DoaHaditsPredicate;
}

interface HaditsData {
  key: Key;
  fullName: string;
  haditsAboutCleanliness: DoaHaditsPredicate;
  haditsAboutCharity: DoaHaditsPredicate;
}

// Data Konstan
const classInfo = {
  academicYear: "2024-2025 (Ganjil)",
  className: "ABDULLAH BIN MUHAMMAD (P2B)",
};

const students = [
  "Asthirah Dhanesa Prayuda",
  "Abyan Mufid Shaqille",
  "Ahza Danendra Abdillah",
  "Akhtar Khairazky Subiyanto",
  "Aldebaran Kenan Arrazka",
  "Byanca Alesha El Ilbar",
  "Cherilyn Nafeeza Ardiansyah",
  "Falisha Tanzeela Rahman",
  "Shane Marshall Yusuf",
];

const initialDoaData: DoaData[] = students.map((name, index) => ({
  key: index.toString(),
  fullName: name,
  // Menetapkan nilai awal sesuai gambar: A atau B
  doaBeforeMeal: index <= 5 || index === 7 ? "A" : "A",
  doaAfterMeal: index === 1 || index === 2 ? "B" : "A",
  doaEnterRestroom: index === 1 || index === 2 ? "B" : "A",
}));

const initialHaditsData: HaditsData[] = students.map((name, index) => ({
  key: index.toString(),
  fullName: name,
  haditsAboutCleanliness: "A",
  haditsAboutCharity: "A",
}));

// ===========================================
// 2. KOMPONEN DAN LOGIC (Diimplementasikan ke DoaHaditsPage)
// ===========================================

const DoaHaditsPage: React.FC = () => {
  const [doaData, setDoaData] = useState<DoaData[]>(initialDoaData);
  const [haditsData, setHaditsData] = useState<HaditsData[]>(initialHaditsData);
  const [loading, setLoading] = useState<boolean>(false);

  // --- LOGIC PERUBAHAN DATA ---

  const handleDoaChange = (
    name: string,
    key: keyof Omit<DoaData, "key" | "fullName">,
    value: DoaHaditsPredicate
  ) => {
    setDoaData((prevData) =>
      prevData.map((record) =>
        record.fullName === name ? { ...record, [key]: value } : record
      )
    );
  };

  const handleHaditsChange = (
    name: string,
    key: keyof Omit<HaditsData, "key" | "fullName">,
    value: DoaHaditsPredicate
  ) => {
    setHaditsData((prevData) =>
      prevData.map((record) =>
        record.fullName === name ? { ...record, [key]: value } : record
      )
    );
  };

  // --- LOGIC SUBMIT ---

  const handleSubmit = (
    record: DoaData | HaditsData,
    section: "Doa" | "Hadits"
  ) => {
    setLoading(true);
    message.loading({
      content: `Submitting ${section} data for ${record.fullName}...`,
      key: "submitKey",
    });

    // Simulasi API call
    setTimeout(() => {
      setLoading(false);
      message.success({
        content: `Data ${section} ${record.fullName} berhasil disimpan!`,
        key: "submitKey",
        duration: 2,
      });
      console.log(`Submitted ${section} Data:`, record);
    }, 1500);
  };

  // --- DEFINISI KOLOM DO'A ---

  const doaColumns: ColumnsType<DoaData> = [
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      width: "30%",
    },
    {
      title: "DO'A BEFORE HAVING MEAL",
      dataIndex: "doaBeforeMeal",
      key: "doaBeforeMeal",
      align: "center",
      render: (predicate: DoaHaditsPredicate, record) => (
        <Select
          value={predicate}
          style={{ width: "100%", minWidth: 60 }}
          onChange={(value) =>
            handleDoaChange(record.fullName, "doaBeforeMeal", value)
          }
          disabled={loading}
        >
          {PREDICATE_OPTIONS.map((option) => (
            <Option key={option} value={option}>
              {option}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "DO'A AFTER HAVING MEAL",
      dataIndex: "doaAfterMeal",
      key: "doaAfterMeal",
      align: "center",
      render: (predicate: DoaHaditsPredicate, record) => (
        <Select
          value={predicate}
          style={{ width: "100%", minWidth: 60 }}
          onChange={(value) =>
            handleDoaChange(record.fullName, "doaAfterMeal", value)
          }
          disabled={loading}
        >
          {PREDICATE_OPTIONS.map((option) => (
            <Option key={option} value={option}>
              {option}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "DO'A ENTER RESTROOM",
      dataIndex: "doaEnterRestroom",
      key: "doaEnterRestroom",
      align: "center",
      render: (predicate: DoaHaditsPredicate, record) => (
        <Select
          value={predicate}
          style={{ width: "100%", minWidth: 60 }}
          onChange={(value) =>
            handleDoaChange(record.fullName, "doaEnterRestroom", value)
          }
          disabled={loading}
        >
          {PREDICATE_OPTIONS.map((option) => (
            <Option key={option} value={option}>
              {option}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleSubmit(record, "Doa")}
          disabled={loading}
        >
          Submit
        </Button>
      ),
    },
  ];

  // --- DEFINISI KOLOM HADITS ---

  const haditsColumns: ColumnsType<HaditsData> = [
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      width: "30%",
    },
    {
      title: "HADITS ABOUT CLEANLINESS",
      dataIndex: "haditsAboutCleanliness",
      key: "haditsAboutCleanliness",
      align: "center",
      render: (predicate: DoaHaditsPredicate, record) => (
        <Select
          value={predicate}
          style={{ width: "100%", minWidth: 60 }}
          onChange={(value) =>
            handleHaditsChange(record.fullName, "haditsAboutCleanliness", value)
          }
          disabled={loading}
        >
          {PREDICATE_OPTIONS.map((option) => (
            <Option key={option} value={option}>
              {option}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "HADITS ABOUT CHARITY",
      dataIndex: "haditsAboutCharity",
      key: "haditsAboutCharity",
      align: "center",
      render: (predicate: DoaHaditsPredicate, record) => (
        <Select
          value={predicate}
          style={{ width: "100%", minWidth: 60 }}
          onChange={(value) =>
            handleHaditsChange(record.fullName, "haditsAboutCharity", value)
          }
          disabled={loading}
        >
          {PREDICATE_OPTIONS.map((option) => (
            <Option key={option} value={option}>
              {option}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleSubmit(record, "Hadits")}
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
          Home / Academic Report / Do'a and Hadits
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
            Do'a and Hadits
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

        {/* --- Bagian Do'a --- */}
        <Title level={4} style={{ marginTop: 0, marginBottom: 15 }}>
          Do'a
        </Title>
        <Table
          columns={doaColumns}
          dataSource={doaData}
          rowKey="fullName"
          pagination={false}
          bordered={true} // Implementasi gaya AttitudesReportPage
          size="middle" // Implementasi gaya AttitudesReportPage
          loading={loading}
          style={{ marginBottom: 40 }}
        />

        {/* --- Bagian Hadits --- */}
        <Title level={4} style={{ marginTop: 0, marginBottom: 15 }}>
          Hadits
        </Title>
        <Table
          columns={haditsColumns}
          dataSource={haditsData}
          rowKey="fullName"
          pagination={false}
          bordered={true} // Implementasi gaya AttitudesReportPage
          size="middle" // Implementasi gaya AttitudesReportPage
          loading={loading}
        />

        <div style={{ height: "50px" }} />
      </Content>
    </Layout>
  );
};

export default DoaHaditsPage;
