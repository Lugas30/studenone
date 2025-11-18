"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
// Mengganti import dayjs dengan moment
import moment from "moment";
// moment biasanya tidak perlu diimpor secara spesifik seperti 'dayjs',
// namun beberapa setup Next.js/Webpack mungkin memerlukannya.
// Jika menggunakan Ant Design DatePicker, pastikan juga sudah ada 'moment' atau 'dayjs' yang di-alias.

import {
  Card,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Radio,
  Upload,
  DatePicker,
  Spin,
} from "antd";
import {
  UploadOutlined,
  EditOutlined,
  UserOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const { Title, Text } = Typography;
const { Option } = Select;

// Ambil URL dari .env
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_IMAGE_URL = process.env.NEXT_PUBLIC_API_IMAGE_URL;
const HEAD_OF_UNITS_ENDPOINT = `${API_URL}/headofunits`;

// Tipe Data untuk Head of Unit
interface HeadOfUnitData {
  id: number;
  academic_year_id: number;
  name: string;
  nip: string;
  contact: string;
  email: string;
  date_of_birth: string;
  responsibility_area: string;
  gender: "headmistress" | "headmaster";
  signature: string; // path signature
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------
// Komponen Modal (Popup) untuk Upload/Update Data
// ----------------------------------------------------

interface UploadModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void; // Fungsi untuk refresh data
  initialData?: HeadOfUnitData; // Data jika dalam mode Edit
}

const UploadHeadOfUnitModal: React.FC<UploadModalProps> = ({
  isVisible,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!initialData;

  useEffect(() => {
    if (isVisible) {
      if (initialData) {
        // PERUBAHAN: Menggunakan moment() untuk inisialisasi DatePicker
        form.setFieldsValue({
          ...initialData,
          date_of_birth: initialData.date_of_birth
            ? moment(initialData.date_of_birth) // Mengganti dayjs(string) menjadi moment(string)
            : null,
          signature: [], // Kosongkan file list untuk signature
        });
      } else {
        form.resetFields();
      }
    }
  }, [isVisible, initialData, form]);

  const onFinish = async (values: any) => {
    setLoading(true);

    const formData = new FormData();

    // Mapping fields ke format API
    // Pastikan academic_year_id dikirim (default "1" jika tidak ada)
    formData.append("academic_year_id", values.academic_year_id || "1");
    formData.append("name", values.name);
    formData.append("nip", values.nip);
    formData.append("contact", values.contact || "");
    formData.append("email", values.email || "");

    // PERUBAHAN: Menggunakan .format("YYYY-MM-DD") dari objek moment
    formData.append(
      "date_of_birth",
      values.date_of_birth
        ? values.date_of_birth.format("YYYY-MM-DD") // Mengganti dayjs().format() menjadi moment().format()
        : ""
    );

    formData.append("responsibility_area", values.responsibility_area);
    formData.append("gender", values.gender);

    // Tambahkan Signature File jika ada
    const signatureFile = values.signature?.[0]?.originFileObj;
    if (signatureFile) {
      formData.append("signature", signatureFile);
    }

    try {
      if (isEditMode) {
        // API POST/PUT untuk Update (menggunakan form-data dan _method=put)
        formData.append("_method", "put");
        await axios.post(
          `${HEAD_OF_UNITS_ENDPOINT}/${initialData?.id}`,
          formData,
          // Header Content-Type Dihapus (Perbaikan Masalah Postman)
          {}
        );
        toast.success("Data Head of Unit berhasil diperbarui!");
      } else {
        // API POST untuk Create (menggunakan form-data)
        await axios.post(HEAD_OF_UNITS_ENDPOINT, formData, {
          // Header Content-Type Dihapus (Perbaikan Masalah Postman)
          // Biarkan browser/axios yang mengatur Content-Type dengan boundary
        });
        toast.success("Data Head of Unit berhasil ditambahkan!");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting data:", error);
      toast.error("Gagal menyimpan data. Cek console log.");
    } finally {
      setLoading(false);
    }
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  return (
    <Modal
      title={
        isEditMode ? "Perbarui Data Head of Unit" : "Upload Data Head of Unit"
      }
      open={isVisible}
      onCancel={onClose}
      footer={null} // Hilangkan footer bawaan
      destroyOnClose={true} // Reset form saat ditutup
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ marginTop: 20 }}
        initialValues={{ gender: "headmaster" }} // Default gender jika mode create
      >
        <Form.Item
          label="Nama Lengkap"
          name="name"
          rules={[{ required: true, message: "Harap masukkan Nama Lengkap!" }]}
        >
          <Input placeholder="Nama Lengkap" />
        </Form.Item>

        <Form.Item
          label="NIP"
          name="nip"
          rules={[{ required: true, message: "Harap masukkan NIP!" }]}
        >
          <Input placeholder="NIP" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Contact" name="contact">
              <Input placeholder="Nomor Kontak" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Email Address"
              name="email"
              rules={[{ type: "email", message: "Format email tidak valid!" }]}
            >
              <Input placeholder="Alamat Email" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Tanggal Lahir" name="date_of_birth">
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Pilih tanggal"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Area Tanggung Jawab"
              name="responsibility_area"
              rules={[{ required: true, message: "Harap pilih unit!" }]}
            >
              <Select placeholder="Pilih unit">
                <Option value="primary">Primary School</Option>
                <Option value="secondary">Secondary School</Option>
                <Option value="high school">High School</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Gender"
          name="gender"
          rules={[{ required: true, message: "Harap pilih jenis kelamin!" }]}
        >
          <Radio.Group>
            <Radio value="headmistress">Headmistress</Radio>
            <Radio value="headmaster">Headmaster</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label="Upload Tanda Tangan"
          name="signature"
          valuePropName="fileList"
          getValueFromEvent={normFile}
          extra={
            isEditMode && initialData?.signature
              ? "Tanda tangan saat ini sudah ada. Upload baru untuk mengganti."
              : "Unggah tanda tangan (PNG/JPG)"
          }
        >
          <Upload
            name="signature"
            multiple={false}
            beforeUpload={() => false} // Mencegah upload otomatis
            maxCount={1}
            accept=".png,.jpg,.jpeg"
          >
            <Button icon={<UploadOutlined />}>Pilih File</Button>
          </Upload>
        </Form.Item>

        <Form.Item style={{ textAlign: "right", marginTop: 20 }}>
          <Space>
            <Button onClick={onClose}>Batal</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={loading}
            >
              {isEditMode ? "Perbarui" : "Upload"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ----------------------------------------------------
// Komponen Utama (View Data)
// ----------------------------------------------------

const HeadOfUnitsView: React.FC = () => {
  const [data, setData] = useState<HeadOfUnitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<HeadOfUnitData | undefined>(
    undefined
  ); // Untuk mode Edit

  // Fungsi untuk mengambil data dari API
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(HEAD_OF_UNITS_ENDPOINT);
      // Asumsi hanya menampilkan data Head of Unit yang pertama (data[0])
      if (response.data && response.data.length > 0) {
        setData(response.data[0]);
      } else {
        setData(null);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal mengambil data dari API.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fungsi untuk membuka modal dalam mode Edit
  const handleEdit = (unitData: HeadOfUnitData) => {
    setSelectedUnit(unitData);
    setIsModalVisible(true);
  };

  // Fungsi untuk membuka modal dalam mode Create (jika belum ada data)
  const handleCreate = () => {
    setSelectedUnit(undefined);
    setIsModalVisible(true);
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />
      </div>
    );
  }

  return (
    <>
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
      <div style={{ padding: "24px" }}>
        {/* Header dan Tombol Aksi */}
        <Space direction="vertical" style={{ width: "100%", marginBottom: 20 }}>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Home / Head of Unit
          </Text>
          <Row justify="space-between" align="middle">
            <Title level={2} style={{ margin: 0 }}>
              Head of Unit Details
            </Title>
            <div>
              {data ? (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(data)}
                >
                  Edit Data
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={handleCreate}
                >
                  Upload Data
                </Button>
              )}
            </div>
          </Row>
        </Space>

        {/* Card View Data */}
        <Card
          variant="outlined"
          style={{ boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)" }}
        >
          <Title
            level={4}
            style={{ borderBottom: "1px solid #eee", paddingBottom: 10 }}
          >
            Informasi Head of Unit
          </Title>

          {data ? (
            <Row gutter={[24, 16]} style={{ marginTop: 20 }}>
              {/* Kolom Kiri */}
              <Col span={12}>
                <DataField label="Nama Lengkap" value={data.name} />
                <DataField label="NIP" value={data.nip} />
                <DataField label="Nomor Kontak" value={data.contact || "-"} />
                <DataField label="Email" value={data.email || "-"} />
                <DataField
                  label="Tanggal Lahir"
                  value={
                    data.date_of_birth
                      ? // PERUBAHAN: Menggunakan moment().format() untuk display
                        moment(data.date_of_birth).format("DD MMMM YYYY")
                      : "-"
                  }
                />
              </Col>
              {/* Kolom Kanan */}
              <Col span={12}>
                <DataField
                  label="Area Tanggung Jawab"
                  value={data.responsibility_area}
                />
                <DataField label="Gender" value={data.gender} />

                <div style={{ marginBottom: 16 }}>
                  <Text strong>Tanda Tangan:</Text>
                  <div style={{ marginTop: 8 }}>
                    {data.signature ? (
                      // Tampilkan gambar tanda tangan dari API Image URL
                      <img
                        src={`${API_IMAGE_URL}/${data.signature}`}
                        alt="Tanda Tangan"
                        style={{
                          maxWidth: "150px",
                          border: "1px solid #ddd",
                          padding: "5px",
                        }}
                      />
                    ) : (
                      <Text type="danger">Tidak ada tanda tangan.</Text>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          ) : (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <Title level={4} type="secondary">
                Data Head of Unit belum tersedia.
              </Title>
              <Text>
                Silakan klik tombol **Upload Data** di atas untuk menambahkan
                data baru.
              </Text>
            </div>
          )}
        </Card>
      </div>

      {/* Komponen Modal untuk Upload/Edit */}
      <UploadHeadOfUnitModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSuccess={fetchData} // Panggil fetchData untuk refresh data setelah submit
        initialData={selectedUnit}
      />
    </>
  );
};

// Komponen Pembantu untuk menampilkan field data
const DataField: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div style={{ marginBottom: 16 }}>
    <Text strong>{label}:</Text>
    <p style={{ margin: "0 0 5px 0" }}>{value}</p>
  </div>
);

export default HeadOfUnitsView;
