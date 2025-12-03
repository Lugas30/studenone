"use client";
// src/pages/DoaHaditsPage.tsx

import React, { useState, useEffect, useCallback, Key, useMemo } from "react";
import {
  Layout,
  Typography,
  Input,
  Select,
  Button,
  Table,
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
const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL;

// ===========================================
// 1. TIPE DATA API
// ===========================================

type DoaHaditsPredicate = "A" | "B" | "C" | "D";
const PREDICATE_OPTIONS: DoaHaditsPredicate[] = ["A", "B", "C", "D"];

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
}

interface Student {
  id: number; // student_id
  fullname: string;
  grade: string;
}

interface StudentInClass {
  id: number; // student_classroom_id
  student_id: number;
  student: Student;
  classroom: Classroom;
}

interface Indicator {
  id: number; // indicator_doa_id atau indicator_hadist_id
  indicator: string;
  grade: number;
}

// Data Nilai yang Disimpan di State Lokal (nilai predikat bisa null)
interface DoaHaditsRecord {
  key: Key;
  student_id: number;
  fullName: string;
  [key: string]: string | number | Key | null; // Predikat bisa null
}

interface SubmittedReport {
  student_id: number;
  items: Array<{
    indicator_doa_id?: number;
    indicator_hadist_id?: number;
    predicate: DoaHaditsPredicate;
  }>;
}

// ===========================================
// 2. KOMPONEN DAN LOGIC
// ===========================================

const DoaHaditsPage: React.FC = () => {
  const [activeAcademicYear, setActiveAcademicYear] = useState<{
    id: number;
    year: string;
    semester: string;
  } | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  // selectedClassGrade bertipe string (misalnya "1")
  const [selectedClassGrade, setSelectedClassGrade] = useState<string>("");

  const [doaIndicators, setDoaIndicators] = useState<Indicator[]>([]);
  const [haditsIndicators, setHaditsIndicators] = useState<Indicator[]>([]);
  const [doaData, setDoaData] = useState<DoaHaditsRecord[]>([]);
  const [haditsData, setHaditsData] = useState<DoaHaditsRecord[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // --- 2.1. FETCH INITIAL DATA (Academic Year & Classrooms) ---

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Academic Year
      const yearRes = await axios.get<AcademicYear[]>(
        `${BASE_API_URL}/academic-years`
      );
      const activeYear = yearRes.data.find((y) => y.is_active);
      if (activeYear) {
        const semester = activeYear.is_ganjil
          ? "Ganjil"
          : activeYear.is_genap
          ? "Genap"
          : "";
        setActiveAcademicYear({
          id: activeYear.id,
          year: activeYear.year,
          semester,
        });
      } else {
        toast.warn("Tidak ada Tahun Akademik aktif yang ditemukan.");
      }

      // 2. Fetch Classrooms
      const classRes = await axios.get<{ data: Classroom[] }>(
        `${BASE_API_URL}/classrooms`
      );

      // Mengurutkan secara ascending by code class
      const sortedClassrooms = classRes.data.data.sort((a, b) => {
        if (a.code < b.code) return -1;
        if (a.code > b.code) return 1;
        return 0;
      });

      setClassrooms(sortedClassrooms);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Gagal memuat data awal (Tahun Ajaran/Kelas).");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // --- 2.2. FETCH DYNAMIC DATA (Indicators, Students, Reports) ---

  const fetchClassroomData = useCallback(
    async (classId: number, grade: string) => {
      if (!classId || !grade) return;

      setLoading(true);
      try {
        // 1. Fetch Indicators
        const [doaRes, haditsRes] = await Promise.all([
          axios.get<{ data: Indicator[] }>(`${BASE_API_URL}/indicator-doa`),
          // Mock data jika API Hadits tidak ada atau error
          axios
            .get<{ data: Indicator[] }>(`${BASE_API_URL}/indicator-hadist`)
            .catch(() => {
              return {
                data: {
                  data: [
                    { id: 101, indicator: "HADITS 1", grade: 1 },
                    { id: 102, indicator: "HADITS 2", grade: 1 },
                  ] as Indicator[],
                },
              };
            }),
        ]);

        // Grade untuk indikator harus diubah ke number untuk filter
        const gradeNumber = parseInt(grade);
        const fetchedDoaIndicators = doaRes.data.data.filter(
          (i) => i.grade === gradeNumber
        );
        const fetchedHaditsIndicators = haditsRes.data.data.filter(
          (i) => i.grade === gradeNumber
        );

        setDoaIndicators(fetchedDoaIndicators);
        setHaditsIndicators(fetchedHaditsIndicators);

        // 2. Fetch Students
        const studentsRes = await axios.get<{ data: StudentInClass[] }>(
          `${BASE_API_URL}/student/classroom?classroom=${classId}`
        );
        const fetchedStudents = studentsRes.data.data;

        // 3. Fetch Existing Reports
        const [doaReportRes, haditsReportRes] = await Promise.all([
          axios
            .get<SubmittedReport[]>(
              `${BASE_API_URL}/report-doa?classroom_id=${classId}`
            )
            .catch(() => ({ data: [] as SubmittedReport[] })),
          axios
            .get<SubmittedReport[]>(
              `${BASE_API_URL}/report-hadist?classroom_id=${classId}`
            )
            .catch(() => ({ data: [] as SubmittedReport[] })),
        ]);

        const submittedDoaReports = doaReportRes.data;
        const submittedHaditsReports = haditsReportRes.data;

        // 4. Transform Data for Tables
        const initialDoaData: DoaHaditsRecord[] = fetchedStudents.map((s) => {
          const report = submittedDoaReports.find(
            (r) => r.student_id === s.student_id
          );
          const record: DoaHaditsRecord = {
            key: s.student_id,
            student_id: s.student_id,
            fullName: s.student.fullname,
          };
          fetchedDoaIndicators.forEach((indicator) => {
            const indicatorKey = `indicator_${indicator.id}`;
            const item = report?.items.find(
              (i) => i.indicator_doa_id === indicator.id
            );
            // Default value di set ke null
            record[indicatorKey] = item ? item.predicate : null;
          });
          return record;
        });

        const initialHaditsData: DoaHaditsRecord[] = fetchedStudents.map(
          (s) => {
            const report = submittedHaditsReports.find(
              (r) => r.student_id === s.student_id
            );
            const record: DoaHaditsRecord = {
              key: s.student_id,
              student_id: s.student_id,
              fullName: s.student.fullname,
            };
            fetchedHaditsIndicators.forEach((indicator) => {
              const indicatorKey = `indicator_${indicator.id}`;
              const item = report?.items.find(
                (i) => i.indicator_hadist_id === indicator.id
              );
              // Default value di set ke null
              record[indicatorKey] = item ? item.predicate : null;
            });
            return record;
          }
        );

        setDoaData(initialDoaData);
        setHaditsData(initialHaditsData);
      } catch (error) {
        console.error("Error fetching classroom data:", error);
        toast.error("Gagal memuat data siswa, indikator, atau laporan.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedClassId && selectedClassGrade) {
      fetchClassroomData(selectedClassId, selectedClassGrade);
    } else {
      setDoaData([]);
      setHaditsData([]);
      setDoaIndicators([]);
      setHaditsIndicators([]);
    }
  }, [selectedClassId, selectedClassGrade, fetchClassroomData]);

  // --- 2.3. HANDLERS ---

  const handleClassChange = (value: number) => {
    const selectedClass = classrooms.find((c) => c.id === value);
    if (selectedClass) {
      setSelectedClassId(value);
      setSelectedClassGrade(selectedClass.grade);
    }
  };

  const handlePredicateChange = (
    studentId: number,
    indicatorKey: string,
    value: DoaHaditsPredicate | null,
    section: "Doa" | "Hadits"
  ) => {
    if (section === "Doa") {
      setDoaData((prevData) =>
        prevData.map((record) =>
          record.student_id === studentId
            ? { ...record, [indicatorKey]: value }
            : record
        )
      );
    } else {
      setHaditsData((prevData) =>
        prevData.map((record) =>
          record.student_id === studentId
            ? { ...record, [indicatorKey]: value }
            : record
        )
      );
    }
  };

  const handleSubmit = async (
    record: DoaHaditsRecord,
    section: "Doa" | "Hadits"
  ) => {
    if (!selectedClassId) {
      toast.warn("Silakan pilih kelas terlebih dahulu.", { autoClose: 3000 });
      return;
    }

    setLoading(true);
    const toastId = toast.loading(
      `Menyimpan data ${section} untuk ${record.fullName}...`
    );

    const indicators = section === "Doa" ? doaIndicators : haditsIndicators;

    // Mapping data ke format API, hanya ambil nilai yang tidak null
    const itemsToSubmit = indicators.reduce(
      (acc, indicator) => {
        const indicatorKey = `indicator_${indicator.id}`;
        const predicateValue = record[indicatorKey];

        if (predicateValue !== null) {
          acc.indicator_ids.push(indicator.id);
          acc.predicates.push(predicateValue as DoaHaditsPredicate);
        }
        return acc;
      },
      { indicator_ids: [] as number[], predicates: [] as DoaHaditsPredicate[] }
    );

    // Validasi: pastikan ada nilai yang akan dikirim
    if (itemsToSubmit.indicator_ids.length === 0) {
      toast.update(toastId, {
        render: `Tidak ada predikat ${section} yang dipilih untuk ${record.fullName}. Tidak ada data yang disimpan.`,
        type: "warning",
        isLoading: false,
        autoClose: 5000,
      });
      setLoading(false);
      return;
    }

    // --- ENDPOINT DAN KEY EKSPLISIT ---
    let apiUrl: string;
    let indicatorKeyName: string;

    if (section === "Doa") {
      apiUrl = `${BASE_API_URL}/report-doa`;
      indicatorKeyName = "indicator_doa_id";
    } else {
      apiUrl = `${BASE_API_URL}/report-hadist`;
      indicatorKeyName = "indicator_hadist_id";
    }
    // ------------------------------------------

    // Menggunakan selectedClassGrade yang bertipe string
    const gradeString = selectedClassGrade;

    if (!gradeString) {
      toast.update(toastId, {
        render: "Error: Grade kelas tidak ditemukan.",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
      setLoading(false);
      return;
    }

    const apiPayload = {
      classroom_id: selectedClassId,
      grade: gradeString, // Dikirim sebagai String (misal: "1")
      student_id: record.student_id,
      [indicatorKeyName]: itemsToSubmit.indicator_ids,
      predicate: itemsToSubmit.predicates,
    };

    try {
      await axios.post(apiUrl, apiPayload);
      toast.update(toastId, {
        render: `Data ${section} ${record.fullName} berhasil disimpan!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      await fetchClassroomData(selectedClassId, selectedClassGrade);
    } catch (error) {
      console.error(`Error submitting ${section} data to ${apiUrl}:`, error);
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : `Gagal menyimpan data ${section} ${record.fullName}. Cek koneksi atau URL API: ${apiUrl}`;
      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // --- 2.4. DEFINISI KOLOM DINAMIS (MEMOIZED) ---

  const generateColumns = (
    indicators: Indicator[],
    section: "Doa" | "Hadits",
    dataHandler: (
      studentId: number,
      indicatorKey: string,
      value: DoaHaditsPredicate | null
    ) => void
  ): ColumnsType<DoaHaditsRecord> => {
    const dynamicColumns: ColumnsType<DoaHaditsRecord> = indicators.map(
      (indicator) => {
        const indicatorKey = `indicator_${indicator.id}`;
        return {
          title: indicator.indicator,
          dataIndex: indicatorKey,
          key: indicatorKey,
          align: "center",
          width: 150,
          render: (predicate: DoaHaditsPredicate | null, record) => (
            <Select
              value={predicate}
              style={{ width: "100%", minWidth: 60 }}
              placeholder="-" // Placeholder untuk nilai kosong
              onChange={(value) =>
                dataHandler(record.student_id as number, indicatorKey, value)
              }
              disabled={loading}
            >
              {PREDICATE_OPTIONS.map((option) => (
                <Option key={option} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          ),
        };
      }
    );

    return [
      {
        title: "Full Name",
        dataIndex: "fullName",
        key: "fullName",
        width: "200px",
        fixed: "left",
      },
      ...dynamicColumns,
      {
        title: "Actions",
        key: "actions",
        align: "center",
        width: 100,
        fixed: "right",
        render: (_, record) => (
          <Button
            type="primary"
            size="small"
            onClick={() => handleSubmit(record, section)}
            disabled={loading}
          >
            Submit
          </Button>
        ),
      },
    ];
  };

  const handleDoaPredicateChange = (
    studentId: number,
    indicatorKey: string,
    value: DoaHaditsPredicate | null
  ) => {
    handlePredicateChange(studentId, indicatorKey, value, "Doa");
  };

  const handleHaditsPredicateChange = (
    studentId: number,
    indicatorKey: string,
    value: DoaHaditsPredicate | null
  ) => {
    handlePredicateChange(studentId, indicatorKey, value, "Hadits");
  };

  const doaColumns = useMemo(
    () => generateColumns(doaIndicators, "Doa", handleDoaPredicateChange),
    [doaIndicators, loading]
  );
  const haditsColumns = useMemo(
    () =>
      generateColumns(haditsIndicators, "Hadits", handleHaditsPredicateChange),
    [haditsIndicators, loading]
  );

  // --- 2.5. FILTER SEARCH ---

  const filteredDoaData = useMemo(() => {
    if (!searchQuery) return doaData;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return doaData.filter((record) =>
      (record.fullName as string).toLowerCase().includes(lowerCaseQuery)
    );
  }, [doaData, searchQuery]);

  const filteredHaditsData = useMemo(() => {
    if (!searchQuery) return haditsData;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return haditsData.filter((record) =>
      (record.fullName as string).toLowerCase().includes(lowerCaseQuery)
    );
  }, [haditsData, searchQuery]);

  // --- 2.6. RENDER HALAMAN UTAMA ---

  const currentClassroom = classrooms.find((c) => c.id === selectedClassId);
  const classNameDisplay = currentClassroom
    ? `${currentClassroom.class_name} (${currentClassroom.code})`
    : "Pilih Kelas";

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
          Home / Academic Report / Do'a and Hadits
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
            Do'a and Hadits
          </Title>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>
            {activeAcademicYear
              ? `${activeAcademicYear.year} (${activeAcademicYear.semester})`
              : "Loading..."}
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
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
          />
          <Select
            value={selectedClassId}
            style={{ width: 120, marginRight: 10 }}
            placeholder="Pilih Kelas"
            onChange={handleClassChange}
            disabled={loading || classrooms.length === 0}
            allowClear={true}
          >
            {classrooms.map((c) => (
              <Option key={c.id} value={c.id}>
                {c.code}
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            onClick={() => {
              if (selectedClassId && selectedClassGrade) {
                fetchClassroomData(selectedClassId, selectedClassGrade);
              }
            }}
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
            disabled={loading || !selectedClassId}
          >
            Apply Filter
          </Button>
        </div>

        {/* Class Title */}
        <Title level={4} style={{ marginBottom: 15 }}>
          Class : {classNameDisplay}
        </Title>
        <Divider style={{ marginTop: 0, marginBottom: "20px" }} />

        {/* --- Bagian Do'a --- */}
        <Title level={4} style={{ marginTop: 0, marginBottom: 15 }}>
          Do'a
        </Title>
        <Table
          columns={doaColumns}
          dataSource={filteredDoaData}
          rowKey="student_id"
          pagination={false}
          bordered={true}
          size="middle"
          loading={loading && doaIndicators.length > 0}
          scroll={{ x: "max-content" }}
          style={{ marginBottom: 40 }}
          locale={{
            emptyText: selectedClassId
              ? loading
                ? "Loading Indicators..."
                : "No Doa Indicators Found for this Grade"
              : "Please select a Class",
          }}
        />

        {/* --- Bagian Hadits --- */}
        <Title level={4} style={{ marginTop: 0, marginBottom: 15 }}>
          Hadits
        </Title>
        <Table
          columns={haditsColumns}
          dataSource={filteredHaditsData}
          rowKey="student_id"
          pagination={false}
          bordered={true}
          size="middle"
          loading={loading && haditsIndicators.length > 0}
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: selectedClassId
              ? loading
                ? "Loading Indicators..."
                : "No Hadits Indicators Found for this Grade"
              : "Please select a Class",
          }}
        />

        <div style={{ height: "50px" }} />
      </Content>
    </Layout>
  );
};

export default DoaHaditsPage;
