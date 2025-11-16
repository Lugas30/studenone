// app/(main)/academic-curriculum/extracurricular/page.tsx
"use client";

import React from "react";
import {
  Breadcrumb,
  Typography,
  Table,
  Input,
  Button,
  Space,
  Switch,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined, // Untuk ikon "View"
} from "@ant-design/icons";

const { Title } = Typography;

// --- DUMMY DATA ---
interface ExtracurricularData {
  key: string;
  extracurricular: string;
  vendor: string;
  pic: string;
  contact: string;
  type: "Internal" | "External";
  status: boolean;
}

const dummyData: ExtracurricularData[] = [
  {
    key: "1",
    extracurricular: "Dance",
    vendor: "Dancer Indo",
    pic: "Indra Wijaya",
    contact: "085763242287",
    type: "External",
    status: true,
  },
  {
    key: "2",
    extracurricular: "Futsal",
    vendor: "PT Futsal Cup",
    pic: "Bagus Bhakti",
    contact: "097548382217",
    type: "Internal",
    status: true,
  },
  {
    key: "3",
    extracurricular: "Pencak Silat",
    vendor: "Satria Muda Indonesia",
    pic: "Dimas Eka",
    contact: "097548383324",
    type: "External",
    status: false,
  },
  {
    key: "4",
    extracurricular: "Pramuka",
    vendor: "DKR Parung",
    pic: "Endi",
    contact: "085763212323",
    type: "Internal",
    status: false,
  },
];

// --- DEFINISI KOLOM TABLE ---
const columns = [
  {
    title: "Extracurricular",
    dataIndex: "extracurricular",
    key: "extracurricular",
    sorter: (a: ExtracurricularData, b: ExtracurricularData) =>
      a.extracurricular.localeCompare(b.extracurricular),
  },
  {
    title: "Vendor",
    dataIndex: "vendor",
    key: "vendor",
  },
  {
    title: "PIC",
    dataIndex: "pic",
    key: "pic",
  },
  {
    title: "Contact",
    dataIndex: "contact",
    key: "contact",
  },
  {
    title: "Type",
    dataIndex: "type",
    key: "type",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (active: boolean) => <Switch checked={active} />,
  },
  {
    title: "Actions",
    key: "actions",
    render: () => (
      <Space size="middle">
        <Button
          type="text"
          icon={<EyeOutlined style={{ color: "#8c8c8c" }} />}
        />
        <Button
          type="text"
          icon={<EditOutlined style={{ color: "#1890ff" }} />}
        />
      </Space>
    ),
  },
];

const ExtracurricularPage: React.FC = () => {
  // Karena gambar tidak menampilkan pagination, kita tidak akan mengaturnya di sini
  // tetapi Anda bisa menambahkannya jika diperlukan.

  return (
    <>
      {/* 1. Breadcrumb */}
      <Breadcrumb
        items={[
          { title: "Home" },
          { title: "Student List" }, // Mengikuti teks breadcrumb di gambar
        ]}
      />

      {/* 2. Title dan Tahun Akademik */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "16px 0 24px 0",
        }}
      >
        <Title level={1} style={{ margin: 0 }}>
          Extracurricular
        </Title>
        <Title level={3} style={{ color: "#888", margin: 0 }}>
          2024-2025
        </Title>
      </div>

      {/* 3. Toolbar: Search & Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <Input
          placeholder="Search customer 100 records..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
        <Space>
          <Button type="primary" icon={<PlusOutlined />}>
            Add Extracurricular
          </Button>
          <Button icon={<DownloadOutlined />} />
        </Space>
      </div>

      {/* 4. Table */}
      <Table
        columns={columns}
        dataSource={dummyData}
        pagination={false} // Tidak ada pagination yang terlihat di gambar
        size="large"
        style={{ border: "1px solid #f0f0f0", borderRadius: "4px" }}
      />
    </>
  );
};

export default ExtracurricularPage;
