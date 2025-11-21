"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Row,
  Col,
  Layout,
  Breadcrumb,
  Spin,
  Pagination,
  Tag,
  Modal,
  Select, // Diperlukan untuk "Row per page"
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { toast } from "react-toastify";
import axios from "axios";
import {
  SearchOutlined,
  UploadOutlined, // Dipertahankan untuk Mass Upload
  UserAddOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

// --- Impor Komponen Modal ---
import AddTeacherRoleModal from "../../components/AddTeacherRoleModal";
import EditTeacherRoleModal from "../../components/EditTeacherRoleModal";
import ViewTeacherRoleModal from "../../components/ViewTeacherRoleModal";

const { Content } = Layout;
const { Option } = Select;

// Ambil BASE URL dari .env
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// --- 1. Definisi Tipe Data (Disesuaikan dengan data API) ---

interface RoleAssignmentTableData {
  id: number;
  nip: string;
  teacherName: string;
  gender: string;
  roles: string[];
  homebaseClass: string;
  key: string;
}

// --- 2. Komponen RoleAssignmentPage ---

export default function RoleAssignmentPage() {
  const [data, setData] = useState<RoleAssignmentTableData[]>([]);
  const [academicYear, setAcademicYear] = useState("");
  const [loading, setLoading] = useState(false);

  // State Modal & Record ID
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  // State untuk Pencarian dan Pagination
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Logika Filter Data
  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.teacherName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.nip.toLowerCase().includes(searchText.toLowerCase()) ||
        item.roles.some((role) =>
          role.toLowerCase().includes(searchText.toLowerCase())
        )
    );
  }, [data, searchText]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Logika Pagination Data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, pageSize]);

  // --- 3. Fungsi Fetch Data dari API ---
  const fetchData = useCallback(async () => {
    if (!API_BASE_URL) return toast.error("API URL tidak terdefinisi.");

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/role-teachers`);
      const apiData = response.data.data;

      setAcademicYear(response.data.academicYear || "Tahun Akademik N/A");

      const mappedData: RoleAssignmentTableData[] = apiData.map((item: any) => {
        const roles = item.role_teacher_assignments.map(
          (a: any) => a.role.role
        );

        const homebaseAssignment = item.role_teacher_assignments.find(
          (a: any) =>
            (a.role.role === "Homeroom Teacher" ||
              a.role.role === "Homeroom Assistant") &&
            a.class_id
        );

        const homebaseClass = homebaseAssignment
          ? `${homebaseAssignment.class.code} - ${homebaseAssignment.class.class_name}`
          : "-";

        return {
          id: item.id,
          nip: item.teacher.nip || item.teacher.nuptk || "-",
          teacherName: item.teacher.name,
          gender: item.teacher.gender === "male" ? "L" : "P", // Menggunakan L/P sesuai kode Anda
          roles: roles,
          homebaseClass: homebaseClass,
          key: item.id.toString(),
        };
      });

      setData(mappedData);
    } catch (error) {
      console.error("Error fetching role assignments:", error);
      toast.error("Gagal memuat data Role Assignment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 4. Handlers untuk Aksi dan Pagination ---

  const handlePageChange = (page: number, size: number) => {
    // Pastikan ukuran page tidak berubah jika hanya menavigasi halaman
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
    }
  };

  const handleGoToPage = (val: number) => {
    if (val >= 1 && val <= totalPages) {
      setCurrentPage(val);
    }
  };

  const handleView = (id: number) => {
    setSelectedRecordId(id);
    setIsViewModalOpen(true);
  };

  const handleEdit = (id: number) => {
    setSelectedRecordId(id);
    setIsEditModalOpen(true);
  };

  const handleDelete = (record: RoleAssignmentTableData) => {
    Modal.confirm({
      title: "Hapus Role Assignment",
      content: `Apakah Anda yakin ingin menghapus peran untuk guru ${record.teacherName} (NIP: ${record.nip})?`,
      okText: "Hapus",
      okType: "danger",
      cancelText: "Batal",
      onOk: async () => {
        if (!API_BASE_URL) return toast.error("API URL tidak terdefinisi.");
        try {
          await axios.delete(`${API_BASE_URL}/role-teachers/${record.id}`);
          toast.success("Peran guru berhasil dihapus!");
          fetchData();
        } catch (error: any) {
          console.error("Error deleting record:", error);
          toast.error(
            error.response?.data?.message || "Gagal menghapus peran guru."
          );
        }
      },
    });
  };

  // Sembunyikan pagination bawaan Table Ant Design
  const customPaginationConfig: TablePaginationConfig = {
    style: { display: "none" },
  };

  // --- 5. Definisi Kolom Tabel ---

  const columns: ColumnsType<RoleAssignmentTableData> = [
    {
      title: "NIY/NIP",
      dataIndex: "nip",
      key: "nip",
      width: 120,
      sorter: (a, b) => a.nip.localeCompare(b.nip),
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
      width: 100,
      sorter: (a, b) => a.gender.localeCompare(b.gender),
    },
    {
      title: "Role",
      dataIndex: "roles",
      key: "roles",
      render: (roles: string[]) => (
        // Menggunakan Tag untuk visualisasi Role yang lebih baik daripada string polos
        <Space size={[0, 8]} wrap>
          {roles.map((role) => (
            <Tag
              key={role}
              color={role.includes("Homeroom") ? "blue" : "geekblue"}
            >
              {role}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Homebase", // Kolom tambahan dari data API
      dataIndex: "homebaseClass",
      key: "homebaseClass",
      width: 150,
      sorter: (a, b) => a.homebaseClass.localeCompare(b.homebaseClass),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          {/* View */}
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleView(record.id)}
            type="text"
            title="View Detail"
            style={{ color: "#1890ff", padding: "0 4px" }}
          />
          {/* Edit */}
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id)}
            type="text"
            title="Edit Role"
            style={{ color: "#faad14", padding: "0 4px" }}
          />
          {/* Delete */}
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            type="text"
            title="Delete Role"
            style={{ color: "#ff4d4f", padding: "0 4px" }}
          />
        </Space>
      ),
    },
  ];

  // --- 6. Render Komponen ---

  return (
    <Layout style={{ padding: "0 24px 24px", background: "#fff" }}>
      {/* 6.1. Header Halaman */}
      <div style={{ padding: "16px 0 24px 0" }}>
        <Breadcrumb items={[{ title: "Home" }, { title: "Role Assignment" }]} />
        <Row justify="space-between" align="middle" style={{ marginTop: 10 }}>
          <Col>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 500 }}>
              Role Assignment
            </h1>
          </Col>
          <Col>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 500 }}>
              {academicYear}
            </h1>
          </Col>
        </Row>
      </div>

      <Content>
        <Spin spinning={loading} tip="Loading data...">
          {/* 6.2. Search dan Action Buttons */}
          <Row
            gutter={16}
            justify="space-between"
            align="middle"
            style={{ marginBottom: 16 }}
          >
            {/* Search Input */}
            <Col flex="300px">
              <Input
                prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                placeholder="Search NIP or Name"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1); // Reset halaman saat mencari
                }}
                style={{ width: "100%" }}
              />
            </Col>

            {/* Action Buttons */}
            <Col>
              <Space>
                <Button
                  type="primary"
                  style={{ backgroundColor: "#28a745", borderColor: "#28a745" }}
                  icon={<UploadOutlined />}
                  disabled={true} // Nonaktifkan, fungsi belum ada
                >
                  Mass Upload
                </Button>
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={() => setIsModalOpen(true)} // Aksi buka modal Add
                >
                  Add Teacher Role
                </Button>
                <Button icon={<DownloadOutlined />} disabled={true} />
              </Space>
            </Col>
          </Row>

          {/* 6.3. Tabel Data */}
          <Table
            columns={columns}
            dataSource={paginatedData}
            rowKey="id" // Menggunakan ID sebagai key
            pagination={customPaginationConfig}
            size="middle"
            scroll={{ x: "max-content" }}
            // Style untuk membatasi tabel (sesuai kode Anda)
            style={{ border: "1px solid #f0f0f0", borderBottom: "none" }}
          />

          {/* 6.4. Custom Footer/Pagination Bawah */}
          <Row
            justify="space-between"
            align="middle"
            style={{
              padding: "8px 0",
              borderTop: "1px solid #f0f0f0",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            {/* Pengaturan Baris per Halaman & Go To */}
            <Col>
              <Space>
                <span style={{ color: "rgba(0,0,0,0.65)" }}>Row per page</span>
                <Select
                  value={pageSize}
                  onChange={(value: number) => handlePageChange(1, value)}
                  style={{ width: 70 }}
                  size="small"
                >
                  <Option value={10}>10</Option>
                  <Option value={20}>20</Option>
                  <Option value={50}>50</Option>
                </Select>

                {/* Pindah Go To ke sini */}
                <span style={{ color: "rgba(0,0,0,0.65)", marginLeft: 16 }}>
                  Go to
                </span>
                <Input
                  type="number"
                  value={currentPage}
                  min={1}
                  max={totalPages}
                  onChange={(e) => handleGoToPage(Number(e.target.value))}
                  style={{ width: 50, textAlign: "center" }}
                  size="small"
                />

                {/* Tampilkan total item/halaman jika diperlukan */}
                <span style={{ color: "rgba(0,0,0,0.65)", marginLeft: 16 }}>
                  Total: {totalItems} items
                </span>
              </Space>
            </Col>

            {/* Komponen Pagination Ant Design */}
            <Col>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalItems}
                onChange={handlePageChange}
                showSizeChanger={false}
                size="small"
                // ItemRender digunakan untuk mendapatkan style pagination Anda
                itemRender={(page, type, originalElement) => {
                  if (type === "page") {
                    const isCurrent = page === currentPage;
                    return (
                      <span
                        style={{
                          padding: "0 8px",
                          border: isCurrent
                            ? "1px solid #1890ff"
                            : "1px solid #d9d9d9",
                          borderRadius: "2px",
                          backgroundColor: isCurrent ? "#e6f7ff" : "#fff",
                          color: isCurrent ? "#1890ff" : "rgba(0,0,0,0.85)",
                          cursor: "pointer",
                          display: "inline-block",
                        }}
                        onClick={() => handlePageChange(page, pageSize)}
                      >
                        {page}
                      </span>
                    );
                  }
                  return originalElement;
                }}
              />
            </Col>
          </Row>
        </Spin>
      </Content>

      {/* --- Modals (Fungsionalitas Sistem) --- */}

      {/* Modal Tambah Peran Guru */}
      <AddTeacherRoleModal
        isModalOpen={isModalOpen}
        handleCancel={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* Modal Edit Peran Guru */}
      {selectedRecordId !== null && (
        <EditTeacherRoleModal
          isModalOpen={isEditModalOpen}
          handleCancel={() => {
            setIsEditModalOpen(false);
            setSelectedRecordId(null);
          }}
          onSuccess={fetchData}
          recordId={selectedRecordId}
        />
      )}

      {/* Modal View Peran Guru */}
      {selectedRecordId !== null && (
        <ViewTeacherRoleModal
          isModalOpen={isViewModalOpen}
          handleCancel={() => {
            setIsViewModalOpen(false);
            setSelectedRecordId(null);
          }}
          recordId={selectedRecordId}
        />
      )}
    </Layout>
  );
}
