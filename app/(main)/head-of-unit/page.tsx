"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
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
  Tag,
  Breadcrumb,
} from "antd";
import {
  UploadOutlined,
  EditOutlined,
  CalendarOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Konfigurasi Konstanta
const { Title, Text } = Typography;
const { Option } = Select;

// Ambil URL dari .env (Asumsi sudah terdefinisi di lingkungan Next.js)
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_IMAGE_URL = process.env.NEXT_PUBLIC_API_IMAGE_URL;
const HEAD_OF_UNITS_ENDPOINT = `${API_URL}/headofunits`;

// --- INTERFACE (TIPE DATA) ---

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

interface HeadOfUnitsAPIResponse {
  academicYear: string; // Tahun ajaran aktif, cth: "2025-2026"
  data: HeadOfUnitData[];
}

// --- KOMPONEN PEMBANTU ---

const DataField: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div style={{ marginBottom: 16 }}>
    <Text strong>{label}:</Text>
    <p style={{ margin: "0 0 5px 0" }}>{value}</p>
  </div>
);

// --- MODAL (CREATE/UPDATE) ---

interface UploadModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: HeadOfUnitData; // Data jika mode Edit
  currentAcademicYearId: number | null; // ID Tahun Ajaran dari API
}

const UploadHeadOfUnitModal: React.FC<UploadModalProps> = ({
  isVisible,
  onClose,
  onSuccess,
  initialData,
  currentAcademicYearId,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!initialData;

  useEffect(() => {
    if (isVisible) {
      if (initialData) {
        // Mode Edit: Isi form dengan data yang ada
        form.setFieldsValue({
          ...initialData,
          date_of_birth: initialData.date_of_birth
            ? moment(initialData.date_of_birth)
            : null,
          signature: [], // Kosongkan file list
        });
      } else {
        // Mode Create: Reset fields dan set default/computed value
        form.resetFields();
        form.setFieldsValue({
          gender: "headmaster",
          academic_year_id: currentAcademicYearId, // Set ID Tahun Ajaran Aktif
        });
      }
    }
  }, [isVisible, initialData, form, currentAcademicYearId]);

  const onFinish = async (values: any) => {
    setLoading(true);

    if (!values.academic_year_id) {
      // ✅ Penggunaan toast untuk error
      toast.error("Academic Year ID tidak ditemukan. Gagal menyimpan.");
      setLoading(false);
      return;
    }

    const formData = new FormData();

    // Mapping fields
    formData.append("academic_year_id", values.academic_year_id.toString());
    formData.append("name", values.name);
    formData.append("nip", values.nip);
    formData.append("contact", values.contact || "");
    formData.append("email", values.email || "");
    formData.append(
      "date_of_birth",
      values.date_of_birth ? values.date_of_birth.format("YYYY-MM-DD") : ""
    );
    formData.append("responsibility_area", values.responsibility_area);
    formData.append("gender", values.gender);

    // Tambahkan Signature File
    const signatureFile = values.signature?.[0]?.originFileObj;
    if (signatureFile) {
      formData.append("signature", signatureFile);
    }

    try {
      if (isEditMode) {
        // Update: Gunakan POST dengan form-data dan _method=put
        formData.append("_method", "put");
        await axios.post(
          `${HEAD_OF_UNITS_ENDPOINT}/${initialData?.id}`,
          formData
        );
        // ✅ Penggunaan toast untuk sukses (Update)
        toast.success("Data Head of Unit berhasil diperbarui!", {
          position: "top-right",
        });
      } else {
        // Create: Gunakan POST dengan form-data
        await axios.post(HEAD_OF_UNITS_ENDPOINT, formData);
        // ✅ Penggunaan toast untuk sukses (Create)
        toast.success("Data Head of Unit berhasil ditambahkan!", {
          position: "top-right",
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting data:", error);
      // ✅ Penggunaan toast untuk error
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
      footer={null}
      destroyOnClose={true}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ marginTop: 20 }}
        initialValues={{ gender: "headmaster" }}
      >
        {/* Hidden Field untuk Academic Year ID */}
        <Form.Item name="academic_year_id" hidden rules={[{ required: true }]}>
          <Input type="hidden" />
        </Form.Item>

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

// --- KOMPONEN UTAMA (VIEW) ---

const HeadOfUnitsView: React.FC = () => {
  const [data, setData] = useState<HeadOfUnitData | null>(null);
  const [academicYear, setAcademicYear] = useState<string | null>(null);
  const [currentAcademicYearId, setCurrentAcademicYearId] = useState<
    number | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<HeadOfUnitData | undefined>(
    undefined
  );

  // Fungsi untuk mengambil data dari API
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get<HeadOfUnitsAPIResponse>(
        HEAD_OF_UNITS_ENDPOINT
      );

      const apiData = response.data;

      setAcademicYear(apiData.academicYear);

      if (apiData.data && apiData.data.length > 0) {
        const firstUnit = apiData.data[0];
        setData(firstUnit);
        // ID Tahun Ajaran diambil dari data yang ada
        setCurrentAcademicYearId(firstUnit.academic_year_id);
      } else {
        setData(null);

        // **Inisialisasi Fallback ID untuk mode Create**
        const fallbackActiveYearId = 2; // Asumsi ID tahun ajaran aktif

        setCurrentAcademicYearId(fallbackActiveYearId); // Set ID untuk mode Create

        // ✅ Penggunaan toast untuk info
        toast.info("Data Head of Unit kosong. Silakan tambahkan data baru.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // ✅ Penggunaan toast untuk error
      toast.error("Gagal mengambil data dari API. Silakan coba lagi.");
      setData(null);
      setAcademicYear(null);
      setCurrentAcademicYearId(null); // Set null jika fetching gagal total
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (unitData: HeadOfUnitData) => {
    setSelectedUnit(unitData);
    setIsModalVisible(true);
  };

  const handleCreate = () => {
    if (!currentAcademicYearId) {
      // ✅ Penggunaan toast untuk error
      toast.error(
        "Gagal memulai proses upload: ID Tahun Ajaran Aktif tidak terdeteksi."
      );
      return;
    }

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
      {/* 💡 KOMPONEN TOASTIFY CONTAINER (Diperbaiki/Ditempatkan) */}
      <ToastContainer />
      <div>
        {/* Header dan Tombol Aksi */}
        <Space direction="vertical" style={{ width: "100%", marginBottom: 20 }}>
          {/* 1. Breadcrumb */}
          <Breadcrumb
            items={[{ title: "Home" }, { title: "Grade & Classroom" }]}
          />
          <Row justify="space-between" align="middle">
            <Title level={2} style={{ margin: 0 }}>
              Head of Unit Details
            </Title>
            <Space>
              {/* Tampilan Tahun Ajaran Aktif */}
              {academicYear && (
                <Title level={3} style={{ margin: 0 }}>
                  {academicYear}
                </Title>
              )}

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
                  disabled={!currentAcademicYearId}
                >
                  Upload Data
                </Button>
              )}
            </Space>
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
                      ? moment(data.date_of_birth).format("DD MMMM YYYY")
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
        onSuccess={fetchData}
        initialData={selectedUnit}
        currentAcademicYearId={currentAcademicYearId}
      />
    </>
  );
};

export default HeadOfUnitsView;
