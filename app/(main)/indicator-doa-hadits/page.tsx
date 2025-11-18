"use client";
// app/(main)/indicator-doa-hadits/page.tsx

import React, { useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Row,
  Col,
  Card,
  Space,
  Breadcrumb,
} from "antd";
import type { ColumnsType } from "antd/es/table"; // Import tipe untuk kolom
import { SearchOutlined, HomeOutlined } from "@ant-design/icons";

const { Option } = Select;
const { Search } = Input;

// ----------------------------------------------------
// --- DEFINISI TIPE DATA (INTERFACE) ---
// ----------------------------------------------------
interface DataItem {
  key: string;
  subject: string;
}

// ----------------------------------------------------
// --- DATA DUMMY ---
// ----------------------------------------------------
const initialDoaData: DataItem[] = [
  {
    key: "1",
    subject: "DO'A BEFORE HAVING MEAL",
  },
  {
    key: "2",
    subject: "DO'A AFTER HAVING MEAL",
  },
];

const initialHaditsData: DataItem[] = [
  {
    key: "3",
    subject: "HADITS ABOUT CLEANLINESS",
  },
];

// ----------------------------------------------------
// --- KOMPONEN UTAMA ---
// ----------------------------------------------------
const DoaHaditsPage = () => {
  const [doaData, setDoaData] = useState<DataItem[]>(initialDoaData);
  const [haditsData, setHaditsData] = useState<DataItem[]>(initialHaditsData);
  const [grade, setGrade] = useState<string>("2");

  // Kolom untuk tabel Doa dan Hadits
  // FIX: Terapkan tipe DataItem pada ColumnsType
  const columns: ColumnsType<DataItem> = [
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      onHeaderCell: () => ({
        style: {
          backgroundColor: "#f5f5f5",
          fontWeight: "bold",
          color: "rgba(0, 0, 0, 0.85)",
          borderBottom: "1px solid #f0f0f0",
        },
      }),
      width: "60%",
    },
    {
      title: "Action",
      key: "action",
      onHeaderCell: () => ({
        style: {
          backgroundColor: "#f5f5f5",
          fontWeight: "bold",
          color: "rgba(0, 0, 0, 0.85)",
          borderBottom: "1px solid #f0f0f0",
        },
      }),
      // FIX: Terapkan tipe DataItem secara eksplisit pada parameter 'record'
      render: (_, record: DataItem) => (
        <Space size="small">
          {/* Button Edit - Warna kuning sesuai gambar */}
          <Button
            type="primary"
            style={{
              backgroundColor: "#ffc107",
              borderColor: "#ffc107",
              color: "#fff",
              fontSize: "12px",
            }}
            size="small"
            onClick={() => alert(`Mengedit: ${record.subject}`)}
          >
            Edit
          </Button>
          {/* Button Delete - Warna merah danger */}
          <Button
            type="primary"
            danger
            size="small"
            onClick={() => alert(`Menghapus: ${record.subject}`)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // Handler Dummy
  const handleAddDoa = () => {
    alert("Fungsi Tambah Doa dipanggil!");
  };

  const handleAddHadits = () => {
    alert("Fungsi Tambah Hadits dipanggil!");
  };

  const handleApplyFilter = () => {
    alert(`Filter diterapkan untuk Grade ${grade}. Memuat data...`);
    // Logika memuat data aktual dari API berdasarkan 'grade'
  };

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
      }}
    >
      {/* 🧭 Breadcrumb */}
      <Breadcrumb style={{ marginBottom: "16px" }}>
        <Breadcrumb.Item>
          <HomeOutlined /> Home
        </Breadcrumb.Item>
        <Breadcrumb.Item>Indicator Input</Breadcrumb.Item>
      </Breadcrumb>

      {/* 📅 Header dan Periode */}
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: "24px" }}
      >
        <Col>
          <h1 style={{ fontSize: "30px", margin: 0 }}>Doa & Hadits</h1>
        </Col>
        <Col>
          <Space>
            <h1 style={{ fontSize: "30px", margin: 0 }}>2024-2025 (Ganjil)</h1>
          </Space>
        </Col>
      </Row>

      {/* 🔍 Search dan Filter Controls */}
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Search customer 100 records..."
            prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
            style={{ width: "100%", borderRadius: "4px" }}
          />
        </Col>
        <Col flex="auto" />
        <Col>
          <Space>
            <Select
              defaultValue="Grade"
              style={{ width: 120, borderRadius: "4px" }}
              onChange={setGrade}
              value={grade}
            >
              <Option value="1">Grade 1</Option>
              <Option value="2">Grade 2</Option>
              <Option value="3">Grade 3</Option>
            </Select>
            <Button
              type="primary"
              style={{
                backgroundColor: "#5cb85c",
                borderColor: "#5cb85c",
                borderRadius: "4px",
              }}
              onClick={handleApplyFilter}
            >
              Apply Filter
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Konten Utama */}
      <Card
        style={{
          padding: "0px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.09)",
        }}
      >
        {/* ⭐ Grade Indicator */}
        <div style={{ padding: "24px 24px 0px 24px", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "20px", margin: 0 }}>
            Grade : <span style={{ fontWeight: "normal" }}>{grade}</span>
          </h2>
        </div>

        {/* --- Bagian Doa --- */}
        <Row
          justify="space-between"
          align="middle"
          style={{ padding: "16px 24px" }}
        >
          <Col>
            <h2 style={{ fontSize: "20px", margin: 0 }}>Doa</h2>
          </Col>
          <Col>
            <Button
              type="primary"
              style={{
                backgroundColor: "#337ab7",
                borderColor: "#337ab7",
                borderRadius: "4px",
              }}
              onClick={handleAddDoa}
            >
              Add Doa
            </Button>
          </Col>
        </Row>
        <Table
          columns={columns}
          dataSource={doaData}
          pagination={false}
          size="middle"
          showHeader={true}
          bordered={false}
          style={{ marginBottom: "24px" }}
        />

        {/* --- Bagian Hadist --- */}
        <Row
          justify="space-between"
          align="middle"
          style={{ padding: "16px 24px" }}
        >
          <Col>
            <h2 style={{ fontSize: "20px", margin: 0 }}>Hadist</h2>
          </Col>
          <Col>
            <Button
              type="primary"
              style={{
                backgroundColor: "#337ab7",
                borderColor: "#337ab7",
                borderRadius: "4px",
              }}
              onClick={handleAddHadits}
            >
              Add Hadits
            </Button>
          </Col>
        </Row>
        <Table
          columns={columns}
          dataSource={haditsData}
          pagination={false}
          size="middle"
          showHeader={true}
          bordered={false}
        />
      </Card>
    </div>
  );
};

export default DoaHaditsPage;
