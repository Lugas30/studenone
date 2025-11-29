"use client";

import React, { useState, useEffect, useCallback } from "react"; // <-- Tambahkan useEffect dan useCallback
import { useParams } from "next/navigation";
import {
  Layout,
  Typography,
  Breadcrumb,
  Card,
  Space,
  Button,
  message,
  Spin, // <-- Tambahkan Spin untuk loading
  Alert,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios"; // <-- Tambahkan axios

const { Title, Text } = Typography;

// URL dasar diambil dari .env
const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- INTERFACE DATA SUBJEK ---
interface SubjectDetail {
  id: number;
  code: string;
  category: string;
  name: string;
  grade: string;
  kkm: number;
}

interface SubjectAPIResponse {
  academicYear: string;
  data: SubjectDetail[];
}
// --- END INTERFACE ---

const PersonalIndicatorDetailPage: React.FC = () => {
  const params = useParams();

  // Ambil TIGA parameter dari URL
  const subjectId = params.subjectId as string;
  const periode = params.periode as string;
  const grade = params.grade as string;

  // State untuk menyimpan data subjek yang ditemukan
  const [subjectDetail, setSubjectDetail] = useState<SubjectDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  /**
   * Fungsi untuk mengambil data subjek dari API dan memfilternya
   */
  const fetchSubjectDetail = useCallback(async (id: string) => {
    if (!BASE_API_URL) {
      message.error("NEXT_PUBLIC_API_URL is not defined in .env");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get<SubjectAPIResponse>(
        `${BASE_API_URL}/subjects`
      );

      const subjects: SubjectDetail[] = response.data.data;

      // Cari subjek yang ID-nya cocok dengan subjectId dari URL (perlu konversi tipe)
      const foundSubject = subjects.find((sub) => sub.id === parseInt(id));

      if (foundSubject) {
        setSubjectDetail(foundSubject);
      } else {
        message.warning(`Subject dengan ID ${id} tidak ditemukan.`);
        setSubjectDetail(null);
      }
    } catch (error) {
      console.error("Error fetching subject details:", error);
      message.error("Gagal mengambil data subjek.");
      setSubjectDetail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Panggil fungsi fetch data saat komponen dimuat atau subjectId berubah
  useEffect(() => {
    if (subjectId) {
      fetchSubjectDetail(subjectId);
    }
  }, [subjectId, fetchSubjectDetail]);

  const displaySubjectName = subjectDetail
    ? subjectDetail.name
    : "Loading Subject...";

  return (
    <Layout
      style={{ minHeight: "100vh", background: "#fff", padding: "0 24px" }}
    >
      <Spin spinning={loading}>
        {" "}
        {/* Seluruh konten di dalam Spin */}
        {/* Header Area */}
        <div style={{ paddingTop: 16 }}>
          <Breadcrumb style={{ margin: "16px 0" }}>
            <Breadcrumb.Item href="/personal-indicator">
              Personal Indicator
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              Detail Subject: {displaySubjectName}{" "}
              {/* Menggunakan nama subjek dinamis */}
            </Breadcrumb.Item>
          </Breadcrumb>

          <Title
            level={1}
            style={{
              margin: "0 0 16px 0",
              fontWeight: "normal",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Space>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => window.history.back()}
              >
                Back
              </Button>
              Detail Personal Indicator
            </Space>
            <Text type="secondary" style={{ fontSize: "24px" }}>
              {periode.toUpperCase()}
            </Text>
          </Title>
        </div>
        {/* Konten Detail */}
        <Card
          title="Subject Information"
          bordered={false}
          style={{ marginBottom: 24 }}
        >
          {subjectDetail ? (
            <>
              <p>
                <Text strong>Subject Name:</Text> {subjectDetail.name}
              </p>
              <p>
                <Text strong>Subject Code:</Text> {subjectDetail.code}
              </p>
              <p>
                <Text strong>Subject ID:</Text> {subjectId}
              </p>
              <p>
                <Text strong>Grade:</Text> {grade}
              </p>
              <p>
                <Text strong>KKM:</Text> {subjectDetail.kkm}
              </p>
              <p>
                <Text strong>Periode (URL format):</Text> {periode}
              </p>
            </>
          ) : (
            <Alert message="Memuat data subjek..." type="info" />
          )}
        </Card>
        <Card title="Indicators and Assessment" bordered={false}>
          <Title level={4}>Data Indikator</Title>
          <p>
            <Text type="success" strong>
              Sekarang Anda dapat melanjutkan untuk mengambil data indikator
              menggunakan Subject ID: {subjectId}, Periode: {periode}, dan
              Grade: {grade}.
            </Text>
          </p>
        </Card>
      </Spin>
    </Layout>
  );
};

export default PersonalIndicatorDetailPage;
