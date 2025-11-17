"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Typography,
  Tag,
  Menu,
  Dropdown,
  Breadcrumb,
  Modal,
  Form,
  DatePicker,
  Select,
  Descriptions,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  PlusOutlined,
  DownOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { ToastContainer, toast } from "react-toastify";

const { Title } = Typography;
const { Option } = Select;

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://so-api.queensland.id/api";

// --- 1. Definisi Tipe Data ---

interface AcademicYear {
  id: number;
  year: string;
  is_active: boolean;
}
interface Student {
  key: string;
  id: number;
  nis: string;
  nisn: string;
  fullname: string;
  gender: "male" | "female";
  join_date: string;
  addmission_type: "regular" | "transfer_in" | "transfer_out" | "drop_out";
  is_active: boolean;
  academic_year: AcademicYear;
  username: string;
  place_birth: string;
  date_of_birth: string;
  religion: string;
  address: string;
  contact: string;
  mother_name: string;
  father_name: string;
  sekolah_asal: string;
  ijazah_number: string;
  notes: string | null;
}
interface StudentPayload {
  nis: string;
  nisn: string;
  fullname: string;
  username: string;
  place_birth: string;
  date_of_birth: string;
  gender: "male" | "female";
  religion: string;
  address: string;
  contact: string;
  mother_name: string;
  father_name: string;
  sekolah_asal: string;
  ijazah_number: string;
  join_date: string;
  addmission_type: "regular" | "transfer_in" | "transfer_out" | "drop_out";
  notes?: string | null;
  is_active?: boolean;
}
type UserStatus =
  | "Active"
  | "Transfer Out"
  | "Transfer In"
  | "Dropout"
  | "Graduate";

// --- 2. Fungsi Utility untuk Status Mapping dan Tag ---

const getDisplayStatus = (
  addmissionType: Student["addmission_type"],
  isActive: boolean
): UserStatus => {
  if (isActive) return "Active";
  switch (addmissionType) {
    case "transfer_in":
      return "Transfer In";
    case "transfer_out":
      return "Transfer Out";
    case "drop_out":
      return "Dropout";
    case "regular":
    default:
      return "Graduate";
  }
};

const getStatusTag = (
  addmissionType: Student["addmission_type"],
  isActive: boolean
) => {
  const statusText = getDisplayStatus(addmissionType, isActive);
  let color;

  switch (statusText) {
    case "Active":
      color = "green";
      break;
    case "Transfer In":
      color = "blue";
      break;
    case "Transfer Out":
    case "Dropout":
      color = "volcano";
      break;
    case "Graduate":
      color = "purple";
      break;
    default:
      color = "default";
  }

  return (
    <Tag color={color} key={statusText}>
      {statusText}
    </Tag>
  );
};

// --- 3. Komponen Detail Siswa (REVISI INFORMASI AKADEMIK) ---

const StudentDetailView: React.FC<{ student: Student }> = ({ student }) => {
  const admissionTypeDisplay = student.addmission_type
    .replace("_", " ")
    .toUpperCase();
  const genderDisplay =
    student.gender === "male" ? "Laki-laki (L)" : "Perempuan (P)";
  const ttlDisplay = `${student.place_birth}, ${dayjs(
    student.date_of_birth
  ).format("DD MMMM YYYY")}`;
  const joinYearDisplay = dayjs(student.join_date).format("YYYY");

  return (
    <div style={{ padding: "0 5px" }}>
      {/* Bagian Status Utama */}
      <Descriptions
        title="Status Keaktifan"
        bordered
        size="middle"
        column={1}
        style={{ marginBottom: "15px" }}
      >
        <Descriptions.Item label="Status Aktif">
          {getStatusTag(student.addmission_type, student.is_active)}
        </Descriptions.Item>
        <Descriptions.Item label="Catatan Status">
          {student.notes || "Tidak ada catatan terkait perubahan status."}
        </Descriptions.Item>
      </Descriptions>

      {/* 1. Informasi Identitas Siswa */}
      <Descriptions
        title="Informasi Identitas Siswa"
        bordered
        size="middle"
        column={2}
        style={{ marginBottom: "20px" }}
      >
        <Descriptions.Item label="NIS">{student.nis}</Descriptions.Item>
        <Descriptions.Item label="NISN">{student.nisn}</Descriptions.Item>
        <Descriptions.Item label="Nama Lengkap">
          {student.fullname}
        </Descriptions.Item>
        <Descriptions.Item label="Nama Panggilan">
          {student.username || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Jenis Kelamin">
          {genderDisplay}
        </Descriptions.Item>
        <Descriptions.Item label="Agama">{student.religion}</Descriptions.Item>
      </Descriptions>

      {/* 2. Informasi Kelahiran dan Domisili */}
      <Descriptions
        title="Informasi Kelahiran & Domisili"
        bordered
        size="middle"
        column={{ xs: 1, sm: 2, md: 3 }}
        style={{ marginBottom: "20px" }}
      >
        <Descriptions.Item label="Tempat, Tanggal Lahir" span={3}>
          {ttlDisplay}
        </Descriptions.Item>
        <Descriptions.Item label="Alamat Tinggal" span={3}>
          {student.address || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Kontak Darurat">
          {student.contact || "-"}
        </Descriptions.Item>
      </Descriptions>

      {/* 3. Informasi Akademik dan Asal Sekolah (REVISI: 2 Kolom) */}
      <Descriptions
        title="Informasi Akademik"
        bordered
        size="middle"
        column={2} // Diubah menjadi 2 kolom
        style={{ marginBottom: "20px" }}
      >
        <Descriptions.Item label="Tipe Penerimaan">
          <Tag color="blue">{admissionTypeDisplay}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Tahun Ajaran Masuk">
          {joinYearDisplay}
        </Descriptions.Item>
        <Descriptions.Item label="Nomor Ijazah">
          {student.ijazah_number || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Sekolah Asal" span={2}>
          {" "}
          {/* span disesuaikan menjadi 2 */}
          {student.sekolah_asal || "Tidak Tercatat"}
        </Descriptions.Item>
      </Descriptions>

      {/* 4. Informasi Orang Tua */}
      <Descriptions
        title="Informasi Orang Tua"
        bordered
        size="middle"
        column={{ xs: 1, sm: 2 }}
      >
        <Descriptions.Item label="Nama Ayah">
          {student.father_name || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Nama Ibu">
          {student.mother_name || "-"}
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
};

// --- 4. Komponen Utama StudentList ---

const StudentList: React.FC = () => {
  const [data, setData] = useState<Student[]>([]);
  const [initialData, setInitialData] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState("Loading...");

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formType, setFormType] = useState<"add" | "edit">("add");
  const [form] = Form.useForm();

  // --- 5. Fungsi Interaksi API ---

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/students`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const apiData: Omit<Student, "key">[] = await response.json();
      const processedData: Student[] = apiData.map((student) => ({
        ...student,
        key: student.id.toString(),
        gender: student.gender as "male" | "female",
      }));
      setData(processedData);
      setInitialData(processedData);
      setAcademicYear(
        processedData.length > 0 ? processedData[0].academic_year.year : "N/A"
      );
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Gagal mengambil data siswa.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleAddStudent = async (payload: StudentPayload) => {
    try {
      const response = await fetch(`${API_URL}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      toast.success("Siswa berhasil ditambahkan!");
      setIsFormModalVisible(false);
      form.resetFields();
      fetchStudents();
    } catch (error: any) {
      toast.error(`Gagal menambah siswa: ${error.message}`);
    }
  };

  const handleUpdateStudent = async (
    studentId: number,
    payload: Partial<StudentPayload>
  ) => {
    try {
      const response = await fetch(`${API_URL}/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      toast.success(`Siswa ID ${studentId} berhasil diperbarui!`);
      setIsFormModalVisible(false);
      form.resetFields();
      fetchStudents();
    } catch (error: any) {
      toast.error(`Gagal memperbarui siswa ID ${studentId}: ${error.message}`);
    }
  };

  // --- 6. Fungsi UI/Handler ---

  const handleOpenEditForm = (student: Student) => {
    setFormType("edit");
    setSelectedStudent(student);

    const formStatus = getDisplayStatus(
      student.addmission_type,
      student.is_active
    );

    let formAdmissionType: "Regular" | "Transfer" = "Regular";
    if (student.addmission_type === "transfer_in") {
      formAdmissionType = "Transfer";
    }

    // Menggunakan pemetaan eksplisit untuk mengatasi ketidakcocokan nama kunci (snake_case vs camelCase)
    form.setFieldsValue({
      // Data ID, Kontak, Agama, Alamat (yang namanya cocok atau dipetakan secara langsung)
      nis: student.nis,
      nisn: student.nisn,
      religion: student.religion,
      address: student.address,
      contact: student.contact,

      // Pemetaan Kunci API (student.xxx) ke Nama Form (yyy)
      fullName: student.fullname,
      callName: student.username,
      placeBirth: student.place_birth,
      motherName: student.mother_name,
      fatherName: student.father_name,
      sekolahAsal: student.sekolah_asal,
      ijazahNumber: student.ijazah_number,
      note: student.notes,

      // Data Khusus (Tanggal & Gender)
      gender: student.gender === "male" ? "L" : "P",
      date_of_birth: dayjs(student.date_of_birth),
      join_date: dayjs(student.join_date),

      // Data Status
      status: formStatus,
      admissionType: formAdmissionType,
    });

    setIsFormModalVisible(true);
  };

  const handleDelete = (student: Student) => {
    Modal.confirm({
      title: "Konfirmasi Hapus",
      content: `Anda yakin ingin menghapus siswa: ${student.fullname} (${student.nis})?`,
      okText: "Hapus",
      okType: "danger",
      cancelText: "Batal",
      onOk() {
        console.log("Menghapus Siswa ID:", student.id);
        toast.warning("Fungsi DELETE API belum diimplementasikan.");
      },
    });
  };

  const onFinish = (values: any) => {
    let apiIsActive: boolean;
    let apiAdmissionType: StudentPayload["addmission_type"];

    const userStatus = values.status as UserStatus;
    const formAdmissionType = values.admissionType as "Regular" | "Transfer";

    if (userStatus === "Transfer Out") {
      apiIsActive = false;
      apiAdmissionType = "transfer_out";
    } else if (userStatus === "Dropout") {
      apiIsActive = false;
      apiAdmissionType = "drop_out";
    } else if (userStatus === "Graduate") {
      apiIsActive = false;
      apiAdmissionType = "regular";
    } else {
      apiIsActive = userStatus === "Active";
      apiAdmissionType =
        formAdmissionType === "Transfer" ? "transfer_in" : "regular";
    }

    const apiGender = values.gender === "L" ? "male" : "female";

    const payload: StudentPayload = {
      // Mapping Balik dari Form Name ke API Key
      nis: values.nis,
      nisn: values.nisn,
      fullname: values.fullName,
      username: values.callName || "",
      place_birth: values.placeBirth,
      date_of_birth: values.date_of_birth.format("YYYY-MM-DD"),
      gender: apiGender,
      religion: values.religion,
      address: values.address || "",
      contact: values.contact || "",
      mother_name: values.motherName || "",
      father_name: values.fatherName || "",
      sekolah_asal: values.sekolahAsal || "",
      ijazah_number: values.ijazahNumber || "",
      join_date: values.join_date.format("YYYY-MM-DD"),
      addmission_type: apiAdmissionType,
      is_active: apiIsActive,
      notes: values.note || null,
    };

    if (formType === "add") {
      delete payload.is_active;
      delete payload.notes;
      handleAddStudent(payload);
    } else if (formType === "edit" && selectedStudent) {
      handleUpdateStudent(selectedStudent.id, payload);
    }
  };

  // --- 7. Definisi Kolom Tabel & Breadcrumb ---

  const columns: ColumnsType<Student> = [
    {
      title: "NIS",
      dataIndex: "nis",
      key: "nis",
      sorter: (a, b) => a.nis.localeCompare(b.nis),
      width: 120,
    },
    {
      title: "NISN",
      dataIndex: "nisn",
      key: "nisn",
      sorter: (a, b) => a.nisn.localeCompare(b.nisn),
      width: 120,
    },
    {
      title: "Full Name",
      dataIndex: "fullname",
      key: "fullname",
      sorter: (a, b) => a.fullname.localeCompare(b.fullname),
      width: 250,
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
      width: 100,
      render: (gender: "male" | "female") => (gender === "male" ? "L" : "P"),
    },
    {
      title: "Join Academic",
      dataIndex: "join_date",
      key: "join_date",
      width: 150,
      render: (join_date: string) => new Date(join_date).getFullYear(),
    },
    {
      title: "Status",
      dataIndex: "addmission_type",
      key: "status",
      render: (_, record) =>
        getStatusTag(record.addmission_type, record.is_active),
      filters: [
        { text: "Active", value: "Active" },
        { text: "Transfer In", value: "Transfer In" },
        { text: "Transfer Out", value: "Transfer Out" },
        { text: "Dropout", value: "Dropout" },
        { text: "Graduate", value: "Graduate" },
      ],
      onFilter: (value, record) =>
        getDisplayStatus(record.addmission_type, record.is_active) === value,
      width: 150,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            title="View Detail"
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => handleOpenEditForm(record)}
            title="Edit Student"
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            title="Delete Student"
          />
        </Space>
      ),
    },
  ];

  const handleViewDetail = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailModalVisible(true);
  };

  const handleOpenAddForm = () => {
    setFormType("add");
    setSelectedStudent(null);
    form.resetFields();
    setIsFormModalVisible(true);
  };

  const menu = (
    <Menu>
      <Menu.Item key="1" icon={<UploadOutlined />}>
        Import from Excel
      </Menu.Item>
      <Menu.Item key="2" icon={<UploadOutlined />}>
        Import from CSV
      </Menu.Item>
    </Menu>
  );

  const breadcrumbItems = [
    { title: <a href="/">Home</a> },
    { title: "Student List" },
  ];

  return (
    <div style={{ padding: "20px" }}>
      {/* Container Toastify */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Breadcrumb */}
      <div style={{ marginBottom: "10px" }}>
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #f0f0f0",
          margin: "15px 0",
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Student List
        </Title>
        <Title level={3} style={{ margin: 0 }}>
          {academicYear}
        </Title>
      </div>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #f0f0f0",
          margin: "15px 0",
        }}
      />

      {/* Control Bar: Search dan Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <Input.Search
          placeholder="Search student by Name, NIS, or NISN..."
          allowClear
          onSearch={() => {}}
          style={{ width: 400 }}
          loading={loading}
        />
        <Space>
          <Dropdown overlay={menu} placement="bottomRight" trigger={["click"]}>
            <Button
              type="primary"
              style={{ backgroundColor: "#28a745", borderColor: "#28a745" }}
              icon={<UploadOutlined />}
            >
              Mass Upload <DownOutlined />
            </Button>
          </Dropdown>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenAddForm}
          >
            Add Student
          </Button>
          <Button icon={<UploadOutlined />} title="Export Data" />
        </Space>
      </div>

      {/* Tabel Data Siswa */}
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
          total: initialData.length,
        }}
        scroll={{ x: 900 }}
        bordered
      />

      {/* Modal View Detail Siswa */}
      <Modal
        title={`Dokumen Siswa: ${selectedStudent?.fullname || ""}`}
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Tutup
          </Button>,
        ]}
        width={900}
        style={{ top: 20 }}
      >
        {selectedStudent && <StudentDetailView student={selectedStudent} />}
      </Modal>

      {/* Modal Add/Edit Student Form */}
      <Modal
        title={
          formType === "add"
            ? "Add Student Information"
            : "Edit Student Information"
        }
        open={isFormModalVisible}
        onCancel={() => {
          setIsFormModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={650}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            gender: "P",
            religion: "Islam",
            status: "Active",
            admissionType: "Regular",
            note: "-",
            contact: "-",
            ijazahNumber: "-",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "5px 20px",
            }}
          >
            <Form.Item
              name="nis"
              label="NIS"
              rules={[{ required: true, message: "Wajib diisi!" }]}
            >
              <Input placeholder="NIS" />
            </Form.Item>
            <Form.Item
              name="nisn"
              label="NISN"
              rules={[{ required: true, message: "Wajib diisi!" }]}
            >
              <Input placeholder="NISN" />
            </Form.Item>
            <Form.Item
              name="fullName"
              label="Full Name"
              rules={[{ required: true, message: "Wajib diisi!" }]}
            >
              <Input placeholder="Full Name" />
            </Form.Item>
            <Form.Item
              name="callName"
              label="Call Name"
              rules={[{ required: true, message: "Wajib diisi!" }]}
            >
              <Input placeholder="Call Name" />
            </Form.Item>
            <Form.Item name="placeBirth" label="Place Birth">
              <Input placeholder="Place Birth" />
            </Form.Item>
            <Form.Item
              name="date_of_birth"
              label="Date of Birth"
              rules={[{ required: true, message: "Wajib diisi!" }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
                placeholder="Select date"
              />
            </Form.Item>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: "Wajib diisi!" }]}
            >
              <Select placeholder="P/L">
                <Option value="P">P</Option>
                <Option value="L">L</Option>
              </Select>
            </Form.Item>
            <Form.Item name="religion" label="Religion">
              <Input placeholder="Islam" />
            </Form.Item>
            <Form.Item name="address" label="Address">
              <Input placeholder="Address" />
            </Form.Item>
            <Form.Item name="contact" label="Contact">
              <Input placeholder="-" />
            </Form.Item>
            <Form.Item name="motherName" label="Mother Name">
              <Input placeholder="Yanti" />
            </Form.Item>
            <Form.Item name="fatherName" label="Father Name">
              <Input placeholder="Islam Machaeve" />
            </Form.Item>
            <Form.Item name="sekolahAsal" label="Sekolah Asal">
              <Input placeholder="TK Bla bla" />
            </Form.Item>
            <Form.Item name="ijazahNumber" label="Ijazah Number">
              <Input placeholder="-" />
            </Form.Item>

            {/* Join Academic Year & Admission Type */}
            <Form.Item
              name="join_date"
              label="Join Academic Year"
              rules={[{ required: true, message: "Wajib diisi!" }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
                placeholder="Select date"
              />
            </Form.Item>

            <Form.Item
              name="admissionType"
              label="Admission Type (Regular or Transfer)"
              rules={[{ required: true, message: "Wajib diisi!" }]}
            >
              <Select placeholder="Transfer">
                <Option value="Regular">Regular</Option>
                <Option value="Transfer">Transfer</Option>
              </Select>
            </Form.Item>

            {/* Status & Note */}
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: "Wajib diisi!" }]}
            >
              <Select>
                <Option value="Active">Active</Option>
                <Option value="Transfer In">Transfer In</Option>
                <Option value="Transfer Out">Transfer Out</Option>
                <Option value="Dropout">Dropout</Option>
                <Option value="Graduate">Graduate</Option>
              </Select>
            </Form.Item>

            <Form.Item name="note" label="Note (for status inactive)">
              <Input.TextArea placeholder="-" rows={1} />
            </Form.Item>
          </div>

          <Form.Item
            style={{ textAlign: "right", marginTop: "20px", marginBottom: 0 }}
          >
            <Space>
              <Button
                onClick={() => {
                  setIsFormModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StudentList;
