// SubjectTeacherPage.tsx (atau src/app/subject-teacher/page.tsx)

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Typography,
  Select,
  Row,
  Col,
  Pagination,
  Layout,
  message,
  Spin,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import AddEditSubjectTeacherModal, {
  InitialSubjectTeacherData,
} from "../../components/AddEditSubjectTeacherModal"; // PASTIKAN PATH INI BENAR

const { Title, Text } = Typography;
const { Content } = Layout;

// --- 1. Definisi Tipe Data (Interfaces) Sesuai Respon API ---

// Interface untuk data Classroom
interface Classroom {
  code: string;
  id: number; // Ditambahkan agar bisa mencari ID saat Edit
}

// Interface untuk subject_teacher_classes
interface SubjectTeacherClass {
  classroom: Classroom;
}

// Interface untuk data Subject
interface Subject {
  name: string;
  id: number; // Ditambahkan untuk kebutuhan Edit
}

// Interface untuk data Teacher
interface Teacher {
  nip: string;
  name: string;
  id: number; // Ditambahkan untuk kebutuhan Edit
}

// Interface untuk item data Subject Teacher (Data mentah dari API)
interface ApiSubjectTeacherData {
  id: number;
  teacher_id: number; // ID Guru mentah
  subject_id: number; // ID Mapel mentah
  is_ganjil: boolean;
  is_genap: boolean;
  subject: Subject;
  teacher: Teacher;
  subject_teacher_classes: SubjectTeacherClass[];
}

// Interface untuk respon utama dari API
interface ApiResponse {
  academicYear: string;
  data: ApiSubjectTeacherData[];
}

// Interface untuk data yang sudah di-format untuk tampilan tabel
interface FormattedSubjectTeacher {
  key: number;
  nip: string;
  teacherName: string;
  subjects: string;
  classList: string;
  semester: "Ganjil" | "Genap" | "-";
  // Tambahkan properti API mentah untuk mempermudah handler edit
  raw: ApiSubjectTeacherData;
}

// --- 2. Komponen Utama ---
const SubjectTeacherPage: React.FC = () => {
  // State untuk data dan status
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [tableData, setTableData] = useState<FormattedSubjectTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk Modal Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<InitialSubjectTeacherData | null>(
    null
  );

  // State untuk Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalData, setTotalData] = useState(0);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://so-api.queensland.id/api";

  // Fungsi untuk memproses data dari API ke format tabel
  const formatData = (
    data: ApiSubjectTeacherData[]
  ): FormattedSubjectTeacher[] => {
    return data.map((item) => {
      // Gabungkan kode kelas (misal: P1A, P3A)
      const classList = item.subject_teacher_classes
        .map((stc) => stc.classroom.code)
        .join(", ");

      // Tentukan semester
      const semester = item.is_ganjil
        ? "Ganjil"
        : item.is_genap
        ? "Genap"
        : "-";

      return {
        key: item.id,
        nip: item.teacher.nip,
        teacherName: item.teacher.name,
        subjects: item.subject.name,
        classList: classList,
        semester: semester,
        raw: item, // Simpan data mentah untuk kebutuhan Edit
      };
    });
  };

  // Fungsi untuk mengambil data dari API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/subject-teachers`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      setAcademicYear(result.academicYear);
      const formatted = formatData(result.data);

      // Atur ulang halaman jika total data berubah dan melebihi halaman saat ini
      const maxPages = Math.ceil(formatted.length / pageSize);
      if (currentPage > maxPages && maxPages > 0) {
        setCurrentPage(maxPages);
      }

      setTableData(formatted);
      setTotalData(formatted.length);
    } catch (err) {
      console.error("Failed to fetch subject teachers:", err);
      setError("Gagal mengambil data dari server.");
      message.error("Gagal memuat data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [API_URL, currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Logika Pagination di Front-end
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = tableData.slice(startIndex, endIndex);

  // --- Handler CRUD ---
  const handleAdd = () => {
    setEditData(null); // Set ke mode Add
    setIsModalOpen(true);
  };

  const handleEdit = (record: FormattedSubjectTeacher) => {
    // Mengubah data tabel menjadi format yang dibutuhkan modal (InitialSubjectTeacherData)

    // Ekstrak ID kelas dari data mentah
    const classroomIds = record.raw.subject_teacher_classes.map(
      (stc) => stc.classroom.id
    );

    const dataForEdit: InitialSubjectTeacherData = {
      id: record.key,
      teacher_id: record.raw.teacher_id,
      subject_id: record.raw.subject_id,
      classroom_ids: classroomIds,
      is_ganjil: record.raw.is_ganjil,
      is_genap: record.raw.is_genap,
    };

    setEditData(dataForEdit);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    fetchData(); // Panggil ulang fungsi fetch data untuk refresh tabel
  };

  const handlePaginationChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(1); // Kembali ke halaman 1 saat mengubah page size
    }
  };

  // Definisikan kolom untuk Ant Design Table
  const columns: ColumnsType<FormattedSubjectTeacher> = [
    {
      title: "NIP",
      dataIndex: "nip",
      key: "nip",
      sorter: (a, b) => a.nip.localeCompare(b.nip),
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
    },
    {
      title: "Class List",
      dataIndex: "classList",
      key: "classList",
    },
    {
      title: "Semester",
      dataIndex: "semester",
      key: "semester",
      width: 100,
      sorter: (a, b) => a.semester.localeCompare(b.semester),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EyeOutlined style={{ color: "#1890ff" }} />}
            onClick={() => console.log("View", record.key)}
          />
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#1890ff" }} />}
            onClick={() => handleEdit(record)} // Memanggil handler edit
          />
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ padding: "24px", background: "#fff" }}>
      {/* ➡️ Header (Breadcrumb dan Tahun Ajaran) */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Home / Subject Teacher
          </Text>
          <Title
            level={1}
            style={{ margin: "8px 0 0 0", fontSize: 30, fontWeight: 500 }}
          >
            Subject Teacher
          </Title>
        </Col>
        <Col>
          <Title level={2} style={{ margin: 0, fontWeight: 500 }}>
            {academicYear}
          </Title>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col flex="auto">
          <Input
            placeholder={`Search ${totalData} records...`}
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            allowClear
          />
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
            >
              Mass Upload
            </Button>
            {/* Tombol Add Subject Teacher Dihubungkan ke Modal */}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd} // Memanggil handler add
            >
              Add Subject Teacher
            </Button>
            <Button icon={<DownloadOutlined />} />
          </Space>
        </Col>
      </Row>

      {/* --- Tabel Data --- */}
      <Content style={{ minHeight: 400 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" tip="Memuat Data..." />
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "50px", color: "red" }}>
            {error}
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={paginatedData}
              rowKey="key"
              pagination={false}
              bordered
              size="middle"
              style={{ marginBottom: 16 }}
            />

            {/* --- Pagination Kustom --- */}
            <Row justify="space-between" align="middle">
              <Col>
                <Space size="small">
                  <Text>Row per page</Text>
                  <Select
                    value={pageSize}
                    style={{ width: 70 }}
                    options={[
                      { value: 10, label: "10" },
                      { value: 20, label: "20" },
                      { value: 50, label: "50" },
                    ]}
                    onChange={(value) =>
                      handlePaginationChange(currentPage, value)
                    }
                  />
                  <Text>Go to</Text>
                  <Input
                    value={currentPage}
                    onChange={(e) => {
                      const maxPages = Math.ceil(totalData / pageSize);
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value > 0 && value <= maxPages) {
                        setCurrentPage(value);
                      }
                    }}
                    style={{ width: 40, textAlign: "center" }}
                  />
                </Space>
              </Col>
              <Col>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalData}
                  onChange={handlePaginationChange}
                  showSizeChanger={false}
                  showQuickJumper={false}
                />
              </Col>
            </Row>
          </>
        )}
      </Content>

      {/* --- Komponen Modal Add/Edit --- */}
      <AddEditSubjectTeacherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editData}
        onSuccess={handleSuccess} // Memuat ulang data setelah sukses
      />
    </Layout>
  );
};

export default SubjectTeacherPage;
