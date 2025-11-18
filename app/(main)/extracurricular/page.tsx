"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Breadcrumb,
  Typography,
  Table,
  Input,
  Button,
  Space,
  Switch,
  Modal,
  Form,
  Select,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const { Title, Text } = Typography;
const { Option } = Select;

// --- Interface Data API Lengkap ---
interface AcademicYear {
  id: number;
  year: string;
  is_active: boolean;
}

interface ExtracurricularData {
  id: number;
  academic_year_id: number;
  excul: string;
  vendor: string;
  pic: string;
  contact: string;
  type: "internal" | "external";
  email: string;
  password: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // academic_year: AcademicYear; // Hapus academic_year di sini karena data API baru tidak membutuhkannya
  key: string;
}

// 💡 Interface baru untuk respons API (sekarang memiliki properti tingkat atas)
interface ExtracurricularApiResponse {
  academicYear: string;
  data: ExtracurricularData[];
}

// --- Komponen Form Add/Edit Modal (Re-usable) ---
interface FormModalProps {
  isVisible: boolean;
  onClose: () => void;
  onFinish: (values: any) => void;
  initialValues?: ExtracurricularData | null;
  isEdit: boolean;
}

const ExtracurricularFormModal: React.FC<FormModalProps> = ({
  isVisible,
  onClose,
  onFinish,
  initialValues,
  isEdit,
}) => {
  const [form] = Form.useForm();

  // Atur nilai form saat modal dibuka atau initialValues berubah
  useEffect(() => {
    if (isVisible && initialValues) {
      form.setFieldsValue(initialValues);
    } else if (isVisible && !isEdit) {
      form.resetFields();
    }
  }, [isVisible, initialValues, isEdit, form]);

  const title = isEdit ? "Edit Extracurricular" : "Add Extracurricular";
  const submitText = isEdit ? "Update" : "Create";

  return (
    <Modal
      title={title}
      open={isVisible}
      onCancel={onClose}
      footer={null} // Hapus footer default
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialValues || { type: "internal" }}
      >
        <Form.Item
          name="excul"
          label="Extracurricular Name"
          rules={[{ required: true, message: "Please input the name!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="vendor"
          label="Vendor"
          rules={[{ required: true, message: "Please input the vendor!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="pic"
          label="PIC Name"
          rules={[{ required: true, message: "Please input the PIC name!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="contact"
          label="Contact Number"
          rules={[{ required: true, message: "Please input the contact!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="type"
          label="Type"
          rules={[{ required: true, message: "Please select the type!" }]}
        >
          <Select>
            <Option value="internal">Internal</Option>
            <Option value="external">External</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="email"
          label="Email (Account)"
          rules={[
            { required: true, message: "Please input the email!" },
            { type: "email", message: "Invalid email format!" },
          ]}
        >
          <Input />
        </Form.Item>
        {/* Password hanya di-require saat Add. Saat Edit, opsional */}
        <Form.Item
          name="password"
          label="Password (Account)"
          rules={
            !isEdit
              ? [{ required: true, message: "Please input the password!" }]
              : []
          }
        >
          <Input.Password
            placeholder={isEdit ? "Leave blank to keep existing password" : ""}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {submitText}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// --- Komponen Modal View Detail ---
interface DetailModalProps {
  data: ExtracurricularData | null;
  isVisible: boolean;
  onClose: () => void;
  academicYear: string; // Tambahkan prop tahun akademik
}

const DetailModal: React.FC<DetailModalProps> = ({
  data,
  isVisible,
  onClose,
  academicYear, // Gunakan prop tahun akademik
}) => {
  if (!data) return null;

  return (
    <Modal
      title="Detail Extracurricular"
      open={isVisible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Text strong>Extracurricular:</Text> <Text>{data.excul}</Text>
        <Text strong>Vendor:</Text> <Text>{data.vendor}</Text>
        <Text strong>PIC:</Text> <Text>{data.pic}</Text>
        <Text strong>Contact:</Text> <Text>{data.contact}</Text>
        <Text strong>Type:</Text> <Text>{data.type}</Text>
        <Text strong>Status:</Text>{" "}
        <Text>{data.is_active ? "Active" : "Inactive"}</Text>
        {/* DATA SENSITIF HANYA MUNCUL DI DETAIL */}
        <Title level={5} style={{ marginTop: 16, marginBottom: 8 }}>
          Account Information
        </Title>
        <Text strong>Email:</Text> <Text>{data.email}</Text>
        <Text strong>Password:</Text> <Text>{data.password}</Text>
        {/* END DATA SENSITIF */}
        <Title level={5} style={{ marginTop: 16, marginBottom: 8 }}>
          Academic Year
        </Title>
        {/* 💡 PERUBAHAN: Tampilkan tahun akademik dari state utama */}
        <Text strong>Year:</Text> <Text>{academicYear}</Text>
      </Space>
    </Modal>
  );
};

// =========================================================================
// --- KOMPONEN UTAMA ---
// =========================================================================

const ExtracurricularPage: React.FC = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [data, setData] = useState<ExtracurricularData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExtracurricularData | null>(
    null
  );
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // Mode untuk Add/Edit
  const [searchTerm, setSearchTerm] = useState("");
  // 💡 PERUBAHAN: State untuk menyimpan tahun akademik dari properti tingkat atas
  const [currentAcademicYear, setCurrentAcademicYear] = useState("Loading...");

  // --- 1. Fetch Data (GET) ---
  const fetchData = useCallback(async () => {
    if (!API_URL) {
      toast.error("API URL is not configured in .env");
      setCurrentAcademicYear("Error");
      return;
    }

    setLoading(true);
    try {
      // 💡 PERUBAHAN: Mendefinisikan tipe respons sebagai ExtracurricularApiResponse
      const response = await axios.get<ExtracurricularApiResponse>(
        `${API_URL}/extracurriculars`
      );

      const apiData = response.data.data;
      const academicYear = response.data.academicYear;

      const mappedData: ExtracurricularData[] = apiData.map(
        (item: ExtracurricularData) => ({
          ...item,
          key: item.id.toString(),
        })
      );
      setData(mappedData);

      // 💡 PERUBAHAN: Mengambil tahun akademik dari properti tingkat atas
      setCurrentAcademicYear(academicYear || "N/A");
    } catch (error) {
      toast.error("Failed to fetch extracurricular data.");
      console.error("Error fetching data:", error);
      setCurrentAcademicYear("Error Loading Year");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 2. Handle Status Toggle (PUT Status) ---
  const handleStatusToggle = async (id: number, currentStatus: boolean) => {
    if (!API_URL) return;

    // Optimistic Update
    setData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, is_active: !currentStatus } : item
      )
    );

    try {
      const response = await axios.put(
        `${API_URL}/extracurriculars/${id}/status`
      );

      toast.success(
        response.data.message ||
          `Status updated successfully to ${
            !currentStatus ? "Active" : "Inactive"
          }!`
      );
      // fetchData(); // Boleh di uncomment jika ingin memastikan data dari server
    } catch (error) {
      // Rollback jika gagal
      setData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, is_active: currentStatus } : item
        )
      );

      toast.error("Failed to update status.");
      console.error("Error updating status:", error);
    }
  };

  // --- 3. Handle Add (POST) ---
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    setIsFormModalVisible(true);
  };

  const handleCreateExtracurricular = async (values: any) => {
    if (!API_URL) return;

    try {
      const response = await axios.post(`${API_URL}/extracurriculars`, values);

      toast.success(
        response.data.message || "Extracurricular Created Successfully!"
      );
      setIsFormModalVisible(false);
      fetchData();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to add new extracurricular.";
      toast.error(errorMessage);
      console.error("Error adding data:", error);
    }
  };

  // --- 4. Handle Edit (PUT) ---
  const handleOpenEditModal = (record: ExtracurricularData) => {
    setIsEditMode(true);
    setSelectedItem(record);
    setIsFormModalVisible(true);
  };

  const handleUpdateExtracurricular = async (values: any) => {
    if (!API_URL || !selectedItem) return;

    try {
      // Hilangkan password dari payload jika kosong (tidak diubah)
      const payload = { ...values };
      if (payload.password === "") {
        delete payload.password;
      }

      const response = await axios.put(
        `${API_URL}/extracurriculars/${selectedItem.id}`,
        payload
      );

      toast.success(
        response.data.message || "Extracurricular Updated Successfully!"
      );
      setIsFormModalVisible(false);
      fetchData();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to update extracurricular.";
      toast.error(errorMessage);
      console.error("Error updating data:", error);
    }
  };

  // --- 5. Handle View Detail ---
  const handleViewDetail = (record: ExtracurricularData) => {
    setSelectedItem(record);
    setIsDetailModalVisible(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalVisible(false);
    setSelectedItem(null);
  };

  const handleCloseFormModal = () => {
    setIsFormModalVisible(false);
    setSelectedItem(null);
  };

  // --- 6. Filtering Data ---
  const filteredData = data.filter(
    (item) =>
      item.excul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- DEFINISI KOLOM TABLE (Tanpa Email & Password) ---
  const columns = [
    {
      title: "Extracurricular",
      dataIndex: "excul",
      key: "excul",
      sorter: (a: ExtracurricularData, b: ExtracurricularData) =>
        a.excul.localeCompare(b.excul),
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Vendor",
      dataIndex: "vendor",
      key: "vendor",
    },
    {
      title: "PIC",
      dataIndex: "pic",
      key: "pic",
    },
    {
      title: "Contact",
      dataIndex: "contact",
      key: "contact",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: "internal" | "external") => (
        <Text type={type === "external" ? "success" : "secondary"}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive: boolean, record: ExtracurricularData) => (
        <Switch
          checked={isActive}
          onChange={() => handleStatusToggle(record.id, isActive)}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: ExtracurricularData) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EyeOutlined style={{ color: "#8c8c8c" }} />}
            onClick={() => handleViewDetail(record)}
            title="View Detail (Termasuk Email & Password)"
          />
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#1890ff" }} />}
            onClick={() => handleOpenEditModal(record)}
            title="Edit"
          />
        </Space>
      ),
    },
  ];

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

      {/* 1. Breadcrumb */}
      <Breadcrumb items={[{ title: "Home" }, { title: "Extracurricular" }]} />

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
          Extracurricular
        </Title>
        <Title level={3} style={{ color: "#888", margin: 0 }}>
          {/* 💡 Tampilkan state tahun akademik dari properti tingkat atas */}
          <span className="font-bold text-zinc-800">{currentAcademicYear}</span>
        </Title>
      </div>

      {/* 3. Toolbar: Search & Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <Input
          placeholder="Search extracurricular, vendor, or PIC..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenAddModal}
          >
            Add Extracurricular
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => toast.info("Downloading data... (Export Logic)")}
          />
        </Space>
      </div>

      {/* 4. Table */}
      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{ pageSize: 10 }}
        size="large"
        style={{ border: "1px solid #f0f0f0", borderRadius: "4px" }}
      />

      {/* 5. Modal View Detail (untuk menampilkan email & password) */}
      <DetailModal
        data={selectedItem}
        isVisible={isDetailModalVisible}
        onClose={handleCloseDetailModal}
        academicYear={currentAcademicYear} // 💡 LEWATKAN TAHUN AKADEMIK
      />

      {/* 6. Modal Form Add/Edit */}
      <ExtracurricularFormModal
        isVisible={isFormModalVisible}
        onClose={handleCloseFormModal}
        onFinish={
          isEditMode ? handleUpdateExtracurricular : handleCreateExtracurricular
        }
        initialValues={isEditMode ? selectedItem : null}
        isEdit={isEditMode}
      />
    </>
  );
};

export default ExtracurricularPage;
