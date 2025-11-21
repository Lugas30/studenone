"use client"; // Diperlukan jika menggunakan App Router di Next.js 13+

import React, { useState } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Row,
  Col,
  Breadcrumb,
  Dropdown,
  Menu,
  Pagination,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  CaretDownOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";

// --- I. Data Types (Interface) ---
export interface SubjectTeacherData {
  /** Nomor Induk Pegawai */
  NIP: string;
  /** Nama Guru */
  teacherName: string;
  /** Mata Pelajaran yang diajarkan */
  subjects: string;
  /** Daftar Kelas yang diajar */
  classList: string;
  /** Semester mengajar */
  semester: "Ganjil" | "Genap";
}

// --- II. Dummy Data ---
export const dummyData: SubjectTeacherData[] = [
  {
    NIP: "790841",
    teacherName: "Budi Santoso",
    subjects: "Matematika",
    classList: "P1A, P3A",
    semester: "Ganjil",
  },
  {
    NIP: "790842",
    teacherName: "Fatimah",
    subjects: "PKN",
    classList: "P3A, P4B, P4C",
    semester: "Genap",
  },
  {
    NIP: "798699",
    teacherName: "Fanny Seyawati",
    subjects: "Bahasa Indonesia",
    classList: "P2A, P3B, P3C, P3D",
    semester: "Ganjil",
  },
  {
    NIP: "790752",
    teacherName: "Edrick Candra",
    subjects: "Science",
    classList: "P1A, P3A",
    semester: "Genap",
  },
  {
    NIP: "790955",
    teacherName: "Yanti",
    subjects: "ICT",
    classList: "P1A, P3A",
    semester: "Ganjil",
  },
  {
    NIP: "790843",
    teacherName: "Dummy Yati",
    subjects: "PAI",
    classList: "P1A, P3A",
    semester: "Genap",
  },
  // Data dummy tambahan untuk simulasi
  {
    NIP: "790844",
    teacherName: "Ahmad Faisal",
    subjects: "Seni Budaya",
    classList: "P5A, P5B",
    semester: "Ganjil",
  },
  {
    NIP: "790845",
    teacherName: "Citra Dewi",
    subjects: "Bahasa Inggris",
    classList: "P1B, P2C",
    semester: "Genap",
  },
];

// --- III. Definisi Kolom Tabel ---
const columns: ColumnsType<SubjectTeacherData> = [
  {
    title: "NIP",
    dataIndex: "NIP",
    key: "NIP",
    sorter: (a, b) => a.NIP.localeCompare(b.NIP),
    width: 100,
  },
  {
    title: "Teacher Name",
    dataIndex: "teacherName",
    key: "teacherName",
    sorter: (a, b) => a.teacherName.localeCompare(b.teacherName),
  },
  {
    title: "Subjects",
    dataIndex: "subjects",
    key: "subjects",
    sorter: (a, b) => a.subjects.localeCompare(b.subjects),
  },
  {
    title: "Class List",
    dataIndex: "classList",
    key: "classList",
    sorter: (a, b) => a.classList.localeCompare(b.classList),
  },
  {
    title: "Semester",
    dataIndex: "semester",
    key: "semester",
    sorter: (a, b) => a.semester.localeCompare(b.semester),
    width: 100,
  },
  {
    title: "Actions",
    key: "actions",
    width: 150,
    render: (_, record) => (
      <Space size="middle">
        {/* Tombol View */}
        <Button
          type="text"
          icon={<EyeOutlined style={{ color: "#1890ff" }} />}
          onClick={() => console.log("View:", record.NIP)}
        />
        {/* Tombol Edit */}
        <Button
          type="text"
          icon={<EditOutlined style={{ color: "#1890ff" }} />}
          onClick={() => console.log("Edit:", record.NIP)}
        />
      </Space>
    ),
  },
];

// --- IV. Komponen Subject Teacher ---
const SubjectTeacherPage: React.FC = () => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(7); // Default ke halaman 7 sesuai gambar
  const totalPages = 50;
  const totalRecords = totalPages * pageSize; // Simulasi total 500 records

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const menu: MenuProps["items"] = [
    { key: "10", label: "10", onClick: () => setPageSize(10) },
    { key: "20", label: "20", onClick: () => setPageSize(20) },
    { key: "50", label: "50", onClick: () => setPageSize(50) },
  ];

  const pageRange = (current: number, total: number) => {
    const pages = [];
    if (total <= 10) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    // Logika untuk meniru tampilan: 1 ... 5 6 7 8 ... 50
    pages.push(1);

    if (current > 4) pages.push("...");

    const start = Math.max(2, current - 2);
    const end = Math.min(total - 1, current + 2);

    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== total) pages.push(i);
    }

    if (current < total - 3) pages.push("...");

    pages.push(total);

    // Filter duplikat dan pastikan urutan
    const uniquePages = Array.from(new Set(pages))
      .filter((p) => p !== "...")
      .sort((a: any, b: any) => a - b);

    const finalPages: (number | string)[] = [1];

    for (let i = 1; i < uniquePages.length; i++) {
      const prev = uniquePages[i - 1] as number;
      const curr = uniquePages[i] as number;
      if (curr - prev > 1) {
        finalPages.push("...");
      }
      finalPages.push(curr);
    }

    if (finalPages[finalPages.length - 1] !== total) {
      if (total - (finalPages[finalPages.length - 1] as number) > 1)
        finalPages.push("...");
      finalPages.push(total);
    }

    return Array.from(new Set(finalPages.map(String)));
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Header dan Breadcrumb */}
      <Breadcrumb style={{ marginBottom: "20px" }}>
        <Breadcrumb.Item>Home</Breadcrumb.Item>
        <Breadcrumb.Item>Subject Teacher</Breadcrumb.Item>
      </Breadcrumb>

      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: "20px" }}
      >
        <Col>
          <h1 style={{ margin: 0, fontSize: "30px", fontWeight: "bold" }}>
            Subject Teacher
          </h1>
        </Col>
        <Col>
          <span style={{ fontSize: "30px", fontWeight: "bold" }}>
            2024-2025
          </span>
        </Col>
      </Row>

      {/* --- Kontrol Atas (Search, Add Button, Download) --- */}
      <Row
        gutter={[16, 16]}
        justify="space-between"
        align="middle"
        style={{ marginBottom: "20px" }}
      >
        <Col xs={24} md={12} lg={8}>
          <Input
            placeholder="Search customer 100 records..."
            prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
            style={{ borderRadius: "6px" }}
          />
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              onClick={() => console.log("Add Subject Teacher")}
              style={{ fontWeight: "bold", borderRadius: "6px" }}
            >
              Add Subject Teacher
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => console.log("Download")}
              style={{ borderRadius: "6px" }}
            />
          </Space>
        </Col>
      </Row>

      {/* --- Tabel --- */}
      <div
        style={{
          border: "1px solid #f0f0f0",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <Table
          columns={columns}
          dataSource={dummyData}
          rowKey="NIP"
          pagination={false}
          scroll={{ x: "max-content" }}
        />
      </div>

      {/* --- Kontrol Bawah (Pagination) --- */}
      <Row justify="space-between" align="middle" style={{ marginTop: "20px" }}>
        <Col>
          <Space>
            {/* Dropdown Row per page */}
            <Space>
              <span>Row per page</span>
              <Dropdown
                overlay={
                  <Menu items={menu} selectedKeys={[String(pageSize)]} />
                }
                trigger={["click"]}
                placement="topCenter"
              >
                <Button style={{ padding: "0 8px" }}>
                  {pageSize} <CaretDownOutlined />
                </Button>
              </Dropdown>
            </Space>

            {/* Input Go to */}
            <Space>
              <span>Go to</span>
              <Input
                value={currentPage}
                onChange={(e) => {
                  const page = Number(e.target.value);
                  if (!isNaN(page) && page >= 1 && page <= totalPages) {
                    setCurrentPage(page);
                  }
                }}
                style={{ width: "50px", textAlign: "center" }}
              />
            </Space>
          </Space>
        </Col>

        {/* Pagination Kustom */}
        <Col>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalRecords}
            showSizeChanger={false}
            onChange={handlePageChange}
            style={{ marginLeft: "auto" }}
            // Menggunakan itemRender untuk mengontrol tampilan angka halaman
            itemRender={(page, type, originalElement) => {
              if (type === "page") {
                return (
                  <span
                    onClick={() => setCurrentPage(page)}
                    style={{
                      border:
                        page === currentPage
                          ? "1px solid #1890ff"
                          : "1px solid #d9d9d9",
                      color:
                        page === currentPage
                          ? "#1890ff"
                          : "rgba(0, 0, 0, 0.65)",
                      backgroundColor:
                        page === currentPage ? "#e6f7ff" : "white",
                      borderRadius: "4px",
                      padding: "0 8px",
                      cursor: "pointer",
                      margin: "0 4px",
                    }}
                  >
                    {page}
                  </span>
                );
              }
              if (type === "jump-prev" || type === "jump-next") {
                return <span style={{ padding: "0 4px" }}>...</span>;
              }
              return originalElement;
            }}
          />
        </Col>
      </Row>
    </div>
  );
};

export default SubjectTeacherPage;
