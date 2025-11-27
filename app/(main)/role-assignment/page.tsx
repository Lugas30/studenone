"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Table,
  Button,
  Input,
  Space,
  Typography,
  Breadcrumb,
  Row,
  Col,
  Pagination,
  Select,
  Alert,
  Spin,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  UploadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import Modal yang telah di-update untuk menggunakan API
import AddEditRoleModal from "../../components/AddEditRoleModal"; // Pastikan path file benar

const { Title, Text } = Typography;
const { Option } = Select;

// Ambil base URL dari .env
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_ENDPOINT = `${BASE_URL}/role-teachers`;

// =======================================================
// 1. DEFINISI TIPE API
// =======================================================

interface Role {
  id: number; // Tambahkan ID Role untuk kebutuhan Edit
  role: string;
}

interface RoleAssignment {
  role: Role;
}

interface Teacher {
  id: number; // Tambahkan ID Teacher untuk kebutuhan Edit
  nip: string;
  name: string;
  gender: "male" | "female";
}

interface RoleTeacherItem {
  id: number; // ID RoleTeacher untuk Edit/Delete
  teacher: Teacher;
  role_teacher_assignments: RoleAssignment[];
  class_id: number | null; // Tambahkan class_id untuk kebutuhan Edit Homebase
}

interface RoleTeacherResponse {
  academicYear: string;
  data: RoleTeacherItem[];
}

// Tipe Data untuk Table (Flat Data)
interface TeacherRoleData {
  key: number;
  id: number; // ID RoleTeacher
  teacherId: number; // ID Guru
  NIP: string;
  teacherName: string;
  gender: "L" | "P";
  role: string; // Gabungan dari semua peran (string)
  roleIds: number[]; // ID Role dalam bentuk array (untuk modal edit)
  classId: number | undefined; // ID Homebase (untuk modal edit)
}

// =======================================================
// 2. KOMPONEN HALAMAN UTAMA
// =======================================================

const RoleAssignmentPage: React.FC = () => {
  const [data, setData] = useState<TeacherRoleData[]>([]);
  const [academicYear, setAcademicYear] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk Modal Add/Edit
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editData, setEditData] = useState<any>(null);

  // State untuk Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalRecords = 500; // Total record disimulasikan
  const [goToPageInput, setGoToPageInput] = useState("1");

  // --- Data Fetching (useCallback) ---
  const fetchData = useCallback(async () => {
    if (!BASE_URL) {
      setError("Error: NEXT_PUBLIC_API_URL is not defined in .env");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Catatan: API Anda sepertinya tidak mendukung pagination,
      // jadi ini hanya mengambil semua data. Untuk pagination real,
      // Anda perlu menambahkan parameter page dan limit ke API_ENDPOINT.
      const response = await axios.get<RoleTeacherResponse>(API_ENDPOINT);
      const apiData = response.data;

      setAcademicYear(apiData.academicYear);

      // Mapping dan Transformasi Data API ke format Table
      const mappedData: TeacherRoleData[] = apiData.data.map((item, index) => {
        const roleAssignments = item.role_teacher_assignments;

        const rolesString = roleAssignments
          .map((assignment) => assignment.role.role)
          .join(", ");

        const roleIdsArray = roleAssignments.map(
          (assignment) => assignment.role.id
        );

        return {
          key: item.id || index,
          id: item.id,
          teacherId: item.teacher.id,
          NIP: item.teacher.nip || "-",
          teacherName: item.teacher.name || "Nama Tidak Ditemukan",
          gender: item.teacher.gender === "male" ? "L" : "P",
          role: rolesString || "No Role Assigned",
          roleIds: roleIdsArray,
          classId: item.class_id || undefined,
        };
      });

      setData(mappedData);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch teacher roles from API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handler Modal ---
  const handleOpenAdd = () => {
    setModalMode("add");
    setEditData(null);
    setIsModalVisible(true);
  };

  const handleOpenEdit = (record: TeacherRoleData) => {
    setModalMode("edit");
    setEditData({
      id: record.id,
      teacherId: record.teacherId,
      roleIds: record.roleIds,
      classId: record.classId,
    });
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditData(null);
  };

  // Dipanggil setelah sukses Add/Edit di Modal
  const handleSuccess = () => {
    // Tampilkan toast success sudah dilakukan di modal
    fetchData(); // Muat ulang data tabel
  };

  // --- Handler Delete ---
  const handleDelete = async (id: number) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus data role guru dengan ID: ${id}?`
      )
    ) {
      try {
        // API DELETE: {{base_url}}/role-teachers/{id}
        await axios.delete(`${API_ENDPOINT}/${id}`);
        toast.success("Data peran guru berhasil dihapus!");
        fetchData();
      } catch (error) {
        let errorMessage = "Gagal menghapus data.";
        if (axios.isAxiosError(error) && error.response) {
          errorMessage = error.response.data.message || errorMessage;
        }
        toast.error(errorMessage);
      }
    }
  };

  // --- Kolom Tabel ---
  const columns: ColumnsType<TeacherRoleData> = [
    {
      title: "NIP",
      dataIndex: "NIP",
      key: "NIP",
      sorter: (a, b) => a.NIP.localeCompare(b.NIP),
      width: 120,
    },
    {
      title: "Teacher Name",
      dataIndex: "teacherName",
      key: "teacherName",
      sorter: (a, b) => a.teacherName.localeCompare(b.teacherName),
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
      sorter: (a, b) => a.gender.localeCompare(b.gender),
      width: 100,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      sorter: (a, b) => a.role.localeCompare(b.role),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      align: "right",
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            size="small"
            title="View"
            style={{ border: "none" }}
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            title="Edit"
            onClick={() => handleOpenEdit(record)} // Trigger Edit Modal
            style={{ color: "#1890ff", border: "none" }}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            title="Delete"
            onClick={() => handleDelete(record.id)} // Trigger Delete
            style={{ color: "#ff4d4f", border: "none" }}
          />
          <Button
            size="small"
            icon={<DownOutlined />}
            style={{
              border: "none",
              padding: "0 5px",
              transform: "rotate(-90deg)",
            }}
          />
        </Space>
      ),
    },
  ];

  // --- Fungsi Pagination Kustom (Sama seperti sebelumnya) ---
  const handleGoToPage = () => {
    const page = parseInt(goToPageInput);
    const maxPage = Math.ceil(totalRecords / pageSize);
    if (page >= 1 && page <= maxPage) {
      setCurrentPage(page);
    } else {
      toast.error(`Halaman harus antara 1 dan ${maxPage}`);
    }
  };

  // Hanya untuk simulasi tampilan seperti gambar
  const customItemRender = (
    current: number,
    type: "page" | "prev" | "next" | "jump-prev" | "jump-next",
    originalElement: React.ReactNode
  ) => {
    if (type === "page") {
      const pagesToShow = [
        1,
        4,
        5,
        6,
        7,
        8,
        Math.ceil(totalRecords / pageSize),
      ];
      if (pagesToShow.includes(current)) {
        return (
          <a
            style={{ fontWeight: current === currentPage ? "bold" : "normal" }}
          >
            {current}
          </a>
        );
      }
      if (current === 2 || current === Math.ceil(totalRecords / pageSize) - 1) {
        return "...";
      }
      return null;
    }
    return originalElement;
  };

  // --- Tampilan Loading dan Error ---
  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Spin size="large" tip="Loading Data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "24px" }}>
        <Alert message="Error" description={error} type="error" showIcon />
      </div>
    );
  }

  // --- Tampilan Utama ---
  return (
    <div style={{ padding: "24px", background: "#fff", minHeight: "100vh" }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Breadcrumb style={{ marginBottom: 8, color: "#999" }}>
            <Breadcrumb.Item>Home</Breadcrumb.Item>
            <Breadcrumb.Item>Role</Breadcrumb.Item>
          </Breadcrumb>
          <Title level={2} style={{ margin: 0 }}>
            Role Assignment
          </Title>
        </Col>
        <Col>
          <Title level={2} style={{ margin: 0, color: "#999" }}>
            {academicYear}
          </Title>
        </Col>
      </Row>

      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Input
            placeholder="Search NIP or Name"
            prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
            style={{ width: 300, padding: 10, borderRadius: 4 }}
          />
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              style={{
                backgroundColor: "#28a745",
                borderColor: "#28a745",
                color: "#fff",
              }}
              icon={<UploadOutlined />}
              size="large"
            >
              Mass Upload
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={handleOpenAdd} // Trigger Add Modal
            >
              Add Teacher
            </Button>
            <Button icon={<DownOutlined />} size="large" />
          </Space>
        </Col>
      </Row>

      {/* TABEL dengan Data dari API */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id" // Gunakan ID unik dari API
        pagination={false}
        bordered={false}
        size="middle"
        style={{ marginBottom: 16 }}
      />

      {/* FOOTER: Pagination Kustom */}
      <Row justify="space-between" align="middle">
        <Col>
          <Space size="middle">
            <Text>Row per page</Text>
            <Select
              value={pageSize.toString()}
              onChange={() => {
                /* logika perubahan page size */
              }}
              style={{ width: 70 }}
              disabled // Dinonaktifkan karena simulasi data
            >
              <Option value="10">10</Option>
            </Select>
            <Text>Go to</Text>
            <Input
              value={goToPageInput}
              onChange={(e) => setGoToPageInput(e.target.value)}
              onPressEnter={handleGoToPage}
              style={{ width: 50, textAlign: "center" }}
            />
          </Space>
        </Col>
        <Col>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalRecords}
            onChange={(page) => setCurrentPage(page)}
            itemRender={customItemRender}
            showSizeChanger={false}
            hideOnSinglePage={true}
          />
        </Col>
      </Row>

      {/* MODAL ADD/EDIT */}
      <AddEditRoleModal
        isVisible={isModalVisible}
        mode={modalMode}
        initialData={editData}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />

      {/* Toast Container untuk notifikasi */}
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
    </div>
  );
};

export default RoleAssignmentPage;
