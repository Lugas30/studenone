// RoleAssignmentPage.tsx

"use client";

import React, { useState } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Row,
  Col,
  Layout,
  Breadcrumb,
  Select,
  Pagination,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import {
  SearchOutlined,
  UploadOutlined,
  UserAddOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined, // Tambahan ikon untuk download/aksi lain
} from "@ant-design/icons";

const { Content } = Layout;
const { Option } = Select;

// --- 1. Struktur Data & Data Dummy ---

/**
 * Interface untuk mendefinisikan struktur data Role Assignment.
 */
interface RoleAssignment {
  nip: string;
  teacherName: string;
  gender: "L" | "P"; // Laki-laki atau Perempuan
  role: string;
}

/**
 * Data Dummy yang identik dengan gambar.
 */
const DUMMY_ROLE_ASSIGNMENTS: RoleAssignment[] = [
  {
    nip: "790841",
    teacherName: "Budi Santoso",
    gender: "L",
    role: "Homeroom Teacher, Subject Teacher",
  },
  {
    nip: "790842",
    teacherName: "Andi Wijaya",
    gender: "L",
    role: "Homeroom Teacher",
  },
  {
    nip: "796699",
    teacherName: "Rani Wulandari",
    gender: "P",
    role: "Homeroom Teacher",
  },
  {
    nip: "790752",
    teacherName: "Dedi Kurniawan",
    gender: "L",
    role: "Subject Teacher, Homeroom Assistant",
  },
  {
    nip: "790955",
    teacherName: "Indah Permata",
    gender: "P",
    role: "Qurans Teacher",
  },
  {
    nip: "790843",
    teacherName: "Nurhayati",
    gender: "P",
    role: "Vice Principal",
  },
  {
    nip: "790844",
    teacherName: "Rizal Hakim",
    gender: "L",
    role: "Subject Teacher, Co Excul",
  },
  {
    nip: "790845",
    teacherName: "Fanny Ghaisani",
    gender: "P",
    role: "Subject Teacher",
  },
  // Tambahkan data dummy tambahan agar pagination terlihat (total 50 item)
  ...Array.from({ length: 42 }, (_, i) => ({
    nip: `7910${(i + 10).toString().padStart(2, "0")}`,
    teacherName: `Guru Test ${i + 10}`,
    gender: i % 2 === 0 ? ("L" as "L") : ("P" as "P"),
    role: i % 3 === 0 ? "Subject Teacher" : "Homeroom Assistant",
  })),
];

// --- 2. Definisi Kolom Tabel ---

// Fungsi handler sederhana untuk aksi
const handleAction = (action: string, record: RoleAssignment) => {
  console.log(
    `${action}ing teacher: ${record.teacherName} (NIP: ${record.nip})`
  );
  alert(`Action: ${action} - ${record.teacherName}`);
};

const columns: ColumnsType<RoleAssignment> = [
  {
    title: "NIP",
    dataIndex: "nip",
    key: "nip",
    sorter: (a, b) => a.nip.localeCompare(b.nip),
    width: 120,
  },
  {
    title: "Teacher Name",
    dataIndex: "teacherName",
    key: "teacherName",
    sorter: (a, b) => a.teacherName.localeCompare(b.teacherName),
  },
  {
    title: "Gender",
    dataIndex: "gender",
    key: "gender",
    width: 100,
    sorter: (a, b) => a.gender.localeCompare(b.gender),
  },
  {
    title: "Role",
    dataIndex: "role",
    key: "role",
  },
  {
    title: "Actions",
    key: "actions",
    width: 120,
    render: (_, record) => (
      <Space size="middle">
        {/* Ikon Mata (View) */}
        <Button
          icon={<EyeOutlined />}
          onClick={() => handleAction("View", record)}
          type="text"
          style={{ color: "#1890ff", padding: "0 4px" }}
        />
        {/* Ikon Pensil (Edit) */}
        <Button
          icon={<EditOutlined />}
          onClick={() => handleAction("Edit", record)}
          type="text"
          style={{ color: "#faad14", padding: "0 4px" }}
        />
        {/* Ikon Sampah (Delete) */}
        <Button
          icon={<DeleteOutlined />}
          onClick={() => handleAction("Delete", record)}
          type="text"
          style={{ color: "#ff4d4f", padding: "0 4px" }}
        />
      </Space>
    ),
  },
];

// --- 3. Komponen Utama Halaman ---

export default function RoleAssignmentPage() {
  const [currentPage, setCurrentPage] = useState(6); // Set default ke halaman 6 seperti di gambar
  const [pageSize, setPageSize] = useState(10);
  const totalItems = DUMMY_ROLE_ASSIGNMENTS.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Hitung data yang ditampilkan berdasarkan pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = DUMMY_ROLE_ASSIGNMENTS.slice(startIndex, endIndex);

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // Sembunyikan pagination bawaan Table Ant Design
  const customPaginationConfig: TablePaginationConfig = {
    style: { display: "none" },
  };

  return (
    <Layout style={{ padding: "0 24px 24px", background: "#fff" }}>
      {/* 3.1. Header Halaman */}
      <div style={{ padding: "16px 0 24px 0" }}>
        <Breadcrumb items={[{ title: "Home" }, { title: "Role" }]} />
        <Row justify="space-between" align="middle" style={{ marginTop: 10 }}>
          <Col>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 500 }}>
              Role Assignment
            </h1>
          </Col>
          <Col>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 500 }}>
              2024-2025
            </h1>
          </Col>
        </Row>
      </div>

      <Content>
        {/* 3.2. Search dan Action Buttons */}
        <Row
          gutter={16}
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          {/* Search Input */}
          <Col flex="300px">
            <Input
              prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
              placeholder="Search NIP or Name"
              style={{ width: "100%" }}
            />
          </Col>

          {/* Action Buttons */}
          <Col>
            <Space>
              <Button
                type="primary"
                style={{ backgroundColor: "#28a745", borderColor: "#28a745" }}
                icon={<UploadOutlined />}
              >
                Mass Upload
              </Button>
              <Button type="primary" icon={<UserAddOutlined />}>
                Add Teacher
              </Button>
              <Button icon={<DownloadOutlined />} /> {/* Ikon untuk download */}
            </Space>
          </Col>
        </Row>

        {/* 3.3. Tabel Data */}
        <Table
          columns={columns}
          dataSource={paginatedData}
          rowKey="nip"
          pagination={customPaginationConfig} // Menggunakan konfigurasi tersembunyi
          size="middle"
          // Style untuk menghilangkan garis tabel jika diperlukan
          style={{ border: "1px solid #f0f0f0", borderBottom: "none" }}
        />

        {/* 3.4. Custom Footer/Pagination Bawah */}
        <Row
          justify="space-between"
          align="middle"
          style={{
            padding: "8px 0",
            borderTop: "1px solid #f0f0f0",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          {/* Pengaturan Baris per Halaman & Go To */}
          <Col>
            <Space>
              <span style={{ color: "rgba(0,0,0,0.65)" }}>Row per page</span>
              <Select
                value={pageSize}
                onChange={(value: number) => handlePageChange(1, value)}
                style={{ width: 70 }}
                size="small"
              >
                <Option value={10}>10</Option>
                <Option value={20}>20</Option>
                <Option value={50}>50</Option>
              </Select>
              <span style={{ color: "rgba(0,0,0,0.65)", marginLeft: 16 }}>
                Go to
              </span>
              <Input
                type="number"
                value={currentPage}
                min={1}
                max={totalPages}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 1 && val <= totalPages) {
                    setCurrentPage(val);
                  }
                }}
                style={{ width: 50, textAlign: "center" }}
                size="small"
              />
            </Space>
          </Col>

          {/* Komponen Pagination Ant Design */}
          <Col>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalItems}
              onChange={handlePageChange}
              showSizeChanger={false}
              size="small"
              // Pengaturan gaya untuk menyorot halaman 6
              itemRender={(page, type, originalElement) => {
                if (type === "page") {
                  const isCurrent = page === currentPage;
                  return (
                    <span
                      style={{
                        padding: "0 8px",
                        border: isCurrent
                          ? "1px solid #1890ff"
                          : "1px solid #d9d9d9",
                        borderRadius: "2px",
                        backgroundColor: isCurrent ? "#e6f7ff" : "#fff",
                        color: isCurrent ? "#1890ff" : "rgba(0,0,0,0.85)",
                        cursor: "pointer",
                        display: "inline-block",
                      }}
                      onClick={() => handlePageChange(page, pageSize)}
                    >
                      {page}
                    </span>
                  );
                }
                return originalElement;
              }}
            />
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
