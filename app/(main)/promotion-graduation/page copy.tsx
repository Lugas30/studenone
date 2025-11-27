"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Layout,
  Typography,
  Select,
  Button,
  Row,
  Col,
  Card,
  Input,
  Table,
  Checkbox,
  Space,
} from "antd";
import { SearchOutlined, CloseCircleOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Ambil BASE_URL dari environment variable
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// =======================================================
// 1. INTERFACE TYPING
// =======================================================

// Interface untuk Tahun Akademik dari API
export interface AcademicYear {
  id: number;
  year: string;
  is_ganjil: boolean;
  is_genap: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Interface untuk data siswa dari API
export interface StudentAPI {
  id: number;
  nis: string;
  fullname: string;
  status_student: string;
  grade: number | null;
  academic_year_id: number;
}

// Interface untuk state komponen
export type GradeValue = number | "new_student" | "graduated";

export interface PromotionState {
  currentGrade: GradeValue;
  newGrade: GradeValue;
  students: StudentAPI[];
  promotedStudents: StudentAPI[];
  selectedStudentIds: number[];
  totalStudentsInCurrentGrade: number;
  isLoading: boolean;
  academicYears: AcademicYear[];
  activeAcademicYearId: number | null;
  activeAcademicYearName: string | null;
  nextAcademicYearId: number | null;
  nextAcademicYearName: string | null;
}

// =======================================================
// 2. KOMPONEN UTAMA NEXT.JS/REACT
// =======================================================

const { Title, Text } = Typography;

const initialGradeOptions = [
  { value: "new_student", label: "New Student" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
  { value: 6, label: "6" },
];
const nextGradeOptions = [
  ...initialGradeOptions.filter((opt) => opt.value !== "new_student"),
  { value: "graduated", label: "Graduated" },
];

const PromotionGraduationPage: React.FC = () => {
  const [state, setState] = useState<PromotionState>({
    currentGrade: "new_student",
    newGrade: 1,
    students: [],
    promotedStudents: [],
    selectedStudentIds: [],
    totalStudentsInCurrentGrade: 0,
    isLoading: false,
    academicYears: [],
    activeAcademicYearId: null,
    activeAcademicYearName: null,
    nextAcademicYearId: null,
    nextAcademicYearName: null,
  });
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>("");
  const [promotedSearchTerm, setPromotedSearchTerm] = useState<string>("");

  // -------------------------------------------------------------------
  // FUNGSI API CALL: FETCH ACADEMIC YEARS
  // -------------------------------------------------------------------

  const fetchAcademicYears = useCallback(async () => {
    if (!BASE_URL) {
      toast.error("NEXT_PUBLIC_API_URL is not set.");
      return;
    }
    const apiUrl = `${BASE_URL}/academic-years`;

    try {
      const response = await axios.get(apiUrl);
      const academicYears: AcademicYear[] = response.data;

      const activeYear = academicYears.find((year) => year.is_active);

      let nextYearId: number | null = null;
      let nextYearName: string | null = null;

      if (activeYear) {
        // Cari tahun akademik dengan ID terbesar untuk menentukan ID tahun akademik berikutnya (yang terbaru)
        // Ini adalah pendekatan yang lebih aman daripada ID aktif + 1
        const maxId = Math.max(...academicYears.map((y) => y.id));
        const nextIdGuess = maxId + 1;

        // Jika ada tahun yang ID-nya lebih besar dari ID aktif, itu mungkin tahun berikutnya.
        // Kita ambil tahun yang ID-nya paling kecil di antara yang lebih besar dari tahun aktif,
        // atau gunakan perkiraan ID aktif + 1 jika tidak ada.

        const nextYearInList = academicYears
          .filter((y) => y.id > activeYear.id)
          .sort((a, b) => a.id - b.id)[0];

        if (nextYearInList) {
          nextYearId = nextYearInList.id;
          nextYearName = nextYearInList.year;
        } else {
          // Jika tidak ada data tahun akademik berikutnya di list, asumsikan ID terbesar + 1
          nextYearId = maxId + 1;
          nextYearName = `Next Year (ID: ${nextYearId})`;
        }
      }

      setState((prev) => ({
        ...prev,
        academicYears,
        activeAcademicYearId: activeYear ? activeYear.id : null,
        activeAcademicYearName: activeYear ? activeYear.year : "N/A",
        nextAcademicYearId: nextYearId,
        nextAcademicYearName: nextYearName,
      }));
    } catch (error) {
      console.error("Error fetching academic years:", error);
      toast.error("Gagal memuat data Tahun Akademik.");
    }
  }, []);

  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  // -------------------------------------------------------------------
  // FUNGSI API CALL: FETCH STUDENTS (GET Request)
  // -------------------------------------------------------------------

  const fetchStudents = useCallback(async (grade: GradeValue) => {
    if (!BASE_URL) return;
    setState((prev) => ({
      ...prev,
      isLoading: true,
      students: [],
      promotedStudents: [],
      selectedStudentIds: [],
    }));

    // Konversi grade ke path API (e.g., 1 -> '1', 'new_student' -> 'new_student')
    const gradePath = (typeof grade === "number" ? grade.toString() : grade)
      .toLowerCase()
      .replace(/\s/g, "_");
    const apiUrl = `${BASE_URL}/pag/students/status-grade-student/${gradePath}`;

    try {
      const response = await axios.get(apiUrl);
      const studentsData: StudentAPI[] = response.data.data;

      setState((prev) => ({
        ...prev,
        students: studentsData,
        totalStudentsInCurrentGrade: studentsData.length,
        isLoading: false,
      }));
      toast.success(
        `Data siswa Grade ${grade} berhasil dimuat: ${studentsData.length} siswa.`
      );
    } catch (error) {
      console.error("Error fetching students:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      toast.error("Gagal memuat data siswa. Cek konsol untuk detail.");
    }
  }, []);

  // Handler untuk Tombol Apply Grade
  const handleApplyGrade = () => {
    fetchStudents(state.currentGrade);
  };

  // -------------------------------------------------------------------
  // FUNGSI API CALL: SUBMIT PROMOTION (POST Request)
  // -------------------------------------------------------------------

  const handleSubmitPromotion = async () => {
    if (state.promotedStudents.length === 0) {
      toast.warn("Tidak ada siswa yang dipilih untuk dipromosikan/lulus.");
      return;
    }

    if (!state.nextAcademicYearId) {
      toast.error(
        "ID Tahun Akademik Tujuan tidak ditemukan. Tidak dapat mengirim data."
      );
      return;
    }

    // Penyesuaian Kunci: Memastikan 'grade' dikirim sebagai string sesuai format API
    const targetGradeValue: string =
      state.newGrade === "graduated" ? "graduated" : state.newGrade.toString();

    const payload = {
      student_id: state.promotedStudents.map((s) => s.id),
      academic_year_id: state.nextAcademicYearId, // ID tahun akademik baru
      grade: targetGradeValue, // String "1", "2", "3", ... atau "graduated"
    };

    try {
      const apiUrl = `${BASE_URL}/pag/students/status-grade-student`;
      const response = await axios.post(apiUrl, payload);

      // Cek response API untuk message yang sukses
      const successMessage = response.data.message || "Promotion Success";

      toast.success(
        `${successMessage}. ${state.promotedStudents.length} siswa berhasil dipindahkan.`
      );

      // Reset state dan muat ulang data current grade
      setState((prev) => ({
        ...prev,
        promotedStudents: [],
        selectedStudentIds: [],
      }));
      fetchStudents(state.currentGrade);
    } catch (error) {
      console.error("Error submitting promotion:", error);
      const errorMessage =
        axios.isAxiosError(error) && error.response
          ? error.response.data.message || "Terjadi kesalahan pada server."
          : "Terjadi kesalahan jaringan atau tak terduga.";

      toast.error(`Gagal Submit: ${errorMessage}`);
    }
  };

  // -------------------------------------------------------------------
  // HANDLER LOKAL
  // -------------------------------------------------------------------

  const handleCurrentGradeChange = (value: GradeValue) => {
    setState((prev) => ({
      ...prev,
      currentGrade: value,
      newGrade:
        value === "new_student"
          ? 1
          : Number(value) === 6
          ? "graduated"
          : (Number(value) as number) + 1,
      students: [],
      promotedStudents: [],
      selectedStudentIds: [],
      totalStudentsInCurrentGrade: 0,
    }));
  };

  const handleStudentSelection = (checked: boolean, student: StudentAPI) => {
    setState((prev) => {
      let updatedSelectedIds: number[];
      if (checked) {
        if (!prev.selectedStudentIds.includes(student.id)) {
          updatedSelectedIds = [...prev.selectedStudentIds, student.id];
        } else {
          updatedSelectedIds = prev.selectedStudentIds;
        }
      } else {
        updatedSelectedIds = prev.selectedStudentIds.filter(
          (id) => id !== student.id
        );
      }
      return {
        ...prev,
        selectedStudentIds: updatedSelectedIds,
      };
    });
  };

  const handleAddToNewGrade = () => {
    setState((prev) => {
      const newStudentsToPromote = prev.students.filter(
        (s) =>
          prev.selectedStudentIds.includes(s.id) &&
          !prev.promotedStudents.some((ps) => ps.id === s.id)
      );

      const updatedPromotedStudents = [
        ...prev.promotedStudents,
        ...newStudentsToPromote,
      ];

      const updatedSelectedIds = updatedPromotedStudents.map((s) => s.id);

      if (newStudentsToPromote.length > 0) {
        toast.info(
          `${newStudentsToPromote.length} siswa ditambahkan ke daftar promosi.`
        );
      }

      return {
        ...prev,
        promotedStudents: updatedPromotedStudents,
        selectedStudentIds: updatedSelectedIds,
      };
    });
  };

  const handleCancelPromotion = (record: StudentAPI) => {
    setState((prev) => {
      toast.info(`Siswa ${record.fullname} dibatalkan dari daftar promosi.`);
      return {
        ...prev,
        promotedStudents: prev.promotedStudents.filter(
          (s) => s.id !== record.id
        ),
        selectedStudentIds: prev.selectedStudentIds.filter(
          (id) => id !== record.id
        ),
      };
    });
  };

  // -------------------------------------------------------------------
  // FILTERING DAN KOLOM TABLE
  // -------------------------------------------------------------------

  const filteredStudents = state.students.filter(
    (student) =>
      student.nis.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
      student.fullname.toLowerCase().includes(currentSearchTerm.toLowerCase())
  );

  const filteredPromotedStudents = state.promotedStudents.filter(
    (student) =>
      student.nis.toLowerCase().includes(promotedSearchTerm.toLowerCase()) ||
      student.fullname.toLowerCase().includes(promotedSearchTerm.toLowerCase())
  );

  const studentsColumns: TableProps<StudentAPI>["columns"] = [
    {
      title: (
        <Checkbox
          checked={
            state.selectedStudentIds.length > 0 &&
            filteredStudents.length > 0 &&
            filteredStudents.every((s) =>
              state.selectedStudentIds.includes(s.id)
            )
          }
          onChange={(e) => {
            const isChecked = e.target.checked;
            const filteredIds = filteredStudents.map((s) => s.id);
            setState((prev) => {
              let updatedSelectedIds = [...prev.selectedStudentIds];
              if (isChecked) {
                const newIds = filteredIds.filter(
                  (id) => !updatedSelectedIds.includes(id)
                );
                updatedSelectedIds = [...updatedSelectedIds, ...newIds];
              } else {
                updatedSelectedIds = updatedSelectedIds.filter(
                  (id) => !filteredIds.includes(id)
                );
              }
              return {
                ...prev,
                selectedStudentIds: updatedSelectedIds,
              };
            });
          }}
        />
      ),
      dataIndex: "id",
      key: "checkbox",
      width: 40,
      render: (text: number, record: StudentAPI) => (
        <Checkbox
          checked={state.selectedStudentIds.includes(record.id)}
          onChange={(e) => handleStudentSelection(e.target.checked, record)}
        />
      ),
    },
    { title: "NIS", dataIndex: "nis", key: "nis" },
    { title: "Student Name", dataIndex: "fullname", key: "fullname" },
    {
      title: "Status",
      dataIndex: "status_student",
      key: "status_student",
      width: 100,
      render: (text: string) => (
        <Text type={text === "active" ? "success" : "warning"}>
          {text.replace(/_/g, " ").toUpperCase()}
        </Text>
      ),
    },
  ];

  const promotedColumns: TableProps<StudentAPI>["columns"] = [
    { title: "NIS", dataIndex: "nis", key: "nis" },
    { title: "Student Name", dataIndex: "fullname", key: "fullname" },
    {
      title: "New Status / Grade",
      dataIndex: "status_student",
      key: "new_status_grade",
      render: () => (
        <Text type={state.newGrade === "graduated" ? "danger" : "success"}>
          {state.newGrade === "graduated"
            ? "GRADUATED"
            : `GRADE ${state.newGrade}`}
        </Text>
      ),
    },
    {
      title: "Cancel",
      key: "cancel",
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={
            <CloseCircleOutlined
              style={{ fontSize: "18px", color: "#ff4d4f" }}
            />
          }
          onClick={() => handleCancelPromotion(record)}
          style={{ padding: 0 }}
        />
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#fff" }}>
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

      {/* --- Header --- */}
      <div
        style={{
          padding: "0 0 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Promotion & Graduation
        </Title>
        <Space direction="vertical" align="end" size={0}>
          <Text strong style={{ fontSize: "18px" }}>
            Tahun Akademik Aktif: {state.activeAcademicYearName || "Memuat..."}
          </Text>
          <Text type="secondary" style={{ fontSize: "14px" }}>
            Tahun Akademik Tujuan: **{state.nextAcademicYearName || "Memuat..."}
            **
          </Text>
        </Space>
      </div>
      <hr />

      {/* --- Pilihan Grade Awal --- */}
      <Row gutter={16} align="middle" style={{ margin: "30px 0" }}>
        <Col>
          <Text>Select **Current Grade** to fetch students:</Text>
        </Col>
        <Col>
          <Select
            value={state.currentGrade}
            onChange={handleCurrentGradeChange}
            options={initialGradeOptions}
            style={{ width: 120 }}
          />
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={handleApplyGrade}
            loading={state.isLoading}
            style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}
          >
            {state.isLoading ? "Loading..." : "Apply Grade"}
          </Button>
        </Col>
      </Row>

      {/* --- Kolom Siswa Grade Saat Ini & Grade Baru --- */}
      <Row gutter={24}>
        {/* --- Kolom Kiri: Students in grade --- */}
        <Col span={12}>
          <Card
            style={{ border: "1px solid #d9d9d9", borderRadius: 2 }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={4} style={{ margin: 0 }}>
                    Students in grade : {state.currentGrade}
                  </Title>
                </Col>
                <Col>
                  <Text>Student Total : {state.students.length}</Text>
                </Col>
              </Row>
              <Input
                placeholder="Search by NIS or Name"
                prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                value={currentSearchTerm}
                onChange={(e) => setCurrentSearchTerm(e.target.value)}
                style={{ marginTop: 16 }}
              />
            </div>

            <Table<StudentAPI>
              columns={studentsColumns}
              dataSource={filteredStudents}
              rowKey="id"
              pagination={false}
              size="middle"
              scroll={{ y: 300 }}
              loading={state.isLoading}
              style={{ border: "none" }}
            />

            <div
              style={{
                padding: 16,
                textAlign: "center",
                borderTop: "1px solid #f0f0f0",
              }}
            >
              <Button
                type="primary"
                onClick={handleAddToNewGrade}
                disabled={
                  state.selectedStudentIds.length === 0 || state.isLoading
                }
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              >
                Add {state.selectedStudentIds.length} to New Grade
              </Button>
            </div>
          </Card>
        </Col>

        {/* --- Kolom Kanan: New Grade --- */}
        <Col span={12}>
          <Card
            style={{ border: "1px solid #d9d9d9", borderRadius: 2 }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Space>
                    <Title level={4} style={{ margin: 0 }}>
                      New Grade
                    </Title>
                    <Select
                      value={state.newGrade}
                      onChange={(value) =>
                        setState((prev) => ({
                          ...prev,
                          newGrade: value,
                        }))
                      }
                      options={nextGradeOptions.filter(
                        (opt) => opt.value !== state.currentGrade
                      )}
                      style={{ width: 120 }}
                    />
                  </Space>
                </Col>
                <Col>
                  <Text>Student Total : {state.promotedStudents.length}</Text>
                </Col>
              </Row>
              <Input
                placeholder="Search by NIS or Name"
                prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
                value={promotedSearchTerm}
                onChange={(e) => setPromotedSearchTerm(e.target.value)}
                style={{ marginTop: 16 }}
              />
            </div>

            <Table<StudentAPI>
              columns={promotedColumns}
              dataSource={filteredPromotedStudents}
              rowKey="id"
              pagination={false}
              size="middle"
              scroll={{ y: 300 }}
              style={{ border: "none" }}
            />
            <div
              style={{
                padding: 16,
                textAlign: "center",
                borderTop: "1px solid #f0f0f0",
              }}
            >
              {/* Padding Konsistensi */}
            </div>
          </Card>
        </Col>
      </Row>

      {/* --- Footer Submit --- */}
      <Row justify="center" style={{ marginTop: 30 }}>
        <Col span={24}>
          <div
            style={{
              backgroundColor: "#fffbe6",
              border: "1px solid #ffe58f",
              padding: 16,
              borderRadius: 2,
              textAlign: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <Text type="warning" strong style={{ color: "#faad14" }}>
              The promotion will be submitted for Academic Year: **
              {state.nextAcademicYearName || "N/A"}**
            </Text>
            <div style={{ marginTop: 16 }}>
              <Button
                type="primary"
                size="large"
                onClick={handleSubmitPromotion}
                disabled={
                  state.promotedStudents.length === 0 ||
                  !state.nextAcademicYearId
                }
                style={{
                  backgroundColor: "#1890ff",
                  borderColor: "#1890ff",
                  height: "40px",
                }}
              >
                Submit Promotion ({state.promotedStudents.length} Students)
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <style jsx global>{`
        .ant-table-thead > tr > th {
          background-color: #f7f7f7 !important;
        }
        .ant-table-container {
          border: none !important;
        }
      `}</style>
    </Layout>
  );
};

export default PromotionGraduationPage;
