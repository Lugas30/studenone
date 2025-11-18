"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Breadcrumb,
  Typography,
  Table,
  Input,
  Button,
  Space,
  Card,
  Spin,
  Modal, // Import Modal
  Form, // Import Form
  InputNumber, // Import InputNumber
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { toast, ToastContainer } from "react-toastify"; // ✨ IMPORT TOASTCONTAINER BARU
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const { Title } = Typography;

// --- KONSTANTA API & BASE URL ---
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const PREDICATE_KKTP_URL = `${BASE_URL}/predicate-kktps`;
const PREDICATE_KKTP_QURAN_URL = `${BASE_URL}/predicate-kktp-quran`;
const PREDICATE_RANGE_PID_URL = `${BASE_URL}/predicate-range-pid`;

// --- DEFINISI TIPE DATA ---

interface KKTPData {
  id: number;
  predicate: string;
  descriptive: string;
  min_value: number;
  max_value: number;
  academic_id: number;
  key: string;
}

interface PIDData {
  id: number;
  predicate: string;
  descriptive: string;
  academic_id: number;
  key: string;
}

// 💡 Interface baru untuk respons API (sesuai permintaan)
interface PredicateApiResponse {
  academicYear: string;
  data: (KKTPData | (PIDData & { academic_year?: any }))[];
}

type TableDataType = KKTPData | PIDData;

// --- FUNGSI UTILITY API ---

// 💡 PERUBAHAN: Sekarang fetchData mengembalikan objek respons penuh
const fetchData = async (url: string): Promise<PredicateApiResponse | null> => {
  try {
    const response = await axios.get<PredicateApiResponse>(url);

    // Periksa apakah respons adalah objek dengan properti 'data'
    if (response.data && Array.isArray(response.data.data)) {
      // Lakukan mapping pada array 'data'
      const mappedData = response.data.data.map((item: any) => ({
        ...item,
        key: item.id.toString(),
        // Mapping untuk kolom tabel
        minValue: item.min_value,
        maxValue: item.max_value,
      }));

      // Kembalikan objek penuh, tetapi dengan data yang sudah di-map
      return {
        academicYear: response.data.academicYear,
        data: mappedData,
      };
    }

    // Jika format respons tidak seperti yang diharapkan, kembalikan null atau throw error
    console.warn(`Response from ${url} did not contain expected 'data' array.`);
    return null;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    // ✨ Mengganti message.error (Ant Design) menjadi toast.error (react-toastify)
    toast.error("Gagal memuat data. Cek console untuk detail.");
    return null;
  }
};

const postData = async (url: string, data: any): Promise<void> => {
  try {
    const response = await axios.post(url, data);
    toast.success(response.data.message || "Data berhasil ditambahkan!");
  } catch (error: any) {
    console.error(`Error posting data to ${url}:`, error);
    // Sekarang hanya menggunakan toast.error
    toast.error(error.response?.data?.message || "Gagal menambahkan data.");
    throw error; // Re-throw error agar proses reload dibatalkan
  }
};

const putData = async (url: string, id: number, data: any): Promise<void> => {
  try {
    const response = await axios.put(`${url}/${id}`, data);
    toast.success(response.data.message || "Data berhasil diubah!");
  } catch (error: any) {
    console.error(`Error updating data at ${url}/${id}:`, error);
    // Sekarang hanya menggunakan toast.error
    toast.error(error.response?.data?.message || "Gagal mengubah data.");
    throw error; // Re-throw error agar proses reload dibatalkan
  }
};

// ... (PredicateFormModal, createKKTPColumns, createPIDColumns, PredicateTable tetap sama)
// --- KOMPONEN MODAL FORM UNTUK ADD/EDIT ---

interface FormValues {
  predicate: string;
  descriptive: string;
  min_value?: number;
  max_value?: number;
}

interface PredicateFormModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onSubmit: (values: FormValues) => Promise<void>;
  initialValues: FormValues | null;
  isKKTP: boolean; // TRUE jika KKTP/Quran (memiliki min/max), FALSE jika PID
}

const PredicateFormModal: React.FC<PredicateFormModalProps> = ({
  isVisible,
  onCancel,
  onSubmit,
  initialValues,
  isKKTP,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set nilai form saat initialValues berubah (untuk Edit)
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const handleFinish = async (values: FormValues) => {
    setLoading(true);
    try {
      await onSubmit(values);
      onCancel(); // Tutup modal hanya jika submit berhasil
    } catch (error) {
      // Error handling sudah ada di fungsi postData/putData
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = initialValues ? "Edit Predicate" : "Tambah Predicate Baru";

  return (
    <Modal
      title={modalTitle}
      open={isVisible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose={true} // Reset form saat ditutup
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={initialValues || {}}
      >
        <Form.Item
          name="predicate"
          label="Predicate"
          rules={[{ required: true, message: "Masukkan nilai Predicate!" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="descriptive"
          label="Descriptive"
          rules={[{ required: true, message: "Masukkan nilai Descriptive!" }]}
        >
          <Input />
        </Form.Item>

        {isKKTP && (
          <>
            <Form.Item
              name="min_value"
              label="Min Value"
              rules={[{ required: true, message: "Masukkan Nilai Minimum!" }]}
            >
              <InputNumber min={0} max={100} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="max_value"
              label="Max Value"
              rules={[{ required: true, message: "Masukkan Nilai Maximum!" }]}
            >
              <InputNumber min={0} max={100} style={{ width: "100%" }} />
            </Form.Item>
          </>
        )}

        <Form.Item style={{ marginTop: 24 }}>
          <Space>
            <Button onClick={onCancel}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {initialValues ? "Update" : "Simpan"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// --- DEFINISI KOLOM TABLE DENGAN HANDLER EDIT/DELETE ---

// Kolom untuk KKTP dan KKTP Quran
const createKKTPColumns = (
  onEdit: (record: KKTPData) => void,
  onDelete: (id: number) => void
) => [
  { title: "Predicate", dataIndex: "predicate", key: "predicate" },
  { title: "Descriptive", dataIndex: "descriptive", key: "descriptive" },
  { title: "Min Value", dataIndex: "minValue", key: "minValue" },
  { title: "Max Value", dataIndex: "maxValue", key: "maxValue" },
  {
    title: "Actions",
    key: "actions",
    render: (text: any, record: KKTPData) => (
      <Space size="middle">
        <Button
          type="text"
          icon={<EditOutlined style={{ color: "#1890ff" }} />}
          onClick={() => onEdit(record)}
        />
        <Button
          type="text"
          icon={<DeleteOutlined style={{ color: "red" }} />}
          onClick={() => onDelete(record.id)}
        />
      </Space>
    ),
  },
];

// Kolom untuk PID Range
const createPIDColumns = (
  onEdit: (record: PIDData) => void,
  onDelete: (id: number) => void
) => [
  { title: "Predicate", dataIndex: "predicate", key: "predicate" },
  { title: "Descriptive", dataIndex: "descriptive", key: "descriptive" },
  {
    title: "Actions",
    key: "actions",
    render: (text: any, record: PIDData) => (
      <Space size="middle">
        <Button
          type="text"
          icon={<EditOutlined style={{ color: "#1890ff" }} />}
          onClick={() => onEdit(record)}
        />
        <Button
          type="text"
          icon={<DeleteOutlined style={{ color: "red" }} />}
          onClick={() => onDelete(record.id)}
        />
      </Space>
    ),
  },
];

// --- Komponen Pembungkus Tabel (SAMA) ---
interface PredicateTableProps {
  title: string;
  data: TableDataType[];
  columns: any[];
  isLoading: boolean;
  onAdd: () => void;
}

const PredicateTable: React.FC<PredicateTableProps> = ({
  title,
  data,
  columns,
  isLoading,
  onAdd,
}) => (
  <Card
    title={
      <Title level={4} style={{ margin: 0 }}>
        {title}
      </Title>
    }
    style={{ marginBottom: "40px", padding: 0 }}
    styles={{ body: { padding: 0 } }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "16px",
        padding: "0 24px",
      }}
    >
      <Input
        placeholder="Search..."
        prefix={<SearchOutlined />}
        style={{ width: 300 }}
      />
      <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
        Add Predicate
      </Button>
    </div>
    <Spin spinning={isLoading}>
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        size="large"
        style={{ border: "1px solid #f0f0f0", borderRadius: "4px" }}
      />
    </Spin>
  </Card>
);

// --- Halaman Utama ---
const PredicateKKTPPage: React.FC = () => {
  const [kktpData, setKktpData] = useState<KKTPData[]>([]);
  const [quransData, setQuransData] = useState<KKTPData[]>([]);
  const [pidData, setPidData] = useState<PIDData[]>([]);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState("Loading...");

  // State untuk Modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TableDataType | null>(
    null
  );
  const [currentApiUrl, setCurrentApiUrl] = useState<string>("");
  const [isCurrentKKTP, setIsCurrentKKTP] = useState(false);

  // Fungsi untuk memuat semua data
  const loadAllData = useCallback(async () => {
    setLoading(true);

    // 💡 PERUBAHAN: Memanggil fetchData dan menyimpan objek penuh
    const [kktpResponse, quranResponse, pidResponse] = await Promise.all([
      fetchData(PREDICATE_KKTP_URL),
      fetchData(PREDICATE_KKTP_QURAN_URL),
      fetchData(PREDICATE_RANGE_PID_URL),
    ]);

    // Mengatur data tabel
    setKktpData((kktpResponse?.data as KKTPData[]) || []);
    setQuransData((quranResponse?.data as KKTPData[]) || []);
    setPidData((pidResponse?.data as PIDData[]) || []);

    // 💡 PERUBAHAN: Mengambil Tahun Akademik dari respons pertama yang berhasil
    const yearFromKktp = kktpResponse?.academicYear;
    const yearFromQuran = quranResponse?.academicYear;
    const yearFromPid = pidResponse?.academicYear;

    if (yearFromKktp) {
      setAcademicYear(yearFromKktp);
    } else if (yearFromQuran) {
      setAcademicYear(yearFromQuran);
    } else if (yearFromPid) {
      setAcademicYear(yearFromPid);
    } else {
      setAcademicYear("Tahun Akademik Tidak Tersedia");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // --- HANDLER MODAL (ADD/EDIT) ---

  const handleOpenAddModal = (url: string, isKktpType: boolean) => {
    setEditingRecord(null); // Mode Add
    setCurrentApiUrl(url);
    setIsCurrentKKTP(isKktpType);
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (
    record: TableDataType,
    url: string,
    isKktpType: boolean
  ) => {
    setEditingRecord(record); // Mode Edit
    setCurrentApiUrl(url);
    setIsCurrentKKTP(isKktpType);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingRecord(null);
    setCurrentApiUrl("");
  };

  const handleSubmitForm = async (values: FormValues) => {
    // Siapkan data untuk API
    const dataToSend = isCurrentKKTP
      ? { ...values, min_value: values.min_value, max_value: values.max_value }
      : { predicate: values.predicate, descriptive: values.descriptive };

    if (editingRecord) {
      // API PUT (Edit)
      await putData(currentApiUrl, editingRecord.id, dataToSend);
    } else {
      // API POST (Add)
      await postData(currentApiUrl, dataToSend);
    }
    await loadAllData(); // Reload data setelah sukses
  };

  // --- HANDLER DELETE ---

  const handleDelete = (id: number) => {
    // Di sini seharusnya ada logika konfirmasi dan penentuan URL API untuk DELETE
    // ✨ Mengganti message.warning (Ant Design) menjadi toast.warning (react-toastify)
    toast.warning(
      `Fitur Delete untuk ID ${id} belum diimplementasikan. URL target harus ditentukan (KKTP, Quran, atau PID).`
    );
  };

  // --- DEFINISI KOLOM DENGAN HANDLER UNTUK TABLE ---

  const kktpColumns = createKKTPColumns(
    (record) => handleOpenEditModal(record, PREDICATE_KKTP_URL, true),
    handleDelete
  );

  const quransColumns = createKKTPColumns(
    (record) => handleOpenEditModal(record, PREDICATE_KKTP_QURAN_URL, true),
    handleDelete
  );

  const pidColumns = createPIDColumns(
    (record) => handleOpenEditModal(record, PREDICATE_RANGE_PID_URL, false),
    handleDelete
  );

  // --- SIAPKAN INITIAL VALUES UNTUK MODAL EDIT ---

  const getInitialValues = () => {
    if (!editingRecord) return null;

    if (isCurrentKKTP) {
      const kktpRecord = editingRecord as KKTPData;
      return {
        predicate: kktpRecord.predicate,
        descriptive: kktpRecord.descriptive,
        min_value: kktpRecord.min_value,
        max_value: kktpRecord.max_value,
      };
    } else {
      const pidRecord = editingRecord as PIDData;
      return {
        predicate: pidRecord.predicate,
        descriptive: pidRecord.descriptive,
      };
    }
  };

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
          <span className="font-bold text-zinc-800">{academicYear}</span>
        </Title>
      </div>

      {/* 3. Predicate KKTP (Utama) */}
      <PredicateTable
        title="Predicate KKTP"
        data={kktpData}
        columns={kktpColumns}
        isLoading={loading}
        onAdd={() => handleOpenAddModal(PREDICATE_KKTP_URL, true)}
      />

      {/* 4. Predicate KKTP Qurans */}
      <PredicateTable
        title="Predicate KKTP Qurans"
        data={quransData}
        columns={quransColumns} // Menggunakan kolom yang sama
        isLoading={loading}
        onAdd={() => handleOpenAddModal(PREDICATE_KKTP_QURAN_URL, true)}
      />

      {/* 5. Predicate Range PID */}
      <PredicateTable
        title="Predicate Range PID"
        data={pidData}
        columns={pidColumns}
        isLoading={loading}
        onAdd={() => handleOpenAddModal(PREDICATE_RANGE_PID_URL, false)}
      />

      {/* 6. Komponen Modal Form */}
      <PredicateFormModal
        isVisible={isModalVisible}
        onCancel={handleCloseModal}
        onSubmit={handleSubmitForm}
        initialValues={getInitialValues()}
        isKKTP={isCurrentKKTP}
      />

      {/* ✨ 7. ToastContainer: Ini adalah perbaikan utama */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
};

export default PredicateKKTPPage;
