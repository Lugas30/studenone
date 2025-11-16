// app/(main)/academic-curriculum/predicate-kktp/page.tsx
"use client";

import React from "react";
import {
  Breadcrumb,
  Typography,
  Table,
  Input,
  Button,
  Space,
  Card,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

// --- DUMMY DATA ---

// 1. Predicate KKTP Data
interface KKTPData {
  key: string;
  predicate: string;
  descriptive: string;
  minValue: number;
  maxValue: number;
}
const kktpData: KKTPData[] = [
  { key: "1", predicate: "D", descriptive: "Fair", minValue: 0, maxValue: 70 },
  { key: "2", predicate: "C", descriptive: "Good", minValue: 71, maxValue: 80 },
  {
    key: "3",
    predicate: "B",
    descriptive: "Great",
    minValue: 81,
    maxValue: 90,
  },
  {
    key: "4",
    predicate: "A",
    descriptive: "Excellent",
    minValue: 91,
    maxValue: 100,
  },
];

// 2. Predicate KKTP Qurans Data
interface QuransData {
  key: string;
  predicate: string;
  descriptive: string;
  minValue: number;
  maxValue: number;
}
const quransData: QuransData[] = [
  {
    key: "1",
    predicate: "Dho'if",
    descriptive: "Dalam Perkembangan",
    minValue: 0,
    maxValue: 70,
  },
  {
    key: "2",
    predicate: "Maqbul",
    descriptive: "Cukup",
    minValue: 71,
    maxValue: 80,
  },
  {
    key: "3",
    predicate: "Jayyid",
    descriptive: "Baik",
    minValue: 81,
    maxValue: 90,
  },
  {
    key: "4",
    predicate: "Jayyid Jiddan",
    descriptive: "Sangat Baik",
    minValue: 91,
    maxValue: 99,
  },
  {
    key: "5",
    predicate: "Mumtaz",
    descriptive: "Sempurna",
    minValue: 100,
    maxValue: 100,
  },
];

// 3. Predicate Range PID Data
interface PIDData {
  key: string;
  predicate: string;
  descriptive: string;
}
const pidData: PIDData[] = [
  { key: "1", predicate: "T", descriptive: "Thorough" },
  { key: "2", predicate: "C", descriptive: "Complete" },
  { key: "3", predicate: "I", descriptive: "Inchoate" },
];

// --- DEFINISI KOLOM TABLE UMUM ---

const kktpColumns = [
  { title: "Predicate", dataIndex: "predicate", key: "predicate" },
  { title: "Descriptive", dataIndex: "descriptive", key: "descriptive" },
  { title: "Min Value", dataIndex: "minValue", key: "minValue" },
  { title: "Max Value", dataIndex: "maxValue", key: "maxValue" },
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

const pidColumns = [
  { title: "Predicate", dataIndex: "predicate", key: "predicate" },
  { title: "Descriptive", dataIndex: "descriptive", key: "descriptive" },
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

// --- Komponen Pembungkus Tabel (FIXED) ---
interface PredicateTableProps {
  title: string;
  data: any[];
  columns: any[];
}

const PredicateTable: React.FC<PredicateTableProps> = ({
  title,
  data,
  columns,
}) => (
  <Card
    title={
      <Title level={4} style={{ margin: 0 }}>
        {title}
      </Title>
    }
    style={{ marginBottom: "40px", padding: 0 }}
    // 👇 FIX: Mengganti bodyStyle dengan styles.body
    styles={{ body: { padding: 0 } }}
  >
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
      <Button type="primary" icon={<PlusOutlined />}>
        Add Predicate
      </Button>
    </div>
    <Table
      columns={columns}
      dataSource={data}
      pagination={false}
      size="large"
      style={{ border: "1px solid #f0f0f0", borderRadius: "4px" }}
    />
  </Card>
);

// --- Halaman Utama ---
const PredicateKKTPPage: React.FC = () => {
  return (
    <>
      {/* 1. Breadcrumb */}
      <Breadcrumb items={[{ title: "Home" }, { title: "Predicate KKTP" }]} />

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
          Predicate KKTP
        </Title>
        <Title level={3} style={{ color: "#888", margin: 0 }}>
          2024-2025
        </Title>
      </div>

      {/* 3. Predicate KKTP (Utama) */}
      <PredicateTable
        title="Predicate KKTP"
        data={kktpData}
        columns={kktpColumns}
      />

      {/* 4. Predicate KKTP Qurans */}
      <PredicateTable
        title="Predicate KKTP Qurans"
        data={quransData}
        columns={kktpColumns}
      />

      {/* 5. Predicate Range PID */}
      <PredicateTable
        title="Predicate Range PID"
        data={pidData}
        columns={pidColumns}
      />
    </>
  );
};

export default PredicateKKTPPage;
