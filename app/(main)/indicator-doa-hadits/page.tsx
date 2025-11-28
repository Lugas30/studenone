// src/pages/DoaHaditsPage.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Table,
  Button,
  Space,
  theme,
  Breadcrumb,
  Typography,
  Select,
  Row,
  Col,
  Alert,
  Modal,
  Form,
  Input,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  HomeOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { ToastContainer, toast } from "react-toastify";
import type { ColumnsType } from "antd/es/table";

// --- Global Config ---
import "react-toastify/dist/ReactToastify.css";

const { Title, Text } = Typography;
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://so-api.queensland.id/api";

// --- 1. Tipe Data ---

interface ApiItem {
  id: number;
  grade: number;
  indicator: string;
}

interface ApiResponse {
  academicYear: string;
  semester: string;
  data: ApiItem[];
}

export type TableItem = {
  id: number;
  subject: string;
  grade: number;
};

export const gradeOptions = Array.from({ length: 6 }, (_, i) => ({
  value: String(i + 1),
  label: `Grade ${i + 1}`,
}));

type ModalType = "doa" | "hadist";

interface ModalState {
  visible: boolean;
  type: ModalType;
  mode: "add" | "edit";
  data: TableItem | null;
}

// ----------------------------------------------------------------------
// ## 2. Komponen Modal (Add/Edit Form)
// ----------------------------------------------------------------------

interface DoaHaditsModalProps {
  modalState: ModalState;
  // Ubah tipe currentGrade agar bisa menerima string atau null
  currentGrade: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DoaHaditsModal: React.FC<DoaHaditsModalProps> = ({
  modalState,
  currentGrade,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const { visible, type, mode, data } = modalState;
  const isDoa = type === "doa";
  const apiEndpoint = isDoa ? "indicator-doa" : "indicator-hadist";

  // Tangani currentGrade yang mungkin null di sini
  const gradeDisplay = currentGrade || "N/A";
  const titleText = `${mode === "add" ? "Tambah" : "Edit"} ${
    isDoa ? "Doa" : "Hadits"
  } (Grade ${gradeDisplay})`;

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        // Pastikan grade yang di-set adalah integer, atau default ke 0 jika null
        grade: data ? data.grade : currentGrade ? parseInt(currentGrade) : 0,
        indicator: data ? data.subject : "",
      });
    }
  }, [visible, form, data, currentGrade]);

  const handleSubmit = async (values: any) => {
    if (!currentGrade) {
      toast.error("Pilih Grade terlebih dahulu sebelum menambah/mengedit!");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        grade: parseInt(currentGrade),
        indicator: values.indicator,
      };

      let response;

      if (mode === "add") {
        response = await axios.post(`${API_BASE_URL}/${apiEndpoint}`, payload);
      } else if (mode === "edit" && data) {
        const endpoint = isDoa
          ? `indicator-doa/${data.id}`
          : `indicator-hadist/${data.id}`;
        response = await axios.put(`${API_BASE_URL}/${endpoint}`, payload);
      }

      toast.success(
        response?.data?.message ||
          `${isDoa ? "Doa" : "Hadits"} berhasil disimpan!`
      );
      onSuccess();
      onClose();
      form.resetFields();
    } catch (error: any) {
      console.error("API Error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        `Gagal ${mode === "add" ? "menambah" : "mengubah"} data.`;
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={titleText}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose} disabled={submitting}>
          Batal
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          onClick={form.submit}
          disabled={!currentGrade} // Nonaktifkan jika grade belum dipilih
        >
          Simpan
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Field Grade (Dinonaktifkan) */}
        {/* <Form.Item label="Grade">
          <Input value={gradeDisplay} disabled />
        </Form.Item> */}

        {/* Field Indicator */}
        <Form.Item
          name="indicator"
          label="Subjek / Indikator"
          rules={[
            { required: true, message: "Mohon masukkan subjek/indikator!" },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Contoh: DO'A BEFORE HAVING MEAL"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ----------------------------------------------------------------------
// ## 3. Komponen Tabel Kustom (DoaHaditsTable)
// ----------------------------------------------------------------------

interface DoaHaditsTableProps {
  title: string;
  data: TableItem[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (item: TableItem) => void;
  disabled: boolean; // Tambahkan properti disabled
}

const DoaHaditsTable: React.FC<DoaHaditsTableProps> = ({
  title,
  data,
  isLoading,
  onAdd,
  onEdit,
  disabled, // Gunakan properti disabled
}) => {
  const { token } = theme.useToken();
  const isDoa = title.toLowerCase().includes("doa");

  // Kolom actions dinonaktifkan jika disabled
  const columns: ColumnsType<TableItem> = [
    {
      title: <span style={{ color: token.colorTextSecondary }}>Subject :</span>,
      dataIndex: "subject",
      key: "subject",
      render: (text) => (
        <span style={{ fontWeight: 500, fontSize: "14px" }}>{text}</span>
      ),
    },
    {
      title: <span style={{ color: token.colorTextSecondary }}>Actions</span>,
      key: "actions",
      width: 100,
      align: "right",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: token.colorWarning }} />}
            onClick={() => onEdit(record)}
            disabled={disabled} // Terapkan disabled
          />
          <Button
            type="text"
            icon={<DeleteOutlined style={{ color: token.colorError }} />}
            onClick={() => console.log(`Delete ${title} ID: ${record.id}`)}
            disabled={disabled} // Terapkan disabled
          />
        </Space>
      ),
    },
  ];

  const buttonText = isDoa ? "Add Doa" : "Add Hadits";

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>{title}</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAdd}
          disabled={disabled} // Terapkan disabled pada tombol Add
        >
          {buttonText}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={false}
        loading={isLoading}
        size="large"
        components={{
          header: {
            row: ({ children, ...props }) => (
              <tr {...props} style={{ backgroundColor: token.colorFillAlter }}>
                {children}
              </tr>
            ),
          },
        }}
        style={{ marginBottom: 40 }}
        locale={{
          emptyText: isLoading
            ? "Memuat data..."
            : disabled
            ? "Pilih Grade terlebih dahulu untuk melihat data." // Pesan jika grade belum dipilih
            : "Tidak ada data yang ditemukan untuk Grade ini.",
        }}
      />
    </>
  );
};

// ----------------------------------------------------------------------
// ## 4. Halaman Utama (DoaHaditsPage)
// ----------------------------------------------------------------------

const DoaHaditsPage: React.FC = () => {
  // *** PERUBAHAN UTAMA: selectedGrade default null ***
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [doaList, setDoaList] = useState<TableItem[]>([]);
  const [haditsList, setHaditsList] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(false); // Default false karena tidak langsung fetch
  const [error, setError] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState("N/A");
  const [semester, setSemester] = useState("N/A");

  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    type: "doa",
    mode: "add",
    data: null,
  });

  const gradeNumber = selectedGrade ? parseInt(selectedGrade) : null;

  const fetchData = useCallback(async () => {
    // *** PERUBAHAN: Hentikan fetch jika grade belum dipilih ***
    if (!selectedGrade) {
      setDoaList([]);
      setHaditsList([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setDoaList([]);
    setHaditsList([]);

    try {
      const [doaResponse, haditsResponse] = await Promise.all([
        axios.get<ApiResponse>(`${API_BASE_URL}/indicator-doa`),
        axios.get<ApiResponse>(`${API_BASE_URL}/indicator-hadist`),
      ]);

      if (doaResponse.data.academicYear) {
        setAcademicYear(doaResponse.data.academicYear);
        setSemester(doaResponse.data.semester);
      }

      // Menggunakan gradeNumber yang sudah dipastikan tidak null di sini
      const currentGradeNum = parseInt(selectedGrade);

      // Filter dan transform data Doa
      const filteredDoa = doaResponse.data.data
        .filter((item) => item.grade === currentGradeNum)
        .map((item) => ({
          id: item.id,
          subject: item.indicator,
          grade: item.grade,
        }));

      // Filter dan transform data Hadits
      const filteredHadits = haditsResponse.data.data
        .filter((item) => item.grade === currentGradeNum)
        .map((item) => ({
          id: item.id,
          subject: item.indicator,
          grade: item.grade,
        }));

      setDoaList(filteredDoa);
      setHaditsList(filteredHadits);

      if (!loading && selectedGrade)
        // Hanya tampilkan info jika ini bukan load pertama
        toast.info("Data berhasil diperbarui.", { autoClose: 1000 });
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Gagal memuat data dari API. Periksa koneksi atau URL.");
      toast.error("Gagal memuat data!");
    } finally {
      setLoading(false);
    }
  }, [selectedGrade]); // Dependency diubah menjadi selectedGrade

  // Panggil fetchData hanya ketika selectedGrade berubah
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGradeChange = (value: string) => {
    setSelectedGrade(value);
  };

  // Handlers Modal
  const handleOpenAdd = (type: ModalType) => {
    // Pastikan grade sudah dipilih sebelum membuka modal Add
    if (selectedGrade) {
      setModalState({ visible: true, type, mode: "add", data: null });
    } else {
      toast.warn("Pilih Grade terlebih dahulu.");
    }
  };

  const handleOpenEdit = (type: ModalType, item: TableItem) => {
    // Pastikan grade sudah dipilih sebelum membuka modal Edit
    if (selectedGrade) {
      setModalState({ visible: true, type, mode: "edit", data: item });
    } else {
      toast.warn("Pilih Grade terlebih dahulu.");
    }
  };

  const handleCloseModal = () => {
    setModalState({ ...modalState, visible: false });
  };

  // Variabel untuk menonaktifkan tabel dan tombol Add/Edit jika grade belum dipilih
  const isGradeSelected = selectedGrade !== null;

  return (
    <div style={{ padding: "24px" }}>
      {/* Toastify Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>Doa & Hadits</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header Halaman dan Seleksi Grade */}
      <Row justify="space-between" align="top" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={1} style={{ margin: 0, fontWeight: 500 }}>
            Doa & Hadits
          </Title>
        </Col>
        <Col style={{ textAlign: "right" }}>
          <Title
            level={2}
            style={{ margin: 0, fontWeight: "normal", fontSize: "20px" }}
          >
            {academicYear} ({semester})
          </Title>
          <div style={{ marginTop: 8 }}>
            <Space>
              <Text>Select grade :</Text>
              <Select
                // *** PERUBAHAN: Gunakan value={selectedGrade} dan placeholder ***
                value={selectedGrade}
                style={{ width: 120 }}
                onChange={handleGradeChange}
                options={gradeOptions}
                placeholder="Select Grade" // Placeholder baru
                disabled={loading}
              />
              {/* <Button
                icon={<SyncOutlined />}
                onClick={fetchData}
                loading={loading}
                title="Refresh Data"
                disabled={!isGradeSelected} // Nonaktifkan jika grade belum dipilih
              /> */}
            </Space>
          </div>
        </Col>
      </Row>

      {/* Tampilkan Error jika ada */}
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 20 }}
        />
      )}

      {/* --- Bagian Doa --- */}
      <DoaHaditsTable
        title="Doa"
        data={doaList}
        isLoading={loading}
        onAdd={() => handleOpenAdd("doa")}
        onEdit={(item) => handleOpenEdit("doa", item)}
        disabled={!isGradeSelected} // Terapkan disabled
      />

      {/* --- Bagian Hadits --- */}
      <DoaHaditsTable
        title="Hadist"
        data={haditsList}
        isLoading={loading}
        onAdd={() => handleOpenAdd("hadist")}
        onEdit={(item) => handleOpenEdit("hadist", item)}
        disabled={!isGradeSelected} // Terapkan disabled
      />

      {/* Komponen Modal untuk Add/Edit */}
      <DoaHaditsModal
        modalState={modalState}
        currentGrade={selectedGrade}
        onClose={handleCloseModal}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default DoaHaditsPage;
