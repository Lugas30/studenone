"use client";

// pages/academic/knowledge.tsx (Next.js Pages Router)
// atau app/academic/knowledge/page.tsx (Next.js App Router)

import React, { useState } from "react";
import {
  Card,
  Button,
  Input,
  Select,
  Row,
  Col,
  Layout,
  Typography,
  theme,
} from "antd";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// --- 1. Data Dummy (Dibuat di dalam file yang sama) ---
interface SubjectCard {
  subject: string;
  teacher: string;
  id: number;
}

const knowledgeSubjects: SubjectCard[] = [
  { id: 1, subject: "Pancasila", teacher: "Aulia Rahman" },
  { id: 2, subject: "PAI", teacher: "Siti Aminah" },
  { id: 3, subject: "Bahasa Indonesia", teacher: "Aulia Rahman" },
  { id: 4, subject: "Matematika", teacher: "Fanny Ghaisani" },
  { id: 5, subject: "Science", teacher: "Budi Santoso" },
  { id: 6, subject: "ICT", teacher: "Aulia Rahman" },
];

// --- 2. Sub-Komponen: Subject Report Card ---
const SubjectReportCard: React.FC<{ data: SubjectCard }> = ({ data }) => {
  const primaryColor = "#52c41a"; // Warna hijau dari gambar

  // Handler untuk tombol (bisa diisi dengan logika navigasi/modal)
  const handleViewIndicator = () => {
    console.log(`View Indicator for: ${data.subject}`);
    // Implementasi: router.push('/indicator-page/' + data.id)
  };

  const handleInputReport = () => {
    console.log(`Input Report for: ${data.subject}`);
    // Implementasi: router.push('/report-input/' + data.id)
  };

  return (
    <Card
      title={
        <Text strong style={{ fontSize: 16 }}>
          {data.subject}
        </Text>
      }
      variant="outlined"
      style={{ marginBottom: 20 }}
    >
      <p style={{ margin: 0 }}>
        <Text type="secondary" style={{ marginRight: 4 }}>
          Teacher :
        </Text>
        <Text>{data.teacher}</Text>
      </p>
      <Row gutter={10} style={{ marginTop: 15 }}>
        <Col span={12}>
          <Button
            block
            style={{
              borderColor: primaryColor,
              color: primaryColor,
            }}
            onClick={handleViewIndicator}
          >
            View Indicator
          </Button>
        </Col>
        <Col span={12}>
          <Button
            type="primary"
            block
            style={{
              backgroundColor: primaryColor,
              borderColor: primaryColor,
            }}
            onClick={handleInputReport}
          >
            Input Report
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

// --- 3. Komponen Utama: Knowledge Page ---
const KnowledgePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassroom, setSelectedClassroom] = useState("P2B");
  const primaryColor = "#52c41a"; // Warna hijau

  // Filter data berdasarkan input pencarian
  const filteredSubjects = knowledgeSubjects.filter(
    (subject) =>
      subject.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.teacher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    // Menggunakan div sebagai wrapper untuk styling Ant Design
    <div
      style={{
        padding: "0 24px 24px",
        backgroundColor: "#fff",
        minHeight: "100vh",
      }}
    >
      {/* Header Mirip Gambar */}
      <div style={{ padding: "16px 0", borderBottom: "1px solid #f0f0f0" }}>
        <Row justify="space-between" align="middle">
          <Col>
            {/* Breadcrumb Path: Home / Academic Report / Knowledge */}
            <Text type="secondary">Home / Academic Report / </Text>
            <Text strong>Knowledge</Text>
            <Title level={2} style={{ margin: "8px 0 0 0" }}>
              Knowledge
            </Title>
          </Col>
          <Col>
            <Title level={3} style={{ margin: 0, fontWeight: "normal" }}>
              2024-2025 (Ganjil)
            </Title>
          </Col>
        </Row>
      </div>

      {/* Filter Bar */}
      <div style={{ padding: "24px 0 16px 0" }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="Search customer 100 records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "50%" }}
            />
          </Col>
          <Col>
            <Select
              defaultValue="P2B"
              style={{ width: 150 }}
              onChange={setSelectedClassroom}
              value={selectedClassroom}
            >
              <Option value="Classroom">Classroom</Option>
              <Option value="P2A">P2A</Option>
              <Option value="P2B">P2B</Option>
            </Select>
          </Col>
          <Col>
            <Button
              type="primary"
              style={{
                backgroundColor: primaryColor,
                borderColor: primaryColor,
              }}
            >
              Apply Filter
            </Button>
          </Col>
        </Row>
      </div>

      {/* Class Indicator */}
      <div style={{ padding: "16px 0 24px 0" }}>
        <Title level={4} style={{ marginBottom: 15 }}>
          Class : ABDULLAH BIN MUHAMMAD (P2B)
        </Title>
      </div>

      {/* Subject Cards */}
      <Row gutter={[24, 24]}>
        {filteredSubjects.map((subject) => (
          // Menggunakan 8/24 = 1/3 lebar untuk 3 kolom di layar medium ke atas
          <Col key={subject.id} xs={24} sm={12} md={8} lg={8} xl={8}>
            <SubjectReportCard data={subject} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default KnowledgePage;
