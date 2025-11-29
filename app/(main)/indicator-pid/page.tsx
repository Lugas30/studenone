"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Layout,
  Typography,
  Alert,
  Breadcrumb,
  Table,
  Space,
  Input,
  Button,
  Pagination,
  Select,
  Card,
  message,
  Spin,
} from "antd";
import { DownloadOutlined, SearchOutlined } from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;
const { Option } = Select;

// --- Helper Function ---
/**
 * Mengubah format Periode dari "Triwulan X" menjadi "triwulan_x" untuk URL.
 * Contoh: "Triwulan 1" -> "triwulan_1"
 */
const formatPeriodForUrl = (periode: string): string => {
  return periode.toLowerCase().replace(/\s+/g, "_");
};
// --- End Helper Function ---

// --- 1. INTERFACE API DAN MAPPING DATA ---

interface SubjectAPIData {
  periode: string; // <-- Data asli (misal: "Triwulan 1")
  subject_id: number;
  code: string;
  name: string;
  grade: string;
  kkm: number;
  category: string;
}

interface SubjectPID {
  key: string;
  subjectCode: string;
  subject: string;
  periode: string; // <-- Data asli
  grade: string;
  subject_id: number;
}

const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- 2. KOMPONEN UTAMA (PERSONAL INDICATOR PAGE) ---

const PersonalIndicatorPage: React.FC = () => {
  const router = useRouter();
  const [data, setData] = useState<SubjectPID[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("1");
  const [filterGrade, setFilterGrade] = useState("1");

  const gradeOptions = Array.from({ length: 6 }, (_, i) => (i + 1).toString());

  const fetchData = useCallback(async (grade: string) => {
    if (!BASE_API_URL) {
      message.error("NEXT_PUBLIC_API_URL is not defined in .env");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_API_URL}/indicator-pid/grade?grade=${grade}`
      );

      const apiData = response.data.dataSubject as SubjectAPIData[];

      const formattedData: SubjectPID[] = apiData.map((item, index) => ({
        key: `${item.subject_id}-${item.periode}-${index}`,
        subjectCode: item.code,
        subject: item.name,
        periode: item.periode,
        grade: item.grade,
        subject_id: item.subject_id,
      }));

      setData(formattedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Gagal mengambil data dari API.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filterGrade);
  }, [fetchData, filterGrade]);

  const handleApplyFilter = () => {
    setFilterGrade(selectedGrade);
  };

  /**
   * 🚀 FUNGSI NAVIGASI KE DETAIL DENGAN 3 PARAMETER
   */
  const handleViewDetail = (record: SubjectPID) => {
    // 1. Format periode agar aman di URL (misal: "Triwulan 1" -> "triwulan_1")
    const formattedPeriode = formatPeriodForUrl(record.periode);

    // 2. Susun path menggunakan periode yang sudah diformat
    const detailPath = `/personal-indicator-detail/${record.subject_id}/${formattedPeriode}/${record.grade}`;

    router.push(detailPath);
  };

  // --- 3. KOMPONEN TABEL DAN PAGINATION ---

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const columns = [
    {
      title: "Subject Code",
      dataIndex: "subjectCode",
      key: "subjectCode",
      sorter: (a: SubjectPID, b: SubjectPID) =>
        a.subjectCode.localeCompare(b.subjectCode),
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      sorter: (a: SubjectPID, b: SubjectPID) =>
        a.subject.localeCompare(b.subject),
    },
    {
      title: "Periode",
      dataIndex: "periode",
      key: "periode",
      sorter: (a: SubjectPID, b: SubjectPID) =>
        a.periode.localeCompare(b.periode),
    },
    {
      title: "Grade",
      dataIndex: "grade",
      key: "grade",
      sorter: (a: SubjectPID, b: SubjectPID) => a.grade.localeCompare(b.grade),
      width: 100,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (text: any, record: SubjectPID) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleViewDetail(record)}
        >
          Detail
        </Button>
      ),
    },
  ];

  const paginatedData = data.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(data.length / pageSize);

  // --- RENDER HALAMAN UTAMA ---

  return (
    <Layout
      style={{ minHeight: "100vh", background: "#fff", padding: "0 24px" }}
    >
      {/* Header Area */}
      <div style={{ paddingTop: 16 }}>
        <Breadcrumb style={{ margin: "16px 0" }}>
          <Breadcrumb.Item>Home</Breadcrumb.Item>
          <Breadcrumb.Item>Personal Indicator</Breadcrumb.Item>
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
          Personal Indicator
          <Text type="secondary" style={{ fontSize: "24px" }}>
            2024-2025
          </Text>
        </Title>
      </div>

      {/* Alert Banner */}
      <Alert
        message={
          <>
            Pastikan data pada menu Subject telah diisi terlebih dahulu.{" "}
            <br></br> Pilih Filter Grade untuk menampilkan data sesuai dengan
            Grade.
          </>
        }
        type="warning"
        showIcon={false}
        banner
        style={{
          marginTop: 8,
          marginBottom: 24,
          backgroundColor: "#fffbe6",
          borderColor: "#ffe58f",
          color: "rgba(0, 0, 0, 0.85)",
        }}
      />

      {/* Subject PID Section Title */}
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
        Subject PID
      </Title>

      {/* Konten Tabel dan Filter */}
      <Card bodyStyle={{ padding: "0 24px" }} bordered={false}>
        {/* Baris Pencarian dan Filter */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 24,
            alignItems: "center",
            paddingTop: 24,
          }}
        >
          <Input
            placeholder="Search customer 100 records..."
            style={{ width: 300 }}
            prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
          />

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Dropdown Grade */}
            <Select
              defaultValue={selectedGrade}
              value={selectedGrade}
              onChange={(value) => setSelectedGrade(value)}
              style={{ width: 120 }}
            >
              {gradeOptions.map((g) => (
                <Option key={g} value={g}>{`Grade ${g}`}</Option>
              ))}
            </Select>
            {/* Tombol Apply Filter */}
            <Button
              type="primary"
              style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              onClick={handleApplyFilter}
              loading={loading}
            >
              Apply Filter
            </Button>
            {/* Tombol Download */}
            <Button icon={<DownloadOutlined />} />
          </div>
        </div>

        {/* Tabel Data */}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={paginatedData}
            pagination={false}
            bordered={false}
            size="middle"
            rowKey="key"
            style={{ minHeight: 400 }}
          />
        </Spin>

        {/* Custom Pagination Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 16,
            paddingBottom: 24,
          }}
        >
          <Space>
            <span>Row per page</span>
            <Select
              value={pageSize.toString()}
              onChange={(value) => {
                setPageSize(parseInt(value));
                setCurrentPage(1);
              }}
              style={{ width: 70 }}
            >
              <Option value="10">10</Option>
              <Option value="20">20</Option>
              <Option value="50">50</Option>
            </Select>
            <span>Go to</span>
            <Input
              value={currentPage}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 1 && value <= totalPages) {
                  setCurrentPage(value);
                }
              }}
              style={{ width: 50 }}
              type="number"
              min={1}
              max={totalPages}
            />
          </Space>

          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={data.length}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
            itemRender={(page, type, originalElement) => {
              if (type === "page") {
                const isSelected = page === currentPage;
                return (
                  <div
                    style={{
                      padding: "0 8px",
                      border: isSelected
                        ? "1px solid #1890ff"
                        : "1px solid #d9d9d9",
                      borderRadius: 4,
                      color: isSelected ? "#1890ff" : "rgba(0, 0, 0, 0.85)",
                      backgroundColor: isSelected ? "#e6f7ff" : "#fff",
                      cursor: "pointer",
                      minWidth: 32,
                      textAlign: "center",
                      lineHeight: "28px",
                    }}
                  >
                    {page}
                  </div>
                );
              }
              return originalElement;
            }}
          />
        </div>
      </Card>
    </Layout>
  );
};

export default PersonalIndicatorPage;
