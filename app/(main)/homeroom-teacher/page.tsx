// src/app/homeroom-teacher/page.tsx

"use client";

import React from "react";
import {
  Layout,
  Typography,
  Row,
  Col,
  Input,
  Select,
  Button,
  Table,
  Space,
  Menu,
  Dropdown,
  Pagination,
  Divider, // Ditambahkan untuk garis pemisah
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DownOutlined,
} from "@ant-design/icons";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// --- 1. DATA DUMMY & INTERFACE ---
export interface HomeroomTeacherRecord {
  key: string;
  grade: number;
  class: string;
  className: string;
  teacher: string;
  coTeacher: string;
  semester: "Ganjil" | "Genap";
}

export const homeroomTeacherData: HomeroomTeacherRecord[] = [
  // Data dummy tetap sama
  {
    key: "1",
    grade: 1,
    class: "P1A",
    className: "Abdullah Bin Muhammad",
    teacher: "Budi Santoso",
    coTeacher: "Ahmad Saputra",
    semester: "Ganjil",
  },
  {
    key: "2",
    grade: 1,
    class: "P1B",
    className: "Abdullah Bin Muhammad",
    teacher: "Fatimah",
    coTeacher: "Ahmad Saputra",
    semester: "Genap",
  },
  {
    key: "3",
    grade: 1,
    class: "P1C",
    className: "Aminah binti Wahb",
    teacher: "Fanny Setyawati",
    coTeacher: "Aulia Rahman",
    semester: "Ganjil",
  },
  {
    key: "4",
    grade: 2,
    class: "P2A",
    className: "Aminah binti Wahb",
    teacher: "—",
    coTeacher: "—",
    semester: "Genap",
  },
  {
    key: "5",
    grade: 2,
    class: "P2B",
    className: "Hamzah bin Abdul Muttalib",
    teacher: "Dummy Yati",
    coTeacher: "Siti Aminah",
    semester: "Ganjil",
  },
  {
    key: "6",
    grade: 2,
    class: "P2C",
    className: "Hamzah bin Abdul Muttalib",
    teacher: "—",
    coTeacher: "—",
    semester: "Genap",
  },
];

// --- 2. KONFIGURASI KOLOM TABEL ---
const columns = [
  // Kolom-kolom tetap sama
  {
    title: "Grade",
    dataIndex: "grade",
    key: "grade",
    sorter: (a: HomeroomTeacherRecord, b: HomeroomTeacherRecord) =>
      a.grade - b.grade,
    width: 80,
  },
  { title: "Class", dataIndex: "class", key: "class", width: 80 },
  { title: "Class Name", dataIndex: "className", key: "className", width: 200 },
  { title: "Teacher", dataIndex: "teacher", key: "teacher", width: 150 },
  { title: "Co-Teacher", dataIndex: "coTeacher", key: "coTeacher", width: 150 },
  {
    title: "Semester",
    dataIndex: "semester",
    key: "semester",
    sorter: (a: HomeroomTeacherRecord, b: HomeroomTeacherRecord) =>
      a.semester.localeCompare(b.semester),
    width: 100,
  },
  {
    title: "Actions",
    key: "actions",
    width: 80,
    render: (_: any, record: HomeroomTeacherRecord) => (
      <Space size="middle">
        {/* Ikon Aksi (View & Edit) */}
        <Button
          icon={<EyeOutlined />}
          type="text"
          onClick={() => console.log("View:", record.key)}
        />
        <Button
          icon={<EditOutlined />}
          type="text"
          onClick={() => console.log("Edit:", record.key)}
        />
      </Space>
    ),
  },
];

const assignmentMenu = (
  <Menu>
    <Menu.Item key="1">Assign Homeroom Teacher</Menu.Item>
    <Menu.Item key="2">Bulk Assign</Menu.Item>
  </Menu>
);

// --- 3. KOMPONEN HALAMAN UTAMA ---
const HomeroomTeacherPage: React.FC = () => {
  const totalRecords = 50 * 10;
  const pageSize = 10;
  const currentPage = 6;

  return (
    <Layout
      style={{
        padding: "24px 24px 0 24px",
        background: "#fff",
        minHeight: "100vh",
      }}
    >
      {/* 🚀 HEADER SECTION (Path & Title) */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 10 }}>
        <Col>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Home / Subject Teacher
          </Text>
          <Title level={2} style={{ margin: "0 0 5px 0", fontWeight: 600 }}>
            Homeroom Teacher
          </Title>
        </Col>
        <Col>
          <Title
            level={2}
            style={{ margin: 0, fontWeight: 400, color: "#333" }}
          >
            2024-2025
          </Title>
        </Col>
      </Row>

      <Divider style={{ margin: "10px 0 20px 0" }} />

      {/* 🔍 FILTER & ACTIONS SECTION */}
      <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 20 }}>
        {/* Search Input */}
        <Col>
          <Input
            placeholder="Search customer 100 records..."
            prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
            style={{ width: 300 }}
          />
        </Col>

        {/* Grade Filter */}
        <Col>
          <Select defaultValue="all" style={{ width: 120 }} placeholder="Grade">
            <Option value="all">Grade</Option>
            <Option value="1">1</Option>
            <Option value="2">2</Option>
          </Select>
        </Col>

        {/* Semester Filter */}
        <Col>
          <Select
            defaultValue="all"
            style={{ width: 120 }}
            placeholder="Semester"
          >
            <Option value="all">Semester</Option>
            <Option value="Ganjil">Ganjil</Option>
            <Option value="Genap">Genap</Option>
          </Select>
        </Col>

        {/* Sisa ruang kosong untuk filter lainnya */}
        <Col flex="auto" />

        {/* Download Button */}
        <Col>
          <Button icon={<DownloadOutlined />} />
        </Col>

        {/* Assignment Dropdown Button */}
        <Col>
          <Dropdown overlay={assignmentMenu} placement="bottomRight">
            <Button type="primary">
              Assignment <DownOutlined />
            </Button>
          </Dropdown>
        </Col>
      </Row>

      {/* 📊 TABLE SECTION */}
      <Content>
        <Table
          columns={columns}
          dataSource={homeroomTeacherData}
          pagination={false} // Matikan pagination bawaan
          bordered={false}
          scroll={{ x: "max-content" }}
        />
      </Content>

      {/* 👣 CUSTOM PAGINATION FOOTER */}
      <Row
        justify="space-between"
        align="middle"
        style={{
          marginTop: 16,
          padding: "10px 0",
          borderTop: "1px solid #f0f0f0", // Tambahkan garis pemisah ringan
        }}
      >
        {/* Kiri: Row per page & Go to */}
        <Col>
          <Space size="middle">
            <Space>
              <Text type="secondary">Row per page</Text>
              <Select defaultValue="10" style={{ width: 70 }} size="small">
                <Option value="10">10</Option>
                <Option value="20">20</Option>
                <Option value="50">50</Option>
              </Select>
            </Space>
            <Space>
              <Text type="secondary">Go to</Text>
              <Input defaultValue="9" style={{ width: 50 }} size="small" />
            </Space>
          </Space>
        </Col>

        {/* Kanan: Pagination (Menyerupai tampilan Simple Pagination) */}
        <Col>
          <Pagination
            simple // Menggunakan mode simple
            current={currentPage}
            total={totalRecords}
            pageSize={pageSize}
            // Hapus showTotal untuk menghindari error TS2322
            onChange={(page) => console.log("Page change:", page)}
            // itemRender kustom untuk menampilkan halaman pertama/terakhir dan ellipsis
            itemRender={(page, type, originalElement) => {
              if (type === "page") {
                // Halaman 1, 4, 5, 6, 7, 8, 50 (sebagai contoh visualisasi)
                const pagesToShow = [1, 4, 5, 6, 7, 8, 50];
                if (pagesToShow.includes(page)) {
                  return originalElement;
                }
                // Tampilkan ellipsis setelah halaman 1 dan sebelum halaman 50
                if (page === 2 || page === totalRecords / pageSize - 1)
                  return <span style={{ padding: "0 8px" }}>...</span>;
                return null;
              }
              return originalElement;
            }}
          />
        </Col>
      </Row>
    </Layout>
  );
};

export default HomeroomTeacherPage;
