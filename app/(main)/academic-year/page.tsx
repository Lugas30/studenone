"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Breadcrumb,
  Typography,
  Alert,
  Table,
  Input,
  Button,
  Space,
  Switch,
  Pagination,
  message,
  Modal,
  Form,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title } = Typography;

// --- 1. Tipe Data & Konfigurasi ---
interface AcademicYear {
  id: number;
  year: string;
  is_ganjil: boolean;
  is_genap: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AcademicYearData extends AcademicYear {
  key: string;
}

interface AcademicYearFormValues {
  year: string;
}

type ModalAction = "add" | "edit" | null;

// Konfigurasi Axios
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- 2. Komponen Modal (Tidak ada perubahan) ---

interface AcademicYearModalProps {
  action: ModalAction;
  initialValues: AcademicYear | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AcademicYearModal: React.FC<AcademicYearModalProps> = ({
  action,
  initialValues,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<AcademicYearFormValues>();

  useEffect(() => {
    if (action === "edit" && initialValues) {
      form.setFieldsValue({ year: initialValues.year });
    } else {
      form.resetFields();
    }
  }, [initialValues, action, form]);

  const title =
    action === "add" ? "Tambah Tahun Akademik" : "Edit Tahun Akademik";

  const handleFinish = async (values: AcademicYearFormValues) => {
    try {
      if (action === "add") {
        await api.post("/academic-years", values);
        message.success("Tahun Akademik berhasil ditambahkan!");
      } else if (action === "edit" && initialValues) {
        await api.put(`/academic-years/${initialValues.id}`, values);
        message.success("Tahun Akademik berhasil diperbarui!");
      }
      form.resetFields();
      onClose();
      onSuccess();
    } catch (error) {
      console.error("API Error:", error);
      message.error("Gagal menyimpan data. Silakan coba lagi.");
    }
  };

  return (
    <Modal
      title={title}
      open={isOpen}
      onCancel={onClose}
      onOk={form.submit}
      destroyOnHidden={true}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={
          action === "edit" && initialValues
            ? { year: initialValues.year }
            : undefined
        }
      >
        <Form.Item
          name="year"
          label="Tahun Akademik (Contoh: 2024-2025)"
          rules={[
            { required: true, message: "Harap masukkan Tahun Akademik!" },
          ]}
        >
          <Input placeholder="Contoh: 2024-2025" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// --- 3. Komponen Halaman Utama ---

const AcademicYearPage: React.FC = () => {
  const [data, setData] = useState<AcademicYearData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const totalRecords = data.length;

  // State untuk Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [editingRecord, setEditingRecord] = useState<AcademicYear | null>(null);

  // --- Fungsi API: GET Data ---
  const fetchAcademicYears = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/academic-years");
      const formattedData: AcademicYearData[] = response.data.map(
        (item: AcademicYear) => ({
          ...item,
          key: String(item.id),
        })
      );
      setData(formattedData);
    } catch (error) {
      console.error("Gagal memuat data Tahun Akademik:", error);
      message.error("Gagal memuat data dari API.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  // --- Handler Modal ---
  const handleAdd = () => {
    setModalAction("add");
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleEdit = (record: AcademicYearData) => {
    setModalAction("edit");
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalAction(null);
    setEditingRecord(null);
  };

  // 🔄 FUNGSI UTAMA 1: Update Status Active (Server Menangani Konflik)
  const handleToggleActive = async (
    record: AcademicYearData,
    checked: boolean
  ) => {
    // Optimistic Update
    const originalIsActive = record.is_active;
    setData((prevData) =>
      prevData.map((item) =>
        item.id === record.id ? { ...item, is_active: checked } : item
      )
    );

    try {
      // Panggil API. Server yang bertanggung jawab menonaktifkan tahun akademik lain
      await api.put(`/academic-years/${record.id}/active`, {
        is_active: checked,
        is_ganjil: record.is_ganjil,
        is_genap: record.is_genap,
      });

      message.success(`Status Tahun Akademik ${record.year} berhasil diubah.`);
      // Sinkronisasi: Ambil data terbaru dari server
      fetchAcademicYears();
    } catch (error) {
      console.error("Gagal update status active:", error);
      message.error("Gagal mengubah status aktif. Mengambil ulang data...");
      // Revert Update jika gagal/terjadi error
      fetchAcademicYears();
    }
  };

  // 🚀 FUNGSI UTAMA 2: Update Semester (Mengirim payload sederhana dan menampilkan Modal)
  const handleToggleSemester = async (
    record: AcademicYearData,
    type: "is_ganjil" | "is_genap",
    checked: boolean
  ) => {
    // Pastikan Tahun Akademik aktif (meskipun sudah disabled di UI)
    if (!record.is_active) {
      return;
    }

    // Hanya kirim permintaan PUT jika switch diaktifkan (checked = true)
    if (!checked) {
      // Jika mencoba menonaktifkan, kita hanya berikan peringatan dan memuat ulang data.
      message.warning(
        `Untuk menonaktifkan semester, aktifkan semester lainnya pada tahun ${record.year}.`
      );
      return;
    }

    // Tentukan nilai semester untuk payload
    const semesterValue = type === "is_ganjil" ? "ganjil" : "genap";

    // Optimistic Update
    setData((prevData) =>
      prevData.map((item) => {
        if (item.id === record.id) {
          return {
            ...item,
            is_ganjil: type === "is_ganjil",
            is_genap: type === "is_genap",
          };
        }
        return item;
      })
    );

    try {
      // Kirim PUT ke API dengan payload sederhana: { "semester": "ganjil" } atau { "semester": "genap" }
      const response = await api.put(`/academic-years/${record.id}`, {
        semester: semesterValue,
      });

      // 4. Tampilkan Notifikasi Modal dari API Response
      Modal.success({
        title: "Pembaruan Semester Berhasil",
        content: (
          <div>
            <p>
              {response.data.message ||
                `Semester ${semesterValue} berhasil diaktifkan.`}
            </p>
            <p>Tahun Akademik: **{record.year}**</p>
          </div>
        ),
      });

      // 5. Sinkronisasi: Ambil data terbaru dari server
      fetchAcademicYears();
    } catch (error) {
      console.error(`Gagal update status ${type}:`, error);
      message.error(`Gagal mengubah status semester. Mengambil ulang data...`);
      // Revert Update jika gagal
      fetchAcademicYears();
    }
  };

  // --- DEFINISI KOLOM TABLE ---
  const columns = [
    {
      title: "Academic Year",
      dataIndex: "year",
      key: "year",
      sorter: (a: AcademicYearData, b: AcademicYearData) =>
        a.year.localeCompare(b.year),
    },
    {
      title: "Status Active",
      dataIndex: "is_active",
      key: "is_active",
      render: (active: boolean, record: AcademicYearData) => (
        <Switch
          checked={active}
          onChange={(checked) => handleToggleActive(record, checked)}
        />
      ),
    },
    {
      title: "Semester Ganjil",
      dataIndex: "is_ganjil",
      key: "is_ganjil",
      render: (active: boolean, record: AcademicYearData) => (
        <Switch
          checked={active}
          // Menonaktifkan Switch jika Tahun Akademik TIDAK aktif
          disabled={!record.is_active}
          onChange={(checked) =>
            handleToggleSemester(record, "is_ganjil", checked)
          }
        />
      ),
    },
    {
      title: "Semester Genap",
      dataIndex: "is_genap",
      key: "is_genap",
      render: (active: boolean, record: AcademicYearData) => (
        <Switch
          checked={active}
          // Menonaktifkan Switch jika Tahun Akademik TIDAK aktif
          disabled={!record.is_active}
          onChange={(checked) =>
            handleToggleSemester(record, "is_genap", checked)
          }
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: AcademicYearData) => (
        <Button
          type="text"
          icon={<EditOutlined style={{ color: "#1890ff" }} />}
          onClick={() => handleEdit(record)}
        />
      ),
    },
  ];

  return (
    <>
      <Breadcrumb items={[{ title: "Home" }, { title: "Academic Year" }]} />

      <Title level={1} style={{ margin: "16px 0 24px 0" }}>
        Academic Year
      </Title>

      <Alert
        message="Admin hanya dapat mengaktifkan satu tahun akademik dan satu semester pada satu waktu."
        type="warning"
        showIcon
        style={{ marginBottom: "24px" }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <Input
          placeholder="Search academic year..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
        <Space>
          <Button icon={<DownloadOutlined />} />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Academic Year
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={isLoading}
        pagination={false}
        size="large"
        style={{ border: "1px solid #f0f0f0", borderRadius: "4px" }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "16px",
        }}
      >
        <Space>
          <span>Row per page</span>
          <Input defaultValue="10" style={{ width: 60, textAlign: "center" }} />
          <span>Go to</span>
          <Input
            defaultValue={currentPage}
            style={{ width: 50, textAlign: "center" }}
          />
        </Space>

        <Pagination
          defaultCurrent={1}
          current={currentPage}
          onChange={setCurrentPage}
          total={totalRecords}
          pageSize={10}
          showSizeChanger={false}
        />
      </div>

      {/* Implementasi Modal */}
      <AcademicYearModal
        action={modalAction}
        initialValues={editingRecord}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={fetchAcademicYears}
      />
    </>
  );
};

export default AcademicYearPage;
