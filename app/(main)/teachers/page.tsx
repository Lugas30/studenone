"use client";

import React, { useState, useEffect, Key } from "react";
import axios, { AxiosError } from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Table,
  Button,
  Input,
  Space,
  Typography,
  Select,
  Pagination,
  Modal,
  Form,
  DatePicker,
  Popconfirm,
  Row,
  Col,
  Upload,
  message,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined as UploadIcon,
  UserAddOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import moment from "moment";
import type { UploadProps } from "antd";

const { Title, Text } = Typography;
const { Option } = Select;

// ===================================
// 1. DATA TYPES AND API CONFIG
// ===================================

// Tipe data untuk objek Guru (sesuai API)
interface Teacher {
  id: number;
  key: Key;
  academic_year_id: number;
  nip: string;
  nuptk: string | null;
  name: string;
  join_date: string;
  gender: "male" | "female";
  phone: string;
  email: string;
  password?: string;
  is_active: boolean;
  signature: string | null;
  note: string | null;
  academic_year: {
    year: string;
  };
}

// Tipe data untuk form
interface TeacherFormValues {
  id?: number;
  academic_year_id: number;
  nip: string;
  nuptk?: string | null;
  name: string;
  join_date: moment.Moment;
  gender: "male" | "female";
  phone: string;
  email: string;
  password?: string;
  is_active: boolean;
  note?: string | null;
  signature?: any; // Menggunakan any untuk menampung format Upload AntD (fileList)
}

// Ambil URL dari .env
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const BASE_URL = `${API_URL}/teachers`;

// ===================================
// 2. COLUMN DEFINITION
// ===================================

const getColumns = (
  handleEdit: (record: Teacher) => void,
  handleDelete: (id: number) => void
): ColumnsType<Teacher> => [
  {
    title: "NIP",
    dataIndex: "nip",
    key: "nip",
    sorter: (a, b) => a.nip.localeCompare(b.nip),
    width: 120,
  },
  {
    title: "Full Name",
    dataIndex: "name",
    key: "name",
    sorter: (a, b) => a.name.localeCompare(b.name),
  },
  {
    title: "Gender",
    dataIndex: "gender",
    key: "gender",
    render: (gender: Teacher["gender"]) => (
      <Text>{gender === "male" ? "L" : "P"}</Text>
    ),
    sorter: (a, b) => a.gender.localeCompare(b.gender),
    width: 100,
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
  },
  {
    title: "Status",
    dataIndex: "is_active",
    key: "is_active",
    width: 120,
    render: (is_active: Teacher["is_active"]) => (
      <Text
        style={{
          color: is_active ? "green" : "red",
          fontWeight: "bold",
        }}
      >
        {is_active ? "Active" : "Non-Active"}
      </Text>
    ),
    sorter: (a, b) => (a.is_active === b.is_active ? 0 : a.is_active ? 1 : -1),
  },
  {
    title: "Actions",
    key: "actions",
    width: 150,
    render: (_, record) => (
      <Space size="middle">
        <Button
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
          type="text"
          style={{ color: "#faad14" }}
        />
        <Popconfirm
          title="Hapus Guru"
          description={`Yakin ingin menghapus ${record.name}?`}
          onConfirm={() => handleDelete(record.id)}
          okText="Ya, Hapus"
          cancelText="Batal"
        >
          <Button icon={<DeleteOutlined />} type="text" danger />
        </Popconfirm>
      </Space>
    ),
  },
];

// ===================================
// 3. MAIN COMPONENT
// ===================================

const TeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [form] = Form.useForm<TeacherFormValues>();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentAcademicYear, setCurrentAcademicYear] = useState("Loading...");

  // Fetch Data Guru
  const fetchTeachers = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const response = await axios.get<Teacher[]>(BASE_URL);

      const mappedData = response.data.map((teacher) => ({
        ...teacher,
        key: teacher.id.toString(),
      }));

      if (mappedData.length > 0) {
        setCurrentAcademicYear(mappedData[0].academic_year.year);
      } else {
        setCurrentAcademicYear("N/A");
      }

      setTotalRecords(mappedData.length);
      const start = (page - 1) * limit;
      const end = start + limit;
      setTeachers(mappedData.slice(start, end));
      setCurrentPage(page);
      setPageSize(limit);
    } catch (error) {
      const err = error as AxiosError;
      console.error("Gagal memuat data guru:", err);
      toast.error(`Gagal memuat data: ${err.message}`, {
        position: "top-right",
      });
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers(currentPage, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (page: number, size: number) => {
    fetchTeachers(page, size);
  };

  const handleEdit = (teacher: Teacher) => {
    setIsEditing(true);
    setCurrentTeacher(teacher);
    form.setFieldsValue({
      ...teacher,
      join_date: moment(teacher.join_date),
      is_active: teacher.is_active,
      // Konversi null menjadi undefined untuk form AntD
      nuptk: teacher.nuptk || undefined,
      note: teacher.note || undefined,
      // Reset signature saat edit agar user upload ulang jika ingin mengubah
      signature: undefined,
    });
    setIsModalOpen(true);
  };

  // Handler Submit Form (Create/Update)
  const handleFormSubmit = async (values: TeacherFormValues) => {
    const formData = new FormData();
    formData.append("academic_year_id", values.academic_year_id.toString());
    formData.append("nip", values.nip);
    formData.append("name", values.name);
    formData.append("join_date", values.join_date.format("YYYY-MM-DD"));
    formData.append("gender", values.gender);
    formData.append("phone", values.phone);
    formData.append("email", values.email);
    formData.append("is_active", values.is_active ? "1" : "0");

    if (values.nuptk) formData.append("nuptk", values.nuptk);
    if (values.note) formData.append("note", values.note);
    if (values.password) formData.append("password", values.password);

    // Penanganan File Signature - Mengambil objek file mentah
    // Menggunakan values.signature[0]?.originFileObj (seperti di kode Head of Unit)
    const signatureFile = values.signature?.[0]?.originFileObj;

    if (signatureFile) {
      formData.append("signature", signatureFile);
    }

    // Konfigurasi Header untuk Axios (Diadopsi dari kode Head of Unit yang sukses)
    const axiosConfig = {
      headers: {
        // Penting: Eksplisit menetapkan Content-Type
        "Content-Type": "multipart/form-data",
      },
    };

    try {
      let response;
      if (isEditing && currentTeacher) {
        // UPDATE
        formData.append("_method", "PUT");
        response = await axios.post(
          `${BASE_URL}/${currentTeacher.id}`,
          formData,
          axiosConfig // Menggunakan config dengan Content-Type eksplisit
        );
        toast.success(response.data.message || "Guru berhasil diperbarui! 📝", {
          position: "top-right",
        });
      } else {
        // CREATE
        response = await axios.post(
          BASE_URL,
          formData,
          axiosConfig // Menggunakan config dengan Content-Type eksplisit
        );
        toast.success(
          response.data.message || "Guru berhasil ditambahkan! ✅",
          { position: "top-right" }
        );
      }
      setIsModalOpen(false);
      fetchTeachers(currentPage, pageSize);
    } catch (error) {
      const err = error as AxiosError<{ message?: string; errors?: any }>;
      const errorMessage = err.response?.data?.message || err.message;
      console.error("Gagal menyimpan data guru:", err.response?.data || err);
      toast.error(`Gagal menyimpan: ${errorMessage}`, {
        position: "top-right",
      });
    }
  };

  // Handler Delete (Simulasi)
  const handleDelete = async (id: number) => {
    try {
      // Simulasi
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`Guru ID ${id} berhasil dihapus (Simulasi)! 🗑️`, {
        position: "top-right",
      });
      fetchTeachers(currentPage, pageSize);
    } catch (error) {
      const err = error as AxiosError;
      toast.error(`Gagal menghapus: ${err.message}`, { position: "top-right" });
    }
  };

  const columns = getColumns(handleEdit, handleDelete);

  // Fungsi normFile yang konsisten dengan kode HeadOfUnit
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  // Prop untuk komponen Upload Signature
  const uploadProps: UploadProps = {
    name: "signature",
    multiple: false,
    maxCount: 1,
    listType: "picture",
    beforeUpload: () => false, // Mencegah upload otomatis, seperti di kode HeadOfUnit
    accept: ".png,.jpg,.jpeg",
    action: undefined,
  };

  return (
    <>
      <ToastContainer />
      <div style={{ padding: 24, background: "#fff" }}>
        {/* Header Halaman dan Tahun Ajaran */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <Text type="secondary">Home /</Text> <Text strong>Teacher</Text>
            <Title level={2} style={{ margin: "8px 0 0 0" }}>
              Teachers
            </Title>
          </div>
          <Title level={3} style={{ color: "#888", margin: 0 }}>
            {currentAcademicYear}
          </Title>
        </div>

        {/* Kontrol Utama */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Input
            prefix={<SearchOutlined style={{ marginRight: 8 }} />}
            placeholder="Search teacher..."
          />
          <Space>
            <Button
              type="primary"
              style={{ backgroundColor: "green", borderColor: "green" }}
              icon={<UploadIcon />}
              onClick={() => toast.info("Fungsi Mass Upload (Simulasi) 📤")}
            >
              Mass Upload
            </Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => {
                setIsEditing(false);
                setCurrentTeacher(null);
                form.resetFields();
                setIsModalOpen(true);
              }}
            >
              Add Teacher
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => toast.info("Fungsi Download (Simulasi) 📥")}
            />
          </Space>
        </div>

        {/* Tabel Data Guru */}
        <Table
          columns={columns}
          dataSource={teachers}
          loading={loading}
          pagination={false}
          rowKey="key"
          bordered
        />

        {/* Custom Pagination di Bawah Tabel */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 16,
          }}
        >
          <Space>
            <Text>Row per page</Text>
            <Select
              defaultValue={10}
              style={{ width: 80 }}
              onChange={(value) => handlePageChange(currentPage, value)}
              value={pageSize}
            >
              <Option value={10}>10</Option>
              <Option value={20}>20</Option>
              <Option value={50}>50</Option>
            </Select>
          </Space>

          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalRecords}
            onChange={handlePageChange}
            showSizeChanger={false}
          />
        </div>
      </div>

      {/* Modal Form Tambah/Edit Guru */}
      <Modal
        title={
          isEditing
            ? `Edit Teacher Information: ${currentTeacher?.name}`
            : "Add Teacher Information"
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden={true}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{
            academic_year_id: 1,
            gender: "male",
            is_active: true,
          }}
        >
          <Form.Item name="academic_year_id" hidden>
            <Input type="hidden" />
          </Form.Item>

          <Row gutter={24}>
            {/* NIY / NIP & NUPTK */}
            <Col span={12}>
              <Form.Item
                name="nip"
                label="NIY / NIP"
                rules={[{ required: true, message: "Please input NIY/NIP!" }]}
              >
                <Input placeholder="56625128890086" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nuptk" label="NUPTK">
                <Input placeholder="-" />
              </Form.Item>
            </Col>

            {/* Full Name & Join Date */}
            <Col span={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: "Please input full name!" }]}
              >
                <Input placeholder="Budi Santoso" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="join_date"
                label="Join Date"
                rules={[
                  { required: true, message: "Please select join date!" },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD"
                  placeholder="Select date"
                />
              </Form.Item>
            </Col>

            {/* Gender & Phone */}
            <Col span={12}>
              <Form.Item
                name="gender"
                label="Gender"
                rules={[{ required: true, message: "Please select gender!" }]}
              >
                <Select placeholder="L">
                  <Option value="male">L</Option>
                  <Option value="female">P</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[
                  { required: true, message: "Please input phone number!" },
                ]}
              >
                <Input placeholder="087654562622" />
              </Form.Item>
            </Col>

            {/* Email Address & Password access */}
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: "Please input email!" },
                  { type: "email", message: "Invalid email format!" },
                ]}
              >
                <Input placeholder="budisantoso@gmail.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              {!isEditing && (
                <Form.Item
                  name="password"
                  label="Password access"
                  rules={[
                    { required: !isEditing, message: "Please input password!" },
                  ]}
                >
                  <Input.Password placeholder="******" />
                </Form.Item>
              )}
              {isEditing && (
                <Form.Item
                  name="password"
                  label="Password access"
                  help="Kosongkan jika tidak ingin mengubah password."
                >
                  <Input.Password placeholder="******" />
                </Form.Item>
              )}
            </Col>

            {/* Status & Note */}
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Status"
                rules={[{ required: true, message: "Please select status!" }]}
              >
                <Select>
                  <Option value={true}>Active</Option>
                  <Option value={false}>Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="note" label="Note (for status Inactive)">
                <Input placeholder="-" />
              </Form.Item>
            </Col>

            {/* Upload Signature (1 kolom penuh) */}
            <Col span={24}>
              <Form.Item
                label="Upload Signature"
                name="signature"
                valuePropName="fileList"
                getValueFromEvent={normFile} // Menggunakan normFile yang sama
                extra={
                  isEditing
                    ? "Tanda tangan saat ini sudah ada. Upload baru untuk mengganti."
                    : "Unggah tanda tangan (PNG/JPG)"
                }
              >
                <Upload.Dragger {...uploadProps}>
                  <p className="ant-upload-drag-icon">
                    <UploadIcon />
                  </p>
                  <p className="ant-upload-text">Upload a File</p>
                  <p className="ant-upload-hint">Drag and drop files here</p>
                </Upload.Dragger>
              </Form.Item>
            </Col>

            {/* Tombol Aksi */}
            <Col span={24}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 10,
                }}
              >
                <Button
                  onClick={() => setIsModalOpen(false)}
                  style={{ marginRight: 8 }}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  Save
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default TeachersPage;
