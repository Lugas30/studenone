// app/(main)/master-data/subject/page.tsx
"use client";

import React, { useState } from "react";
import {
  Breadcrumb,
  Typography,
  Table,
  Input,
  Button,
  Space,
  Pagination,
  Switch,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  UploadOutlined,
  EyeOutlined, // Untuk ikon "View"
} from "@ant-design/icons";

const { Title } = Typography;

// --- DUMMY DATA ---
interface SubjectData {
  key: string;
  subjectCode: string;
  subject: string;
  category: string;
  grade: number;
  kkm: number;
  ganjilActive: boolean;
  genapActive: boolean;
}

// Data Dummy sesuai gambar
const dummyData: SubjectData[] = [
  {
    key: "1",
    subjectCode: "MP001",
    subject: "Matematika",
    category: "Kelompok A",
    grade: 1,
    kkm: 75,
    ganjilActive: true,
    genapActive: true,
  },
  {
    key: "2",
    subjectCode: "MP002",
    subject: "PKN",
    category: "Kelompok A",
    grade: 1,
    kkm: 78,
    ganjilActive: true,
    genapActive: true,
  },
  {
    key: "3",
    subjectCode: "MP003",
    subject: "Bahasa Indonesia",
    category: "Kelompok A",
    grade: 2,
    kkm: 75,
    ganjilActive: false,
    genapActive: false,
  },
  {
    key: "4",
    subjectCode: "MP006",
    subject: "Science",
    category: "Kelompok B",
    grade: 2,
    kkm: 70,
    ganjilActive: false,
    genapActive: false,
  },
  {
    key: "5",
    subjectCode: "MP007",
    subject: "English",
    category: "Kelompok B",
    grade: 3,
    kkm: 72,
    ganjilActive: true,
    genapActive: false,
  },
];

// --- DEFINISI KOLOM TABLE ---
const columns = [
  {
    title: "Subject Code",
    dataIndex: "subjectCode",
    key: "subjectCode",
    sorter: (a: SubjectData, b: SubjectData) =>
      a.subjectCode.localeCompare(b.subjectCode),
  },
  {
    title: "Subject",
    dataIndex: "subject",
    key: "subject",
    sorter: (a: SubjectData, b: SubjectData) =>
      a.subject.localeCompare(b.subject),
  },
  {
    title: "Category",
    dataIndex: "category",
    key: "category",
  },
  {
    title: "Grade",
    dataIndex: "grade",
    key: "grade",
    sorter: (a: SubjectData, b: SubjectData) => a.grade - b.grade,
  },
  {
    title: "KKM",
    dataIndex: "kkm",
    key: "kkm",
    sorter: (a: SubjectData, b: SubjectData) => a.kkm - b.kkm,
  },
  {
    title: "Ganjil",
    dataIndex: "ganjilActive",
    key: "ganjilActive",
    render: (active: boolean) => <Switch checked={active} />,
  },
  {
    title: "Genap",
    dataIndex: "genapActive",
    key: "genapActive",
    render: (active: boolean) => <Switch checked={active} />,
  },
  {
    title: "Actions",
    key: "actions",
    render: () => (
      <Space size="middle">
        <Button
          type="text"
          icon={<EyeOutlined style={{ color: "#1890ff" }} />}
        />
        <Button
          type="text"
          icon={<EditOutlined style={{ color: "#1890ff" }} />}
        />
      </Space>
    ),
  },
];

const SubjectPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(6); // Default ke halaman 6, seperti di gambar
  const totalRecords = 500; // Total record untuk simulasi pagination
  const pageSize = 10;

  return (
    <>
      {/* 1. Breadcrumb */}
      <Breadcrumb items={[{ title: "Home" }, { title: "Subject" }]} />

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
          Subject
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
          <Button
            type="primary"
            icon={<UploadOutlined />}
            style={{ background: "#52c41a", borderColor: "#52c41a" }}
          >
            Mass Upload
          </Button>
          <Button type="primary" icon={<PlusOutlined />}>
            Add Subject
          </Button>
          <Button icon={<DownloadOutlined />} />
        </Space>
      </div>

      {/* 4. Table */}
      <Table
        columns={columns}
        dataSource={dummyData}
        pagination={false} // Matikan pagination bawaan Antd
        size="large"
        style={{ border: "1px solid #f0f0f0", borderRadius: "4px" }}
      />

      {/* 5. Pagination & Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "16px",
        }}
      >
        {/* Row per page & Go to */}
        <Space>
          <span>Row per page</span>
          {/* Menggunakan Input dengan ikon dropdown untuk simulasi Select */}
          <Input
            defaultValue="10"
            style={{ width: 60, textAlign: "center" }}
            suffix={<div style={{ marginRight: "-8px" }}>▼</div>}
          />
          <span>Go to</span>
          <Input
            defaultValue={currentPage}
            style={{ width: 50, textAlign: "center" }}
          />
        </Space>

        {/* Pagination */}
        <Pagination
          defaultCurrent={1}
          current={currentPage}
          onChange={setCurrentPage}
          total={totalRecords}
          pageSize={pageSize}
          showSizeChanger={false}
        />
      </div>
    </>
  );
};

export default SubjectPage;
