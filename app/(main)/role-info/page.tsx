"use client";

import {
  Breadcrumb,
  Typography,
  Divider,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Spin,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
// Catatan: Impor CSS dihilangkan karena menyebabkan error di lingkungan build.
// Pastikan 'react-toastify/dist/ReactToastify.css' diimpor secara global di file root proyek Anda.

const { Title } = Typography;

// Definisikan struktur data Role
interface Role {
  id: number;
  role: string;
  role_type: number;
  created_at: string | null;
  updated_at: string | null;
}

// Konfigurasi API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const ROLES_ENDPOINT = `${API_BASE_URL}/roles`;

export default function RoleInfoPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();

  // --- API OPERATIONS ---

  // 1. GET: Fetch Roles Data
  const fetchRoles = async () => {
    setLoading(true);
    try {
      // Menggunakan ROLES_ENDPOINT untuk mengambil data peran
      const response = await axios.get(ROLES_ENDPOINT);
      setRoles(response.data);
      toast.success("Data peran berhasil dimuat!");
    } catch (error) {
      toast.error("Gagal memuat data peran.");
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // 2. POST / PUT: Handle Form Submission
  const handleFormSubmit = async (values: {
    role: string;
    role_type: number;
  }) => {
    setIsSubmitting(true);
    try {
      if (editingRole) {
        // PUT: Update existing role
        // Endpoint: /roles/{id}
        await axios.put(`${ROLES_ENDPOINT}/${editingRole.id}`, values);
        toast.success(`Peran "${values.role}" berhasil diperbarui.`);
      } else {
        // POST: Create new role
        // Endpoint: /roles
        await axios.post(ROLES_ENDPOINT, values);
        toast.success(`Peran "${values.role}" berhasil ditambahkan.`);
      }

      // Tutup modal dan muat ulang data
      setIsModalVisible(false);
      await fetchRoles();
    } catch (error) {
      // Menangani error dari respons API (jika ada)
      const errorMessage =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        `Gagal ${editingRole ? "memperbarui" : "menambahkan"} peran.`;

      toast.error(errorMessage);
      console.error("Error submitting role:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- MODAL HANDLERS ---

  const showAddModal = () => {
    setEditingRole(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (role: Role) => {
    setEditingRole(role);
    // Set nilai form dengan data peran yang akan diedit
    form.setFieldsValue({
      role: role.role,
      role_type: role.role_type,
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // --- TABLE CONFIGURATION ---

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a: Role, b: Role) => a.id - b.id,
      width: 80,
    },
    {
      title: "Nama Peran",
      dataIndex: "role",
      key: "role",
      sorter: (a: Role, b: Role) => a.role.localeCompare(b.role),
    },
    {
      title: "Tipe Peran",
      dataIndex: "role_type",
      key: "role_type",
      sorter: (a: Role, b: Role) => a.role_type - b.role_type,
      width: 150,
    },
    {
      title: "Aksi",
      key: "action",
      width: 100,
      render: (_: any, record: Role) => (
        <Button
          icon={<EditOutlined />}
          onClick={() => showEditModal(record)}
          type="primary"
          ghost
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8">
      {/* ToastContainer diletakkan di sini untuk menampilkan notifikasi */}
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Breadcrumb */}
      <Breadcrumb items={[{ title: "Home" }, { title: "Role info" }]} />

      {/* Header */}
      <div className="flex justify-between items-center mt-4">
        <Title level={1} className="text-3xl font-bold m-0">
          Role Info
        </Title>
        <Title level={3} className="text-gray-500 m-0 text-xl">
          2024-2025
        </Title>
      </div>

      <Divider />

      {/* Main Content Area */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <Title level={4} className="m-0 text-2xl">
            Daftar Peran
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showAddModal}
            className="h-10 px-6 font-semibold"
          >
            Tambah Peran Baru
          </Button>
        </div>

        {/* Role Table */}
        <Spin spinning={loading} tip="Memuat data...">
          <Table
            dataSource={roles}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 600 }}
            className="w-full"
            bordered
          />
        </Spin>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={editingRole ? "Edit Peran" : "Tambah Peran Baru"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null} // Custom footer for loading state
        destroyOnClose={true}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          // Nilai awal diatur saat memanggil form.setFieldsValue di showEditModal
          initialValues={{ role: "", role_type: 1 }}
        >
          <Form.Item
            name="role"
            label="Nama Peran"
            rules={[
              { required: true, message: "Masukkan nama peran!" },
              { min: 3, message: "Nama peran minimal 3 karakter." },
            ]}
          >
            <Input placeholder="Contoh: Subject Teacher" />
          </Form.Item>

          <Form.Item
            name="role_type"
            label="ID Tipe Peran (Role Type)"
            rules={[
              { required: true, message: "Masukkan ID tipe peran!" },
              { type: "number", min: 1, message: "ID harus angka positif." },
            ]}
          >
            <InputNumber
              placeholder="Contoh: 4"
              style={{ width: "100%" }}
              min={1}
              step={1}
              controls={false}
            />
          </Form.Item>

          <Form.Item className="mt-6">
            <Space className="w-full justify-end">
              <Button onClick={handleCancel} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                {editingRole ? "Simpan Perubahan" : "Tambah Peran"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
