"use client";
// src/pages/LifeskillPage.tsx (Revisi Final untuk Default Placeholder)

import React, { useState, useEffect, Key, useCallback, useMemo } from "react";
import {
  Layout,
  Typography,
  Input,
  Select,
  Button,
  Table,
  Space,
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// Ambil Base URL dari .env
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
// Endpoint API Indicator
const ISLAMIC_INDICATOR_API = `${API_BASE_URL}/indicator-islamic-lifeskill`;
const GENERAL_INDICATOR_API = `${API_BASE_URL}/indicator-lifeskill`;
const STUDENT_API = `${API_BASE_URL}/student/classroom`;
const CLASSROOM_API = `${API_BASE_URL}/classrooms`;
const ACADEMIC_YEAR_API = `${API_BASE_URL}/academic-years`;
const ISLAMIC_REPORT_API = `${API_BASE_URL}/report-islamic-lifeskill`;
const GENERAL_REPORT_API = `${API_BASE_URL}/report-lifeskill`;

// ===========================================
// 1. TIPE DATA & KONSTANTA
// ===========================================

type LifeskillPredicate = "A" | "B" | "C" | "D";
type OptionalLifeskillPredicate = LifeskillPredicate | "";
const PREDICATE_OPTIONS: LifeskillPredicate[] = ["A", "B", "C", "D"];

// Tipe untuk data Akademik
interface AcademicYear {
  id: number;
  year: string;
  is_ganjil: boolean;
  is_genap: boolean;
  is_active: boolean;
}

// Tipe untuk data Kelas
interface Classroom {
  id: number;
  class_name: string;
  code: string;
  grade: string;
}

// Tipe untuk data Siswa
interface StudentData {
  id: number; // student_classroom id
  student_id: number;
  semester: "ganjil" | "genap";
  student: {
    id: number; // student id
    fullname: string;
    grade: string;
  };
  classroom: Classroom;
}

// Tipe untuk data Indikator
interface IndicatorItem {
  id: number;
  academic_year_id: number;
  grade: number;
  indicator: string;
  semester: string;
}

// Tipe untuk nilai Islamic Lifeskill (dari API)
interface IslamicReportItem {
  indicator_islamic_lifeskill_id: number;
  indicator_islamic_lifeskill: string;
  predicate: LifeskillPredicate;
}
interface IslamicReport {
  student_id: number;
  items: IslamicReportItem[];
}

// Tipe untuk nilai General Lifeskill (dari API)
interface GeneralReportItem {
  indicator_lifeskill_id: number;
  indicator_lifeskill: string;
  predicate: LifeskillPredicate;
}
interface GeneralReport {
  student_id: number;
  items: GeneralReportItem[];
}

// Tipe data untuk bagian Life Skill di Table (Dinamis)
interface DynamicLifeskillData {
  key: Key;
  studentClassroomId: number;
  studentId: number;
  fullName: string;
  // Map untuk menyimpan nilai indikator secara dinamis: Kunci = indicator_id
  predicates: Map<number, OptionalLifeskillPredicate>;
}

// ===========================================
// 2. KOMPONEN DAN LOGIC UTAMA
// ===========================================

const LifeskillPage: React.FC = () => {
  // State untuk data filter/header
  const [academicYearInfo, setAcademicYearInfo] = useState<{
    year: string;
    semester: string;
  } | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  // selectedClassId HARUS null agar placeholder tampil
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(
    null
  );
  const [currentSemester, setCurrentSemester] = useState<
    "ganjil" | "genap" | null
  >(null);

  // State untuk data indikator
  const [islamicIndicators, setIslamicIndicators] = useState<IndicatorItem[]>(
    []
  );
  const [generalIndicators, setGeneralIndicators] = useState<IndicatorItem[]>(
    []
  );

  // State untuk data tabel (Menggunakan tipe dinamis)
  const [islamicData, setIslamicData] = useState<DynamicLifeskillData[]>([]);
  const [generalData, setGeneralData] = useState<DynamicLifeskillData[]>([]);

  // State Loading
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);

  // --- FUNGSI FETCH DATA ---

  const fetchAcademicData = useCallback(async () => {
    try {
      const response = await axios.get<AcademicYear[]>(ACADEMIC_YEAR_API);
      const activeYear = response.data.find((year) => year.is_active);
      if (activeYear) {
        const semester = activeYear.is_ganjil
          ? "Ganjil"
          : activeYear.is_genap
          ? "Genap"
          : "";
        const currentSem = activeYear.is_ganjil
          ? "ganjil"
          : activeYear.is_genap
          ? "genap"
          : null;

        setAcademicYearInfo({
          year: activeYear.year,
          semester: semester,
        });
        setCurrentSemester(currentSem);
        return {
          currentSemester: currentSem,
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching academic year:", error);
      toast.error("Gagal memuat Tahun Akademik.");
      return null;
    }
  }, []);

  const fetchClassrooms = useCallback(async () => {
    try {
      const response = await axios.get<{ data: Classroom[] }>(CLASSROOM_API);
      setClassrooms(response.data.data);

      // Tidak mengembalikan data kelas pertama untuk menghindari pemuatan data tabel otomatis,
      // dan membiarkan selectedClassId tetap null.
      return null;
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      toast.error("Gagal memuat data Kelas.");
      return null;
    }
  }, []);

  const fetchStudentAndReportData = useCallback(
    async (classId: number, grade: string) => {
      if (!currentSemester) {
        setLoadingInitial(false);
        return;
      }

      setLoadingInitial(true);

      let currentIslamicIndicators: IndicatorItem[] = [];
      let currentGeneralIndicators: IndicatorItem[] = [];

      try {
        const gradeNum = parseInt(grade);
        // 1. Ambil Indikator
        const [islamicRes, generalRes] = await Promise.all([
          axios.get<{ data: IndicatorItem[] }>(
            `${ISLAMIC_INDICATOR_API}?grade=${gradeNum}&semester=${currentSemester}`
          ),
          axios.get<{ data: IndicatorItem[] }>(
            `${GENERAL_INDICATOR_API}?grade=${gradeNum}&semester=${currentSemester}`
          ),
        ]);

        currentIslamicIndicators = islamicRes.data.data;
        currentGeneralIndicators = generalRes.data.data;
        setIslamicIndicators(currentIslamicIndicators);
        setGeneralIndicators(currentGeneralIndicators);

        // 2. Ambil Data Siswa dan Report
        const [studentRes, islamicReportRes, generalReportRes] =
          await Promise.all([
            axios.get<{ data: StudentData[] }>(
              `${STUDENT_API}?classroom=${classId}`
            ),
            axios.get<IslamicReport[]>(
              `${ISLAMIC_REPORT_API}?classroom_id=${classId}`
            ),
            axios.get<GeneralReport[]>(
              `${GENERAL_REPORT_API}?classroom_id=${classId}`
            ),
          ]);

        // 3. Mapping Data Siswa dan Report
        const students = studentRes.data.data;
        const islamicReports = islamicReportRes.data || [];
        const generalReports = generalReportRes.data || [];

        const newIslamicData: DynamicLifeskillData[] = [];
        const newGeneralData: DynamicLifeskillData[] = [];

        students.forEach((s) => {
          const studentId = s.student.id;

          // Islamic Mapping
          const islamicReport = islamicReports.find(
            (r) => r.student_id === studentId
          );
          const islamicPredicates = new Map<
            number,
            OptionalLifeskillPredicate
          >();

          currentIslamicIndicators.forEach((indicator) => {
            const reportItem = islamicReport?.items.find(
              (item) => item.indicator_islamic_lifeskill_id === indicator.id
            );
            islamicPredicates.set(
              indicator.id,
              reportItem?.predicate || ("" as OptionalLifeskillPredicate)
            );
          });

          newIslamicData.push({
            key: `islamic-${s.id}`,
            studentClassroomId: s.id,
            studentId: studentId,
            fullName: s.student.fullname,
            predicates: islamicPredicates,
          });

          // General Mapping
          const generalReport = generalReports.find(
            (r) => r.student_id === studentId
          );
          const generalPredicates = new Map<
            number,
            OptionalLifeskillPredicate
          >();

          currentGeneralIndicators.forEach((indicator) => {
            const reportItem = generalReport?.items.find(
              (item) => item.indicator_lifeskill_id === indicator.id
            );
            generalPredicates.set(
              indicator.id,
              reportItem?.predicate || ("" as OptionalLifeskillPredicate)
            );
          });

          newGeneralData.push({
            key: `general-${s.id}`,
            studentClassroomId: s.id,
            studentId: studentId,
            fullName: s.student.fullname,
            predicates: generalPredicates,
          });
        });

        setIslamicData(newIslamicData);
        setGeneralData(newGeneralData);
      } catch (error) {
        console.error("Error fetching student/report data:", error);
        toast.error("Gagal memuat data Siswa, Indikator, dan Nilai.");
        setIslamicData([]);
        setGeneralData([]);
      } finally {
        setLoadingInitial(false);
      }
    },
    [currentSemester]
  );

  // --- useEffect Awal (Hanya memuat Akademik dan Daftar Kelas) ---
  useEffect(() => {
    const initialFetch = async () => {
      setLoadingInitial(true);
      const academicInfo = await fetchAcademicData();
      await fetchClassrooms(); // fetchClassrooms sekarang tidak mengembalikan nilai untuk selectedClass

      // Kita hanya berhenti loading setelah semua data filter dimuat
      if (academicInfo) {
        setLoadingInitial(false);
      }
    };

    initialFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect untuk perubahan Kelas (Memuat data tabel hanya setelah kelas dipilih)
  useEffect(() => {
    if (selectedClassId && selectedClassroom && currentSemester) {
      fetchStudentAndReportData(selectedClassId, selectedClassroom.grade);
    } else if (currentSemester && selectedClassId === null) {
      // Ketika semester sudah dimuat tetapi kelas belum dipilih
      setIslamicData([]);
      setGeneralData([]);
      setLoadingInitial(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, currentSemester]);

  // --- LOGIC PERUBAHAN DATA DINAMIS ---

  const handleDynamicChange = (
    fullName: string,
    indicatorId: number,
    value: OptionalLifeskillPredicate,
    section: "Islamic" | "General"
  ) => {
    const setData = section === "Islamic" ? setIslamicData : setGeneralData;
    setData((prevData) =>
      prevData.map((record) => {
        if (record.fullName === fullName) {
          const newPredicates = new Map(record.predicates);
          newPredicates.set(indicatorId, value);
          return { ...record, predicates: newPredicates };
        }
        return record;
      })
    );
  };

  // --- LOGIC SUBMIT ---

  const handleSubmit = async (
    record: DynamicLifeskillData,
    section: "Islamic" | "General"
  ) => {
    if (!selectedClassroom || !currentSemester) {
      toast.warn("Data Kelas atau Semester belum lengkap. Silakan coba lagi.");
      return;
    }

    setLoadingSubmit(true);
    const sectionName =
      section === "Islamic" ? "Islamic Life Skill" : "Life Skill";
    const toastId = toast.loading(
      `Mengirim data ${sectionName} untuk ${record.fullName}...`
    );

    try {
      let endpoint = "";
      let indicatorIds: number[] = [];
      let predicates: string[] = [];
      const currentIndicators =
        section === "Islamic" ? islamicIndicators : generalIndicators;

      // Filter hanya nilai yang tidak kosong (Predicate A/B/C/D)
      currentIndicators.forEach((indicator) => {
        const value = record.predicates.get(indicator.id);
        // PERBAIKAN: Cukup cek apakah value BUKAN string kosong ("")
        if (value !== "") {
          indicatorIds.push(indicator.id);
          // Type assertion aman di sini karena kita sudah filter nilai ""
          predicates.push(value as LifeskillPredicate);
        }
      });

      if (indicatorIds.length === 0) {
        toast.update(toastId, {
          render:
            "Silakan pilih setidaknya satu nilai (A/B/C/D) untuk disubmit.",
          type: "warning",
          isLoading: false,
          autoClose: 3000,
        });
        setLoadingSubmit(false);
        return;
      }

      let payload: any = {
        classroom_id: selectedClassroom.id,
        grade: parseInt(selectedClassroom.grade),
        student_id: record.studentId,
      };

      if (section === "Islamic") {
        endpoint = "/report-islamic-lifeskill";
        payload.indicator_islamic_lifeskill_id = indicatorIds;
        payload.predicate = predicates;
      } else {
        endpoint = "/report-lifeskill";
        payload.indicator_lifeskill_id = indicatorIds;
        payload.predicate = predicates;
      }

      await axios.post(`${API_BASE_URL}${endpoint}`, payload);

      toast.update(toastId, {
        render: `Data ${sectionName} ${record.fullName} berhasil disimpan!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      // Refresh data
      fetchStudentAndReportData(selectedClassroom.id, selectedClassroom.grade);
    } catch (error: any) {
      console.error(`Error submitting ${sectionName} data:`, error);
      const errorMessage =
        error.response?.data?.message ||
        `Gagal menyimpan data ${sectionName} ${record.fullName}.`;

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  // --- DEFINISI KOLOM DINAMIS (ISLAMIC & GENERAL) ---
  // ... (createDynamicColumns, islamicColumns, generalColumns tetap sama)
  const createDynamicColumns = useCallback(
    (
      indicators: IndicatorItem[],
      section: "Islamic" | "General"
    ): ColumnsType<DynamicLifeskillData> => {
      const handleValueChange = (
        fullName: string,
        indicatorId: number,
        value: OptionalLifeskillPredicate
      ) => {
        handleDynamicChange(fullName, indicatorId, value, section);
      };

      // Kolom Nama Siswa (Statis)
      const studentColumn: ColumnsType<DynamicLifeskillData>[0] = {
        title: "Full Name",
        dataIndex: "fullName",
        key: "fullName",
        width: section === "Islamic" ? "30%" : "20%",
        fixed: "left",
      };

      // Kolom Aksi (Submit per Baris, Statis)
      const actionColumn: ColumnsType<DynamicLifeskillData>[0] = {
        title: "Actions",
        key: "actions",
        align: "center",
        width: section === "Islamic" ? "15%" : "10%",
        fixed: "right",
        render: (_, record) => (
          <Button
            type="primary"
            size="small"
            onClick={() => handleSubmit(record, section)}
            disabled={loadingInitial || loadingSubmit}
          >
            Submit
          </Button>
        ),
      };

      // Kolom Indikator (Dinamis)
      const indicatorColumns: ColumnsType<DynamicLifeskillData> =
        indicators.map((indicator) => ({
          title: indicator.indicator,
          key: `indicator-${indicator.id}`,
          align: "center",
          // Perhitungan lebar kolom agar memenuhi tabel dan ada scroll jika terlalu banyak
          width:
            section === "Islamic"
              ? `${(55 / indicators.length).toFixed(1)}%`
              : `${(70 / indicators.length).toFixed(1)}%`,
          render: (text, record) => {
            const predicate =
              record.predicates.get(indicator.id) ||
              ("" as OptionalLifeskillPredicate);
            return (
              <Select
                value={predicate}
                style={{ width: "100%", minWidth: 60 }}
                onChange={(value) =>
                  handleValueChange(record.fullName, indicator.id, value)
                }
                disabled={loadingInitial || loadingSubmit}
              >
                {/* Opsi Placeholder "-" */}
                <Option key="empty" value="">
                  -
                </Option>
                {PREDICATE_OPTIONS.map((option) => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
                ))}
              </Select>
            );
          },
        }));

      return [studentColumn, ...indicatorColumns, actionColumn];
    },
    [loadingInitial, loadingSubmit, handleSubmit, handleDynamicChange]
  );

  const islamicColumns = useMemo(
    () => createDynamicColumns(islamicIndicators, "Islamic"),
    [createDynamicColumns, islamicIndicators]
  );

  const generalColumns = useMemo(
    () => createDynamicColumns(generalIndicators, "General"),
    [createDynamicColumns, generalIndicators]
  );
  // ... (createDynamicColumns, islamicColumns, generalColumns tetap sama)

  const handleClassChange = (value: number) => {
    const selected = classrooms.find((c) => c.id === value);
    setSelectedClassId(value);
    setSelectedClassroom(selected || null);
    // fetchStudentAndReportData akan dipicu oleh useEffect
  };

  // --- LOGIC TAMBAHAN: Pengurutan Kelas ---
  const sortedClassrooms = useMemo(() => {
    return [...classrooms].sort((a, b) => a.code.localeCompare(b.code));
  }, [classrooms]);

  // --- RENDER HALAMAN UTAMA ---

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
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

      {/* Header/Breadcrumb Area */}
      <Header
        style={{
          padding: "0 20px",
          background: "white",
          height: 40,
          lineHeight: "40px",
        }}
      >
        <Text type="secondary" style={{ fontSize: 12 }}>
          Home / Academic Report / Lifeskill
        </Text>
      </Header>

      <Content style={{ padding: "20px" }}>
        {/* Title and Academic Year */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 20,
          }}
        >
          <Title level={1} style={{ margin: 0 }}>
            Lifeskill Report
          </Title>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>
            {academicYearInfo
              ? `${academicYearInfo.year} (${academicYearInfo.semester})`
              : "Memuat Tahun..."}
          </Text>
        </div>

        {/* Filter & Search Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            marginBottom: 30,
          }}
        >
          <Search
            placeholder="Search student records..."
            style={{ width: 300, marginRight: 10 }}
            allowClear
            disabled={loadingInitial}
          />
          <Select
            placeholder="Select Class" // Placeholder
            value={selectedClassId} // Nilai ini adalah null secara default
            style={{ width: 250, marginRight: 10 }}
            onChange={handleClassChange}
            disabled={loadingInitial || classrooms.length === 0}
            loading={loadingInitial && classrooms.length === 0}
          >
            {/* Menggunakan sortedClassrooms dan hanya menampilkan c.code */}
            {sortedClassrooms.map((c) => (
              <Option key={c.id} value={c.id}>
                {c.code}
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
            disabled={loadingInitial || loadingSubmit}
          >
            Apply Filter
          </Button>
        </div>

        {/* Class Title */}
        <Title level={4} style={{ marginBottom: 15 }}>
          Class :{" "}
          {selectedClassroom
            ? `${selectedClassroom.class_name} (${selectedClassroom.code})`
            : "Pilih Kelas"}
        </Title>
        <Divider style={{ marginTop: 0, marginBottom: "20px" }} />

        {/* --- Bagian Islamic Life Skill --- */}
        <Title level={3} style={{ marginTop: 0, marginBottom: 15 }}>
          Islamic Life Skill
        </Title>
        <Table
          columns={islamicColumns}
          dataSource={islamicData}
          rowKey="studentId"
          pagination={false}
          bordered={true}
          size="middle"
          loading={loadingInitial}
          style={{ marginBottom: 40 }}
          scroll={{ x: true }}
        />

        {/* --- Bagian Life Skill --- */}
        <Title level={3} style={{ marginTop: 0, marginBottom: 15 }}>
          Life Skill
        </Title>
        <Table
          columns={generalColumns}
          dataSource={generalData}
          rowKey="studentId"
          pagination={false}
          bordered={true}
          size="middle"
          loading={loadingInitial}
          scroll={{ x: true }}
        />

        <div style={{ height: "50px" }} />
      </Content>
    </Layout>
  );
};

export default LifeskillPage;
