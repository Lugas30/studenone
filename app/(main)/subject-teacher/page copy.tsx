"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify"; // Import toast dari react-toastify
import {
  Table,
  Button,
  Input,
  Space,
  Row,
  Col,
  Breadcrumb,
  Dropdown,
  Menu,
  Pagination,
  Spin, // Tambahkan Spin untuk loading
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  CaretDownOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";

// Ambil URL dasar dari .env
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_ENDPOINT = "/subject-teachers";

// --- I. Data Types (Interface) ---
// Perbarui interface SubjectTeacherData sesuai dengan format yang akan digunakan untuk tabel
export interface SubjectTeacherData {
  id: number;
  NIP: string;
  teacherName: string;
  subjects: string;
  classList: string;
  semester: "Ganjil" | "Genap" | "N/A";
}

// Interface untuk data dari API (opsional, tapi bagus untuk type safety)
interface ApiSubjectTeacher {
  id: number;
  is_ganjil: boolean;
  is_genap: boolean;
  subject: {
    name: string;
  };
  teacher: {
    nip: string;
    name: string;
  };
  subject_teacher_classes: {
    classroom: {
      code: string;
    };
  }[];
}

interface ApiResponse {
  academicYear: string;
  data: ApiSubjectTeacher[];
}

// --- II. Definisi Kolom Tabel ---
const columns: ColumnsType<SubjectTeacherData> = [
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
    title: "Subjects",
    dataIndex: "subjects",
    key: "subjects",
    sorter: (a, b) => a.subjects.localeCompare(b.subjects),
  },
  {
    title: "Class List",
    dataIndex: "classList",
    key: "classList",
    sorter: (a, b) => a.classList.localeCompare(b.classList),
  },
  {
    title: "Semester",
    dataIndex: "semester",
    key: "semester",
    sorter: (a, b) => a.semester.localeCompare(b.semester),
    width: 100,
  },
  {
    title: "Actions",
    key: "actions",
    width: 150,
    render: (_, record) => (
      <Space size="middle">
        {/* Tombol View */}
        <Button
          type="text"
          icon={<EyeOutlined style={{ color: "#1890ff" }} />}
          onClick={() => toast.info(`View data ${record.NIP}`)} // Contoh Toastify
        />
        {/* Tombol Edit */}
        <Button
          type="text"
          icon={<EditOutlined style={{ color: "#1890ff" }} />}
          onClick={() => toast.warn(`Edit data ${record.NIP}`)} // Contoh Toastify
        />
      </Space>
    ),
  },
];

// --- III. Komponen Subject Teacher ---
const SubjectTeacherPage: React.FC = () => {
  const [data, setData] = useState<SubjectTeacherData[]>([]);
  const [loading, setLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState("");

  // State Pagination (biarkan default untuk simulasi Ant Design/tampilan)
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 50; // Asumsi total halaman
  const totalRecords = totalPages * pageSize; // Simulasi total records

  /**
   * Fungsi untuk memproses data dari API ke format SubjectTeacherData
   * @param apiData Data dari respons API
   * @returns Data dalam format SubjectTeacherData[]
   */
  const transformData = (
    apiData: ApiSubjectTeacher[]
  ): SubjectTeacherData[] => {
    return apiData.map((item) => ({
      id: item.id,
      NIP: item.teacher.nip || "N/A",
      teacherName: item.teacher.name || "N/A",
      subjects: item.subject.name || "N/A",
      // Gabungkan semua kode kelas
      classList: item.subject_teacher_classes
        .map((cls) => cls.classroom.code)
        .join(", "),
      // Tentukan semester
      semester: item.is_ganjil ? "Ganjil" : item.is_genap ? "Genap" : "N/A",
    }));
  };

  /**
   * Fungsi untuk mengambil data dari API
   */
  const fetchData = useCallback(async () => {
    if (!BASE_URL) {
      toast.error("NEXT_PUBLIC_API_URL tidak ditemukan di .env!");
      return;
    }

    setLoading(true);
    try {
      const url = `${BASE_URL}${API_ENDPOINT}`;
      const response = await axios.get<ApiResponse>(url);

      const transformedData = transformData(response.data.data);
      setData(transformedData);
      setAcademicYear(response.data.academicYear);

      toast.success("Data Subject Teacher berhasil dimuat! 🎉");
    } catch (error) {
      let errorMessage = "Gagal memuat data Subject Teacher.";
      if (axios.isAxiosError(error) && error.response) {
        // Asumsi API mengembalikan pesan error dalam response.data.message/error
        errorMessage = `Gagal memuat data: ${error.response.status} - ${
          error.response.data.message ||
          error.response.data.error ||
          "Server Error"
        }`;
      } else {
        errorMessage = `Gagal memuat data: ${
          error instanceof Error ? error.message : "Kesalahan tidak diketahui"
        }`;
      }

      toast.error(errorMessage);
      console.error("Fetch Data Error:", error);
      setData([]); // Kosongkan data jika gagal
    } finally {
      setLoading(false);
    }
  }, []); // Dependensi kosong, hanya dijalankan sekali saat mount

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Fungsi dan Konfigurasi Pagination (TETAP SAMA) ---
  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
    // TODO: Implementasi logika fetch data API dengan parameter page dan size di sini
    toast.info(`Mengubah ke halaman ${page} dengan ${size} baris.`);
  };

  const menu: MenuProps["items"] = [
    { key: "10", label: "10", onClick: () => setPageSize(10) },
    { key: "20", label: "20", onClick: () => setPageSize(20) },
    { key: "50", label: "50", onClick: () => setPageSize(50) },
  ];

  // itemRender untuk kustomisasi tampilan pagination Ant Design (dapat dihapus jika tidak diperlukan)
  const itemRender = (
    page: number,
    type: "page" | "prev" | "next" | "jump-prev" | "jump-next",
    originalElement: React.ReactNode
  ) => {
    if (type === "page") {
      return (
        <span
          onClick={() => setCurrentPage(page)}
          style={{
            border:
              page === currentPage ? "1px solid #1890ff" : "1px solid #d9d9d9",
            color: page === currentPage ? "#1890ff" : "rgba(0, 0, 0, 0.65)",
            backgroundColor: page === currentPage ? "#e6f7ff" : "white",
            borderRadius: "4px",
            padding: "0 8px",
            cursor: "pointer",
            margin: "0 4px",
          }}
        >
          {page}
        </span>
      );
    }
    return originalElement;
  };
  // --- Akhir Fungsi Pagination ---

  return (
    <div style={{ padding: "24px" }}>
      {/* Header dan Breadcrumb */}
      <Breadcrumb style={{ marginBottom: "20px" }}>
        <Breadcrumb.Item>Home</Breadcrumb.Item>
        <Breadcrumb.Item>Subject Teacher</Breadcrumb.Item>
      </Breadcrumb>

      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: "20px" }}
      >
        <Col>
          <h1 style={{ margin: 0, fontSize: "30px", fontWeight: "bold" }}>
            Subject Teacher
          </h1>
        </Col>
        <Col>
          <span style={{ fontSize: "30px", fontWeight: "bold" }}>
            {academicYear || "Loading..."}
          </span>
        </Col>
      </Row>

      {/* --- Kontrol Atas (Search, Add Button, Download) --- */}
      <Row
        gutter={[16, 16]}
        justify="space-between"
        align="middle"
        style={{ marginBottom: "20px" }}
      >
        <Col xs={24} md={12} lg={8}>
          <Input
            placeholder={`Search customer ${totalRecords} records...`}
            prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
            style={{ borderRadius: "6px" }}
          />
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              onClick={() => toast.success("Menambah Subject Teacher")} // Contoh Toastify
              style={{ fontWeight: "bold", borderRadius: "6px" }}
            >
              Add Subject Teacher
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => toast.info("Mengunduh data...")} // Contoh Toastify
              style={{ borderRadius: "6px" }}
            />
            {/* Tombol Refresh/Reload Data */}
            <Button
              icon={<SearchOutlined />}
              onClick={fetchData}
              loading={loading}
              style={{ borderRadius: "6px" }}
            >
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      {/* --- Tabel --- */}
      <div
        style={{
          border: "1px solid #f0f0f0",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <Spin spinning={loading} tip="Memuat data...">
          <Table
            columns={columns}
            dataSource={data} // Gunakan data dari API
            rowKey="id" // Gunakan ID unik dari API
            pagination={false}
            scroll={{ x: "max-content" }}
          />
        </Spin>
      </div>

      {/* --- Kontrol Bawah (Pagination) --- */}
      <Row justify="space-between" align="middle" style={{ marginTop: "20px" }}>
        <Col>
          <Space>
            {/* Dropdown Row per page */}
            <Space>
              <span>Row per page</span>
              <Dropdown
                overlay={
                  <Menu items={menu} selectedKeys={[String(pageSize)]} />
                }
                trigger={["click"]}
                placement="topCenter"
              >
                <Button style={{ padding: "0 8px" }}>
                  {pageSize} <CaretDownOutlined />
                </Button>
              </Dropdown>
            </Space>

            {/* Input Go to */}
            <Space>
              <span>Go to</span>
              <Input
                value={currentPage}
                onChange={(e) => {
                  const page = Number(e.target.value);
                  if (!isNaN(page) && page >= 1 && page <= totalPages) {
                    setCurrentPage(page);
                  }
                }}
                style={{ width: "50px", textAlign: "center" }}
              />
            </Space>
          </Space>
        </Col>

        {/* Pagination Kustom */}
        <Col>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalRecords}
            showSizeChanger={false}
            onChange={handlePageChange}
            style={{ marginLeft: "auto" }}
            itemRender={itemRender}
          />
        </Col>
      </Row>
    </div>
  );
};

export default SubjectTeacherPage;
