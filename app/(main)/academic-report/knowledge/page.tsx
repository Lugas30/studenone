"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";

// Ant Design Components and Icons
import {
  Card,
  Button,
  Input,
  Select,
  Row,
  Col,
  Typography,
  Spin,
  Divider,
} from "antd";
import { LoadingOutlined } from "@ant-design/icons";

// Destructure Ant Design Components
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// --- 📚 Interfaces ---

/** Struktur data Tahun Akademik dari API. */
interface AcademicYear {
  id: number;
  year: string;
  is_ganjil: boolean;
  is_genap: boolean;
  is_active: boolean;
}

/** Struktur data Kelas dari API. */
interface Classroom {
  id: number;
  grade: string;
  section: string;
  class_name: string;
  code: string;
  academic_id: number;
  academic_year: AcademicYear;
}

/** Struktur data Mata Pelajaran untuk Card. */
interface SubjectCardData {
  subject_teacher_id: number;
  subject_id: number; // ID Mata Pelajaran (Digunakan untuk navigasi)
  teacher_id: number;
  classroom_id: number;
  grade: string;
  classroom_name: string;
  subject_name: string;
  teacher_name: string;
}

// --- ⚙️ Constants ---

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const PRIMARY_COLOR = "#52c41a"; // Ant Design Green
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

// --- Sub-Component: SubjectReportCard ---

/**
 * Komponen Card untuk menampilkan informasi Mata Pelajaran dan aksi navigasi.
 */
const SubjectReportCard: React.FC<{ data: SubjectCardData }> = ({ data }) => {
  const router = useRouter();

  const handleViewIndicator = useCallback(() => {
    // Navigasi ke halaman indikator (jika rute sudah ada)
    console.log(`View Indicator for: ${data.subject_name}`);
    toast.info("Fitur View Indicator belum diimplementasikan.", {
      position: "bottom-center",
    });
  }, [data.subject_name]);

  const handleInputReport = useCallback(() => {
    // Menggunakan subject_id (ID Mata Pelajaran) dan classroom_id untuk navigasi
    const { subject_id: subjectId, classroom_id: classroomId } = data;

    console.log(
      `Navigating to Input Report with Subject ID: ${subjectId} and Classroom ID: ${classroomId}`
    );

    // Rute yang diharapkan: /academic-report/knowledge-input/[subjectId]/[classroomId]
    router.push(`/academic-report/knowledge-input/${subjectId}/${classroomId}`);
  }, [data, router]);

  return (
    <Card
      title={
        <Text strong style={{ fontSize: 16 }}>
          {data.subject_name}
        </Text>
      }
      variant="outlined"
      style={{ marginBottom: 0 }}
      hoverable
    >
      <p style={{ margin: "0 0 5px 0" }}>
        <Text type="secondary" style={{ marginRight: 4 }}>
          Teacher:
        </Text>
        <Text>{data.teacher_name}</Text>
      </p>
      {/* Subject ID ditampilkan untuk debugging/informasi */}
      {/* <p style={{ margin: "0 0 10px 0" }}>
        <Text type="secondary" style={{ marginRight: 4 }}>
          Subject ID:
        </Text>
        <Text>{data.subject_id}</Text>
      </p> */}

      <Row gutter={10} style={{ marginTop: 15 }}>
        <Col span={12}>
          <Button
            block
            style={{
              borderColor: PRIMARY_COLOR,
              color: PRIMARY_COLOR,
            }}
            onClick={handleViewIndicator}
          >
            View Indicator
          </Button>
        </Col>
        <Col span={12}>
          <Button
            type="primary"
            block
            style={{
              backgroundColor: PRIMARY_COLOR,
              borderColor: PRIMARY_COLOR,
            }}
            onClick={handleInputReport}
          >
            Input Report
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

// --- Main Component: KnowledgePage ---

/**
 * Halaman utama untuk penginputan nilai pengetahuan (Knowledge Report).
 * Memungkinkan filter berdasarkan kelas dan pencarian mata pelajaran/guru.
 */
const KnowledgePage: React.FC = () => {
  // Nama komponen tetap KnowledgePage
  // State untuk Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSelectedClassId, setTempSelectedClassId] = useState<
    number | undefined
  >(undefined);
  // ID kelas yang sudah DITERAPKAN filter
  const [appliedClassId, setAppliedClassId] = useState<number | undefined>(
    undefined
  );

  // State untuk Data
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<SubjectCardData[]>([]);

  // State untuk Loading
  const [isLoading, setIsLoading] = useState(false); // Loading Subject Data
  const [isClassroomLoading, setIsClassroomLoading] = useState(false); // Loading Classrooms

  // --- Data Fetching Logic ---

  /** Mengambil daftar semua kelas dari API. */
  const fetchClassrooms = useCallback(async () => {
    if (!API_BASE_URL) return;

    setIsClassroomLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/classrooms`);
      let data: Classroom[] = response.data.data;

      // Urutkan berdasarkan kode kelas (misalnya: X A, X B, XI A)
      data.sort((a, b) => a.code.localeCompare(b.code));

      setClassrooms(data);

      toast.success("Daftar kelas berhasil dimuat! 📚", {
        position: "top-right",
      });
    } catch (error) {
      console.error("Gagal memuat daftar kelas:", error);
      toast.error("Gagal memuat daftar kelas! Silakan coba lagi. ❌", {
        position: "top-right",
      });
    } finally {
      setIsClassroomLoading(false);
    }
  }, []);

  /** Mengambil data mata pelajaran berdasarkan Class ID yang dipilih. */
  const fetchSubjects = useCallback(async (classId: number) => {
    if (!API_BASE_URL) return;

    setIsLoading(true);
    setSubjects([]); // Clear previous subjects while loading
    try {
      const response = await axios.get(
        `${API_BASE_URL}/indicator-knowledge-skill?classroom_id=${classId}`
      );
      const data: SubjectCardData[] = response.data;
      setSubjects(data);
      toast.success(`Berhasil memuat ${data.length} mata pelajaran.`, {
        position: "top-right",
      });
    } catch (error) {
      console.error("Gagal memuat data mata pelajaran:", error);
      toast.error("Gagal memuat data mata pelajaran! ❌", {
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- Effects ---

  // Effect untuk memuat daftar kelas saat inisialisasi
  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  // Effect untuk memuat mata pelajaran ketika appliedClassId berubah
  useEffect(() => {
    if (appliedClassId) {
      fetchSubjects(appliedClassId);
    }
  }, [appliedClassId, fetchSubjects]);

  // --- Handlers ---

  const handleApplyFilter = () => {
    if (tempSelectedClassId === undefined) {
      toast.warn("Mohon pilih kelas terlebih dahulu. ⚠️", {
        position: "top-center",
      });
      return;
    }
    // Hanya fetch data jika ID kelas yang dipilih BERBEDA dengan yang sudah diterapkan
    if (tempSelectedClassId !== appliedClassId) {
      setAppliedClassId(tempSelectedClassId);
      toast.info("Filter diterapkan! Memuat data mata pelajaran...", {
        position: "top-right",
      });
    } else {
      toast.info(
        "Kelas yang sama sudah diterapkan. Tidak perlu memuat ulang.",
        {
          position: "top-right",
        }
      );
    }
  };

  const handleClassChange = (value: number) => {
    setTempSelectedClassId(value);
  };

  // --- Memoized Values ---

  /** Filter mata pelajaran berdasarkan searchTerm (Nama Mapel atau Guru). */
  const filteredSubjects = useMemo(() => {
    if (!searchTerm) return subjects;

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    return subjects.filter(
      (subject) =>
        subject.subject_name.toLowerCase().includes(lowerCaseSearchTerm) ||
        subject.teacher_name.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [subjects, searchTerm]);

  /** Mendapatkan data kelas yang sedang aktif/diterapkan. */
  const currentClassroom = useMemo(() => {
    return classrooms.find((c) => c.id === appliedClassId);
  }, [classrooms, appliedClassId]);

  /** Membuat teks Tahun Ajaran dan Semester. */
  const academicYearText = useMemo(() => {
    // Mencari tahun akademik yang aktif dari semua kelas yang dimuat
    const activeClass = classrooms.find((c) => c.academic_year.is_active);
    const academicYearData =
      activeClass?.academic_year || classrooms[0]?.academic_year;

    if (!academicYearData) return <Spin size="small" />;

    let semester = "";
    if (academicYearData.is_ganjil) {
      semester = "(Ganjil)";
    } else if (academicYearData.is_genap) {
      semester = "(Genap)";
    }

    return `${academicYearData.year} ${semester}`;
  }, [classrooms]);

  // --- Render ---

  return (
    <div
      style={{
        padding: "0 24px 24px",
        backgroundColor: "#fff",
        minHeight: "100vh",
      }}
    >
      <ToastContainer />

      {/* Header & Breadcrumb */}
      <div style={{ padding: "16px 0", borderBottom: "1px solid #f0f0f0" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Text type="secondary">Home / Academic Report / </Text>
            <Text strong>Knowledge</Text>
            <Title level={2} style={{ margin: "8px 0 0 0" }}>
              Input Nilai Knowledge
            </Title>
          </Col>
          <Col>
            <Title level={3} style={{ margin: 0, fontWeight: "normal" }}>
              {academicYearText}
            </Title>
          </Col>
        </Row>
      </div>
      <Divider style={{ margin: "0 0 24px 0" }} />

      {/* Filter Section */}
      <div style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="Search mata pelajaran atau guru..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", maxWidth: "400px" }}
              enterButton
            />
          </Col>
          <Col>
            <Select
              style={{ width: 150 }}
              placeholder="Pilih Kelas"
              onChange={handleClassChange}
              value={tempSelectedClassId}
              loading={isClassroomLoading}
              disabled={isClassroomLoading || isLoading} // Disabled jika sedang memuat kelas atau mata pelajaran
            >
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
              style={{
                backgroundColor: PRIMARY_COLOR,
                borderColor: PRIMARY_COLOR,
              }}
              onClick={handleApplyFilter}
              loading={isLoading}
              disabled={isClassroomLoading || tempSelectedClassId === undefined}
            >
              Apply Filter
            </Button>
          </Col>
        </Row>
      </div>
      <Divider style={{ margin: "0 0 24px 0" }} />

      {/* Class Indicator Title */}
      <Title level={4} style={{ marginBottom: 24 }}>
        Class:{" "}
        <Text
          style={{ fontSize: 20 }}
          strong
          type={currentClassroom ? undefined : "secondary"}
        >
          {currentClassroom
            ? `${currentClassroom.class_name} (${currentClassroom.code})`
            : "Belum Ada Kelas Terpilih"}
        </Text>
      </Title>

      {/* Subject Cards Content */}
      {appliedClassId === undefined ? (
        <Card
          style={{ textAlign: "center", padding: "50px", minHeight: "200px" }}
        >
          <Text type="secondary">
            Pilih kelas dari **dropdown** dan klik **Apply Filter** untuk memuat
            data mata pelajaran.
          </Text>
        </Card>
      ) : isLoading ? (
        <div
          style={{
            textAlign: "center",
            padding: "50px",
            backgroundColor: "#f0f2f5",
            borderRadius: "4px",
          }}
        >
          <Spin indicator={antIcon} />
          <Text style={{ display: "block", marginTop: 10 }}>
            Memuat data mata pelajaran...
          </Text>
        </div>
      ) : filteredSubjects.length > 0 ? (
        <Row gutter={[24, 24]}>
          {filteredSubjects.map((subject) => (
            <Col
              key={subject.subject_teacher_id}
              xs={24} // Full width on extra small screens
              sm={12} // Half width on small screens
              md={8} // Third width on medium/large screens
            >
              <SubjectReportCard data={subject} />
            </Col>
          ))}
        </Row>
      ) : (
        <Card
          style={{ textAlign: "center", padding: "50px", minHeight: "200px" }}
        >
          <Text type="secondary">
            Tidak ada mata pelajaran yang ditemukan untuk kelas ini, atau data
            tidak cocok dengan kriteria pencarian (**{searchTerm}**).
          </Text>
        </Card>
      )}
    </div>
  );
};

export default KnowledgePage;
