"use client";
// src/pages/LifeskillPage.tsx (Implementasi gaya AttitudesReportPage)

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
// 1. DATA DUMMY & TIPE DATA (Diperbarui sesuai Image)
// ===========================================

type LifeskillPredicate = "A" | "B" | "C" | "D";
const PREDICATE_OPTIONS: LifeskillPredicate[] = ["A", "B", "C", "D"];

// Tipe data untuk bagian Islamic Life Skill
interface IslamicLifeskillData {
  key: Key;
  fullName: string;
  adabKetikaMarah: LifeskillPredicate;
}

// Tipe data untuk bagian General Life Skill
interface GeneralLifeskillData {
  key: Key;
  fullName: string;
  generalLifeSkill: LifeskillPredicate;
  gardening: LifeskillPredicate;
  antiBullying: LifeskillPredicate;
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

// Data awal untuk Islamic Life Skill (Semua 'A')
const initialIslamicData: IslamicLifeskillData[] = students.map(
  (name, index) => ({
    key: index.toString(),
    fullName: name,
    adabKetikaMarah: "A",
  })
);

// Data awal untuk Life Skill (Sesuai dengan gambar: Abyan Mufid Shaqille = B untuk Gardening & Anti Bullying)
const initialGeneralData: GeneralLifeskillData[] = students.map(
  (name, index) => {
    const isAbyan = name === "Abyan Mufid Shaqille";
    return {
      key: index.toString(),
      fullName: name,
      generalLifeSkill: "A",
      gardening: isAbyan ? "B" : "A",
      antiBullying: isAbyan ? "B" : "A",
    };
  }
);

// ===========================================
// 2. KOMPONEN DAN LOGIC
// ===========================================

const LifeskillPage: React.FC = () => {
  const [islamicData, setIslamicData] =
    useState<IslamicLifeskillData[]>(initialIslamicData);
  const [generalData, setGeneralData] =
    useState<GeneralLifeskillData[]>(initialGeneralData);
  const [loading, setLoading] = useState<boolean>(false);

  // --- LOGIC PERUBAHAN DATA ISLAMIC ---

  const handleIslamicChange = (
    name: string,
    key: keyof Omit<IslamicLifeskillData, "key" | "fullName">,
    value: LifeskillPredicate
  ) => {
    setIslamicData((prevData) =>
      prevData.map((record) =>
        record.fullName === name ? { ...record, [key]: value } : record
      )
    );
  };

  // --- LOGIC PERUBAHAN DATA GENERAL ---

  const handleGeneralChange = (
    name: string,
    key: keyof Omit<GeneralLifeskillData, "key" | "fullName">,
    value: LifeskillPredicate
  ) => {
    setGeneralData((prevData) =>
      prevData.map((record) =>
        record.fullName === name ? { ...record, [key]: value } : record
      )
    );
  };

  // --- LOGIC SUBMIT ---

  const handleSubmit = (
    record: IslamicLifeskillData | GeneralLifeskillData,
    section: "Islamic" | "General"
  ) => {
    const sectionName =
      section === "Islamic" ? "Islamic Life Skill" : "Life Skill";
    setLoading(true);
    message.loading({
      content: `Submitting ${sectionName} data for ${record.fullName}...`,
      key: "submitKey",
    });

    // Simulasi API call
    setTimeout(() => {
      setLoading(false);
      message.success({
        content: `Data ${sectionName} ${record.fullName} berhasil disimpan!`,
        key: "submitKey",
        duration: 2,
      });
      console.log(`Submitted ${sectionName} Data:`, record);
    }, 1500);
  };

  // --- DEFINISI KOLOM ISLAMIC LIFESKILL ---

  const islamicColumns: ColumnsType<IslamicLifeskillData> = [
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      width: "40%",
    },
    {
      title: "ADAB KETIKA MARAH",
      dataIndex: "adabKetikaMarah",
      key: "adabKetikaMarah",
      align: "center",
      width: "30%",
      render: (predicate: LifeskillPredicate, record) => (
        <Select
          value={predicate}
          style={{ width: "100%", minWidth: 60 }}
          onChange={(value) =>
            handleIslamicChange(record.fullName, "adabKetikaMarah", value)
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
      width: "15%",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleSubmit(record, "Islamic")}
          disabled={loading}
        >
          Submit
        </Button>
      ),
    },
  ];

  // --- DEFINISI KOLOM GENERAL LIFESKILL ---

  const generalColumns: ColumnsType<GeneralLifeskillData> = [
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      width: "30%",
    },
    {
      title: "GENERAL LIFE SKILL",
      dataIndex: "generalLifeSkill",
      key: "generalLifeSkill",
      align: "center",
      width: "15%",
      render: (predicate: LifeskillPredicate, record) => (
        <Select
          value={predicate}
          style={{ width: "100%", minWidth: 60 }}
          onChange={(value) =>
            handleGeneralChange(record.fullName, "generalLifeSkill", value)
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
      title: "GARDENING",
      dataIndex: "gardening",
      key: "gardening",
      align: "center",
      width: "15%",
      render: (predicate: LifeskillPredicate, record) => (
        <Select
          value={predicate}
          style={{ width: "100%", minWidth: 60 }}
          onChange={(value) =>
            handleGeneralChange(record.fullName, "gardening", value)
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
      title: "ANTI BULLYING",
      dataIndex: "antiBullying",
      key: "antiBullying",
      align: "center",
      width: "15%",
      render: (predicate: LifeskillPredicate, record) => (
        <Select
          value={predicate}
          style={{ width: "100%", minWidth: 60 }}
          onChange={(value) =>
            handleGeneralChange(record.fullName, "antiBullying", value)
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
      width: "10%",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleSubmit(record, "General")}
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
          Home / Academic Report / Lifeskill
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
            Lifeskill Report
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

        {/* --- Bagian Islamic Life Skill --- */}
        <Title level={3} style={{ marginTop: 0, marginBottom: 15 }}>
          Islamic Life Skill
        </Title>
        <Table
          columns={islamicColumns}
          dataSource={islamicData}
          rowKey="fullName"
          pagination={false}
          bordered={true} // Implementasi gaya AttitudesReportPage
          size="middle" // Implementasi gaya AttitudesReportPage
          loading={loading}
          style={{ marginBottom: 40 }}
        />

        {/* --- Bagian Life Skill --- */}
        <Title level={3} style={{ marginTop: 0, marginBottom: 15 }}>
          Life Skill
        </Title>
        <Table
          columns={generalColumns}
          dataSource={generalData}
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

export default LifeskillPage;
