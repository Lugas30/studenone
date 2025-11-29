// src/app/personal-indicator-detail/[subjectId]/[periode]/[grade]/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Layout,
  Typography,
  Breadcrumb,
  Card,
  Space,
  Button,
  message,
  Spin,
  Alert, // <-- Pastikan Alert diimpor
  Collapse, // <-- Impor Collapse untuk menata data bertingkat
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;
const { Panel } = Collapse; // Destructuring Panel dari Collapse

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
// --- END INTERFACE SUBJEK ---

// --- INTERFACE DATA INDIKATOR ---
interface Indicator {
  id: number;
  ic: number;
  indicator: string;
  domain: string;
}

interface Subthema {
  id: number;
  subthema: string;
  indicators: Indicator[];
}

interface Thema {
  id: number;
  thema: string;
  subthemas: Subthema[];
}

interface PersonalIndicatorData {
  id: number;
  semester: string;
  priode: string;
  themas: Thema[]; // Nested themas
}
// --- END INTERFACE INDIKATOR ---

const PersonalIndicatorDetailPage: React.FC = () => {
  const params = useParams();

  // Ambil TIGA parameter dari URL
  const subjectId = params.subjectId as string;
  const periode = params.periode as string;
  const grade = params.grade as string;

  // State untuk data subjek dan indikator
  const [subjectDetail, setSubjectDetail] = useState<SubjectDetail | null>(
    null
  );
  const [indicatorData, setIndicatorData] = useState<
    PersonalIndicatorData[] | null
  >(null);

  // State Loading terpisah
  const [loadingSubject, setLoadingSubject] = useState(true);
  const [loadingIndicators, setLoadingIndicators] = useState(true);

  // --- 1. FETCH SUBJECT DETAIL ---

  const fetchSubjectDetail = useCallback(async (id: string) => {
    if (!BASE_API_URL) return;

    setLoadingSubject(true);
    try {
      const response = await axios.get<SubjectAPIResponse>(
        `${BASE_API_URL}/subjects`
      );

      const foundSubject = response.data.data.find(
        (sub) => sub.id === parseInt(id)
      );

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
      setLoadingSubject(false);
    }
  }, []);

  // --- 2. FETCH INDICATOR DATA ---

  const fetchIndicatorData = useCallback(
    async (id: string, p: string, g: string) => {
      if (!BASE_API_URL) return;

      setLoadingIndicators(true);
      try {
        // Konstruksi URL API kedua
        const apiUrl = `${BASE_API_URL}/indicator-pid/subject?grade=${g}&subject_id=${id}&priode=${p}`;
        const response = await axios.get<PersonalIndicatorData[]>(apiUrl);

        setIndicatorData(response.data);

        if (response.data.length === 0) {
          message.info("Tidak ada data indikator ditemukan untuk periode ini.");
        }
      } catch (error) {
        console.error("Error fetching indicator data:", error);
        message.error("Gagal mengambil data indikator.");
        setIndicatorData(null);
      } finally {
        setLoadingIndicators(false);
      }
    },
    []
  );

  // --- 3. useEffect untuk Memanggil Kedua API ---

  useEffect(() => {
    if (subjectId && periode && grade) {
      fetchSubjectDetail(subjectId);
      fetchIndicatorData(subjectId, periode, grade);
    }
  }, [subjectId, periode, grade, fetchSubjectDetail, fetchIndicatorData]);

  const displaySubjectName = subjectDetail
    ? subjectDetail.name
    : "Loading Subject...";
  const combinedLoading = loadingSubject || loadingIndicators;

  return (
    <Layout
      style={{ minHeight: "100vh", background: "#fff", padding: "0 24px" }}
    >
      <Spin spinning={combinedLoading}>
        {/* Header Area */}
        <div style={{ paddingTop: 16 }}>
          <Breadcrumb style={{ margin: "16px 0" }}>
            <Breadcrumb.Item href="/personal-indicator">
              Personal Indicator
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              Detail Subject: {displaySubjectName}
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
              {periode.toUpperCase().replace(/_/g, " ")}{" "}
              {/* Tampilkan periode yang lebih mudah dibaca */}
            </Text>
          </Title>
        </div>

        {/* Konten Detail */}
        <Card
          title="Subject Information"
          bordered={false}
          style={{ marginBottom: 24 }}
        >
          {loadingSubject ? (
            <Alert message="Memuat data subjek..." type="info" />
          ) : subjectDetail ? (
            <>
              <p>
                <Text strong>Subject Name:</Text> **{subjectDetail.name}**
              </p>
              <p>
                <Text strong>Subject Code:</Text> {subjectDetail.code}
              </p>
              <p>
                <Text strong>Subject ID:</Text> **{subjectId}**
              </p>
              <p>
                <Text strong>Grade:</Text> **{grade}**
              </p>
              <p>
                <Text strong>Periode (URL format):</Text> **{periode}**
              </p>
            </>
          ) : (
            <Alert
              message={`Subject dengan ID ${subjectId} tidak ditemukan.`}
              type="error"
            />
          )}
        </Card>

        <Card title="Indicators and Assessment" bordered={false}>
          <Title level={4} style={{ marginBottom: 16 }}>
            Daftar Indikator
          </Title>

          {loadingIndicators ? (
            <Alert message="Memuat daftar indikator..." type="info" />
          ) : indicatorData && indicatorData.length > 0 ? (
            <Collapse accordion defaultActiveKey={["0"]}>
              {indicatorData[0].themas.map((thema, themaIndex) => (
                <Panel
                  header={`THEMA: ${thema.thema}`}
                  key={`thema-${themaIndex}`}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {thema.subthemas.map((subthema, subthemaIndex) => (
                      <Card
                        key={`subthema-${subthemaIndex}`}
                        title={`Subthema: ${subthema.subthema}`}
                        size="small"
                        style={{
                          borderLeft: "3px solid #52c41a",
                          backgroundColor: "#f9fff9",
                        }}
                      >
                        <ul
                          style={{ listStyleType: "decimal", paddingLeft: 20 }}
                        >
                          {subthema.indicators.map(
                            (indicator, indicatorIndex) => (
                              <li
                                key={`indicator-${indicatorIndex}`}
                                style={{ marginBottom: 8 }}
                              >
                                <Text strong>{indicator.domain}:</Text>{" "}
                                {indicator.indicator}
                                <Text
                                  type="secondary"
                                  style={{ marginLeft: 10 }}
                                >
                                  [IC: {indicator.ic}]
                                </Text>
                              </li>
                            )
                          )}
                        </ul>
                      </Card>
                    ))}
                  </Space>
                </Panel>
              ))}
            </Collapse>
          ) : (
            <Alert
              message="Data Indikator Tidak Tersedia"
              description={`Tidak ada indikator yang terdaftar untuk subjek ini pada Periode ${periode}.`}
              type="warning"
              showIcon
            />
          )}
        </Card>
      </Spin>
    </Layout>
  );
};

export default PersonalIndicatorDetailPage;
