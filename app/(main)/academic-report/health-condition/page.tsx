"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Table,
  Input,
  Button,
  Select,
  Space,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Breadcrumb,
  Modal,
  Form,
  InputNumber,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  // EyeOutlined, // Tidak digunakan, bisa dihapus jika mau
} from "@ant-design/icons";
import { ColumnsType } from "antd/es/table";
import { toast } from "react-toastify";
import axios from "axios";

const { Option } = Select;
const { Title } = Typography;
const { Item } = Form;

// --- 1. Konfigurasi API ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  console.error("NEXT_PUBLIC_API_URL environment variable is not set.");
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- 2. Definisi Tipe Data ---

interface AcademicYear {
  id: number;
  year: string;
  is_ganjil: boolean;
  is_genap: boolean;
  is_active: boolean;
}

interface Classroom {
  id: number;
  code: string;
  class_name: string;
}

interface Student {
  id: number;
  nis: string;
  fullname: string;
  gender: "male" | "female";
}

interface StudentClass {
  id: number;
  student_id: number;
  classroom_id: number;
  semester: string;
  student: Student;
}

interface HealthConditionData {
  student_id: number;
  height: number;
  weight: number;
  vision: string;
  hearing: string;
  dental: string;
  pemeriksa: string;
  note: string;
}

// Data yang ditampilkan di tabel
interface HealthRecord {
  key: string;
  student_id: number;
  nis: string;
  fullName: string;
  gender: "L" | "P";
  height: number | null;
  weight: number | null;
  vision: string | null;
  hearing: string | null;
  dental: string | null;
  pemeriksa?: string;
  note?: string;
}

interface HealthFormValues {
  height: number;
  weight: number;
  vision: string;
  hearing: string;
  dental: string;
  pemeriksa: string;
  note: string;
}

// --- 3. Komponen Form Modal (Internal) ---

const HealthConditionForm: React.FC<{
  visible: boolean;
  onCancel: () => void;
  onFinish: (values: HealthFormValues) => void;
  initialValues: Partial<HealthFormValues>;
  studentName: string;
  isSubmitting: boolean;
}> = ({
  visible,
  onCancel,
  onFinish,
  initialValues,
  studentName,
  isSubmitting,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [visible, initialValues, form]);

  return (
    <Modal
      title={`Input Data Kesehatan: ${studentName}`}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isSubmitting}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialValues}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Item
              name="height"
              label="Height (cm)"
              rules={[{ required: true, message: "Wajib diisi" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Item>
          </Col>
          <Col span={12}>
            <Item
              name="weight"
              label="Weight (kg)"
              rules={[{ required: true, message: "Wajib diisi" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Item
              name="vision"
              label="Vision"
              rules={[{ required: true, message: "Wajib diisi" }]}
            >
              <Input />
            </Item>
          </Col>
          <Col span={12}>
            <Item
              name="hearing"
              label="Hearing"
              rules={[{ required: true, message: "Wajib diisi" }]}
            >
              <Input />
            </Item>
          </Col>
        </Row>
        <Item
          name="dental"
          label="Dental"
          rules={[{ required: true, message: "Wajib diisi" }]}
        >
          <Input />
        </Item>
        <Item name="pemeriksa" label="Checked By">
          <Input />
        </Item>
        <Item name="note" label="Note">
          <Input.TextArea rows={2} />
        </Item>
      </Form>
    </Modal>
  );
};

// --- 4. Komponen Utama HealthCondition ---

const HealthCondition: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [academicInfo, setAcademicInfo] = useState({
    year: "Loading...",
    semester: "",
  });
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  // selectedClassId diinisialisasi null agar placeholder muncul
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [studentRecords, setStudentRecords] = useState<HealthRecord[]>([]);

  // State untuk Modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<HealthRecord | null>(
    null
  );

  // --- 5. Fetching Data ---

  // 5.1 Fetch Academic Year
  useEffect(() => {
    const fetchAcademicYear = async () => {
      try {
        const response = await api.get<AcademicYear[]>("/academic-years");
        const activeYear = response.data.find((y) => y.is_active);

        if (activeYear) {
          const semester = activeYear.is_ganjil
            ? "Ganjil"
            : activeYear.is_genap
            ? "Genap"
            : "Unknown";
          setAcademicInfo({ year: activeYear.year, semester });
        } else {
          setAcademicInfo({ year: "N/A", semester: "N/A" });
          toast.warn("Tidak ada Tahun Akademik yang aktif ditemukan.");
        }
      } catch (error) {
        toast.error("Gagal mengambil data Tahun Akademik.");
        console.error("Fetch Academic Year Error:", error);
      }
    };
    fetchAcademicYear();
  }, []);

  // 5.2 Fetch Classrooms
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const response = await api.get<{ data: Classroom[] }>("/classrooms");
        let classData = response.data.data;

        // MODIFIKASI: Urutkan data kelas secara ascending berdasarkan code
        classData = classData.sort(
          (a, b) => a.code.localeCompare(b.code) // Mengurutkan berdasarkan 'code'
        );

        setClassrooms(classData);

        // Hapus logika default selection agar placeholder muncul
        setLoading(false);
      } catch (error) {
        toast.error("Gagal mengambil data Kelas.");
        console.error("Fetch Classrooms Error:", error);
      }
    };
    fetchClassrooms();
  }, []);

  // 5.3 Fetch Student Data & Health Data (Main Logic)
  const fetchStudentRecords = useCallback(async (classId: number) => {
    setLoading(true);
    if (!classId) return;

    try {
      // 1. Ambil data siswa di kelas yang dipilih
      const studentsRes = await api.get<{ data: StudentClass[] }>(
        `/student/classroom?classroom=${classId}`
      );
      const studentsInClass = studentsRes.data.data.map((item) => ({
        key: item.student.id.toString(),
        student_id: item.student.id,
        nis: item.student.nis,
        fullName: item.student.fullname,
        gender: (item.student.gender.toLowerCase() === "male" ? "L" : "P") as
          | "L"
          | "P",
        height: null,
        weight: null,
        vision: null,
        hearing: null,
        dental: null,
      }));

      // 2. Ambil data kondisi kesehatan yang sudah di-submit untuk kelas ini
      const healthRes = await api.get<{ data: HealthConditionData[] }>(
        `/students/health-condition?classroom=${classId}`
      );
      const healthDataMap = new Map(
        healthRes.data.data.map((h) => [h.student_id, h])
      );

      // 3. Gabungkan data
      const mergedRecords: HealthRecord[] = studentsInClass.map((student) => {
        const healthData = healthDataMap.get(student.student_id);
        if (healthData) {
          return {
            ...student,
            height: healthData.height,
            weight: healthData.weight,
            vision: healthData.vision,
            hearing: healthData.hearing,
            dental: healthData.dental,
            pemeriksa: healthData.pemeriksa,
            note: healthData.note,
          };
        }
        return student;
      });

      setStudentRecords(mergedRecords);
    } catch (error) {
      toast.error("Gagal mengambil data Siswa atau Kondisi Kesehatan.");
      console.error("Fetch Records Error:", error);
      setStudentRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger fetch student data when selectedClassId changes
  useEffect(() => {
    // Hanya fetch data jika selectedClassId sudah terpilih
    if (selectedClassId) {
      fetchStudentRecords(selectedClassId);
    } else {
      // Jika kelas belum terpilih, tampilkan tabel kosong/loading=false
      setLoading(false);
      setStudentRecords([]);
    }
  }, [selectedClassId, fetchStudentRecords]);

  // Handler untuk Select Kelas
  const handleClassChange = (value: number) => {
    const selected = classrooms.find((c) => c.id === value);
    if (selected) {
      setSelectedClassId(value);
      setSelectedClass(selected);
    }
  };

  // --- 6. Modal/Form Logic ---

  const openEditModal = (record: HealthRecord) => {
    setCurrentStudent(record);
    setIsModalVisible(true);
  };

  const handleFormSubmit = async (values: HealthFormValues) => {
    if (!currentStudent) return;

    setIsSubmitting(true);

    const payload = {
      student_id: currentStudent.student_id,
      ...values,
      semester: academicInfo.semester.toLowerCase(), // Ambil semester aktif
    };

    try {
      await api.post("/students/health-condition", payload);
      toast.success(
        `Data kesehatan ${currentStudent.fullName} berhasil disimpan!`
      );
      setIsModalVisible(false);

      // Refresh data setelah submit berhasil
      if (selectedClassId) {
        fetchStudentRecords(selectedClassId);
      }
    } catch (error) {
      toast.error("Gagal menyimpan data Kondisi Kesehatan.");
      console.error("Submit Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 7. Konfigurasi Kolom Tabel (Diperbarui) ---
  const columns: ColumnsType<HealthRecord> = useMemo(
    () => [
      {
        title: "NIS",
        dataIndex: "nis",
        key: "nis",
        width: 120,
        sorter: (a, b) => a.nis.localeCompare(b.nis),
      },
      {
        title: "Full Name",
        dataIndex: "fullName",
        key: "fullName",
        width: 250,
        sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      },
      {
        title: "Gender",
        dataIndex: "gender",
        key: "gender",
        width: 100,
        render: (gender: "L" | "P") => (
          <Tag color={gender === "L" ? "blue" : "pink"}>{gender}</Tag>
        ),
      },
      {
        title: "Height (cm)",
        dataIndex: "height",
        key: "height",
        width: 100,
        render: (text) => text || "-",
        sorter: (a, b) => (a.height || 0) - (b.height || 0),
      },
      {
        title: "Weight (kg)",
        dataIndex: "weight",
        key: "weight",
        width: 100,
        render: (text) => text || "-",
        sorter: (a, b) => (a.weight || 0) - (b.weight || 0),
      },
      {
        title: "Vision",
        dataIndex: "vision",
        key: "vision",
        width: 100,
        render: (text) => text || "-",
      },
      {
        title: "Hearing",
        dataIndex: "hearing",
        key: "hearing",
        width: 100,
        render: (text) => text || "-",
      },
      {
        title: "Dental",
        dataIndex: "dental",
        key: "dental",
        width: 100,
        render: (text) => text || "-",
      },
      // --- KOLOM BARU UNTUK PEMERIKSA ---
      {
        title: "Checked By",
        dataIndex: "pemeriksa",
        key: "pemeriksa",
        width: 120,
        render: (text) => text || "-",
      },
      // --- KOLOM BARU UNTUK NOTE ---
      {
        title: "Note",
        dataIndex: "note",
        key: "note",
        width: 180,
        render: (text) => text || "-",
      },

      {
        title: "Actions",
        key: "actions",
        fixed: "right",
        width: 80,
        render: (_, record) => (
          <Space size="small">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => openEditModal(record)}
            />
          </Space>
        ),
      },
    ],
    []
  );

  // --- 8. Render Komponen Utama ---
  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>Home</Breadcrumb.Item>
        <Breadcrumb.Item>Academic Report</Breadcrumb.Item>
        <Breadcrumb.Item>Health Condition</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header dan Tahun Akademik */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Health Condition
          </Title>
        </Col>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            {academicInfo.year} ({academicInfo.semester})
          </Title>
        </Col>
      </Row>

      {/* Area Pencarian dan Aksi */}
      <Card style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Input
              placeholder="Search student records..."
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: "100%" }}
            />
          </Col>
          <Col flex="auto" /> {/* Spacer */}
          <Col>
            <Select
              // Jika selectedClassId null, set value ke undefined agar placeholder muncul
              value={selectedClassId === null ? undefined : selectedClassId}
              style={{ width: "100%" }}
              onChange={handleClassChange}
              loading={classrooms.length === 0 && loading}
              placeholder="Select Class" // Placeholder ditampilkan secara default
            >
              {/* MODIFIKASI: Hanya tampilkan c.code */}
              {classrooms.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.code}
                </Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button
              type="primary"
              style={{ width: "100%" }}
              onClick={() =>
                selectedClassId
                  ? fetchStudentRecords(selectedClassId)
                  : toast.warn("Pilih kelas terlebih dahulu.")
              }
              disabled={loading || !selectedClassId}
            >
              Apply Filter
            </Button>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{
                width: "100%",
                backgroundColor: "#52c41a",
                borderColor: "#52c41a",
              }}
              onClick={() =>
                toast.info("Fitur Mass Upload belum diimplementasikan.")
              }
            >
              Mass Upload
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Tampilan Info Kelas */}
      <Row style={{ marginBottom: 15 }}>
        <Col>
          <Title level={4} style={{ margin: 0, fontWeight: "bold" }}>
            Class :{" "}
            {selectedClass
              ? `${selectedClass.class_name} (${selectedClass.code})`
              : "Pilih Kelas"}
          </Title>
        </Col>
      </Row>

      {/* Tabel Data */}
      <Table<HealthRecord>
        columns={columns}
        dataSource={studentRecords}
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          total: studentRecords.length,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        scroll={{ x: 1300 }}
        bordered
      />

      {/* Modal Input/Edit Kesehatan */}
      {currentStudent && (
        <HealthConditionForm
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onFinish={handleFormSubmit}
          studentName={currentStudent.fullName}
          initialValues={{
            height: currentStudent.height || undefined,
            weight: currentStudent.weight || undefined,
            vision: currentStudent.vision || "",
            hearing: currentStudent.hearing || "",
            dental: currentStudent.dental || "",
            pemeriksa: currentStudent.pemeriksa || "",
            note: currentStudent.note || "",
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default HealthCondition;
