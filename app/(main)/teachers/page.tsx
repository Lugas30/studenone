"use client";

import React, { useState, useEffect, Key, useCallback } from "react";
import axios, { AxiosError } from "axios";
// Import library sheetjs untuk membuat file Excel
import * as XLSX from "xlsx";
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
  Breadcrumb,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined as UploadIcon,
  UserAddOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileExcelOutlined, // Ikon untuk template Excel
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import moment from "moment";
import type { UploadProps } from "antd";

const { Title, Text } = Typography;
const { Option } = Select;

// ===================================
// 1. DATA TYPES AND API CONFIG
// ===================================

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
  created_at: string;
  updated_at: string;
}

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
  signature?: any;
}

interface TeacherApiResponse {
  academicYear: string;
  data: Teacher[];
  total: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const BASE_URL = `${API_URL}/teachers`;
const IMPORT_TEACHERS_ENDPOINT = `${API_URL}/teacher/import`;
const IMAGE_BASE_URL =
  process.env.NEXT_PUBLIC_API_IMAGE_URL ||
  "https://so-api.queensland.id/storage/";

// ===================================
// 2. DETAIL VIEW MODAL COMPONENT
// ===================================

interface DetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  teacher: Teacher | null;
}

const TeacherDetailModal: React.FC<DetailModalProps> = ({
  isVisible,
  onClose,
  teacher,
}) => {
  if (!teacher) return null;

  const data = [
    { label: "NIY / NIP", value: teacher.nip },
    { label: "NUPTK", value: teacher.nuptk || "-" },
    { label: "Full Name", value: teacher.name },
    {
      label: "Gender",
      value: teacher.gender === "male" ? "Laki-laki" : "Perempuan",
    },
    { label: "Phone", value: teacher.phone },
    { label: "Email", value: teacher.email },
    { label: "Password", value: teacher.password || "-" },
    {
      label: "Join Date",
      value: moment(teacher.join_date).format("DD MMMM YYYY"),
    },
    {
      label: "Status",
      value: teacher.is_active ? "Active" : "Non-Active",
      color: teacher.is_active ? "green" : "red",
    },
    { label: "Note", value: teacher.note || "-" },
    {
      label: "Created At",
      value: moment(teacher.created_at).format("DD/MM/YYYY HH:mm"),
    },
    {
      label: "Updated At",
      value: moment(teacher.updated_at).format("DD/MM/YYYY HH:mm"),
    },
  ];

  return (
    <Modal
      title={`Detail Teacher: ${teacher.name}`}
      open={isVisible}
      onCancel={onClose}
      footer={
        <Button onClick={onClose} type="primary">
          Close
        </Button>
      }
      width={600}
    >
      <Row gutter={[16, 16]}>
        {data.map((item) => (
          <Col span={12} key={item.label}>
            <Text strong>{item.label}:</Text>
            <br />
            <Text style={{ color: item.color }}>{item.value}</Text>
          </Col>
        ))}
        {teacher.signature && (
          <Col span={24}>
            <Text strong>Signature:</Text>
            <div
              style={{
                marginTop: 8,
                textAlign: "center",
                border: "1px solid #d9d9d9",
                padding: "10px",
              }}
            >
              <img
                src={`${IMAGE_BASE_URL}${teacher.signature}`}
                alt="Teacher Signature"
                style={{
                  maxWidth: "100%",
                  maxHeight: "150px",
                  objectFit: "contain",
                }}
              />
            </div>
          </Col>
        )}
      </Row>
    </Modal>
  );
};

// ===================================
// 3. COLUMN DEFINITION
// ===================================

const getColumns = (
  handleEdit: (record: Teacher) => void,
  handleDelete: (id: number) => void,
  handleView: (record: Teacher) => void
): ColumnsType<Teacher> => [
  {
    title: "NIY / NIP",
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
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
          type="text"
          style={{ color: "#1890ff" }}
          title="View Detail"
        />
        <Button
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
          type="text"
          style={{ color: "#faad14" }}
          title="Edit Data"
        />
        <Popconfirm
          title="Delete Teacher"
          description={`Are you sure you want to delete ${record.name}?`}
          onConfirm={() => handleDelete(record.id)}
          okText="Yes, Delete"
          cancelText="Cancel"
        >
          <Button
            icon={<DeleteOutlined />}
            type="text"
            danger
            title="Delete Data"
          />
        </Popconfirm>
      </Space>
    ),
  },
];

// ===================================
// 4. FORM MODAL COMPONENT
// ===================================

interface FormModalProps {
  isVisible: boolean;
  onClose: () => void;
  onFinish: (values: TeacherFormValues) => void;
  initialValues: Teacher | null;
  isEditing: boolean;
}

const normFile = (e: any) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

const TeacherFormModal: React.FC<FormModalProps> = ({
  isVisible,
  onClose,
  onFinish,
  initialValues,
  isEditing,
}) => {
  const [form] = Form.useForm<TeacherFormValues>();

  useEffect(() => {
    if (isVisible) {
      if (initialValues) {
        form.setFieldsValue({
          ...initialValues,
          join_date: moment(initialValues.join_date),
          nuptk: initialValues.nuptk || undefined,
          note: initialValues.note || undefined,
          password: undefined, // Selalu kosongkan password saat edit untuk keamanan
          signature: undefined,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          academic_year_id: 1,
          gender: "male",
          is_active: true,
        });
      }
    }
  }, [isVisible, initialValues, form]);

  const uploadProps: UploadProps = {
    name: "signature",
    multiple: false,
    maxCount: 1,
    listType: "picture",
    beforeUpload: () => false,
    accept: ".png,.jpg,.jpeg",
    action: undefined,
  };

  const title = isEditing
    ? `Edit Teacher Information: ${initialValues?.name}`
    : "Add Teacher Information";

  return (
    <Modal
      title={title}
      open={isVisible}
      onCancel={onClose}
      footer={null}
      destroyOnClose={true}
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
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
              rules={[{ required: true, message: "Please select join date!" }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
                placeholder="Select date"
              />
            </Form.Item>
          </Col>
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

          {/* FIELD PASSWORD DI FORM MODAL */}
          <Col span={12}>
            <Form.Item
              name="password"
              label="Password access"
              rules={
                !isEditing
                  ? [{ required: true, message: "Please input password!" }]
                  : []
              }
              help={
                isEditing
                  ? "Leave blank to keep the existing password."
                  : undefined
              }
            >
              <Input.Password placeholder="******" />
            </Form.Item>
          </Col>

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
              getValueFromEvent={normFile}
              extra={
                isEditing && initialValues?.signature
                  ? "Signature currently exists. Upload a new one to replace."
                  : "Upload signature (PNG/JPG)"
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

            {/* PRATINJAU GAMBAR TANDA TANGAN YANG SUDAH ADA */}
            {isEditing && initialValues?.signature && (
              <div style={{ marginBottom: 15 }}>
                <Text strong>Existing Signature:</Text>
                <div
                  style={{
                    marginTop: 8,
                    textAlign: "center",
                    border: "1px dashed #d9d9d9",
                    padding: "10px",
                  }}
                >
                  <img
                    src={`${IMAGE_BASE_URL}${initialValues.signature}`}
                    alt="Existing Signature"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100px",
                      objectFit: "contain",
                    }}
                  />
                </div>
              </div>
            )}
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
              <Button onClick={onClose} style={{ marginRight: 8 }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {isEditing ? "Update" : "Save"}
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

// ===================================
// 5. MAIN COMPONENT (DENGAN MASS UPLOAD BARU DAN PERBAIKAN)
// ===================================

const TeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentAcademicYear, setCurrentAcademicYear] = useState("Loading...");

  // --- 💡 STATE UNTUK MASS UPLOAD ---
  const [isMassUploadModalVisible, setIsMassUploadModalVisible] =
    useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  // ------------------------------------------

  // Fetch Data Guru
  const fetchTeachers = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const response = await axios.get<TeacherApiResponse>(
        `${BASE_URL}?page=${page}&limit=${limit}`
      );

      const { academicYear, data, total } = response.data;

      const mappedData = data.map((teacher) => ({
        ...teacher,
        key: teacher.id.toString(),
      }));

      setCurrentAcademicYear(academicYear || "N/A");
      setTotalRecords(total);
      setTeachers(mappedData);
      setCurrentPage(page);
      setPageSize(limit);
    } catch (error) {
      const err = error as AxiosError;
      console.error("Gagal memuat data guru:", err);
      toast.error(`Failed to load data: ${err.message}`, {
        position: "top-right",
      });
      setTeachers([]);
      setCurrentAcademicYear("Error Loading Year");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers(currentPage, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTeachers]);

  const handlePageChange = (page: number, size: number) => {
    fetchTeachers(page, size);
  };

  const handleView = (teacher: Teacher) => {
    setCurrentTeacher(teacher);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setIsEditing(true);
    setCurrentTeacher(teacher);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setCurrentTeacher(null);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setCurrentTeacher(null);
  };

  // Handler Submit Form (Create/Update) - Logika tetap sama
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

    const signatureFile = values.signature?.[0]?.originFileObj;
    if (signatureFile) {
      formData.append("signature", signatureFile);
    }

    const axiosConfig = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    try {
      let response;
      if (isEditing && currentTeacher) {
        formData.append("_method", "PUT");
        response = await axios.post(
          `${BASE_URL}/${currentTeacher.id}`,
          formData,
          axiosConfig
        );
        toast.success(
          response.data.message || "Teacher updated successfully! 📝",
          {
            position: "top-right",
          }
        );
      } else {
        response = await axios.post(BASE_URL, formData, axiosConfig);
        toast.success(
          response.data.message || "Teacher added successfully! ✅",
          {
            position: "top-right",
          }
        );
      }
      setIsFormModalOpen(false);
      fetchTeachers(currentPage, pageSize);
    } catch (error) {
      const err = error as AxiosError<{ message?: string; errors?: any }>;
      const errorMessage = err.response?.data?.message || err.message;
      console.error("Failed to save teacher data:", err.response?.data || err);
      toast.error(`Failed to save: ${errorMessage}`, {
        position: "top-right",
      });
    }
  };

  // Handler Delete (Simulasi/Ganti dengan aksi API DELETE)
  const handleDelete = async (id: number) => {
    try {
      // Ganti dengan await axios.delete(`${BASE_URL}/${id}`);
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`Teacher ID ${id} deleted successfully (Simulation)! 🗑️`, {
        position: "top-right",
      });
      fetchTeachers(currentPage, pageSize);
    } catch (error) {
      const err = error as AxiosError;
      toast.error(`Failed to delete: ${err.message}`, {
        position: "top-right",
      });
    }
  };

  // --- 💡 FUNGSI MASS UPLOAD BARU YANG DIREFRAKTOR ---

  // 6. Fungsi Download Template
  const handleDownloadTemplate = () => {
    const data = [
      {
        NIP: "NIP929875",
        NUPTK: "NUPTK401234",
        "NAMA LENGKAP": "Adi Maulana",
        "TGL DAFTAR": "2018-08-05",
        "JENIS KELAMIN": "Perempuan",
        "NO TELEPON": "08167419761",
        EMAIL: "adimaulana@studentone.id",
        PASSWORD: "pass9372",
        NOTE: "",
      },
      {
        NIP: "NIP458185",
        NUPTK: "NUPTK334742",
        "NAMA LENGKAP": "Oka Setiawan",
        "TGL DAFTAR": "2025-10-26",
        "JENIS KELAMIN": "Laki-laki",
        "NO TELEPON": "08689588151",
        EMAIL: "okasetiawan@studentone.id",
        PASSWORD: "pass9707",
        NOTE: "",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers");

    XLSX.writeFile(workbook, "Teachers.xlsx");

    toast.info("Template Teachers.xlsx berhasil diunduh.");
  };

  // 7. Fungsi utama yang menjalankan API POST/IMPORT
  const handleMassUpload = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file); // Key 'file' harus sesuai dengan API

    try {
      const response = await axios.post(IMPORT_TEACHERS_ENDPOINT, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(response.data.message || "Data guru berhasil diimpor! ✅");
      setIsMassUploadModalVisible(false); // Tutup modal
      setFileList([]); // Kosongkan list file
      fetchTeachers(1, pageSize); // Refresh data
    } catch (error: any) {
      console.error("Gagal Upload File:", error.response?.data || error);
      toast.error(
        error.response?.data?.message ||
          "Gagal mengimpor data. Pastikan format file sudah benar."
      );
      // Jangan reset fileList di sini agar user bisa coba lagi
    } finally {
      setLoading(false);
    }
  };

  // 8. Props untuk Komponen Upload yang disederhanakan
  const uploadProps: UploadProps = {
    accept: ".xlsx",
    maxCount: 1,
    fileList,
    onRemove: (file) => {
      // Filter file yang dihapus
      const newFileList = fileList.filter((item) => item.uid !== file.uid);
      setFileList(newFileList);
    },
    beforeUpload: (file: File) => {
      // Simpan file ke state, termasuk originFileObj
      const fileWithObj = {
        ...file,
        originFileObj: file,
        uid: file.name, // Gunakan nama file sebagai uid sementara
        name: file.name,
      };
      setFileList([fileWithObj] as any[]);
      return false; // Mencegah upload otomatis Ant Design
    },
    // Dummy customRequest untuk memenuhi tipe Ant Design, karena kita panggil manual
    customRequest: () => {
      return;
    },
  };
  // ------------------------------------------

  const columns = getColumns(handleEdit, handleDelete, handleView);

  return (
    <>
      <ToastContainer />
      <div style={{ background: "#fff", padding: "20px", borderRadius: "8px" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: "10px" }}>
          <Breadcrumb items={[{ title: "Home" }, { title: "Teachers" }]} />
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            borderBottom: "1px solid #f0f0f0",
            paddingBottom: "10px",
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            Teacher Management
          </Title>
          <Title level={3} style={{ margin: 0 }}>
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
            placeholder="Search teacher by name or NIP..."
            style={{ maxWidth: 300 }}
          />
          <Space>
            {/* *** TOMBOL MASS UPLOAD BARU *** */}
            <Button
              type="primary"
              style={{ backgroundColor: "green", borderColor: "green" }}
              icon={<UploadIcon />}
              onClick={() => setIsMassUploadModalVisible(true)}
            >
              Mass Upload
            </Button>
            {/* ******************************* */}
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => {
                setIsEditing(false);
                setCurrentTeacher(null);
                setIsFormModalOpen(true);
              }}
            >
              Add Teacher
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => toast.info("Download Function (Simulation) 📥")}
              title="Download Data"
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
          size="middle"
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
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
            }
          />
        </div>
      </div>

      {/* Modal Form Tambah/Edit Guru */}
      <TeacherFormModal
        isVisible={isFormModalOpen}
        onClose={handleCloseFormModal}
        onFinish={handleFormSubmit}
        initialValues={currentTeacher}
        isEditing={isEditing}
      />

      {/* Modal View Detail Guru */}
      <TeacherDetailModal
        isVisible={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        teacher={currentTeacher}
      />

      {/* *** MODAL MASS UPLOAD *** */}
      <Modal
        title="Mass Upload Teachers (.xlsx)"
        open={isMassUploadModalVisible}
        onCancel={() => {
          setIsMassUploadModalVisible(false);
          setFileList([]); // Reset file list saat modal ditutup
        }}
        footer={[
          <Button
            key="back"
            onClick={() => {
              setIsMassUploadModalVisible(false);
              setFileList([]);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            // Panggil fungsi handleMassUpload
            onClick={() => {
              const fileToUpload = fileList[0]?.originFileObj;
              if (fileToUpload) {
                // Panggil fungsi upload yang sudah direfaktor
                handleMassUpload(fileToUpload as File);
              } else {
                toast.warn("Silakan pilih file untuk diunggah.");
              }
            }}
            loading={loading}
            disabled={fileList.length === 0 || loading}
          >
            {loading ? "Uploading..." : "Upload File"}
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Typography.Paragraph>
            Pastikan file Excel yang Anda upload memiliki format tabel yang
            sesuai: **NIP, NUPTK, NAMA LENGKAP, TGL DAFTAR (YYYY-MM-DD), JENIS
            KELAMIN (Laki-laki/Perempuan), NO TELEPON, EMAIL, PASSWORD, NOTE**.
          </Typography.Paragraph>
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleDownloadTemplate}
            type="dashed"
            block
            style={{ marginBottom: 16 }}
          >
            Download Template **Teachers.xlsx**
          </Button>
          <Upload {...uploadProps}>
            <Button icon={<UploadIcon />} disabled={fileList.length > 0}>
              Select **.xlsx** File to Upload
            </Button>
          </Upload>
          {fileList.length > 0 && (
            <Typography.Text type="secondary" style={{ marginTop: 10 }}>
              File terpilih: **{fileList[0].name}**
            </Typography.Text>
          )}
        </Space>
      </Modal>
      {/* ******************************* */}
    </>
  );
};

export default TeachersPage;
