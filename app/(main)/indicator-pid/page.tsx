"use client";

import React, { useState } from "react";
import {
  Layout,
  Typography,
  Alert,
  Input,
  Button,
  Table,
  Select,
  Space,
  Pagination,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// --- 1. DEFINISI INTERFACE (Tipe Data) ---
interface SubjectPID {
  key: string;
  subjectCode: string;
  subject: string;
  periode: string;
  grade: number;
}

// --- 2. DATA DUMMY ---
const initialData: SubjectPID[] = [
  {
    key: "1",
    subjectCode: "MP001",
    subject: "Matematika",
    periode: "Triwulan 1",
    grade: 1,
  },
  {
    key: "2",
    subjectCode: "MP001",
    subject: "Matematika",
    periode: "Triwulan 2",
    grade: 1,
  },
  {
    key: "3",
    subjectCode: "MP001",
    subject: "Matematika",
    periode: "Triwulan 3",
    grade: 1,
  },
  {
    key: "4",
    subjectCode: "MP001",
    subject: "Matematika",
    periode: "Triwulan 4",
    grade: 1,
  },
  {
    key: "5",
    subjectCode: "MP002",
    subject: "PKN",
    periode: "Triwulan 1",
    grade: 1,
  },
  {
    key: "6",
    subjectCode: "MP002",
    subject: "PKN",
    periode: "Triwulan 2",
    grade: 1,
  },
  // Data tambahan untuk simulasi 50 halaman (500 total record)
  ...Array.from({ length: 494 }, (_, i) => ({
    key: String(i + 7),
    subjectCode: i % 2 === 0 ? "MP003" : "MP004",
    subject: i % 2 === 0 ? "Bahasa Indonesia" : "Seni Budaya",
    periode: `Triwulan ${((i + 7) % 4) + 1}`,
    grade: Math.floor((i + 7) / 100) + 1,
  })),
];

// --- 3. DEFINISI KOLOM DENGAN TIPE YANG BENAR ---
const columns: ColumnsType<SubjectPID> = [
  {
    title: "Subject Code",
    dataIndex: "subjectCode",
    key: "subjectCode",
    sorter: (a: SubjectPID, b: SubjectPID) =>
      a.subjectCode.localeCompare(b.subjectCode),
    align: "left",
    // Perbaikan: Menambahkan onHeaderCell dan onCell untuk border vertikal dan styling header
    onHeaderCell: () => ({
      style: {
        backgroundColor: "#f0f0f0",
        fontWeight: "bold",
        borderRight: "1px solid #f0f0f0",
      },
    }),
    onCell: () => ({ style: { borderRight: "1px solid #f0f0f0" } }),
  },
  {
    title: "Subject",
    dataIndex: "subject",
    key: "subject",
    sorter: (a: SubjectPID, b: SubjectPID) =>
      a.subject.localeCompare(b.subject),
    align: "left",
    // Perbaikan: Menambahkan onHeaderCell dan onCell
    onHeaderCell: () => ({
      style: {
        backgroundColor: "#f0f0f0",
        fontWeight: "bold",
        borderRight: "1px solid #f0f0f0",
      },
    }),
    onCell: () => ({ style: { borderRight: "1px solid #f0f0f0" } }),
  },
  {
    title: "Periode",
    dataIndex: "periode",
    key: "periode",
    sorter: (a: SubjectPID, b: SubjectPID) =>
      a.periode.localeCompare(b.periode),
    align: "left",
    // Perbaikan: Menambahkan onHeaderCell dan onCell
    onHeaderCell: () => ({
      style: {
        backgroundColor: "#f0f0f0",
        fontWeight: "bold",
        borderRight: "1px solid #f0f0f0",
      },
    }),
    onCell: () => ({ style: { borderRight: "1px solid #f0f0f0" } }),
  },
  {
    title: "Grade",
    dataIndex: "grade",
    key: "grade",
    sorter: (a: SubjectPID, b: SubjectPID) => a.grade - b.grade,
    align: "left",
    // Perbaikan: Menambahkan onHeaderCell dan onCell
    onHeaderCell: () => ({
      style: {
        backgroundColor: "#f0f0f0",
        fontWeight: "bold",
        borderRight: "1px solid #f0f0f0",
      },
    }),
    onCell: () => ({ style: { borderRight: "1px solid #f0f0f0" } }),
  },
  {
    title: "Actions",
    key: "actions",
    align: "center",
    // Perbaikan: Menambahkan onHeaderCell dan onCell
    onHeaderCell: () => ({
      style: {
        backgroundColor: "#f0f0f0",
        fontWeight: "bold",
        borderRight: "1px solid #f0f0f0",
      },
    }),
    onCell: () => ({ style: { borderRight: "1px solid #f0f0f0" } }),
    render: (_, record: SubjectPID) => (
      <Space size={4}>
        <Button
          icon={<EyeOutlined />}
          type="text"
          style={{ padding: "0 4px", color: "#1890ff" }}
          onClick={() => console.log("View", record)}
        />
        <Button
          icon={<EditOutlined />}
          type="text"
          style={{ padding: "0 4px", color: "#1890ff" }}
          onClick={() => console.log("Edit", record)}
        />
      </Space>
    ),
  },
];

// --- 4. KOMPONEN HALAMAN ---
const PersonalIndicatorPage = () => {
  const [currentPage, setCurrentPage] = useState(6);
  const [pageSize, setPageSize] = useState(10);
  const totalRecords = initialData.length;

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const dataToShow = initialData.slice(startIndex, endIndex);

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      <Content
        style={{
          padding: "24px",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Header Area: Home / Personal Indicator dan 2024-2025 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "20px",
          }}
        >
          <div>
            <Text
              style={{
                fontSize: "12px",
                color: "#666",
                marginBottom: "4px",
                display: "block",
              }}
            >
              Home /{" "}
              <span style={{ fontWeight: "bold" }}>Personal Indicator</span>
            </Text>
            <Title
              level={1}
              style={{ margin: 0, fontWeight: "bold", fontSize: "30px" }}
            >
              Personal Indicator
            </Title>
          </div>
          <Title
            level={2}
            style={{ margin: 0, color: "#333", fontSize: "24px" }}
          >
            2024-2025
          </Title>
        </div>

        {/* --- HR --- (Garis pemisah seperti di gambar) */}
        <div
          style={{ borderBottom: "1px solid #f0f0f0", margin: "16px 0 24px 0" }}
        ></div>

        {/* Alert / Peringatan */}
        <Alert
          message={
            <>
              Pastikan data pada menu <Text strong>Subject</Text> telah diisi
              terlebih dahulu. Pilih <Text strong>Filter Grade</Text> untuk
              menampilkan data sesuai dengan <Text strong>Grade</Text>.
            </>
          }
          type="warning"
          showIcon={false}
          style={{
            marginBottom: "24px",
            backgroundColor: "#fffbe6", // Warna kuning terang
            borderColor: "#ffe58f", // Border kuning
            color: "#faad14", // Warna teks kuning-oranye
            padding: "12px 16px",
            borderRadius: "2px",
            fontSize: "14px",
            lineHeight: "22px",
          }}
        />

        {/* Sub Judul Subject PID */}
        <Title level={3} style={{ marginBottom: "16px", fontSize: "20px" }}>
          Subject PID
        </Title>

        {/* Filter dan Search Bar */}
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Input
            placeholder="Search customer 100 records..."
            prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
            style={{ width: 300, borderRadius: "2px", height: "32px" }}
          />
          <Space size={8}>
            <Select
              defaultValue="1"
              style={{ width: 120 }}
              placeholder="Pilih Grade"
            >
              <Option value="1">Grade 1</Option>
              <Option value="2">Grade 2</Option>
            </Select>
            <Button
              type="primary"
              style={{
                backgroundColor: "#52c41a", // Warna hijau
                borderColor: "#52c41a",
                borderRadius: "2px",
                height: "32px",
                fontWeight: "normal",
              }}
            >
              Apply Filter
            </Button>
            <Button
              icon={<DownloadOutlined />}
              style={{ height: "32px", borderRadius: "2px" }}
            />
          </Space>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={dataToShow}
          pagination={false}
          bordered={true}
          style={{ marginBottom: "16px" }}
          // rowClassName="ant-table-row-striped" // Dinonaktifkan, karena mungkin menyebabkan ketidaksesuaian warna
        />

        {/* --- HR --- (Garis pemisah seperti di gambar) */}
        <div
          style={{ borderBottom: "1px solid #f0f0f0", margin: "16px 0 24px 0" }}
        ></div>

        {/* Custom Footer Pagination */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
          }}
        >
          {/* Kontrol Kiri: Row per page & Go to */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Text
              style={{ fontSize: "14px", color: "#666", fontWeight: "bold" }}
            >
              Row per page
            </Text>
            <Select
              defaultValue="10"
              style={{ width: 70 }}
              onChange={(value) => setPageSize(Number(value))}
            >
              <Option value="10">10</Option>
              <Option value="20">20</Option>
              <Option value="50">50</Option>
            </Select>
            <Text
              style={{
                fontSize: "14px",
                color: "#666",
                marginLeft: "16px",
                fontWeight: "bold",
              }}
            >
              Go to
            </Text>
            <Input
              type="number"
              value={currentPage}
              style={{
                width: 50,
                textAlign: "center",
                borderRadius: "2px",
                border: "1px solid #d9d9d9",
              }}
              min={1}
              max={Math.ceil(totalRecords / pageSize)}
              onChange={(e) => {
                const page = Number(e.target.value);
                if (page > 0 && page <= Math.ceil(totalRecords / pageSize)) {
                  setCurrentPage(page);
                }
              }}
            />
          </div>

          {/* Kontrol Kanan: Pagination */}
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalRecords}
            showSizeChanger={false}
            onChange={handlePageChange}
            // Menggabungkan logika tampilan angka dan styling aktif
            itemRender={(page, type, originalElement) => {
              if (
                type === "prev" ||
                type === "next" ||
                type === "jump-prev" ||
                type === "jump-next"
              ) {
                return originalElement;
              }

              const totalPages = Math.ceil(totalRecords / pageSize);
              let shouldDisplay = false;

              // Tampilkan halaman 1 dan totalPages (50)
              if (page === 1 || page === totalPages) {
                shouldDisplay = true;
              }
              // Tampilkan halaman di sekitar current page (misal 2 sebelum dan 2 sesudah)
              else if (Math.abs(page - currentPage) <= 2) {
                // Menampilkan 4, 5, [6], 7, 8
                shouldDisplay = true;
              }
              // Tampilkan '...' jika ada gap
              else if (
                (page === currentPage - 3 && page > 1) ||
                (page === currentPage + 3 && page < totalPages)
              ) {
                return (
                  <span className="ant-pagination-item-ellipsis">...</span>
                );
              }

              if (!shouldDisplay) {
                return null;
              }

              // Jika halaman harus ditampilkan, terapkan styling aktif jika perlu
              if (page === currentPage) {
                return (
                  <a
                    className="ant-pagination-item ant-pagination-item-active"
                    style={{
                      backgroundColor: "#1890ff", // Warna biru untuk aktif
                      borderColor: "#1890ff",
                      color: "#fff", // Teks putih
                      borderRadius: "2px",
                    }}
                  >
                    {page}
                  </a>
                );
              }

              // Untuk halaman non-aktif yang ditampilkan
              return originalElement;
            }}
          />
        </div>
      </Content>
    </Layout>
  );
};

export default PersonalIndicatorPage;
