"use client";

// src/pages/KnowledgeSkillPage.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Row,
  Col,
  Space,
  Typography,
  Pagination,
  Spin,
  Empty,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Pastikan path import ini benar
import KnowledgeSkillFormModal from "../../components/KnowledgeSkillFormModal";

const { Title, Text } = Typography;
const { Search } = Input;

// --- Definisi Tipe Data ---

interface Subject {
  name: string;
}

interface IndicatorData {
  id: number;
  subject_id: number; // Tambahkan subject_id untuk modal edit
  teacher: string;
  grade: number;
  knowledge: string;
  skill: string;
  subject: Subject;
  key: string;
}

interface ApiResponse {
  academicYear: string;
  semester: string;
  data: IndicatorData[];
}

interface InitialFormData {
  id?: number;
  subject_id: number;
  grade: number;
  knowledge: string;
  skill: string;
}

// --- Konfigurasi ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const INDICATOR_ENDPOINT = "/indicator-knowledge-skill";
const gradeOptions = [1, 2, 3, 4, 5, 6].map((grade) => ({
  value: grade,
  label: `Grade ${grade}`,
}));

// --- Komponen Halaman Utama ---

const KnowledgeSkillPage: React.FC = () => {
  const [data, setData] = useState<IndicatorData[]>([]);
  const [academicInfo, setAcademicInfo] = useState<{
    year: string;
    semester: string;
  } | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(false);

  // State untuk Modal Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<InitialFormData | undefined>(
    undefined
  );

  // --- Fetch Data ---
  const fetchDataByGrade = useCallback(async (grade: number) => {
    if (!API_BASE_URL) {
      toast.error("API Base URL tidak ditemukan di .env!");
      return;
    }

    setLoading(true);
    setData([]);

    try {
      const response = await axios.get<ApiResponse>(
        `${API_BASE_URL}${INDICATOR_ENDPOINT}/grade/${grade}`
      );

      const apiData = response.data;

      const mappedData: IndicatorData[] = apiData.data.map((item) => ({
        ...item,
        key: item.id.toString(),
      }));

      setData(mappedData);
      setAcademicInfo({
        year: apiData.academicYear,
        semester: apiData.semester,
      });
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      toast.error("Gagal memuat data dari server.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect untuk memuat data saat grade berubah
  useEffect(() => {
    fetchDataByGrade(selectedGrade);
  }, [fetchDataByGrade, selectedGrade]);

  // --- Modal Handlers ---

  const handleGradeChange = (value: number) => {
    setSelectedGrade(value);
  };

  const handleAdd = () => {
    setEditData(undefined); // Reset ke mode Add
    setIsModalOpen(true);
  };

  const handleEdit = (record: IndicatorData) => {
    // Set data yang akan diedit
    setEditData({
      id: record.id,
      subject_id: record.subject_id,
      grade: record.grade,
      knowledge: record.knowledge,
      skill: record.skill,
    });
    setIsModalOpen(true);
  };

  const handleView = (id: number) => {
    console.log(`Melihat detail ID: ${id}`);
    toast.info(`Melihat detail ID: ${id}`);
  };

  const handleModalSuccess = (mode: "add" | "edit") => {
    // Muat ulang data tabel setelah Add/Edit sukses
    fetchDataByGrade(selectedGrade);
  };

  // --- Konfigurasi Kolom Tabel ---
  const columns = [
    {
      title: "Subject",
      dataIndex: ["subject", "name"],
      key: "subject",
      sorter: (a: IndicatorData, b: IndicatorData) =>
        a.subject.name.localeCompare(b.subject.name),
      render: (text: string) => text || "-",
    },
    {
      title: "Teacher",
      dataIndex: "teacher",
      key: "teacher",
      sorter: (a: IndicatorData, b: IndicatorData) =>
        a.teacher.localeCompare(b.teacher),
    },
    {
      title: "Knowledge",
      dataIndex: "knowledge",
      key: "knowledge",
      ellipsis: true,
      render: (text: string) => text || "-",
    },
    {
      title: "Skill",
      dataIndex: "skill",
      key: "skill",
      ellipsis: true,
      render: (text: string) => text || "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (text: string, record: IndicatorData) => (
        <Space size="middle">
          {/* Icon Edit (Pensil) */}
          <Button
            icon={<EditOutlined style={{ color: "#1890ff" }} />}
            onClick={() => handleEdit(record)} // Memanggil handler Edit
            type="text"
          />
          {/* Icon View (Mata) */}
          <Button
            icon={<EyeOutlined style={{ color: "#1890ff" }} />}
            onClick={() => handleView(record.id)}
            type="text"
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* Toastify Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Header Utama */}
      <Text type="secondary">Home / Indicator Input</Text>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginTop: "4px", marginBottom: "16px" }}
      >
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Knowledge & Skill
          </Title>
        </Col>
        <Col>
          <Text style={{ fontSize: "24px", fontWeight: "bold" }}>
            {academicInfo
              ? `${academicInfo.year} (${academicInfo.semester})`
              : "Memuat..."}
          </Text>
        </Col>
      </Row>

      {/* Control Bar (Search, Grade, Add Button) */}
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: "20px" }}>
        <Col flex="auto">
          <Input
            placeholder="Search customer 100 records..."
            prefix={<SearchOutlined />}
            style={{ maxWidth: 300 }}
          />
        </Col>
        <Col>
          <Space>
            {/* Dropdown Grade */}
            <Select
              value={selectedGrade}
              style={{ width: 120 }}
              onChange={handleGradeChange}
              options={gradeOptions}
              disabled={loading}
            />
            {/* Button Add */}
            <Button
              type="primary"
              onClick={handleAdd}
              style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}
            >
              + Add Knowledge & Skill
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Tabel Data */}
      <div style={{ border: "1px solid #f0f0f0", borderRadius: "2px" }}>
        <Spin
          spinning={loading}
          indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
          tip="Memuat data..."
        >
          <Table
            columns={columns}
            dataSource={data}
            pagination={false}
            size="middle"
          />
        </Spin>
      </div>

      {/* Pagination Bar */}
      <Row justify="start" style={{ marginTop: "16px" }}>
        <Pagination
          defaultCurrent={1}
          total={data.length > 0 ? data.length * 10 : 50}
          pageSize={10}
          showSizeChanger={false}
          style={{ padding: "8px 0" }}
        />
      </Row>

      {/* Komponen Modal Add/Edit */}
      <KnowledgeSkillFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        activeGrade={selectedGrade}
        initialData={editData}
      />
    </div>
  );
};

export default KnowledgeSkillPage;
