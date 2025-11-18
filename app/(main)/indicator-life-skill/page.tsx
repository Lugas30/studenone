"use client";
// app/(main)/indicator-life-skill/page.tsx

import React, { useState } from "react";
import {
  Layout,
  Breadcrumb,
  Select,
  Input,
  Button,
  Table,
  Space,
  Row,
  Col,
  Card,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";

const { Content } = Layout;

// --- 1. Definisi Tipe Data (Digabung) ---
export type LifeSkill = {
  id: string;
  subject: string;
};

export type LifeSkillCategory = "Islamic Life Skill" | "Life Skill";

export type LifeSkillData = {
  category: LifeSkillCategory;
  skills: LifeSkill[];
};

// --- 2. Data Dummy (Digabung) ---
const initialLifeSkillData: LifeSkillData[] = [
  {
    category: "Islamic Life Skill",
    skills: [{ id: "ils-1", subject: "ADAB KETIKA MARAH" }],
  },
  {
    category: "Life Skill",
    skills: [
      { id: "ls-1", subject: "GENERAL LIFE SKIL" },
      { id: "ls-2", subject: "GARDENING" },
      { id: "ls-3", subject: "ANTI BULLYING" },
    ],
  },
];
// ------------------------------------

/**
 * Kolom untuk tabel Life Skill.
 */
const getColumns = (
  onEdit: (id: string) => void,
  onDelete: (id: string) => void
) => [
  {
    title: "Subject",
    dataIndex: "subject",
    key: "subject",
    sorter: (a: LifeSkill, b: LifeSkill) => a.subject.localeCompare(b.subject),
  },
  {
    title: "Action",
    key: "action",
    render: (_: any, record: LifeSkill) => (
      <Space size="middle">
        <Button
          type="primary"
          size="small"
          // Custom style untuk warna kuning pada tombol Edit
          style={{
            backgroundColor: "#ffc107",
            borderColor: "#ffc107",
            color: "black",
          }}
          onClick={() => onEdit(record.id)}
        >
          Edit
        </Button>
        <Button danger size="small" onClick={() => onDelete(record.id)}>
          Delete
        </Button>
      </Space>
    ),
  },
];

// --- 3. Komponen Utama Next.js/TypeScript/Ant Design (Digabung) ---
const LifeSkillInputPage: React.FC = () => {
  const [data, setData] = useState<LifeSkillData[]>(initialLifeSkillData);
  const [selectedGrade, setSelectedGrade] = useState<string>("2");

  const currentSemester = "Ganjil";
  const currentYear = "2024-2025";

  const handleApplyFilter = () => {
    // Logika untuk menerapkan filter (misalnya, memuat data berdasarkan selectedGrade)
    console.log(`Filter Applied for Grade: ${selectedGrade}`);
    // Di sini Anda akan memanggil API atau memfilter data dummy
  };

  const handleAddSkill = (category: LifeSkillCategory) => {
    // Logika untuk menambah Life Skill baru (misalnya, membuka modal)
    console.log(`Adding new skill to: ${category}`);
    alert(`Tambah Life Skill Baru untuk: ${category}`);
  };

  const handleEdit = (id: string) => {
    console.log(`Edit skill ID: ${id}`);
    alert(`Mengedit Life Skill ID: ${id}`);
  };

  const handleDelete = (id: string) => {
    console.log(`Delete skill ID: ${id}`);
    if (window.confirm(`Yakin ingin menghapus Life Skill ID: ${id}?`)) {
      // Logika untuk menghapus data dari state
      setData((prevData) =>
        prevData.map((categoryData) => ({
          ...categoryData,
          skills: categoryData.skills.filter((skill) => skill.id !== id),
        }))
      );
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "white" }}>
      <Content style={{ padding: "0 24px 24px" }}>
        {/* Header dan Breadcrumb */}
        <div style={{ padding: "16px 0" }}>
          <Breadcrumb>
            <Breadcrumb.Item>Home</Breadcrumb.Item>
            <Breadcrumb.Item>Indicator Input</Breadcrumb.Item>
          </Breadcrumb>
        </div>

        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 20 }}
        >
          <Col>
            <h1 style={{ margin: 0, fontSize: "2em" }}>Life Skill</h1>
          </Col>
          <Col>
            <h2 style={{ margin: 0, fontSize: "1.5em" }}>
              {currentYear} ({currentSemester})
            </h2>
          </Col>
        </Row>

        {/* Filter dan Search Bar */}
        <Row gutter={16} align="middle" style={{ marginBottom: 20 }}>
          <Col flex="auto">
            <Input
              prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
              placeholder="Search customer 100 records..."
              style={{ width: 250 }}
            />
          </Col>
          <Col>
            <Select
              defaultValue={selectedGrade}
              style={{ width: 120 }}
              onChange={(value) => setSelectedGrade(value)}
            >
              <Select.Option value="1">Grade 1</Select.Option>
              <Select.Option value="2">Grade 2</Select.Option>
              <Select.Option value="3">Grade 3</Select.Option>
            </Select>
          </Col>
          <Col>
            <Button
              type="primary"
              style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              onClick={handleApplyFilter}
            >
              Apply Filter
            </Button>
          </Col>
        </Row>

        {/* Grade Display */}
        <h3 style={{ marginTop: 10, marginBottom: 30 }}>
          Grade : {selectedGrade}
        </h3>

        {/* Content - Life Skill Categories */}
        {data.map((categoryData) => (
          <Card
            key={categoryData.category}
            title={
              <span style={{ fontWeight: "bold", fontSize: "1.2em" }}>
                {categoryData.category}
              </span>
            }
            extra={
              <Button
                type="primary"
                onClick={() => handleAddSkill(categoryData.category)}
              >
                Add Life skill
              </Button>
            }
            style={{ marginBottom: 30, borderTop: "none" }}
            headStyle={{
              borderBottom: "none",
              padding: "16px 0",
              marginLeft: "24px",
            }}
            bodyStyle={{ padding: 0 }}
            bordered={false} // Menghilangkan border Card agar terlihat lebih mirip gambar
          >
            {/* Tabel untuk setiap kategori */}
            <Table
              dataSource={categoryData.skills}
              columns={getColumns(handleEdit, handleDelete)}
              rowKey="id"
              pagination={false}
              showHeader={true}
              // Menyesuaikan tampilan agar terlihat seperti tabel sederhana
              className="life-skill-table"
              style={{ border: "none" }}
            />
          </Card>
        ))}
      </Content>
    </Layout>
  );
};

export default LifeSkillInputPage;
