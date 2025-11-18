"use client";
// pages/spi-sos.tsx - Perbaikan untuk Tampilan yang Lebih Identik

import React, { useState, useEffect } from "react";
import {
  Layout,
  Typography,
  Row,
  Col,
  Input,
  Select,
  Button,
  Card,
  Space,
} from "antd";
import { SearchOutlined, DownloadOutlined } from "@ant-design/icons";
import Head from "next/head";

// --- 1. DATA DUMMY & TIPE DATA (Tidak Berubah) ---

interface AttitudeIndicator {
  id: number;
  grade: string;
  semester: string;
  spiritual: string;
  social: string;
  year: string;
}

const dummyIndicators: AttitudeIndicator[] = [
  {
    id: 1,
    grade: "10",
    semester: "Ganjil",
    spiritual:
      "Giving greetings, Such in tawakal, Grateful for the blessings & gifts of Allah SWT, tolerance, and being grateful for succeeding in doing something.",
    social: "honesty, discipline, responsibility, and tolerance.",
    year: "2024-2025",
  },
  {
    id: 2,
    grade: "11",
    semester: "Ganjil",
    spiritual:
      "Focusing on daily prayer, understanding the religious importance of charity, and maintaining good moral conduct.",
    social: "cooperation, leadership, fairness, and politeness.",
    year: "2024-2025",
  },
];

const gradeOptions = [
  { label: "Grade 10", value: "10" },
  { label: "Grade 11", value: "11" },
  { label: "Grade 12", value: "12" },
];

const fetchAttitudeIndicator = (grade: string): AttitudeIndicator | null => {
  return (
    dummyIndicators.find(
      (indicator) =>
        indicator.grade === grade && indicator.semester === "Ganjil"
    ) || null
  );
};

// --- 2. KOMPONEN UI Halaman Spi & Sos (Diperbaiki) ---

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

interface FilterState {
  grade: string | undefined;
}

const SpiSosPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterState>({ grade: "10" });
  const [currentIndicator, setCurrentIndicator] =
    useState<AttitudeIndicator | null>(null);

  const applyFilter = () => {
    if (filter.grade) {
      const data = fetchAttitudeIndicator(filter.grade);
      setCurrentIndicator(data);
    } else {
      setCurrentIndicator(null);
    }
  };

  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.grade]);

  const handleGradeChange = (value: string) => {
    setFilter((prev) => ({ ...prev, grade: value }));
  };

  const handleSubmit = () => {
    console.log("Data Submitted:", currentIndicator);
    alert(`Data Indikator Grade ${filter.grade} telah disubmit (Simulasi)`);
  };

  const spiritualValue =
    currentIndicator?.spiritual ||
    "Pilih grade dan terapkan filter untuk melihat indikator Spiritual.";
  const socialValue =
    currentIndicator?.social ||
    "Pilih grade dan terapkan filter untuk melihat indikator Sosial.";
  const displayYear = currentIndicator?.year || "2024-2025";
  const displaySemester = currentIndicator?.semester || "Ganjil";

  return (
    <>
      <Head>
        <title>Spiritual and Social Attitudes</title>
      </Head>
      <Layout style={{ minHeight: "100vh", backgroundColor: "#fff" }}>
        {" "}
        {/* Latar belakang putih untuk meniru image */}
        {/* --- HEADER/BREADCRUMB PALING ATAS --- */}
        <div
          style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0" }}
        >
          <Text type="secondary" style={{ fontSize: 14 }}>
            Home / Indicator Spi & Sos
          </Text>
        </div>
        {/* KONTEN UTAMA */}
        <Content style={{ padding: "0 24px 24px 24px" }}>
          {" "}
          {/* Padding vertikal sedikit disesuaikan */}
          {/* BARIS JUDUL DAN TAHUN */}
          <Row
            justify="space-between"
            align="top"
            style={{ marginTop: 24, marginBottom: 24 }}
          >
            <Col>
              <Title level={2} style={{ margin: 0, fontWeight: "normal" }}>
                {" "}
                {/* Font Judul dibuat normal */}
                Spiritual and Social Attitudes
              </Title>
            </Col>
            <Col>
              <Title
                level={4}
                style={{ margin: 0, fontWeight: "normal", color: "#000" }}
              >
                {displayYear} ({displaySemester})
              </Title>
            </Col>
          </Row>
          {/* BARIS SEARCH, FILTER, DAN TOMBOL DOWNLOAD */}
          <Row
            justify="space-between"
            align="middle"
            style={{ marginBottom: 24 }}
          >
            {/* Search Input */}
            <Col>
              <Input
                placeholder="Search customer 100 records..."
                prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
                style={{
                  width: 250,
                  borderRadius: 5,
                  padding: "8px 11px",
                  border: "1px solid #d9d9d9",
                }}
              />
            </Col>

            {/* Filter Group (Sangat Mirip dengan Gambar) */}
            <Col>
              <Space>
                <Select
                  value={filter.grade}
                  placeholder="Pilih Grade"
                  onChange={handleGradeChange}
                  options={gradeOptions}
                  style={{ minWidth: 120, height: 38 }} // Sesuaikan tinggi agar sejajar
                  dropdownStyle={{ border: "none" }}
                />
                {/* Apply Filter Button (Warna hijau solid) */}
                <Button
                  type="primary"
                  onClick={applyFilter}
                  style={{
                    backgroundColor: "#52c41a",
                    borderColor: "#52c41a",
                    height: 38,
                    padding: "0 15px",
                  }}
                >
                  Apply Filter
                </Button>
                {/* Download Button (Hanya Ikon, Latar belakang putih/transparan) */}
                <Button
                  icon={<DownloadOutlined style={{ fontSize: 16 }} />}
                  style={{
                    height: 38,
                    width: 38,
                    border: "1px solid #d9d9d9",
                    backgroundColor: "#fff",
                  }}
                />
              </Space>
            </Col>
          </Row>
          {/* --- CARD SPIRITUAL --- */}
          {/* Card tanpa border dan background putih, hanya bayangan ringan jika perlu */}
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                Spiritual
              </Title>
            }
            bordered={false}
            style={{
              marginBottom: 24,
              padding: "0 1px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            bodyStyle={{ padding: "16px 24px" }} // Padding disesuaikan
          >
            <TextArea
              rows={4}
              value={spiritualValue}
              readOnly
              style={{
                resize: "none",
                border: "none", // Menghilangkan border default TextArea
                boxShadow: "none", // Menghilangkan bayangan/outline fokus
                padding: 0,
                backgroundColor: "transparent",
              }}
            />
          </Card>
          {/* --- CARD SOCIAL --- */}
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                Social
              </Title>
            }
            bordered={false}
            style={{
              marginBottom: 24,
              padding: "0 1px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            bodyStyle={{ padding: "16px 24px" }}
          >
            <TextArea
              rows={4}
              value={socialValue}
              readOnly
              style={{
                resize: "none",
                border: "none",
                boxShadow: "none",
                padding: 0,
                backgroundColor: "transparent",
              }}
            />
          </Card>
          {/* TOMBOL SUBMIT */}
          <Row justify="start">
            <Col>
              <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
                style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}
              >
                Submit
              </Button>
            </Col>
          </Row>
        </Content>
      </Layout>
    </>
  );
};

export default SpiSosPage;
