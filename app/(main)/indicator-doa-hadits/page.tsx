// src/app/indicator-input/doa-hadits/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Button,
  Select,
  Table,
  Space,
  Row,
  Col,
  Breadcrumb,
  Card,
  Modal,
  Form,
  Input,
  message,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const { Title, Text } = Typography;

// ===========================================
// 0. KONSTANTA DAN UTILITAS
// ===========================================

// Mendefinisikan Base URL dari .env
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Tipe data untuk item Doa/Hadits (sesuai struktur 'data' dari API)
export type IndicatorItem = {
  id: number;
  academic_year_id: number;
  grade: number;
  indicator: string;
  semester: string;
  created_at: string;
  updated_at: string;
  academic_year: {
    id: number;
    year: string;
    is_ganjil: boolean;
    is_genap: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
};

export type GradeString =
  | "Grade 1"
  | "Grade 2"
  | "Grade 3"
  | "Grade 4"
  | "Grade 5"
  | "Grade 6";

export const gradeOptions: GradeString[] = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
];

export const defaultGrade: GradeString = "Grade 1";
export const defaultSemester: string = "2024-2025 (Ganjil)";

// Fungsi helper untuk konversi 'Grade 1' ke angka 1
const gradeToNumber = (grade: GradeString): number =>
  parseInt(grade.replace("Grade ", ""), 10);

// ===========================================
// 1. KOMPONEN AKSI
// ===========================================

interface ActionButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onEdit, onDelete }) => (
  <Space size="middle">
    <Button
      icon={<EditOutlined />}
      onClick={onEdit}
      type="text"
      style={{ color: "#1677ff", padding: "0 4px" }}
    />
    <Button
      icon={<DeleteOutlined />}
      onClick={onDelete}
      type="text"
      danger
      style={{ padding: "0 4px" }}
    />
  </Space>
);

// ===========================================
// 2. MODAL TAMBAH/EDIT
// ===========================================

interface AddEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void; // Fungsi untuk refresh data
  // TIPE DATA DISESUAIKAN DENGAN ENDPOINT API: hadits -> hadist
  type: "doa" | "hadist";
  grade: number; // Grade yang sedang aktif
  editingData: IndicatorItem | null; // Data yang akan diedit (null jika Add)
}

const AddEditModal: React.FC<AddEditModalProps> = ({
  visible,
  onClose,
  onSuccess,
  type,
  grade,
  editingData,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Set initial form values saat editingData berubah
  useEffect(() => {
    if (editingData) {
      form.setFieldsValue({ indicator: editingData.indicator });
    } else {
      form.resetFields();
    }
  }, [editingData, form]);

  const handleSubmit = async (values: { indicator: string }) => {
    setLoading(true);
    // Endpoint API menggunakan ejaan "hadist"
    const endpoint = `/indicator-${type}`;
    const url = editingData
      ? `${BASE_URL}${endpoint}/${editingData.id}`
      : `${BASE_URL}${endpoint}`;

    const indicatorPayload = {
      indicator: values.indicator,
      grade: grade,
    };

    const action = editingData ? "mengupdate" : "menambahkan";

    try {
      if (editingData) {
        // Logika Edit (PUT)
        await axios.put(url, indicatorPayload);
      } else {
        // Logika Tambah (POST)
        await axios.post(url, indicatorPayload);
      }

      toast.success(`Berhasil ${action} indicator ${type.toUpperCase()}!`);
      onSuccess(); // Refresh data di komponen utama
      onClose();
    } catch (error) {
      console.error(`Gagal ${action} indicator ${type}:`, error);
      toast.error(
        `Gagal ${action} indicator ${type.toUpperCase()}. Silakan coba lagi.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        editingData
          ? `Edit Indicator ${type.toUpperCase()}`
          : `Tambah Indicator ${type.toUpperCase()}`
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="indicator"
          label="Indicator"
          rules={[
            {
              required: true,
              message: `Masukkan indicator ${type.toUpperCase()}`,
            },
          ]}
        >
          <Input placeholder={`Contoh: DO'A BEFORE HAVING MEAL`} />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ marginRight: 8 }}
          >
            {editingData ? "Simpan Perubahan" : "Tambah"}
          </Button>
          <Button onClick={onClose}>Batal</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ===========================================
// 3. KOMPONEN UTAMA
// ===========================================

const DoaHaditsPage: React.FC = () => {
  const [selectedGrade, setSelectedGrade] = useState<GradeString>(defaultGrade);
  const [doaData, setDoaData] = useState<IndicatorItem[]>([]);
  const [haditsData, setHaditsData] = useState<IndicatorItem[]>([]);
  const [loading, setLoading] = useState(false);
  // TIPE STATE DISESUAIKAN: hadits -> hadist
  const [modalType, setModalType] = useState<"doa" | "hadist" | null>(null);
  const [editingItem, setEditingItem] = useState<IndicatorItem | null>(null);

  const gradeNumber = gradeToNumber(selectedGrade);

  // === FUNGSI FETCH DATA ===
  const fetchData = useCallback(async (grade: number) => {
    if (!BASE_URL) {
      console.error(
        "NEXT_PUBLIC_API_URL is not defined in environment variables."
      );
      toast.error("Error: API URL tidak ditemukan.");
      return;
    }

    setLoading(true);
    try {
      const [doaRes, haditsRes] = await Promise.all([
        axios.get<any>(`${BASE_URL}/indicator-doa`, { params: { grade } }),
        // Endpoint API menggunakan 'hadist'
        axios.get<any>(`${BASE_URL}/indicator-hadist`, { params: { grade } }),
      ]);

      setDoaData(doaRes.data.data || []);
      setHaditsData(haditsRes.data.data || []);
    } catch (error) {
      console.error("Gagal memuat data:", error);
      toast.error("Gagal memuat data Doa dan Hadits. Cek koneksi API.");
      setDoaData([]);
      setHaditsData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Memuat data saat komponen mount atau grade berubah
  useEffect(() => {
    fetchData(gradeNumber);
  }, [gradeNumber, fetchData]);

  // === FUNGSI HANDLER ===

  const handleGradeChange = (value: GradeString) => {
    setSelectedGrade(value);
  };

  // TIPE ARGUMEN DISESUAIKAN: hadits -> hadist
  const openAddModal = (type: "doa" | "hadist") => {
    setEditingItem(null);
    setModalType(type);
  };

  // TIPE ARGUMEN DISESUAIKAN: hadits -> hadist
  const openEditModal = (item: IndicatorItem, type: "doa" | "hadist") => {
    setEditingItem(item);
    setModalType(type);
  };

  // TIPE ARGUMEN DISESUAIKAN: hadits -> hadist
  const handleDelete = async (id: number, type: "doa" | "hadist") => {
    if (!BASE_URL) return toast.error("Error: API URL tidak ditemukan.");

    Modal.confirm({
      title: `Yakin ingin menghapus indicator ${type.toUpperCase()} ini?`,
      content: `Indicator ID: ${id}`,
      okText: "Ya, Hapus",
      okType: "danger",
      cancelText: "Batal",
      onOk: async () => {
        try {
          // Endpoint API menggunakan 'hadist'
          const url = `${BASE_URL}/indicator-${type}/${id}`;
          await axios.delete(url);
          toast.success(`Indicator ${type.toUpperCase()} berhasil dihapus!`);
          fetchData(gradeNumber); // Refresh data
        } catch (error) {
          console.error(`Gagal menghapus indicator ${type}:`, error);
          toast.error(`Gagal menghapus indicator ${type.toUpperCase()}.`);
        }
      },
    });
  };

  // --- Kolom untuk Tabel Doa & Hadits ---

  // TIPE ARGUMEN DISESUAIKAN: hadits -> hadist
  const getColumns = (
    type: "doa" | "hadist"
  ): TableProps<IndicatorItem>["columns"] => [
    {
      title: "Indicator Subject",
      dataIndex: "indicator",
      key: "indicator",
      sorter: (a, b) => a.indicator.localeCompare(b.indicator),
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      align: "right",
      render: (_, record) => (
        <ActionButtons
          // Memanggil fungsi dengan string literal yang benar: "doa" atau "hadist"
          onEdit={() => openEditModal(record, type)}
          onDelete={() => handleDelete(record.id, type)}
        />
      ),
    },
  ];

  return (
    <div style={{ minHeight: "100vh", padding: 0, backgroundColor: "white" }}>
      {/* Container untuk Toastify. Penting agar notifikasi muncul. */}
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

      <Card bordered={false} style={{ boxShadow: "none" }}>
        {/* Header dan Dropdown Grade */}
        <Breadcrumb style={{ marginBottom: "20px" }}>
          <Breadcrumb.Item>Home</Breadcrumb.Item>
          <Breadcrumb.Item>Indicator Input</Breadcrumb.Item>
        </Breadcrumb>

        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: "20px" }}
        >
          <Col>
            <Title level={2} style={{ margin: 0, fontWeight: 500 }}>
              Doa & Hadits
            </Title>
          </Col>
          <Col>
            <Title
              level={4}
              style={{ margin: 0, color: "rgba(0, 0, 0, 0.65)" }}
            >
              {defaultSemester}
            </Title>
          </Col>
        </Row>

        <Row justify="end" style={{ marginBottom: "30px" }}>
          <Col>
            <Space>
              {/* Dropdown Grade */}
              <Select
                value={selectedGrade}
                style={{ width: 120 }}
                onChange={handleGradeChange}
                options={gradeOptions.map((grade) => ({
                  label: grade,
                  value: grade,
                }))}
              />
            </Space>
          </Col>
        </Row>

        {/* --- Bagian Doa --- */}
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: "15px" }}
        >
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              Doa ({selectedGrade})
            </Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              // String literal yang dikirim ke openAddModal harus sesuai dengan tipe 'doa' | 'hadist'
              onClick={() => openAddModal("doa")}
            >
              Add Doa
            </Button>
          </Col>
        </Row>

        {/* Tabel Doa */}
        <Table<IndicatorItem>
          columns={getColumns("doa")}
          dataSource={doaData}
          loading={loading}
          rowKey="id"
          pagination={false}
          size="middle"
          components={{
            header: {
              wrapper: ({ children }) => (
                <thead style={{ borderBottom: "1px solid #f0f0f0" }}>
                  {children}
                </thead>
              ),
              cell: (props) => (
                <th
                  {...props}
                  style={{
                    ...props.style,
                    backgroundColor: "white",
                    borderBottom: "1px solid #f0f0f0",
                    fontWeight: "normal",
                    color: "rgba(0, 0, 0, 0.85)",
                    paddingTop: "8px",
                    paddingBottom: "8px",
                  }}
                >
                  {props.children}
                </th>
              ),
            },
          }}
          style={{ marginBottom: "40px" }}
        />

        {/* --- Bagian Hadits --- */}
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: "15px" }}
        >
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              Hadits ({selectedGrade})
            </Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              // String literal yang dikirim ke openAddModal harus sesuai dengan tipe 'doa' | 'hadist'
              onClick={() => openAddModal("hadist")}
            >
              Add Hadits
            </Button>
          </Col>
        </Row>

        {/* Tabel Hadits */}
        <Table<IndicatorItem>
          columns={getColumns("hadist")}
          dataSource={haditsData}
          loading={loading}
          rowKey="id"
          pagination={false}
          size="middle"
          components={{
            header: {
              wrapper: ({ children }) => (
                <thead style={{ borderBottom: "1px solid #f0f0f0" }}>
                  {children}
                </thead>
              ),
              cell: (props) => (
                <th
                  {...props}
                  style={{
                    ...props.style,
                    backgroundColor: "white",
                    borderBottom: "1px solid #f0f0f0",
                    fontWeight: "normal",
                    color: "rgba(0, 0, 0, 0.85)",
                    paddingTop: "8px",
                    paddingBottom: "8px",
                  }}
                >
                  {props.children}
                </th>
              ),
            },
          }}
        />
      </Card>

      {/* Modal Tambah/Edit */}
      {modalType && (
        <AddEditModal
          visible={!!modalType}
          onClose={() => setModalType(null)}
          onSuccess={() => fetchData(gradeNumber)}
          type={modalType}
          grade={gradeNumber}
          editingData={editingItem}
        />
      )}
    </div>
  );
};

export default DoaHaditsPage;
