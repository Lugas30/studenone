"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Input, Select, Row, Col, Typography, Spin } from "antd";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// --- 1. Konfigurasi API URL ---
const BASE_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://so-api.queensland.id/api";

const axiosInstance = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- 2. Definisi Tipe Data dari API ---
interface Classroom {
  id: number;
  code: string;
  class_name: string;
  grade: string;
  section: string;
}

interface SkillSubject {
  subject_teacher_id: number;
  subject_id: number;
  teacher_id: number;
  classroom_id: number;
  grade: string;
  classroom_name: string;
  subject_name: string;
  teacher_name: string;
  indicators: any[];
}

// --- 3. Sub-Komponen: Subject Report Card ---
const SubjectReportCard: React.FC<{ data: SkillSubject; router: any }> = ({
  data,
  router,
}) => {
  const primaryColor = "#52c41a";

  const handleViewIndicator = () => {
    console.log(`View Indicator for: ${data.subject_name}`);
    toast.info(`Melihat Indikator untuk: ${data.subject_name}`);
  };

  const handleInputReport = () => {
    const subjectId = data.subject_id;
    const classroomId = data.classroom_id;

    router.push(`/academic-report/skills-input/${subjectId}/${classroomId}`);
    toast.success(`Mengarahkan ke Input Nilai: ${data.subject_name}`);
  };

  return (
    <Card
      title={
        <Text strong style={{ fontSize: 16 }}>
          {data.subject_name}
        </Text>
      }
      variant="outlined"
      style={{ marginBottom: 20 }}
    >
      <p style={{ margin: 0 }}>
        <Text type="secondary" style={{ marginRight: 4 }}>
          Teacher :
        </Text>
        <Text>{data.teacher_name}</Text>
      </p>
      <Row gutter={10} style={{ marginTop: 15 }}>
        <Col span={12}>
          <Button
            block
            style={{
              borderColor: primaryColor,
              color: primaryColor,
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
              backgroundColor: primaryColor,
              borderColor: primaryColor,
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

// --- 4. Komponen Utama: Skills Page ---
const SkillsPage: React.FC = () => {
  const router = useRouter();
  const primaryColor = "#52c41a";

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [skillsSubjects, setSkillsSubjects] = useState<SkillSubject[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassCode, setSelectedClassCode] = useState<string | null>(
    null
  );
  const [pendingClassCode, setPendingClassCode] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string | null>(
    null
  );

  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const fetchClassrooms = useCallback(async () => {
    setLoadingClassrooms(true);
    try {
      const response = await axiosInstance.get("/classrooms");
      const apiData = response.data.data as Classroom[];

      const sortedData = apiData.sort((a, b) => a.code.localeCompare(b.code));

      setClassrooms(sortedData);
      setCurrentAcademicYear(response.data.academicYear);

      toast.success("Data Kelas berhasil dimuat!");
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      toast.error(
        `Gagal memuat data kelas dari API. URL: ${BASE_API_URL}/classrooms`
      );
      setClassrooms([]);
      setCurrentAcademicYear(null);
    } finally {
      setLoadingClassrooms(false);
    }
  }, []);

  const fetchSkillsSubjects = useCallback(
    async (classId: number, classCode: string) => {
      setLoadingSubjects(true);
      setSkillsSubjects([]);

      try {
        const response = await axiosInstance.get(
          `/indicator-skill?classroom_id=${classId}`
        );

        const apiData = response.data as SkillSubject[];
        setSkillsSubjects(apiData);
        setSelectedClassCode(classCode);

        toast.success(`Data Subjek untuk kelas ${classCode} berhasil dimuat!`);
      } catch (error) {
        console.error(
          `Error fetching subjects for class ID ${classId}:`,
          error
        );
        toast.error(`Gagal memuat data subjek untuk kelas ${classCode}.`);
        setSkillsSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  const handleClassroomChange = (code: string | null) => {
    if (!code || code === "") {
      setPendingClassCode(null);
      setSelectedClassId(null);
      return;
    }
    const selected = classrooms.find((c) => c.code === code);
    if (selected) {
      setPendingClassCode(code);
      setSelectedClassId(selected.id);
    }
  };

  const handleApplyFilter = () => {
    setSearchTerm("");
    if (selectedClassId && pendingClassCode) {
      fetchSkillsSubjects(selectedClassId, pendingClassCode);
      toast.info(`Filter Kelas diterapkan: ${pendingClassCode}`);
    } else {
      setSkillsSubjects([]);
      setSelectedClassCode(null);
      toast.warn(
        "Mohon pilih kelas terlebih dahulu sebelum menerapkan filter."
      );
    }
  };

  const filteredSubjects = skillsSubjects.filter(
    (subject) =>
      subject.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.teacher_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentClassDetails = classrooms.find(
    (c) => c.code === selectedClassCode
  );
  const classDisplayName = currentClassDetails
    ? `${currentClassDetails.class_name} (${currentClassDetails.code})`
    : selectedClassCode
    ? `${selectedClassCode}`
    : "Pilih Kelas";

  return (
    <div
      style={{
        padding: "0 24px 24px",
        backgroundColor: "#fff",
        minHeight: "100vh",
      }}
    >
      <ToastContainer position="top-right" autoClose={5000} />

      <div style={{ padding: "16px 0", borderBottom: "1px solid #f0f0f0" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Text type="secondary">Home / Academic Report / </Text>
            <Text strong>Skills</Text>
            <Title level={2} style={{ margin: "8px 0 0 0" }}>
              Skills
            </Title>
          </Col>
          <Col>
            <Title level={3} style={{ margin: 0, fontWeight: "normal" }}>
              {currentAcademicYear || "Tahun Akademik"}
            </Title>
          </Col>
        </Row>
      </div>

      {/* --- Filter Bar --- */}
      <div style={{ padding: "24px 0 16px 0" }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="Search subject or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "50%" }}
            />
          </Col>
          <Col>
            <Spin spinning={loadingClassrooms}>
              <Select
                placeholder="Select Class"
                style={{ width: 150 }}
                onChange={handleClassroomChange}
                value={pendingClassCode}
                disabled={loadingClassrooms || classrooms.length === 0}
              >
                {classrooms.map((c) => (
                  <Option key={c.id} value={c.code}>
                    {c.code}
                  </Option>
                ))}
              </Select>
            </Spin>
          </Col>
          <Col>
            <Button
              type="primary"
              style={{
                backgroundColor: primaryColor,
                borderColor: primaryColor,
              }}
              onClick={handleApplyFilter}
              disabled={loadingSubjects || !pendingClassCode}
            >
              Apply Filter
            </Button>
          </Col>
        </Row>
      </div>

      {/* Class Indicator */}
      <div style={{ padding: "16px 0 24px 0" }}>
        <Title level={4} style={{ marginBottom: 15 }}>
          Class : {classDisplayName}
        </Title>
      </div>

      {/* --- Subject Cards (Loading State & Hasil) --- */}
      <Spin spinning={loadingSubjects}>
        {selectedClassCode === null ? (
          <div
            style={{ textAlign: "center", padding: "50px 0", color: "#888" }}
          >
            <Text type="secondary">
              Silakan **pilih kelas** dan tekan **Apply Filter** untuk memuat
              data.
            </Text>
          </div>
        ) : selectedClassCode &&
          skillsSubjects.length === 0 &&
          !loadingSubjects ? (
          <div
            style={{ textAlign: "center", padding: "50px 0", color: "#888" }}
          >
            <Text type="secondary">
              Tidak ada data subjek keterampilan yang tersedia untuk kelas{" "}
              {selectedClassCode}.
            </Text>
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {filteredSubjects.map((subject) => (
              <Col
                key={subject.subject_teacher_id}
                xs={24}
                sm={12}
                md={8}
                lg={8}
                xl={8}
              >
                <SubjectReportCard data={subject} router={router} />
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default SkillsPage;
