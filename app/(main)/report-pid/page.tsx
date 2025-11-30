"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Row,
  Col,
  Select,
  Input,
  Button,
  Typography,
  Space,
  Card,
  Breadcrumb,
  Spin,
  message,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import axios from "axios";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;
const { Option } = Select;

// Ambil BASE_URL dari .env
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// =================================================================
// 📚 DEFINISI TIPE DATA (INTERFACE)
// =================================================================

interface AcademicYear {
  id: number;
  year: string;
  is_ganjil: boolean;
  is_genap: boolean;
  is_active: boolean;
}

interface Classroom {
  id: number;
  grade: string;
  section: string;
  class_name: string;
  code: string;
  academic_year: AcademicYear;
}

interface ClassroomResponse {
  academicYear: string;
  data: Classroom[];
}

interface SubjectAssessment {
  subject_teacher_id: number;
  subject_id: number;
  teacher_id: number;
  classroom_id: number;
  grade: string;
  classroom_name: string;
  subject_name: string;
  teacher_name: string;
}

interface PidAssignment {
  pid_assessment_id: number | null;
  classroom_id: number;
  code: string;
  grade: string;
  class_name: string;
  status: "true" | "false" | "-"; // PERUBAHAN LOGIKA: "true" = Open, "false" = Submitted/Closed
  publish: "true" | "false" | "-";
}

// --- KOMPONEN SUBJECT CARD ---
interface SubjectCardProps {
  data: SubjectAssessment;
  onInputReport: (data: SubjectAssessment) => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ data, onInputReport }) => {
  const greenColor = "#52c41a";

  return (
    <Card style={{ width: "100%" }} bodyStyle={{ padding: "16px" }}>
      <Text strong>Subject : {data.subject_name}</Text>
      <div style={{ margin: "8px 0" }}>
        <Text type="secondary">Teacher : </Text>
        <Text>{data.teacher_name}</Text>
      </div>

      <Space size="small" style={{ marginTop: "10px" }}>
        <Button
          type="default"
          style={{
            backgroundColor: "#fff",
            borderColor: greenColor,
            color: greenColor,
          }}
        >
          View Indicator
        </Button>
        <Button
          type="primary"
          style={{
            backgroundColor: greenColor,
            borderColor: greenColor,
            color: "#fff",
          }}
          onClick={() => onInputReport(data)}
        >
          Input Report
        </Button>
      </Space>
    </Card>
  );
};

// =================================================================
// 🖥️ HALAMAN UTAMA: PID REPORT ASSESSMENT PAGE
// =================================================================

const PIDReportAssessmentPage: React.FC = () => {
  const router = useRouter();

  // State Data Utama
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<SubjectAssessment[]>([]);
  const [activeAcademicYear, setActiveAcademicYear] =
    useState<AcademicYear | null>(null);

  const [assignmentData, setAssignmentData] = useState<PidAssignment[]>([]);

  // State Filter
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>(
    undefined
  );
  const [selectedTriwulan, setSelectedTriwulan] = useState<string | undefined>(
    undefined
  );
  const [isFilterApplied, setIsFilterApplied] = useState(false);

  // State Loading
  const [loadingClass, setLoadingClass] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingAssignment, setLoadingAssignment] = useState(false);

  // --- Data Fetching ---

  /**
   * Mengambil data daftar kelas dan tahun ajaran aktif.
   */
  useEffect(() => {
    const fetchClassrooms = async () => {
      setLoadingClass(true);
      if (!API_URL) {
        message.error("NEXT_PUBLIC_API_URL tidak terdefinisi.");
        setLoadingClass(false);
        return;
      }
      try {
        const response = await axios.get<ClassroomResponse>(
          `${API_URL}/classrooms`
        );
        const data = response.data;
        setClassrooms(data.data);

        if (data.data.length > 0) {
          setActiveAcademicYear(data.data[0].academic_year);
        }
      } catch (error) {
        console.error("Error fetching classrooms:", error);
        message.error("Gagal memuat data kelas.");
      } finally {
        setLoadingClass(false);
      }
    };
    fetchClassrooms();
  }, []);

  /**
   * Mengambil data status assignment raport
   */
  useEffect(() => {
    const fetchAssignmentStatus = async () => {
      setLoadingAssignment(true);
      if (!API_URL) {
        setLoadingAssignment(false);
        return;
      }
      try {
        const response = await axios.get<PidAssignment[]>(
          `${API_URL}/pid-assignments`
        );
        setAssignmentData(response.data);
      } catch (error) {
        console.error("Error fetching assignment status:", error);
        message.error("Gagal memuat status raport.");
      } finally {
        setLoadingAssignment(false);
      }
    };
    fetchAssignmentStatus();
  }, []);

  /**
   * Mengambil data mata pelajaran berdasarkan Kelas yang dipilih.
   */
  const fetchSubjects = useCallback(
    async (classId: number) => {
      setLoadingSubjects(true);
      try {
        const selectedClass = classrooms.find((c) => c.id === classId);
        if (!selectedClass) {
          message.warning("Kelas tidak ditemukan.");
          setSubjects([]);
          return;
        }

        const grade = selectedClass.grade;
        const response = await axios.get<SubjectAssessment[]>(
          `${API_URL}/indicator-pid?grade=${grade}&classroom_id=${classId}`
        );
        setSubjects(response.data);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        message.error("Gagal memuat data mata pelajaran.");
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    },
    [classrooms]
  );

  // --- Handlers dan Computed Values ---

  const handleApplyFilter = () => {
    if (!selectedClassId || !selectedTriwulan) {
      message.warning(
        "Harap pilih Periode (Triwulan) dan Kelas terlebih dahulu."
      );
      return;
    }

    setIsFilterApplied(true);
    fetchSubjects(selectedClassId);
  };

  const handleInputReportNavigation = (subjectData: SubjectAssessment) => {
    if (!selectedTriwulan || !currentClassroom) {
      message.error("Gagal menavigasi. Data Periode atau Kelas tidak lengkap.");
      return;
    }

    // 1. Format Periode: "Triwulan 1" menjadi "triwulan_1"
    const formattedPeriode = selectedTriwulan.toLowerCase().replace(" ", "_");

    // 2. Tentukan Path Parameters dan Construct URL
    const grade = currentClassroom.grade;
    const subjectId = subjectData.subject_id.toString();
    // 💡 PERBAIKAN: Ambil classroomId dari subjectData
    const classroomId = subjectData.classroom_id.toString();

    // 💡 PERBAIKAN: Tambahkan classroomId ke path URL
    const path = `/pid-report-input/${grade}/${subjectId}/${formattedPeriode}/${classroomId}`;

    router.push(path);
  };

  /**
   * Fungsi untuk mendapatkan status raport berdasarkan filter
   */
  const getReportStatus = useCallback(() => {
    if (!selectedClassId || !selectedTriwulan) {
      return { status: "Belum Dipilih", isClosed: true };
    }

    // Tentukan pid_assessment_id yang dicari (1 untuk Triwulan 1/3, 2 untuk Triwulan 2/4)
    const triwulanNumber = parseInt(selectedTriwulan.replace(/[^0-9]/g, ""));
    const pidAssessmentId = triwulanNumber % 2 !== 0 ? 1 : 2;

    const assignment = assignmentData.find(
      (a) =>
        a.classroom_id === selectedClassId &&
        a.pid_assessment_id === pidAssessmentId
    );

    if (!assignment || assignment.status === "-") {
      // Jika tidak ditemukan, atau status "-", dianggap default Open (jika filter diterapkan)
      return {
        status: isFilterApplied ? "Open" : "Belum Tersedia",
        isClosed: false,
      };
    }

    // PERBAIKAN LOGIKA STATUS DI SINI
    if (assignment.status === "true") {
      return {
        status: "Open", // True = Open
        isClosed: false,
      };
    } else {
      // assignment.status === "false"
      return {
        status: "Submited & Closed", // False = Submitted & Closed
        isClosed: true,
      };
    }
  }, [assignmentData, selectedClassId, selectedTriwulan, isFilterApplied]);

  const triwulanOptions = useMemo(() => {
    if (activeAcademicYear?.is_ganjil) {
      return [
        { value: "Triwulan 1", label: "Triwulan 1" },
        { value: "Triwulan 2", label: "Triwulan 2" },
      ];
    }
    if (activeAcademicYear?.is_genap) {
      return [
        { value: "Triwulan 3", label: "Triwulan 3" },
        { value: "Triwulan 4", label: "Triwulan 4" },
      ];
    }
    return [];
  }, [activeAcademicYear]);

  const currentClassroom = useMemo(() => {
    return classrooms.find((c) => c.id === selectedClassId);
  }, [selectedClassId, classrooms]);

  const academicYearDisplay = useMemo(() => {
    if (activeAcademicYear) {
      const semester = activeAcademicYear.is_ganjil
        ? "Ganjil"
        : activeAcademicYear.is_genap
        ? "Genap"
        : "";
      return `${activeAcademicYear.year} (${semester})`;
    }
    return "Loading...";
  }, [activeAcademicYear]);

  // Status hasil perhitungan
  const { status: reportStatus, isClosed } = getReportStatus();

  // --- Gaya Tampilan ---
  const greenColor = "#52c41a";
  const orangeColor = "#faad14";
  const redColor = "#ff4d4f";

  // Tentukan warna berdasarkan status Closed/Open
  const statusColor = isClosed ? redColor : orangeColor;

  const openStatusStyle: React.CSSProperties = {
    backgroundColor: isClosed ? "#fff1f0" : "#fffbe6", // Light red for Closed, Light yellow for Open
    border: `1px solid ${isClosed ? "#ffa39e" : "#ffe58f"}`,
    padding: "12px 20px",
    borderRadius: "4px",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  // =================================================================
  // ⚛️ RENDER
  // =================================================================

  return (
    <div style={{ padding: "24px" }}>
      {/* BREADCRUMB SECTION */}
      <Breadcrumb style={{ marginBottom: "10px" }}>
        <Breadcrumb.Item>PID Report</Breadcrumb.Item>
        <Breadcrumb.Item>Assessment</Breadcrumb.Item>
      </Breadcrumb>

      {/* HEADER SECTION */}
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: "20px" }}
      >
        <Title level={2} style={{ margin: 0 }}>
          PID Report Assessment
        </Title>
        <Title level={3} style={{ margin: 0 }}>
          {academicYearDisplay}
        </Title>
      </Row>

      {/* FILTER SECTION */}
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: "20px" }}>
        <Col xs={24} md={10} lg={8} xl={6}>
          <Input
            prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
            placeholder="Search student records..."
            style={{ width: "100%" }}
          />
        </Col>

        {/* SELECT TRIWULAN */}
        <Col>
          <Select
            value={selectedTriwulan}
            placeholder="Select Period"
            style={{ width: 120 }}
            onChange={(value) => {
              setSelectedTriwulan(value);
              setIsFilterApplied(false);
              setSubjects([]);
            }}
            disabled={loadingClass || triwulanOptions.length === 0}
          >
            {triwulanOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Col>

        {/* SELECT CLASS */}
        <Col>
          <Select
            value={selectedClassId}
            placeholder="Select Class"
            style={{ width: 120 }}
            onChange={(value) => {
              setSelectedClassId(value);
              setIsFilterApplied(false);
              setSubjects([]);
            }}
            loading={loadingClass}
          >
            {classrooms.map((c) => (
              <Option key={c.id} value={c.id}>
                {c.code}
              </Option>
            ))}
          </Select>
        </Col>

        {/* APPLY FILTER BUTTON */}
        <Col>
          <Button
            type="primary"
            style={{
              backgroundColor: greenColor,
              borderColor: greenColor,
            }}
            onClick={handleApplyFilter}
            disabled={!selectedClassId || !selectedTriwulan}
          >
            Apply Filter
          </Button>
        </Col>
      </Row>

      <hr />

      {/* CLASS AND STATUS DISPLAY */}
      <Title level={4} style={{ margin: "16px 0" }}>
        Class :{" "}
        {currentClassroom
          ? `${currentClassroom.code} - ${currentClassroom.class_name}`
          : "Pilih Kelas"}{" "}
        - {selectedTriwulan || "Periode"}
      </Title>

      {/* STATUS CARD (Hanya Tampil jika filter sudah diterapkan atau sedang loading status) */}
      {selectedClassId && selectedTriwulan && isFilterApplied ? (
        <Spin spinning={loadingAssignment}>
          <div style={openStatusStyle}>
            <Space>
              <Text strong>Status Raport :</Text>
              <Text style={{ color: statusColor, fontWeight: "bold" }}>
                {reportStatus}
              </Text>
            </Space>

            <Button
              type="primary"
              style={{
                backgroundColor: isClosed ? redColor : orangeColor,
                borderColor: isClosed ? redColor : orangeColor,
              }}
              // Tombol disable jika status Closed, atau belum ada subjek
              disabled={isClosed || subjects.length === 0}
            >
              {isClosed ? "Assessment Submitted" : "Submit Assessment"}
            </Button>
          </div>
        </Spin>
      ) : (
        // Tampilkan pesan default jika filter belum diterapkan
        <Card
          style={{ textAlign: "center", padding: "50px", marginBottom: "20px" }}
        >
          <Text type="secondary">
            Status Raport akan muncul di sini setelah Filter diterapkan.
          </Text>
        </Card>
      )}

      {/* SUBJECT CARDS SECTION */}
      <Spin spinning={loadingSubjects}>
        {subjects.length > 0 ? (
          <Row gutter={[24, 24]}>
            {subjects.map((subjectData) => (
              <Col
                xs={24}
                sm={12}
                md={8}
                lg={8}
                xl={8}
                key={subjectData.subject_teacher_id}
              >
                <SubjectCard
                  data={subjectData}
                  onInputReport={handleInputReportNavigation}
                />
              </Col>
            ))}
          </Row>
        ) : (
          <Card style={{ textAlign: "center", padding: "50px" }}>
            <Text type="secondary">
              Silakan pilih Periode dan Kelas, lalu klik "Apply Filter" untuk
              memuat data mata pelajaran.
            </Text>
          </Card>
        )}
      </Spin>
    </div>
  );
};

export default PIDReportAssessmentPage;
