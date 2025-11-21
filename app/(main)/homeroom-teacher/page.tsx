"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Layout,
  Typography,
  Row,
  Col,
  Input,
  Select,
  Button,
  Table,
  Space,
  Menu,
  Dropdown,
  Pagination,
  Divider,
  Spin, // Ditambahkan untuk indikator loading
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DownOutlined,
} from "@ant-design/icons";

// Import axios
import axios from "axios";

// Import React Toastify
import { toast } from "react-toastify";
// Pastikan file CSS Toastify sudah diimport di root layout Anda!

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// Ambil URL API dari .env
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// --- 1. INTERFACE API ---
// Sesuaikan dengan struktur data API yang sebenarnya
export interface HomeroomTeacherAPIRecord {
  id: number;
  teacher_id: number;
  assistant_id: number | null;
  classroom_id: number;
  academic_year_id: number;
  semester: string; // "ganjil" | "genap"
  academic_year: {
    year: string;
  };
  teacher: {
    name: string;
  };
  assistant: {
    name: string;
  } | null;
  classroom: {
    grade: string; // "1", "2", dst
    section: string; // "A", "B", dst
    class_name: string;
    code: string; // P1A, P1B, dst
  };
}

// Interface untuk data yang akan ditampilkan di tabel
export interface HomeroomTeacherRecord {
  key: string;
  id: number;
  grade: number;
  class: string;
  className: string;
  teacher: string;
  coTeacher: string;
  semester: "Ganjil" | "Genap";
}

// --- 2. KONFIGURASI KOLOM TABEL ---
// Kolom menggunakan interface HomeroomTeacherRecord
const columns = [
  {
    title: "Grade",
    dataIndex: "grade",
    key: "grade",
    sorter: (a: HomeroomTeacherRecord, b: HomeroomTeacherRecord) =>
      a.grade - b.grade,
    width: 80,
  },
  { title: "Class", dataIndex: "class", key: "class", width: 80 },
  { title: "Class Name", dataIndex: "className", key: "className", width: 200 },
  { title: "Teacher", dataIndex: "teacher", key: "teacher", width: 150 },
  { title: "Co-Teacher", dataIndex: "coTeacher", key: "coTeacher", width: 150 },
  {
    title: "Semester",
    dataIndex: "semester",
    key: "semester",
    sorter: (a: HomeroomTeacherRecord, b: HomeroomTeacherRecord) =>
      a.semester.localeCompare(b.semester),
    width: 100,
  },
  {
    title: "Actions",
    key: "actions",
    width: 80,
    render: (_: any, record: HomeroomTeacherRecord) => (
      <Space size="middle">
        <Button
          icon={<EyeOutlined />}
          type="text"
          onClick={() => toast.info(`View Homeroom ID: ${record.id}`)}
        />
        <Button
          icon={<EditOutlined />}
          type="text"
          onClick={() => toast.info(`Edit Homeroom ID: ${record.id}`)}
        />
      </Space>
    ),
  },
];

const assignmentMenu = (
  <Menu>
    <Menu.Item key="1">Assign Homeroom Teacher</Menu.Item>
    <Menu.Item key="2">Bulk Assign</Menu.Item>
  </Menu>
);

// --- 3. KOMPONEN HALAMAN UTAMA ---
const HomeroomTeacherPage: React.FC = () => {
  const [data, setData] = useState<HomeroomTeacherRecord[]>([]);
  const [academicYear, setAcademicYear] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // State untuk Pagination Client-Side
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [goToPage, setGoToPage] = useState<string>("");

  // State untuk Filter
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [searchText, setSearchText] = useState<string>("");

  // Fungsi untuk mengambil data dari API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_URL is not defined in .env");
      }
      const response = await axios.get(`${API_URL}/homerooms`);

      if (response.data && Array.isArray(response.data.data)) {
        setAcademicYear(response.data.academicYear || "");

        // Mapping data API ke format tabel
        const formattedData: HomeroomTeacherRecord[] = response.data.data.map(
          (item: HomeroomTeacherAPIRecord) => ({
            key: item.id.toString(),
            id: item.id,
            grade: parseInt(item.classroom.grade, 10),
            class: item.classroom.code,
            className: item.classroom.class_name,
            teacher: item.teacher?.name || "—",
            coTeacher: item.assistant?.name || "—",
            semester:
              item.semester === "ganjil"
                ? "Ganjil"
                : item.semester === "genap"
                ? "Genap"
                : "—",
          })
        );
        setData(formattedData);
        setTotalRecords(formattedData.length);
        toast.success("Data Homeroom berhasil dimuat! 🎉");
      } else {
        setData([]);
        setTotalRecords(0);
        toast.warning("API merespon tanpa properti data yang valid.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data Homeroom. Cek konsol untuk detail.");
      setData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- LOGIC FILTERING DAN PAGINATION CLIENT-SIDE ---

  const filteredData = useMemo(() => {
    return data.filter((record) => {
      // 1. Filter Grade
      if (gradeFilter !== "all" && record.grade !== parseInt(gradeFilter)) {
        return false;
      }

      // 2. Filter Semester
      if (semesterFilter !== "all" && record.semester !== semesterFilter) {
        return false;
      }

      // 3. Search Text Filter
      if (searchText) {
        const lowerSearchText = searchText.toLowerCase();
        return (
          record.className.toLowerCase().includes(lowerSearchText) ||
          record.teacher.toLowerCase().includes(lowerSearchText) ||
          record.coTeacher.toLowerCase().includes(lowerSearchText) ||
          record.class.toLowerCase().includes(lowerSearchText)
        );
      }

      return true;
    });
  }, [data, gradeFilter, semesterFilter, searchText]);

  // Data yang akan ditampilkan di halaman saat ini
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize]);

  // Update total records setelah filtering
  useEffect(() => {
    setTotalRecords(filteredData.length);
    setCurrentPage(1); // Kembali ke halaman 1 setelah filter
  }, [filteredData]);

  // Handler Pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setGoToPage(page.toString());
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value, 10));
    setCurrentPage(1); // Kembali ke halaman 1
    setGoToPage("1");
  };

  const handleGoToPage = () => {
    const pageNum = parseInt(goToPage, 10);
    const maxPage = Math.ceil(totalRecords / pageSize);
    if (pageNum >= 1 && pageNum <= maxPage) {
      setCurrentPage(pageNum);
    } else {
      toast.error(`Halaman harus antara 1 dan ${maxPage}`);
      setGoToPage(currentPage.toString());
    }
  };

  return (
    <Layout
      style={{
        padding: "24px 24px 0 24px",
        background: "#fff",
        minHeight: "100vh",
      }}
    >
      {/* 🚀 HEADER SECTION (Path & Title) */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 10 }}>
        <Col>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Home / Homeroom Teacher
          </Text>
          <Title level={2} style={{ margin: "0 0 5px 0", fontWeight: 600 }}>
            Homeroom Teacher
          </Title>
        </Col>
        <Col>
          <Title
            level={2}
            style={{ margin: 0, fontWeight: 400, color: "#333" }}
          >
            {academicYear || "Loading..."}
          </Title>
        </Col>
      </Row>

      <Divider style={{ margin: "10px 0 20px 0" }} />

      {/* 🔍 FILTER & ACTIONS SECTION */}
      <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 20 }}>
        {/* Search Input */}
        <Col>
          <Input
            placeholder="Search..."
            prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>

        {/* Grade Filter */}
        <Col>
          <Select
            defaultValue="all"
            style={{ width: 120 }}
            placeholder="Grade"
            onChange={(value) => setGradeFilter(value)}
            value={gradeFilter}
          >
            <Option value="all">Grade (Semua)</Option>
            <Option value="1">1</Option>
            <Option value="2">2</Option>
            {/* Tambahkan grade lain sesuai kebutuhan */}
          </Select>
        </Col>

        {/* Semester Filter */}
        <Col>
          <Select
            defaultValue="all"
            style={{ width: 120 }}
            placeholder="Semester"
            onChange={(value) => setSemesterFilter(value)}
            value={semesterFilter}
          >
            <Option value="all">Semester (Semua)</Option>
            <Option value="Ganjil">Ganjil</Option>
            <Option value="Genap">Genap</Option>
          </Select>
        </Col>

        <Col flex="auto" />

        {/* Download Button */}
        <Col>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => toast.info("Fitur Download belum diimplementasikan")}
          />
        </Col>

        {/* Assignment Dropdown Button */}
        <Col>
          <Dropdown overlay={assignmentMenu} placement="bottomRight">
            <Button type="primary">
              Assignment <DownOutlined />
            </Button>
          </Dropdown>
        </Col>
      </Row>

      {/* 📊 TABLE SECTION */}
      <Content>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={paginatedData} // Gunakan data yang sudah dipaginasi
            pagination={false} // Matikan pagination bawaan
            bordered={false}
            scroll={{ x: "max-content" }}
            locale={{
              emptyText: loading ? "Memuat Data..." : "Tidak ada data Homeroom",
            }}
          />
        </Spin>
      </Content>

      {/* 👣 CUSTOM PAGINATION FOOTER */}
      <Row
        justify="space-between"
        align="middle"
        style={{
          marginTop: 16,
          padding: "10px 0",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        {/* Kiri: Row per page & Go to */}
        <Col>
          <Space size="middle">
            <Space>
              <Text type="secondary">Row per page</Text>
              <Select
                defaultValue="10"
                style={{ width: 70 }}
                size="small"
                onChange={handlePageSizeChange}
                value={pageSize.toString()}
              >
                <Option value="10">10</Option>
                <Option value="20">20</Option>
                <Option value="50">50</Option>
              </Select>
            </Space>
            <Space>
              <Text type="secondary">Go to</Text>
              <Input
                style={{ width: 50 }}
                size="small"
                value={goToPage}
                onChange={(e) => setGoToPage(e.target.value)}
                onPressEnter={handleGoToPage}
                onBlur={handleGoToPage}
              />
            </Space>
            <Text type="secondary">Total {totalRecords} records</Text>
          </Space>
        </Col>

        {/* Kanan: Pagination Ant Design */}
        <Col>
          <Pagination
            current={currentPage}
            total={totalRecords}
            pageSize={pageSize}
            onChange={handlePageChange}
            showSizeChanger={false} // showSizeChanger sudah diimplementasikan di bagian kiri
          />
        </Col>
      </Row>
    </Layout>
  );
};

export default HomeroomTeacherPage;
