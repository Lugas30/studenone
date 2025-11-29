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
  Alert,
  Table,
  Input,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  SearchOutlined,
  DownloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import komponen modal dengan nama yang baru
import AddThemeModalPID from "../../../../../components/AddThemeModalPID";

const { Title, Text } = Typography;

// URL dasar diambil dari .env
const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- INTERFACE DATA ---
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
  themas: Thema[];
}
interface TableData {
  key: string;
  theme: string;
  subTheme: string;
  ic: number;
  indicator: string;
  domain: string;
}

// --- FUNGSI HELPER: MERATAKAN DATA ---
const flattenIndicatorData = (
  data: PersonalIndicatorData[] | null
): TableData[] => {
  if (!data || data.length === 0) return [];

  const flattened: TableData[] = [];
  const mainData = data[0];

  if (!mainData || !mainData.themas) return [];

  mainData.themas.forEach((thema) => {
    thema.subthemas.forEach((subthema) => {
      subthema.indicators.forEach((indicator) => {
        flattened.push({
          key: `${thema.id}-${subthema.id}-${indicator.id}`,
          theme: thema.thema,
          subTheme: subthema.subthema,
          ic: indicator.ic,
          indicator: indicator.indicator,
          domain: indicator.domain,
        });
      });
    });
  });

  return flattened;
};

// --- KOMPONEN UTAMA ---

const PersonalIndicatorDetailPage: React.FC = () => {
  const params = useParams();

  const subjectId = params.subjectId as string;
  const periode = params.periode as string;
  const grade = params.grade as string;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [subjectDetail, setSubjectDetail] = useState<SubjectDetail | null>(
    null
  );
  const [indicatorData, setIndicatorData] = useState<
    PersonalIndicatorData[] | null
  >(null);

  const [loadingSubject, setLoadingSubject] = useState(true);
  const [loadingIndicators, setLoadingIndicators] = useState(true);

  // --- 1. FETCH SUBJECT DETAIL (DYNAMIC) ---
  const fetchSubjectDetail = useCallback(async (id: string) => {
    if (!BASE_API_URL) {
      setLoadingSubject(false);
      return;
    }

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
        message.warning(`Subject dengan ID ${id} tidak ditemukan di API.`);
        setSubjectDetail(null);
      }
    } catch (error) {
      console.error("Error fetching subject details:", error);
      message.error("Gagal mengambil data subjek dari API.");
      setSubjectDetail(null);
    } finally {
      setLoadingSubject(false);
    }
  }, []);

  // --- 2. FETCH INDICATOR DATA ---
  const fetchIndicatorData = useCallback(
    async (id: string, p: string, g: string) => {
      if (!BASE_API_URL) {
        setLoadingIndicators(false);
        return;
      }
      setLoadingIndicators(true);
      try {
        const apiUrl = `${BASE_API_URL}/indicator-pid/subject?grade=${g}&subject_id=${id}&priode=${p}`;
        const response = await axios.get<PersonalIndicatorData[]>(apiUrl);
        setIndicatorData(response.data);
      } catch (error) {
        console.error("Error fetching indicator data:", error);
        setIndicatorData(null);
      } finally {
        setLoadingIndicators(false);
      }
    },
    []
  );

  // Fungsi untuk Refresh Data setelah berhasil menambahkan Theme
  const handleAddThemeSuccess = () => {
    setIsModalVisible(false);
    fetchIndicatorData(subjectId, periode, grade);
  };

  // --- 3. useEffect untuk Memanggil Kedua API ---
  useEffect(() => {
    if (subjectId && periode && grade) {
      fetchSubjectDetail(subjectId);
      fetchIndicatorData(subjectId, periode, grade);
    }
  }, [subjectId, periode, grade, fetchSubjectDetail, fetchIndicatorData]);

  const displaySubjectName = subjectDetail
    ? subjectDetail.name
    : "Memuat Subjek...";

  // --- STRUKTUR TABEL ---
  const tableData = flattenIndicatorData(indicatorData);

  const columns = [
    {
      title: "Theme",
      dataIndex: "theme",
      key: "theme",
      width: 150,
      render: (text: string, record: TableData, index: number) => {
        const rowSpan = tableData.filter((item) => item.theme === text).length;
        const prevTheme = index > 0 ? tableData[index - 1].theme : null;
        if (text === prevTheme) {
          return { children: text, props: { rowSpan: 0 } };
        }
        return { children: text, props: { rowSpan: rowSpan } };
      },
    },
    {
      title: "Sub Theme",
      dataIndex: "subTheme",
      key: "subTheme",
      width: 150,
      render: (text: string, record: TableData, index: number) => {
        const themeGroup = tableData.filter(
          (item) => item.theme === record.theme
        );
        const themeGroupStartIndex = tableData.findIndex(
          (item) => item.theme === record.theme
        );
        const currentThemeIndex = index - themeGroupStartIndex;
        const rowSpan = themeGroup.filter(
          (item) => item.subTheme === text
        ).length;
        const prevSubTheme =
          currentThemeIndex > 0
            ? themeGroup[currentThemeIndex - 1].subTheme
            : null;
        if (
          text === prevSubTheme &&
          record.theme === themeGroup[currentThemeIndex - 1].theme
        ) {
          return { children: text, props: { rowSpan: 0 } };
        }
        return { children: text, props: { rowSpan: rowSpan } };
      },
    },
    {
      title: "IC",
      dataIndex: "ic",
      key: "ic",
      width: 50,
      sorter: (a: TableData, b: TableData) => a.ic - b.ic,
    },
    { title: "Indicator", dataIndex: "indicator", key: "indicator" },
    { title: "Domain", dataIndex: "domain", key: "domain", width: 120 },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: () => <Button type="text" icon={<EditOutlined />} size="small" />,
    },
  ];

  // --- RENDER KOMPONEN ---

  return (
    <Layout
      style={{ minHeight: "100vh", background: "#fff", padding: "0 24px" }}
    >
      {/* Toast Container untuk notifikasi */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <Spin spinning={loadingSubject}>
        <div style={{ paddingTop: 16 }}>
          <Breadcrumb style={{ margin: "16px 0" }}>
            <Breadcrumb.Item href="/personal-indicator">
              Personal Indicator
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              Detail Subject: {displaySubjectName}
            </Breadcrumb.Item>
          </Breadcrumb>
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => window.history.back()}
            >
              Back
            </Button>
          </Space>
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
            <Space>Detail Personal Indicator</Space>
            <Text type="secondary" style={{ fontSize: "24px" }}>
              {periode.toUpperCase().replace(/_/g, " ")}
            </Text>
          </Title>
        </div>

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
                <Text strong>Subject Name:</Text> {subjectDetail.name}
              </p>
              <p>
                <Text strong>Subject ID:</Text> {subjectId}
              </p>
              <p>
                <Text strong>Grade:</Text> {grade}
              </p>
              <p>
                <Text strong>Periode (URL format):</Text> {periode}
              </p>
            </>
          ) : (
            <Alert
              message={`Subject dengan ID ${subjectId} tidak ditemukan.`}
              type="error"
            />
          )}
        </Card>
      </Spin>

      {/* Indicators Table Section */}
      <Card title="Indicators and Assessment" bordered={false}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Input
              placeholder="Search customer 100 records..."
              style={{ width: 300 }}
              prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
            />
          </div>
          <Space>
            <Button icon={<DownloadOutlined />} />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              onClick={() => setIsModalVisible(true)}
              disabled={!subjectDetail || loadingIndicators}
            >
              Add Theme
            </Button>
          </Space>
        </div>

        <Spin spinning={loadingIndicators}>
          {tableData.length > 0 ? (
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={false}
              bordered={true}
              size="middle"
              rowKey="key"
            />
          ) : (
            <Alert
              message="Data Indikator Tidak Tersedia"
              description={
                loadingIndicators
                  ? "Menunggu data..."
                  : `Tidak ada indikator yang terdaftar untuk ${displaySubjectName} pada Periode ${periode}.`
              }
              type="warning"
              showIcon
            />
          )}
        </Spin>
      </Card>

      {/* Modal Komponen */}
      {subjectDetail && (
        <AddThemeModalPID
          isVisible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onSuccess={handleAddThemeSuccess}
          subjectId={subjectId}
          grade={grade}
          periode={periode}
        />
      )}
    </Layout>
  );
};

export default PersonalIndicatorDetailPage;
