"use client";

import React, { useState, useEffect, Key, useCallback } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  Layout,
  Typography,
  Input,
  Select,
  Button,
  Table,
  Divider,
  InputNumber,
  Spin,
} from "antd";
import type { ColumnsType } from "antd/es/table";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// Tentukan Base URL dari environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ===========================================
// 1. TIPE DATA API & LOCAL
// ===========================================

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

interface StudentData {
  id: number; // student_classroom id
  student_id: number;
  semester: string;
  student: {
    id: number; // student id
    fullname: string;
  };
}

interface AttendanceRecap {
  id: number;
  student_id: number;
  classroom_id: number;
  present: number;
  illness: number; // sakit
  permission: number; // izin
  absent: number; // tanpa keterangan
}

// Tipe data untuk bagian Attendance yang akan ditampilkan di Table
interface AttendanceData {
  key: Key;
  studentClassroomId: number; // ID dari tabel pivot student_classroom
  studentId: number; // student_id untuk POST
  fullName: string;
  present: number; // Jumlah Hadir (H) - Kolom baru
  sickness: number; // Jumlah Sakit (S)
  permit: number; // Jumlah Izin (I)
  absent: number; // Jumlah Tanpa Keterangan (A)
}

// ===========================================
// 2. KOMPONEN DAN LOGIC UTAMA
// ===========================================

const AttendancePage: React.FC = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] =
    useState<AcademicYear | null>(null);
  const [selectedClassroomId, setSelectedClassroomId] = useState<number | null>(
    null
  );
  const [selectedClassroomCode, setSelectedClassroomCode] = useState<
    string | null
  >(null); // State ini kini menampung Nama dan Kode yang diformat

  const [loading, setLoading] = useState<boolean>(false); // Loading untuk Submit (per baris)
  const [dataLoading, setDataLoading] = useState<boolean>(false); // Loading data utama (fetch)

  const semesterText = selectedAcademicYear
    ? selectedAcademicYear.is_ganjil
      ? "Ganjil"
      : selectedAcademicYear.is_genap
      ? "Genap"
      : ""
    : "";

  // --- FUNGSI FETCH DATA ---

  // 1. Fetch Academic Years
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/academic-years`);
        const activeYear = response.data.find((y: AcademicYear) => y.is_active);
        setAcademicYears(response.data);
        if (activeYear) {
          setSelectedAcademicYear(activeYear);
        }
      } catch (error) {
        toast.error("Gagal memuat Tahun Akademik.");
      }
    };
    fetchAcademicYears();
  }, []);

  // 2. Fetch Classrooms (DITAMBAH PENGURUTAN)
  useEffect(() => {
    if (selectedAcademicYear) {
      const fetchClassrooms = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/classrooms`);

          // --- PENGURUTAN BERDASARKAN CODE (ASCENDING) ---
          const sortedClassrooms = response.data.data.sort(
            (a: Classroom, b: Classroom) => a.code.localeCompare(b.code)
          );
          // --- END PENGURUTAN ---

          setClassrooms(sortedClassrooms);
        } catch (error) {
          toast.error("Gagal memuat data Kelas.");
        }
      };
      fetchClassrooms();
    }
  }, [selectedAcademicYear]);

  // 3. Fetch Student dan Recap Data (Dipanggil hanya jika selectedClassroomId tidak null)
  const fetchAttendanceData = useCallback(async (classroomId: number) => {
    setDataLoading(true);
    try {
      // 1. Ambil daftar siswa
      const studentResponse = await axios.get<{ data: StudentData[] }>(
        `${API_BASE_URL}/student/classroom?classroom=${classroomId}`
      );
      const studentList = studentResponse.data.data;

      // 2. Ambil rekap kehadiran yang sudah tersimpan
      const recapResponse = await axios.get<{ recap: AttendanceRecap[] }>(
        `${API_BASE_URL}/reacap-absent?classroom=${classroomId}`
      );
      const recapMap = new Map(
        recapResponse.data.recap.map((r) => [r.student_id, r])
      );

      // Gabungkan data siswa dengan data rekap
      const combinedData: AttendanceData[] = studentList.map((sc) => {
        const recap = recapMap.get(sc.student.id);

        return {
          key: sc.id.toString(),
          studentClassroomId: sc.id,
          studentId: sc.student.id,
          fullName: sc.student.fullname,
          present: recap ? recap.present : 0,
          sickness: recap ? recap.illness : 0,
          permit: recap ? recap.permission : 0,
          absent: recap ? recap.absent : 0,
        };
      });

      setAttendanceData(combinedData);
    } catch (error) {
      console.error("Fetch Attendance Data Error:", error);
      toast.error("Gagal memuat data kehadiran siswa.");
      setAttendanceData([]);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Memuat data kehadiran setiap kali kelas yang dipilih berubah (LOGIC FORMAT BARU DI SINI)
  useEffect(() => {
    if (selectedClassroomId) {
      fetchAttendanceData(selectedClassroomId);
      const currentClassroom = classrooms.find(
        (c) => c.id === selectedClassroomId
      );

      if (currentClassroom) {
        // *** PERUBAHAN UTAMA: Gabungkan Nama Kelas dan Kode Kelas ke dalam satu string format: "Nama Kelas (Kode)" ***
        const formattedName = `${currentClassroom.class_name} (${currentClassroom.code})`;
        setSelectedClassroomCode(formattedName);
      } else {
        setSelectedClassroomCode(null);
      }
    } else {
      setAttendanceData([]);
      setSelectedClassroomCode(null);
    }
  }, [selectedClassroomId, fetchAttendanceData, classrooms]);

  // --- LOGIC PERUBAHAN DATA ATTENDANCE ---

  const handleDataChange = (
    studentId: number,
    key: keyof Omit<
      AttendanceData,
      "key" | "fullName" | "studentClassroomId" | "studentId"
    >,
    value: number | null
  ) => {
    const numericValue = value === null || value === undefined ? 0 : value;

    setAttendanceData((prevData) =>
      prevData.map((record) =>
        record.studentId === studentId
          ? { ...record, [key]: numericValue }
          : record
      )
    );
  };

  // --- LOGIC SUBMIT ---

  const handleSubmit = async (record: AttendanceData) => {
    if (!selectedClassroomId || !selectedAcademicYear) {
      toast.warn("Silakan pilih Tahun Akademik dan Kelas terlebih dahulu.");
      return;
    }

    setLoading(true);

    const payload = {
      student_id: record.studentId,
      classroom_id: selectedClassroomId,
      present: record.present,
      absent: record.absent,
      illness: record.sickness,
      permission: record.permit,
    };

    try {
      await axios.post(`${API_BASE_URL}/reacap-absent`, payload);

      toast.success(`Data Kehadiran ${record.fullName} berhasil disimpan!`);

      // Muat ulang data untuk mengupdate tampilan
      if (selectedClassroomId) {
        await fetchAttendanceData(selectedClassroomId);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Gagal menyimpan data kehadiran.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- DEFINISI KOLOM ATTENDANCE ---

  const columns: ColumnsType<AttendanceData> = [
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      width: "35%",
    },
    {
      title: "PRESENT (H)",
      dataIndex: "present",
      key: "present",
      align: "center",
      width: "12%",
      render: (present: number, record) => (
        <InputNumber
          value={present}
          min={0}
          style={{ width: "100%", minWidth: 60 }}
          onChange={(value) =>
            handleDataChange(record.studentId, "present", value)
          }
          disabled={loading || dataLoading}
        />
      ),
    },
    {
      title: "SICKNESS (S)",
      dataIndex: "sickness",
      key: "sickness",
      align: "center",
      width: "12%",
      render: (sickness: number, record) => (
        <InputNumber
          value={sickness}
          min={0}
          style={{ width: "100%", minWidth: 60 }}
          onChange={(value) =>
            handleDataChange(record.studentId, "sickness", value)
          }
          disabled={loading || dataLoading}
        />
      ),
    },
    {
      title: "PERMIT (I)",
      dataIndex: "permit",
      key: "permit",
      align: "center",
      width: "12%",
      render: (permit: number, record) => (
        <InputNumber
          value={permit}
          min={0}
          style={{ width: "100%", minWidth: 60 }}
          onChange={(value) =>
            handleDataChange(record.studentId, "permit", value)
          }
          disabled={loading || dataLoading}
        />
      ),
    },
    {
      title: "ABSENT (A)",
      dataIndex: "absent",
      key: "absent",
      align: "center",
      width: "12%",
      render: (absent: number, record) => (
        <InputNumber
          value={absent}
          min={0}
          style={{ width: "100%", minWidth: 60 }}
          onChange={(value) =>
            handleDataChange(record.studentId, "absent", value)
          }
          disabled={loading || dataLoading}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: "17%",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleSubmit(record)}
          disabled={loading || dataLoading}
          loading={
            loading &&
            record.studentId ===
              attendanceData.find((d) => d.key === record.key)?.studentId
          }
        >
          Submit
        </Button>
      ),
    },
  ];

  // --- RENDER HALAMAN UTAMA ---

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {/* Container untuk React Toastify */}
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
          Home / Academic Report / Attendance
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
            Attendance Report
          </Title>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>
            {selectedAcademicYear?.year} ({semesterText})
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
            disabled={dataLoading}
          />
          <Select
            placeholder="Select class"
            style={{ width: 180, marginRight: 10 }}
            value={selectedClassroomId}
            onChange={(value: number) => {
              setSelectedClassroomId(value);
            }}
            loading={classrooms.length === 0 && !selectedClassroomId}
            disabled={dataLoading}
          >
            {classrooms.map((cls) => (
              <Option key={cls.id} value={cls.id}>
                {cls.code} {/* Hanya menampilkan kode kelas di dropdown */}
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
            onClick={() => {
              if (selectedClassroomId) {
                fetchAttendanceData(selectedClassroomId);
              } else {
                toast.warn("Silakan pilih Kelas terlebih dahulu.");
              }
            }}
            disabled={dataLoading}
          >
            Apply Filter
          </Button>
        </div>

        {/* Class Title (MENGGUNAKAN FORMAT BARU) */}
        <Title level={4} style={{ marginBottom: 15 }}>
          Class : {selectedClassroomCode ?? "Pilih Kelas"}
        </Title>
        <Divider style={{ marginTop: 0, marginBottom: "20px" }} />

        {/* --- Bagian Attendance --- */}
        <Title level={3} style={{ marginTop: 0, marginBottom: 15 }}>
          Student Attendance
        </Title>
        <Spin spinning={dataLoading}>
          <Table
            columns={columns}
            dataSource={attendanceData}
            rowKey="studentId"
            pagination={false}
            bordered={true}
            size="middle"
            loading={loading || dataLoading}
            style={{ marginBottom: 40 }}
            locale={{
              emptyText: dataLoading
                ? "Memuat data siswa..."
                : "Tidak ada data siswa ditemukan. Pilih kelas.",
            }}
          />
        </Spin>

        <div style={{ height: "50px" }} />
      </Content>
    </Layout>
  );
};

export default AttendancePage;
