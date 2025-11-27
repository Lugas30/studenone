"use client";

import React, { useState } from "react";
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Layout,
  ConfigProvider,
  Row,
  Col,
  Pagination,
} from "antd";
import {
  SearchOutlined,
  UploadOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { TableProps } from "antd";

const { Content } = Layout;
const { Title } = Typography;

// ====================================================================
// 1. INTERFACE DAN DUMMY DATA
// ====================================================================

interface StudentHealth {
  nis: string;
  fullName: string;
  gender: "P" | "L"; // P: Perempuan, L: Laki-laki
  height: number; // cm
  weight: number; // kg
  vision: string;
  hearing: string;
  dental: string;
  key: string; // Untuk kebutuhan Ant Design Table
}

const DUMMY_STUDENT_HEALTH_DATA: StudentHealth[] = [
  {
    key: "1",
    nis: "790841",
    fullName: "Aathirah Dhanesa Prayuda",
    gender: "P",
    height: 120,
    weight: 22,
    vision: "OD: 20/20, OS: 20/20",
    hearing: "Baik",
    dental: "Gigi Berlubang",
  },
  {
    key: "2",
    nis: "790842",
    fullName: "Abyan Mufid Shaquille",
    gender: "L",
    height: 118,
    weight: 21,
    vision: "OD: 20/20, OS: 20/20",
    hearing: "Baik",
    dental: "Baik",
  },
  {
    key: "3",
    nis: "796699",
    fullName: "Ahza Danendra Abdillah",
    gender: "L",
    height: 123,
    weight: 24,
    vision: "OD: 20/40, OS: 20/25",
    hearing: "Baik",
    dental: "Baik",
  },
  {
    key: "4",
    nis: "790752",
    fullName: "Akhtar Khairazky Subiyanto",
    gender: "L",
    height: 119,
    weight: 20,
    vision: "OD: 20/20, OS: 20/20",
    hearing: "Baik",
    dental: "Baik",
  },
  {
    key: "5",
    nis: "790955",
    fullName: "Aldebaran Kenan Arrazka",
    gender: "L",
    height: 125,
    weight: 25,
    vision: "OD: 20/30, OS: 20/25",
    hearing: "Baik",
    dental: "Baik",
  },
  {
    key: "6",
    nis: "790843",
    fullName: "Byanca Alesha El Iber",
    gender: "P",
    height: 117,
    weight: 19,
    vision: "OD: 20/30, OS: 20/25",
    hearing: "Baik",
    dental: "Baik",
  },
  // Tambahkan data lain untuk simulasi
];

// ====================================================================
// 2. KONFIGURASI KOLOM TABEL
// ====================================================================

const columns: TableProps<StudentHealth>["columns"] = [
  {
    title: "NIS",
    dataIndex: "nis",
    key: "nis",
    sorter: (a, b) => a.nis.localeCompare(b.nis),
    width: 100,
  },
  {
    title: "Full Name",
    dataIndex: "fullName",
    key: "fullName",
    sorter: (a, b) => a.fullName.localeCompare(b.fullName),
    width: 250,
  },
  {
    title: "Gender",
    dataIndex: "gender",
    key: "gender",
    width: 100,
  },
  {
    title: "Height",
    dataIndex: "height",
    key: "height",
    width: 100,
  },
  {
    title: "Weight",
    dataIndex: "weight",
    key: "weight",
    width: 100,
  },
  {
    title: "Vision",
    dataIndex: "vision",
    key: "vision",
    width: 180,
  },
  {
    title: "Hearing",
    dataIndex: "hearing",
    key: "hearing",
    width: 120,
  },
  {
    title: "Dental",
    dataIndex: "dental",
    key: "dental",
    width: 150,
  },
  {
    title: "Actions",
    key: "actions",
    fixed: "right",
    width: 100,
    render: (_, record) => (
      <Space size="small">
        <Button
          icon={<EyeOutlined />}
          shape="circle"
          size="small"
          title="View"
        />
        <Button
          icon={<EditOutlined />}
          shape="circle"
          size="small"
          title="Edit"
        />
      </Space>
    ),
  },
];

// ====================================================================
// 3. KOMPONEN UTAMA (StudentHealthPage)
// ====================================================================

const StudentHealthPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(6); // Menyesuaikan dengan state di gambar
  const [pageSize, setPageSize] = useState(10); // Menyesuaikan dengan state di gambar
  const totalRecords = 500; // Asumsi total data

  // Custom component untuk bagian pagination bawah
  const CustomPagination = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 16,
      }}
    >
      <Space>
        <div style={{ color: "rgba(0, 0, 0, 0.85)" }}>Row per page</div>
        <Select
          value={pageSize}
          onChange={(value) => setPageSize(value)}
          options={[
            { value: 10, label: "10" },
            { value: 20, label: "20" },
            { value: 50, label: "50" },
          ]}
          style={{ width: 70 }}
        />
        <div style={{ color: "rgba(0, 0, 0, 0.85)" }}>Go to</div>
        <Input
          defaultValue={6} // Nilai awal sesuai gambar
          style={{ width: 40, textAlign: "center" }}
          onPressEnter={(e: React.KeyboardEvent<HTMLInputElement>) => {
            const page = parseInt(e.currentTarget.value, 10);
            if (
              !isNaN(page) &&
              page > 0 &&
              page <= Math.ceil(totalRecords / pageSize)
            ) {
              setCurrentPage(page);
            }
          }}
        />
      </Space>
      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={totalRecords}
        showSizeChanger={false}
        onChange={(page) => setCurrentPage(page)}
      />
    </div>
  );

  return (
    // ConfigProvider untuk kustomisasi tema, khususnya tombol Mass Upload
    <ConfigProvider
      theme={{
        components: {
          Button: {
            colorPrimary: "#52c41a", // Warna hijau untuk Mass Upload
            colorPrimaryHover: "#73d13c",
            colorPrimaryActive: "#389e0d",
          },
        },
      }}
    >
      {/* Struktur Layout dan Padding */}
      <Layout style={{ padding: 24, background: "#fff" }}>
        {/* Breadcrumb dan Header */}
        <div style={{ color: "rgba(0, 0, 0, 0.45)", marginBottom: 8 }}>
          Home / Principal
        </div>
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 24 }}
        >
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Student Health Condition
            </Title>
          </Col>
          <Col>
            <Title
              level={2}
              style={{ margin: 0, color: "rgba(0, 0, 0, 0.65)" }}
            >
              2024-2025
            </Title>
          </Col>
        </Row>

        {/* Filter dan Mass Upload Section */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }} align="middle">
          <Col>
            <Input
              placeholder="Search customer 100 records..."
              prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
              style={{ width: 250 }}
            />
          </Col>
          <Col>
            <Select
              defaultValue="P2A"
              style={{ width: 150 }}
              placeholder="Select Homeroom"
              options={[{ value: "P2A", label: "P2A" }]}
            />
          </Col>
          <Col>
            <Select
              defaultValue="Triwulan 1"
              style={{ width: 150 }}
              placeholder="Periode"
              options={[{ value: "Triwulan 1", label: "Triwulan 1" }]}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}
            >
              Apply Filter
            </Button>
          </Col>
          <Col flex="auto" style={{ textAlign: "right" }}>
            {/* Button Mass Upload menggunakan colorPrimary dari ConfigProvider */}
            <Button type="primary" icon={<UploadOutlined />}>
              Mass Upload
            </Button>
          </Col>
        </Row>

        {/* Table Section */}
        <Content>
          <Table
            columns={columns}
            dataSource={DUMMY_STUDENT_HEALTH_DATA}
            pagination={false} // Matikan pagination bawaan Ant Design
            scroll={{ x: "max-content" }} // Agar responsif pada layar kecil
            bordered={false}
          />
          {CustomPagination} {/* Tampilkan pagination kustom */}
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default StudentHealthPage;
