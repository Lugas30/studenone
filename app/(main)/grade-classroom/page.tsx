"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Breadcrumb,
  Typography,
  Table,
  Input,
  Button,
  Space,
  Pagination,
  Modal,
  Form,
  Select,
  // 💡 Hapus Ant Design notification
  // notification,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import axios from "axios";
// 💡 Import React Toastify
import { ToastContainer, toast } from "react-toastify";
// 💡 Pastikan Anda mengimpor CSS ini di file root/layout Anda:
// import 'react-toastify/dist/ReactToastify.css';

const { Title } = Typography;
const { Option } = Select;

// Ambil BASE_URL dari environment variable
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// --- Definisi Tipe Data (Interfaces) ---

interface AcademicYear {
  id: number;
  year: string;
  is_active: boolean;
}

interface Classroom {
  id: number;
  grade: string;
  section: string;
  class_name: string;
  code: string;
  academic_id: number;
  academic_year: AcademicYear;
  key: string; // Diperlukan Ant Design Table
}

// 💡 Interface untuk struktur respons API baru
interface ApiResponse {
  academicYear: string;
  data: Classroom[];
}

interface ClassroomFormValues {
  grade: string;
  section: string;
  class_name: string;
}

// Data Pilihan untuk Form (sesuai kebutuhan tipikal)
const GRADE_OPTIONS = ["1", "2", "3", "4", "5", "6"];
const SECTION_OPTIONS = ["A", "B", "C", "D", "E", "F"];

const GradeClassroomPage: React.FC = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeAcademicYear, setActiveAcademicYear] =
    useState<string>("Loading...");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(
    null
  );
  const [form] = Form.useForm<ClassroomFormValues>();

  // State untuk Pagination (tetap pertahankan tampilan seperti permintaan)
  const [currentPage, setCurrentPage] = useState(1);
  const totalRecords = 500;
  const pageSize = 10;

  // --- Fungsi API Calls ---

  const fetchClassrooms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get<ApiResponse>(`${BASE_URL}/classrooms`);

      // 1. Ambil tahun akademik dari properti tingkat atas
      const { academicYear, data } = response.data;

      const formattedData: Classroom[] = data.map((item: Classroom) => ({
        ...item,
        key: item.id.toString(), // Tambahkan key untuk Table Ant Design
      }));

      setClassrooms(formattedData);

      // 2. Tampilkan Tahun Akademik Aktif dari properti tingkat atas
      if (academicYear) {
        setActiveAcademicYear(academicYear);
      } else if (
        formattedData.length > 0 &&
        formattedData[0].academic_year?.year
      ) {
        // Fallback: jika properti academicYear tidak ada, gunakan dari item pertama
        setActiveAcademicYear(formattedData[0].academic_year.year);
      }
    } catch (error) {
      console.error("Failed to fetch classrooms:", error);
      // 💡 Ganti Ant Design notification.error dengan toast.error
      toast.error("Terjadi kesalahan saat mengambil data kelas.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  // --- Modal dan Form Handlers ---

  const handleOpenModal = (classroom: Classroom | null = null) => {
    setEditingClassroom(classroom);
    setIsModalOpen(true);
    if (classroom) {
      form.setFieldsValue({
        grade: classroom.grade,
        section: classroom.section,
        class_name: classroom.class_name,
      });
    } else {
      form.resetFields();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClassroom(null);
    form.resetFields();
  };

  const onFinish = async (values: ClassroomFormValues) => {
    setLoading(true);
    try {
      let response;
      const successMessage = editingClassroom
        ? "Classroom berhasil diupdate!"
        : "Classroom berhasil ditambahkan!";

      if (editingClassroom) {
        // PUT (Edit)
        const url = `${BASE_URL}/classrooms/${editingClassroom.id}`;
        response = await axios.put(url, values);
      } else {
        // POST (Add)
        const url = `${BASE_URL}/classrooms`;
        response = await axios.post(url, values);
      }

      // 💡 Ganti Ant Design notification.success dengan toast.success
      toast.success(successMessage, {
        position: "top-right",
      });

      handleCloseModal();
      fetchClassrooms(); // Refresh data
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Terjadi kesalahan yang tidak diketahui saat menyimpan data.";
      console.error("API Error:", error);

      // 💡 Ganti Ant Design notification.error dengan toast.error
      toast.error(errorMessage, {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  // 💡 FUNGSI VALIDASI KUSTOM UNTUK MENCEGAH DUPLIKAT GRADE & SECTION
  const validateDuplicateClassroom = async () => {
    const values = form.getFieldsValue();
    const { grade, section } = values;

    if (!grade || !section) {
      // Biarkan validasi 'required' default yang menangani
      return Promise.resolve();
    }

    // Cek apakah ada kombinasi yang sama di data yang sudah ada (classrooms)
    const isDuplicate = classrooms.some((classroom) => {
      // Jika dalam mode Edit, izinkan edit pada kelas yang sedang diedit (dengan ID yang sama)
      if (editingClassroom && classroom.id === editingClassroom.id) {
        return false;
      }
      return classroom.grade === grade && classroom.section === section;
    });

    if (isDuplicate) {
      // Tolak Promise untuk menampilkan pesan error di form
      return Promise.reject(
        new Error(`Kombinasi Grade ${grade} dan Section ${section} sudah ada.`)
      );
    }

    // Lanjutkan jika tidak ada duplikat
    return Promise.resolve();
  };

  // --- Definisi Kolom Table (Diperbarui) ---
  const columns = [
    {
      title: "Grade",
      dataIndex: "grade",
      key: "grade",
      sorter: (a: Classroom, b: Classroom) => a.grade.localeCompare(b.grade),
    },
    {
      title: "Section",
      dataIndex: "section",
      key: "section",
    },
    {
      title: "Classroom Name",
      dataIndex: "class_name",
      key: "class_name",
      sorter: (a: Classroom, b: Classroom) =>
        a.class_name.localeCompare(b.class_name),
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Classroom) => (
        <Button
          type="text"
          icon={<EditOutlined style={{ color: "#1890ff" }} />}
          onClick={() => handleOpenModal(record)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      {/* 💡 Tambahkan ToastContainer di root komponen Anda */}
      <ToastContainer />

      {/* 1. Breadcrumb */}
      <Breadcrumb items={[{ title: "Home" }, { title: "Grade & Classroom" }]} />

      {/* 2. Title dan Tahun Akademik (DYNAMIC) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "16px 0 24px 0",
        }}
      >
        <Title level={1} style={{ margin: 0 }}>
          Grade & Classroom
        </Title>
        {/* Tampilkan Tahun Akademik Aktif di pojok kanan atas */}
        <Title level={3} style={{ color: "#888", margin: 0 }}>
          <span className="font-bold text-zinc-800">{activeAcademicYear}</span>
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
          placeholder="Search classroom records..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
        <Space>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
          >
            Mass Upload
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal(null)}
          >
            Add Classroom
          </Button>
          <Button icon={<DownloadOutlined />} />
        </Space>
      </div>

      {/* 4. Table (Menggunakan data API) */}
      <Table
        columns={columns}
        dataSource={classrooms}
        loading={loading}
        pagination={false}
        size="large"
        style={{ border: "1px solid #f0f0f0", borderRadius: "4px" }}
      />

      {/* 5. Pagination & Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "16px",
        }}
      >
        {/* Row per page & Go to (Dibiarkan statis karena tidak ada implementasi backend pagination) */}
        <Space>
          <span>Row per page</span>
          <Input defaultValue="10" style={{ width: 60, textAlign: "center" }} />
          <span>Go to</span>
          <Input
            defaultValue={currentPage}
            style={{ width: 50, textAlign: "center" }}
            onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
          />
        </Space>

        {/* Pagination */}
        <Pagination
          defaultCurrent={1}
          current={currentPage}
          onChange={setCurrentPage}
          total={totalRecords}
          pageSize={pageSize}
          showSizeChanger={false}
        />
      </div>

      {/* --- Modal Tambah/Edit Kelas --- */}
      <Modal
        title={editingClassroom ? "Edit Classroom" : "Add New Classroom"}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={[
          <Button key="back" onClick={handleCloseModal}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={() => form.submit()}
          >
            {editingClassroom ? "Update Classroom" : "Add Classroom"}
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ grade: "Grade", section: "Section" }}
          className="mt-4"
        >
          <Form.Item
            name="class_name"
            label="Classroom Name"
            rules={[
              { required: true, message: "Please input the Classroom Name!" },
            ]}
          >
            <Input placeholder="e.g., Aminah binti Wahb" />
          </Form.Item>

          <Form.Item label="Grade and Section" required>
            <>
              <Form.Item
                name="grade"
                noStyle
                // 💡 Tambahkan custom validator di sini
                rules={[
                  { required: true, message: "Select Grade" },
                  { validator: validateDuplicateClassroom },
                ]}
              >
                <Select style={{ width: "50%" }} placeholder="Select Grade">
                  {GRADE_OPTIONS.map((grade) => (
                    <Option key={grade} value={grade}>
                      {grade}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="section"
                noStyle
                // 💡 Tambahkan custom validator di sini
                rules={[
                  { required: true, message: "Select Section" },
                  { validator: validateDuplicateClassroom },
                ]}
              >
                <Select style={{ width: "50%" }} placeholder="Select Section">
                  {SECTION_OPTIONS.map((section) => (
                    <Option key={section} value={section}>
                      Section {section}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default GradeClassroomPage;
