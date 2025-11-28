"use client";
// src/components/PromotionGraduationPage.tsx

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Typography,
  Select,
  Button,
  Row,
  Col,
  Card,
  Input,
  Table,
  Space,
  Spin,
} from "antd";
import type { TableProps } from "antd";
import { SearchOutlined, CloseCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const { Title, Text } = Typography;

// --- 1. Definisi Tipe Data ---

interface AcademicYear {
  id: number;
  year: string;
  is_active: boolean;
}

interface Student {
  id: number;
  nis: string;
  fullname: string;
  // Memperbaiki/Mengkonfirmasi Literal Union Type
  status_student: "active" | "graduated" | "new_student";
  grade: string;
  key: string;
}

type GradeOption = "new_student" | "1" | "2" | "3" | "4" | "5" | "6";
type PostGradeOption = "1" | "2" | "3" | "4" | "5" | "6" | "graduated";

// TIPE BARU untuk memungkinkan nilai kosong/belum dipilih pada Select
type SelectableGradeOption = GradeOption | null;
type SelectablePostGradeOption = PostGradeOption | null;

// --- 2. Service API (Axios) ---

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
});

// --- 3. Komponen Utama ---

const PromotionGraduationPage: React.FC = () => {
  // --- State Management ---
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [activeAcademicYear, setActiveAcademicYear] =
    useState<AcademicYear | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  const [loading, setLoading] = useState(false);

  // UBAH: Default state menjadi null (kosong)
  const [currentGrade, setCurrentGrade] = useState<SelectableGradeOption>(null); // Default: null
  const [newGrade, setNewGrade] = useState<SelectablePostGradeOption>(null); // Default: null

  const [selectedStudentKeys, setSelectedStudentKeys] = useState<React.Key[]>(
    []
  );
  const [promotedStudents, setPromotedStudents] = useState<Student[]>([]);
  const [searchStudent, setSearchStudent] = useState<string>("");
  const [searchPromoted, setSearchPromoted] = useState<string>("");

  // Grade Options untuk Select
  const gradeOptions = [
    { value: "new_student", label: "New Student" },
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6", label: "6" },
  ];

  const newGradeOptions = [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6", label: "6" },
    { value: "graduated", label: "Graduated" },
  ];

  // --- Fetch Data Hooks ---

  // 3a. Fetch Academic Years
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const response = await api.get("/academic-years");
        const years: AcademicYear[] = response.data;
        setAcademicYears(years);
        const activeYear = years.find((y) => y.is_active);
        setActiveAcademicYear(activeYear || null);
      } catch (error) {
        toast.error("Gagal memuat Tahun Akademik.");
        console.error("Error fetching academic years:", error);
      }
    };
    fetchAcademicYears();
  }, []);

  // 3b. Fetch Students based on Current Grade
  // Parameter harus GradeOption (tidak boleh null) karena ini yang dikirim ke API
  const fetchStudents = useCallback(async (grade: GradeOption) => {
    setLoading(true);
    setAllStudents([]);
    setPromotedStudents([]);
    setSelectedStudentKeys([]);

    const gradeParam = grade === "new_student" ? "new_student" : grade;

    try {
      const response = await api.get(
        `/pag/students/status-grade-student/${gradeParam}`
      );
      const fetchedStudents: Student[] = response.data.data.map((s: any) => ({
        id: s.id,
        nis: s.nis || "N/A",
        fullname: s.fullname,
        // Asumsi data status_student dari API selalu sesuai dengan union type
        status_student: s.status_student as
          | "active"
          | "graduated"
          | "new_student",
        grade: s.grade,
        key: s.id.toString(),
      }));
      setAllStudents(fetchedStudents);
      toast.success(
        `Berhasil memuat ${
          fetchedStudents.length
        } siswa untuk Grade ${gradeParam.toUpperCase().replace("_", " ")}`
      );
    } catch (error) {
      toast.error(
        `Gagal memuat data siswa untuk Grade ${gradeParam
          .toUpperCase()
          .replace("_", " ")}.`
      );
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // UBAH: useEffect hanya akan memanggil fetchStudents jika currentGrade sudah terpilih (bukan null)
  useEffect(() => {
    if (currentGrade) {
      fetchStudents(currentGrade);
    }
  }, [currentGrade, fetchStudents]);

  // --- Logic Promosi Siswa ---

  const handleAddToNewGrade = () => {
    if (selectedStudentKeys.length === 0) {
      toast.error("Pilih siswa yang akan dipromosikan terlebih dahulu.");
      return;
    }
    // TAMBAHKAN: Validasi newGrade
    if (!newGrade) {
      toast.error("Silakan pilih Grade baru terlebih dahulu!");
      return;
    }

    // 1. Tentukan status siswa baru
    const newStatus: "active" | "graduated" =
      newGrade === "graduated" ? "graduated" : "active";

    // 2. Filter siswa yang dipilih dan buat objek baru
    const studentsToPromote = allStudents
      .filter((student) => selectedStudentKeys.includes(student.key))
      .map((student) => ({
        ...student,
        // Override status_student
        status_student: newStatus,
      })) as Student[];

    // 3. Update state
    setPromotedStudents((prev) => [...prev, ...studentsToPromote]);
    setSelectedStudentKeys([]);
    toast.info(
      `${studentsToPromote.length} siswa ditambahkan ke daftar promosi.`
    );
  };

  const handleCancelPromotion = (nis: string) => {
    setPromotedStudents((prev) =>
      prev.filter((student) => student.nis !== nis)
    );
    toast.warn(`Siswa dengan NIS ${nis} dibatalkan dari daftar promosi.`);
  };

  // --- Submit Promosi ke API ---
  const handleSubmitPromotion = async () => {
    if (promotedStudents.length === 0) {
      toast.error(
        "Silakan pilih siswa untuk dipromosikan/lulus terlebih dahulu!"
      );
      return;
    }
    if (!activeAcademicYear) {
      toast.error(
        "Tahun Akademik aktif tidak ditemukan. Tidak dapat melakukan promosi."
      );
      return;
    }
    // TAMBAHKAN: Validasi newGrade
    if (!newGrade) {
      toast.error("Grade tujuan (New Grade) harus dipilih!");
      return;
    }

    const studentIds = promotedStudents.map((s) => s.id);
    const targetAcademicYearId = activeAcademicYear.id;

    const postData = {
      student_id: studentIds,
      academic_year_id: targetAcademicYearId,
      grade: newGrade, // newGrade dijamin PostGradeOption
    };

    setLoading(true);

    try {
      const response = await api.post(
        "/pag/students/status-grade-student",
        postData
      );

      if (response.data.message === "Promotion Success") {
        toast.success("Promosi/Kelulusan berhasil diajukan!");
      } else {
        toast.success(`Promosi berhasil diajukan: ${response.data.message}`);
      }

      // Pastikan currentGrade tidak null sebelum fetch ulang
      if (currentGrade) {
        await fetchStudents(currentGrade);
      } else {
        // Jika currentGrade null, cukup reset list siswa
        setAllStudents([]);
        toast.info("Pilihan grade saat ini hilang, silakan pilih grade lagi.");
      }

      setPromotedStudents([]);
      setSelectedStudentKeys([]);
    } catch (error) {
      let errorMessage = "Gagal memproses promosi. Silakan coba lagi.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      toast.error(`❌ ${errorMessage}`);
      console.error("Submit Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Computed Values (Pencarian & Filtering UI) ---

  const filteredStudents = useMemo(() => {
    const available = allStudents.filter(
      (student) => !promotedStudents.some((p) => p.nis === student.nis)
    );
    return available.filter(
      (student) =>
        student.nis.includes(searchStudent) ||
        student.fullname.toLowerCase().includes(searchStudent.toLowerCase())
    );
  }, [searchStudent, allStudents, promotedStudents]);

  const filteredPromotedStudents = useMemo(() => {
    return promotedStudents.filter(
      (student) =>
        student.nis.includes(searchPromoted) ||
        student.fullname.toLowerCase().includes(searchPromoted.toLowerCase())
    );
  }, [searchPromoted, promotedStudents]);

  // --- Konfigurasi Ant Design Table ---

  const studentColumns: TableProps<Student>["columns"] = [
    { title: "NIS", dataIndex: "nis", key: "nis", width: "20%" },
    { title: "Student Name", dataIndex: "fullname", key: "fullname" },
    {
      title: "Status",
      dataIndex: "status_student",
      key: "status_student",
      width: "20%",
      render: (text) => (
        <Text
          type={
            text === "active" || text === "new_student"
              ? "success"
              : "secondary"
          }
          strong
        >
          {text.toUpperCase().replace("_", " ")}
        </Text>
      ),
    },
  ];

  const promotedColumns: TableProps<Student>["columns"] = [
    { title: "NIS", dataIndex: "nis", key: "nis", width: "20%" },
    { title: "Student Name", dataIndex: "fullname", key: "fullname" },
    {
      title: "Status",
      dataIndex: "status_student",
      key: "status_student",
      width: "20%",
      render: (text) => (
        <Text strong>{text.toUpperCase().replace("_", " ")}</Text>
      ),
    },
    {
      title: "",
      key: "cancel",
      width: "10%",
      render: (_, record) => (
        <Button
          danger
          type="text"
          icon={<CloseCircleOutlined style={{ fontSize: "18px" }} />}
          onClick={() => handleCancelPromotion(record.nis)}
        />
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedStudentKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedStudentKeys(selectedKeys);
    },
    getCheckboxProps: (record: Student) => ({
      disabled: promotedStudents.some((p) => p.nis === record.nis),
    }),
  };

  // --- Render Component ---

  return (
    <div style={{ padding: 24, minHeight: "100vh" }} className="bg-zinc-100">
      <Spin spinning={loading} tip="Memuat Data atau Memproses Promosi...">
        {/* Header */}
        <div style={{ padding: "0 0 16px 0" }}>
          <Text type="secondary">Home / Student List</Text>
        </div>

        <Row justify="space-between" align="top" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Promotion & Graduation
            </Title>
          </Col>
          <Col>
            <Title level={2} style={{ margin: 0, color: "#4096FF" }}>
              {activeAcademicYear ? activeAcademicYear.year : "Memuat..."}
            </Title>
          </Col>
        </Row>

        {/* Grade Selection */}
        <Row gutter={16} align="middle" style={{ marginBottom: 40 }}>
          <Col style={{ display: "flex", alignItems: "center" }}>
            <Text style={{ marginRight: 8 }}>Please select current grade</Text>
          </Col>
          <Col>
            <Select
              // UBAH: value bisa null
              value={currentGrade}
              onChange={(value) =>
                setCurrentGrade(value as SelectableGradeOption)
              }
              options={gradeOptions}
              style={{ minWidth: 120 }}
              disabled={loading}
              placeholder="Select Grade" // Tambahkan placeholder
            />
          </Col>
          <Col>
            <Button
              type="primary"
              // UBAH: Cek currentGrade sebelum fetch
              onClick={() => {
                if (currentGrade) {
                  fetchStudents(currentGrade);
                } else {
                  toast.warn("Silakan pilih Grade saat ini terlebih dahulu.");
                }
              }}
              // UBAH: Disabled jika loading atau currentGrade null
              disabled={loading || currentGrade === null}
            >
              Apply Grade
            </Button>
          </Col>
        </Row>

        {/* Main Content: Two Cards */}
        <Row gutter={24}>
          {/* Card Kiri: Students in grade : X */}
          <Col span={12}>
            <Card
              title={
                <Space size="large">
                  <Text strong>
                    Students in grade :{" "}
                    {/* Tampilkan nilai atau pesan jika null */}
                    {currentGrade
                      ? currentGrade.toUpperCase().replace("_", " ")
                      : "N/A"}
                  </Text>
                  <Text type="secondary">
                    Student Total : {allStudents.length}
                  </Text>
                </Space>
              }
              variant="borderless"
            >
              {/* Search Bar */}
              <Input
                placeholder="Search by NIS or Name"
                prefix={<SearchOutlined />}
                style={{ marginBottom: 16 }}
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
              />

              {/* Students Table */}
              <Table
                rowSelection={rowSelection}
                columns={studentColumns}
                dataSource={filteredStudents}
                pagination={false}
                size="small"
                scroll={{ y: 300 }}
                style={{ border: "1px solid #f0f0f0" }}
                loading={loading}
              />

              {/* Add to New Grade Button */}
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <Button
                  type="primary"
                  style={{
                    backgroundColor: "#52c41a",
                    borderColor: "#52c41a",
                    fontWeight: "bold",
                  }}
                  onClick={handleAddToNewGrade}
                  // UBAH: Disabled jika selectedStudentKeys kosong atau newGrade null
                  disabled={
                    selectedStudentKeys.length === 0 ||
                    loading ||
                    newGrade === null
                  }
                >
                  Add to New Grade
                </Button>
              </div>
            </Card>
          </Col>

          {/* Card Kanan: New Grade */}
          <Col span={12}>
            <Card
              title={
                <Space size="large">
                  <Text strong>New Grade</Text>
                  <Select
                    // UBAH: value bisa null
                    value={newGrade}
                    onChange={(value) =>
                      setNewGrade(value as SelectablePostGradeOption)
                    }
                    options={newGradeOptions}
                    style={{ minWidth: 100 }}
                    disabled={loading}
                    placeholder="Select New Grade" // Tambahkan placeholder
                  />
                  <Text type="secondary">
                    Student Total : {promotedStudents.length}
                  </Text>
                </Space>
              }
              variant="borderless"
            >
              {/* Search Bar */}
              <Input
                placeholder="Search by NIS or Name"
                prefix={<SearchOutlined />}
                style={{ marginBottom: 16 }}
                value={searchPromoted}
                onChange={(e) => setSearchPromoted(e.target.value)}
              />

              {/* Promoted Students Table */}
              <Table
                columns={promotedColumns}
                dataSource={filteredPromotedStudents}
                pagination={false}
                size="small"
                scroll={{ y: 300 }}
                style={{ border: "1px solid #f0f0f0" }}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        {/* Submit Promotion Section */}
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <div
            style={{
              display: "inline-block",
              padding: "24px 32px",
              backgroundColor: "#fffbe6",
              border: "1px solid #ffe58f",
              borderRadius: 4,
              boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
            }}
          >
            <Text strong type="warning">
              Please kindly check before submit the Promotion & Graduation !
            </Text>
          </div>
          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              size="large"
              style={{
                height: 50,
                padding: "0 50px",
                fontWeight: "bold",
                fontSize: "16px",
              }}
              onClick={handleSubmitPromotion}
              disabled={
                // UBAH: Disabled jika promotedStudents kosong, loading, activeAcademicYear null, atau newGrade null
                promotedStudents.length === 0 ||
                loading ||
                !activeAcademicYear ||
                !newGrade
              }
            >
              Submit Promotion
            </Button>
          </div>
        </div>
      </Spin>
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
    </div>
  );
};

export default PromotionGraduationPage;
