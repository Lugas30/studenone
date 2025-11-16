// app/(main)/master-data/grade-classroom/page.tsx
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
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  UploadOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

// --- DUMMY DATA ---
interface ClassroomData {
  key: string;
  grade: number;
  sections: string;
  classroomName: string;
  code: string;
}

const dummyData: ClassroomData[] = [
  {
    key: "1",
    grade: 1,
    sections: "A",
    classroomName: "Abdullah Bin Muhammad",
    code: "P1A",
  },
  {
    key: "2",
    grade: 1,
    sections: "B",
    classroomName: "Aminah binti Wahb",
    code: "P1B",
  },
  {
    key: "3",
    grade: 2,
    sections: "A",
    classroomName: "Hamzah bin Abdul Muttalib",
    code: "P2A",
  },
  {
    key: "4",
    grade: 2,
    sections: "A",
    classroomName: "Hamzah bin Abdul Muttalib",
    code: "P2A", // Contoh duplikasi di data dummy
  },
  {
    key: "5",
    grade: 3,
    sections: "B",
    classroomName: "Ali bin Abi Thalib",
    code: "P3B",
  },
];

// --- DEFINISI KOLOM TABLE ---
const columns = [
  {
    title: "Grade",
    dataIndex: "grade",
    key: "grade",
    sorter: (a: ClassroomData, b: ClassroomData) => a.grade - b.grade,
  },
  {
    title: "Sections",
    dataIndex: "sections",
    key: "sections",
  },
  {
    title: "Classroom Name",
    dataIndex: "classroomName",
    key: "classroomName",
    sorter: (a: ClassroomData, b: ClassroomData) =>
      a.classroomName.localeCompare(b.classroomName),
  },
  {
    title: "Code",
    dataIndex: "code",
    key: "code",
  },
  {
    title: "Actions",
    key: "actions",
    render: () => (
      <Button
        type="text"
        icon={<EditOutlined style={{ color: "#1890ff" }} />}
      />
    ),
  },
];

const GradeClassroomPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(6); // Default ke halaman 6, seperti di gambar
  const totalRecords = 500; // Asumsi ada 500 total record seperti di pagination
  const pageSize = 10;

  return (
    <>
      {/* 1. Breadcrumb */}
      <Breadcrumb items={[{ title: "Home" }, { title: "Grade & Classroom" }]} />

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
          Grade & Classroom
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
            Add Classroom
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
          <Input defaultValue="10" style={{ width: 60, textAlign: "center" }} />
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

export default GradeClassroomPage;
