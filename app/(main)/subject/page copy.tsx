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
  Switch,
  Modal,
  Form,
  InputNumber,
  Select,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  UploadOutlined,
  EyeOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import axios from "axios";

// *** IMPOR REACT TOASTIFY ***
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Wajib impor CSS-nya

const { Title } = Typography;
const { Option } = Select;

// --- KONSTANTA API ---
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://so-api.queensland.id/api";
const SUBJECTS_ENDPOINT = `${API_URL}/subjects`;
const PAGE_SIZE = 10;

// --- INTERFACE DATA API ---
interface AcademicYear {
  id: number;
  year: string;
  is_active: boolean;
}

interface ApiSubject {
  id: number;
  code: string;
  category: string;
  name: string;
  grade: string;
  kkm: number;
  is_ganjil: boolean;
  is_genap: boolean;
  academic_id: number;
  academic_year: AcademicYear;
}

// 💡 Interface untuk struktur respons API baru (jika API mengembalikan objek dengan tahun akademik di tingkat atas)
interface ApiResponse {
  academicYear: string;
  data: ApiSubject[];
}

interface SubjectData {
  key: string;
  id: number;
  subjectCode: string;
  subject: string;
  category: string;
  grade: string;
  kkm: number;
  ganjilActive: boolean;
  genapActive: boolean;
}

const CATEGORIES = ["Kelompok A", "Kelompok B"];

// --- DEFINISI KOLOM TABLE ---
const getColumns = (
  handleSemesterToggle: (
    id: number,
    field: "is_ganjil" | "is_genap",
    value: boolean
  ) => void,
  handleEdit: (record: SubjectData) => void
) => [
  {
    title: "Subject Code",
    dataIndex: "subjectCode",
    key: "subjectCode",
    sorter: (a: SubjectData, b: SubjectData) =>
      a.subjectCode.localeCompare(b.subjectCode),
    width: 120,
  },
  {
    title: "Subject",
    dataIndex: "subject",
    key: "subject",
    sorter: (a: SubjectData, b: SubjectData) =>
      a.subject.localeCompare(b.subject),
  },
  {
    title: "Category",
    dataIndex: "category",
    key: "category",
    width: 120,
  },
  {
    title: "Grade",
    dataIndex: "grade",
    key: "grade",
    sorter: (a: SubjectData, b: SubjectData) =>
      parseInt(a.grade) - parseInt(b.grade),
    width: 80,
  },
  {
    title: "KKM",
    dataIndex: "kkm",
    key: "kkm",
    sorter: (a: SubjectData, b: SubjectData) => a.kkm - b.kkm,
    width: 80,
  },
  {
    title: "Ganjil",
    dataIndex: "ganjilActive",
    key: "ganjilActive",
    width: 80,
    render: (active: boolean, record: SubjectData) => (
      <Switch
        checked={active}
        onChange={(checked) =>
          handleSemesterToggle(record.id, "is_ganjil", checked)
        }
      />
    ),
  },
  {
    title: "Genap",
    dataIndex: "genapActive",
    key: "genapActive",
    width: 80,
    render: (active: boolean, record: SubjectData) => (
      <Switch
        checked={active}
        onChange={(checked) =>
          handleSemesterToggle(record.id, "is_genap", checked)
        }
      />
    ),
  },
  {
    title: "Actions",
    key: "actions",
    width: 100,
    render: (_: any, record: SubjectData) => (
      <Space size="middle">
        <Button
          type="text"
          icon={<EyeOutlined style={{ color: "#1890ff" }} />}
          title="View Detail"
        />
        <Button
          type="text"
          icon={<EditOutlined style={{ color: "#1890ff" }} />}
          title="Edit Subject"
          onClick={() => handleEdit(record)}
        />
      </Space>
    ),
  },
];

const SubjectPage: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalRecords: 0,
    academicYear: "Loading...",
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectData | null>(
    null
  );
  const [form] = Form.useForm();

  // --- 1. FUNGSI FETCH DATA (GET) ---
  const fetchSubjects = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      // 💡 Perubahan: Mengubah tipe data respons menjadi ApiResponse
      const response = await axios.get<ApiResponse>(SUBJECTS_ENDPOINT, {
        params: {
          page: page,
          limit: PAGE_SIZE,
        },
      });

      // 💡 Perubahan: Mengambil 'academicYear' dan 'data' dari properti tingkat atas
      const { academicYear, data } = response.data;

      const apiData: ApiSubject[] = Array.isArray(data) ? data : [];

      const transformedData: SubjectData[] = apiData.map((item) => ({
        key: String(item.id),
        id: item.id,
        subjectCode: item.code,
        subject: item.name,
        category: item.category,
        grade: item.grade,
        kkm: item.kkm,
        ganjilActive: item.is_ganjil,
        genapActive: item.is_genap,
      }));

      // 💡 Perubahan: Menggunakan academicYear dari properti tingkat atas
      const activeYearDisplay =
        academicYear || "Tahun Akademik Tidak Ditemukan";

      setSubjects(transformedData);
      setPagination((prev) => ({
        ...prev,
        currentPage: page,
        // Catatan: Jika backend sudah menerapkan pagination,
        // Anda perlu mengganti totalRecords dengan nilai dari metadata respons.
        totalRecords: transformedData.length,
        academicYear: activeYearDisplay,
      }));
    } catch (error) {
      console.error("Gagal mengambil data mata pelajaran:", error);
      // *** GANTI: message.error -> toast.error ***
      toast.error("Gagal memuat data mata pelajaran. Cek koneksi API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects(1);
  }, [fetchSubjects]);

  // --- 2. FUNGSI UPDATE SEMESTER (PUT: /subjects/{id}/semester) ---
  const handleSemesterToggle = async (
    id: number,
    field: "is_ganjil" | "is_genap",
    value: boolean
  ) => {
    const fieldKey = field === "is_ganjil" ? "ganjilActive" : "genapActive";

    // Optimistic update
    const originalSubjects = subjects;
    const updatedSubjects = subjects.map((sub) =>
      sub.id === id ? { ...sub, [fieldKey]: value } : sub
    );
    setSubjects(updatedSubjects);

    try {
      const response = await axios.put(`${SUBJECTS_ENDPOINT}/${id}/semester`, {
        field: field,
        value: value,
      });

      // *** GANTI: message.success -> toast.success ***
      toast.success(
        response.data.message || "Status semester berhasil diubah."
      );
    } catch (error: any) {
      // Rollback jika gagal
      // *** GANTI: message.error -> toast.error ***
      toast.error(
        error.response?.data?.message || `Gagal mengubah status ${field}.`
      );
      setSubjects(originalSubjects);

      console.error("Gagal mengupdate semester:", error);
    }
  };

  // --- 3. FUNGSI TAMBAH/EDIT SUBJECT (POST/PUT: /subjects/{id}) ---
  const showModal = (record?: SubjectData) => {
    if (record) {
      setEditingSubject(record);
      form.setFieldsValue({
        code: record.subjectCode,
        category: record.category,
        name: record.subject,
        grade: parseInt(record.grade),
        kkm: record.kkm,
      });
    } else {
      setEditingSubject(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleFormSubmit = async (values: any) => {
    setLoading(true);
    try {
      let response;
      const payload = {
        code: values.code,
        category: values.category,
        name: values.name,
        grade: String(values.grade),
        kkm: String(values.kkm),
      };

      if (editingSubject) {
        // Logika Edit (PUT)
        response = await axios.put(
          `${SUBJECTS_ENDPOINT}/${editingSubject.id}`,
          payload
        );
      } else {
        // Logika Tambah (POST)
        response = await axios.post(SUBJECTS_ENDPOINT, payload);
      }

      // *** GANTI: message.success -> toast.success ***
      toast.success(
        response.data.message ||
          `Subject ${editingSubject ? "Updated" : "Created"} Successfully`
      );

      setIsModalVisible(false);
      fetchSubjects(pagination.currentPage);
    } catch (error: any) {
      console.error("Gagal submit form:", error);
      // *** GANTI: message.error -> toast.error ***
      toast.error(
        error.response?.data?.message ||
          "Terjadi kesalahan saat menyimpan data."
      );
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERING KOLOM DENGAN HANDLER ---
  const columns = getColumns(handleSemesterToggle, showModal);

  // --- HANDLE PAGINATION CHANGE ---
  const handlePageChange = (page: number) => {
    fetchSubjects(page);
  };

  return (
    <>
      {/* *** TAMBAHKAN TOASTCONTAINER DI ROOT KOMPONEN *** */}
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
      <Breadcrumb items={[{ title: "Home" }, { title: "Subject" }]} />

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
          Subject
        </Title>
        <Title level={3} style={{ color: "#888", margin: 0 }}>
          {/* Tahun akademik sekarang menggunakan state dari properti tingkat atas */}
          <span className="font-bold text-zinc-800">
            {pagination.academicYear}
          </span>
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
          placeholder="Search subject..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
        <Space>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            style={{ background: "#52c41a", borderColor: "#52c41a" }}
          >
            Mass Upload
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            Add Subject
          </Button>
          <Button icon={<DownloadOutlined />} />
        </Space>
      </div>

      {/* 4. Table */}
      <Table
        columns={columns}
        dataSource={subjects}
        pagination={false}
        loading={{
          indicator: <LoadingOutlined style={{ fontSize: 24 }} spin />,
          spinning: loading,
        }}
        size="large"
        style={{ border: "1px solid #f0f0f0", borderRadius: "4px" }}
        scroll={{ x: 800 }}
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
        {/* Row per page & Go to */}
        <Space>
          <span>Row per page</span>
          <Input
            defaultValue={PAGE_SIZE}
            style={{ width: 60, textAlign: "center" }}
            suffix={<div style={{ marginRight: "-8px" }}>▼</div>}
          />
          <span>Go to</span>
          <Input
            defaultValue={pagination.currentPage}
            style={{ width: 50, textAlign: "center" }}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (
                page > 0 &&
                page <= Math.ceil(pagination.totalRecords / PAGE_SIZE)
              ) {
                // Logic for page input
              }
            }}
            onPressEnter={(e) =>
              handlePageChange(parseInt((e.target as HTMLInputElement).value))
            }
          />
        </Space>

        {/* Pagination */}
        <Pagination
          defaultCurrent={1}
          current={pagination.currentPage}
          onChange={handlePageChange}
          total={pagination.totalRecords}
          pageSize={PAGE_SIZE}
          showSizeChanger={false}
        />
      </div>

      {/* Modal Tambah/Edit */}
      <Modal
        title={editingSubject ? "Edit Subject" : "Add New Subject"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{ category: CATEGORIES[0] }}
        >
          <Form.Item
            name="code"
            label="Subject Code"
            rules={[
              { required: true, message: "Please input the subject code!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="Subject Name"
            rules={[
              { required: true, message: "Please input the subject name!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Please select the category!" }]}
          >
            <Select placeholder="Select category">
              {CATEGORIES.map((cat) => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="grade"
            label="Grade"
            rules={[{ required: true, message: "Please input the grade!" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="kkm"
            label="KKM (Kriteria Ketuntasan Minimal)"
            rules={[{ required: true, message: "Please input the KKM!" }]}
          >
            <InputNumber min={0} max={100} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SubjectPage;
