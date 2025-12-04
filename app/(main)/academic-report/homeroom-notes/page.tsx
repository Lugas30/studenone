"use client";
// src/pages/HomeroomNotesPage.tsx

import React, { useState, useEffect, Key, useCallback } from "react";
import {
  Layout,
  Typography,
  Input,
  Select,
  Button,
  Table,
  Divider,
  Spin,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify"; // Import Toastify

// Destructuring komponen yang dibutuhkan
const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search, TextArea } = Input;
const { Option } = Select;

// Ambil URL API dari environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ===========================================
// 1. TIPE DATA API
// (Tidak ada perubahan pada bagian ini)
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
  academic_id: number;
}

interface Student {
  id: number; // Student ID
  fullname: string;
}

interface StudentClassroom {
  id: number; // student_classroom ID (key untuk table row)
  student_id: number; // ID Siswa
  classroom_id: number; // ID Kelas
  semester: string;
  student: Student;
}

interface HomeroomNote {
  id: number;
  student_id: number;
  note: string;
}

interface HomeroomNotesData {
  key: Key; // Menggunakan student_classroom ID sebagai key
  studentId: number; // student_id yang akan disubmit
  fullName: string;
  note: string; // Catatan berupa teks/string
}

// ===========================================
// 2. KOMPONEN DAN LOGIC
// ===========================================

const HomeroomNotesPage: React.FC = () => {
  // --- State Data Utama ---
  const [loading, setLoading] = useState<boolean>(true);
  const [academicYearInfo, setAcademicYearInfo] = useState<{
    year: string;
    semester: string;
    id: number | null;
  }>({
    year: "Loading...",
    semester: "",
    id: null,
  });
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  // Perubahan: selectedClassId default null, selectedClassName default "Pilih Kelas"
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedClassName, setSelectedClassName] =
    useState<string>("Pilih Kelas");

  const [homeroomNotesData, setHomeroomNotesData] = useState<
    HomeroomNotesData[]
  >([]);

  // --- State Filtering ---
  const [searchTerm, setSearchTerm] = useState<string>("");

  // ===========================================
  // FUNGSI FETCHING DATA API
  // ===========================================

  const fetchAcademicYear = async () => {
    try {
      const response = await axios.get<AcademicYear[]>(
        `${API_BASE_URL}/academic-years`
      );
      const activeYear = response.data.find((year) => year.is_active);

      if (activeYear) {
        let semester = "";
        if (activeYear.is_ganjil) semester = "Ganjil";
        else if (activeYear.is_genap) semester = "Genap";

        setAcademicYearInfo({
          year: activeYear.year,
          semester: semester,
          id: activeYear.id,
        });
      }
    } catch (error) {
      console.error("Error fetching academic year:", error);
      toast.error("Gagal mengambil data Tahun Ajaran.");
    }
  };

  const fetchClassrooms = async () => {
    try {
      const response = await axios.get<{ data: Classroom[] }>(
        `${API_BASE_URL}/classrooms`
      );
      const classes = response.data.data;
      setClassrooms(classes);

      // Perubahan: Hapus logika default selection. selectedClassId tetap null.
      if (classes.length === 0) {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      toast.error("Gagal mengambil data Kelas.");
    }
  };

  const fetchStudentsAndNotes = useCallback(async (classId: number) => {
    setLoading(true);
    if (!API_BASE_URL) {
      toast.error("API Base URL tidak ditemukan di environment variables.");
      setLoading(false);
      return;
    }
    try {
      // 1. Ambil Data Siswa
      const studentsRes = await axios.get<{ data: StudentClassroom[] }>(
        `${API_BASE_URL}/student/classroom?classroom=${classId}`
      );
      const rawStudents = studentsRes.data.data;

      // 2. Ambil Data Catatan Homeroom yang Sudah Tersimpan
      const notesRes = await axios.get<{ data: HomeroomNote[] }>(
        `${API_BASE_URL}/report-homerooms?classroom=${classId}`
      );
      const savedNotesMap = new Map<number, string>();
      notesRes.data.data.forEach((note) => {
        savedNotesMap.set(note.student_id, note.note);
      });

      // 3. Gabungkan dan Perbarui State Catatan
      const combinedData: HomeroomNotesData[] = rawStudents.map(
        (studentRecord) => {
          const studentId = studentRecord.student.id;
          const savedNote = savedNotesMap.get(studentId) || "";

          return {
            key: studentRecord.id.toString(), // student_classroom ID
            studentId: studentId, // student ID
            fullName: studentRecord.student.fullname,
            note: savedNote,
          };
        }
      );

      setHomeroomNotesData(combinedData);
    } catch (error) {
      console.error("Error fetching students and notes:", error);
      toast.error("Gagal memuat data Siswa atau Catatan Homeroom.");
      setHomeroomNotesData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- useEffect untuk Inisialisasi Data Awal ---
  useEffect(() => {
    fetchAcademicYear();
    fetchClassrooms();
  }, []);

  // --- useEffect untuk Memuat Data Siswa/Catatan ketika Kelas Berubah ---
  useEffect(() => {
    if (selectedClassId) {
      fetchStudentsAndNotes(selectedClassId);
    } else {
      // Jika tidak ada kelas yang dipilih, atur data kosong dan non-loading
      setHomeroomNotesData([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId]);

  // ===========================================
  // LOGIC INTERAKSI UI
  // ===========================================

  const handleDataChange = (studentId: number, value: string) => {
    setHomeroomNotesData((prevData) =>
      prevData.map((record) =>
        record.studentId === studentId ? { ...record, note: value } : record
      )
    );
  };

  /**
   * @function handleClassChange
   * @description Mengubah kelas yang dipilih.
   */
  const handleClassChange = (value: string) => {
    // Format value: "id|nama_kelas (kode)"
    const [id, code, name] = value.split("|"); // Perubahan: menangkap code dan name
    const classId = parseInt(id, 10);
    if (classId) {
      // Perubahan: Menggunakan format code (name) untuk selectedClassName
      setSelectedClassId(classId);
      setSelectedClassName(`${code} (${name})`);
    }
  };

  // ===========================================
  // LOGIC SUBMIT (API Call)
  // ===========================================

  const handleSubmit = async (record: HomeroomNotesData) => {
    if (!selectedClassId) {
      toast.warn("Mohon pilih kelas terlebih dahulu.", { autoClose: 3000 });
      return;
    }

    if (!record.note.trim()) {
      toast.warn(`Catatan untuk ${record.fullName} tidak boleh kosong.`, {
        autoClose: 3000,
      });
      return;
    }

    // Mengatur loading di dalam logic submit agar table tidak sepenuhnya ter-disable saat submit per baris
    // Namun, karena kita me-reload semua data setelah submit, kita tetap menggunakan loading global
    // untuk mencegah perubahan pada input lain saat proses loading data.
    setLoading(true);
    const toastId = toast.loading(
      `Menyimpan catatan untuk ${record.fullName}...`
    );

    try {
      const dataToSend = {
        classroom_id: selectedClassId,
        student_id: record.studentId,
        note: record.note,
      };

      await axios.post(`${API_BASE_URL}/report-homerooms`, dataToSend);

      toast.update(toastId, {
        render: `Catatan ${record.fullName} berhasil disimpan!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      // Reload data untuk menampilkan catatan yang baru disimpan
      await fetchStudentsAndNotes(selectedClassId);
    } catch (error) {
      console.error("Submission Error:", error);
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : `Gagal menyimpan data ${record.fullName}. Terjadi kesalahan koneksi/server.`;

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
      setLoading(false);
    }
  };

  // --- DEFINISI KOLOM HOMEROOM NOTES ---

  const columns: ColumnsType<HomeroomNotesData> = [
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      width: "30%",
      fixed: "left",
      filteredValue: searchTerm ? [searchTerm] : [],
      onFilter: (value, record) => {
        return record.fullName
          .toLowerCase()
          .includes((value as string).toLowerCase());
      },
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: "NOTE (N)",
      dataIndex: "note",
      key: "note",
      width: "55%",
      render: (note: string, record) => (
        <TextArea
          value={note}
          placeholder="Masukkan catatan homeroom..."
          rows={2}
          style={{ width: "100%", minWidth: 150 }}
          onChange={(e) => handleDataChange(record.studentId, e.target.value)}
          disabled={loading}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: "15%",
      fixed: "right",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleSubmit(record)}
          disabled={loading}
        >
          Submit
        </Button>
      ),
    },
  ];

  // --- RENDER HALAMAN UTAMA ---

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {/* Header/Breadcrumb Area */}
      <Header
        style={{
          padding: "0 20px",
          background: "white",
          height: 40,
          lineHeight: "40px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Text type="secondary" style={{ fontSize: 12 }}>
          Home / Academic Report / Homeroom Notes
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
            Homeroom Notes
          </Title>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>
            {academicYearInfo.year} ({academicYearInfo.semester || "Semester"})
          </Text>
        </div>

        {/* Filter & Search Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            marginBottom: 30,
            gap: 10,
          }}
        >
          <Search
            placeholder="Cari nama siswa..."
            style={{ width: 300 }}
            allowClear
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading && !searchTerm}
          />
          <Select
            placeholder="Pilih Kelas" // Placeholder yang diminta
            style={{ width: 250 }}
            // Perubahan: Nilai value hanya terisi jika selectedClassId ada
            value={
              selectedClassId
                ? `${selectedClassId}|${
                    classrooms.find((c) => c.id === selectedClassId)?.code
                  }|${
                    classrooms.find((c) => c.id === selectedClassId)?.class_name
                  }`
                : undefined
            }
            onChange={handleClassChange}
            disabled={loading}
          >
            {classrooms.map((cls) => (
              // Perubahan: Nilai Option menggunakan format ID|CODE|NAME
              // Tampilan Option hanya menggunakan CODE
              <Option
                key={cls.id}
                value={`${cls.id}|${cls.code}|${cls.class_name}`}
              >
                {cls.code}
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
            disabled={loading}
          >
            Apply Filter
          </Button>
        </div>

        {/* Class Title */}
        <Title level={3} style={{ marginBottom: 15 }}>
          Class :{" "}
          <Text style={{ fontSize: 20 }} strong>
            {/* Tampilkan selectedClassName yang sudah di-format (Code (Name)) */}
            {selectedClassId ? selectedClassName : " Pilih kelas"}
          </Text>
        </Title>
        <Divider style={{ marginTop: 0, marginBottom: "20px" }} />

        {/* --- Bagian Homeroom Notes Table --- */}
        <Title level={3} style={{ marginTop: 0, marginBottom: 15 }}>
          Student Notes
        </Title>
        <Spin spinning={loading} tip="Memuat data siswa dan catatan...">
          <Table
            columns={columns}
            dataSource={homeroomNotesData.filter((record) =>
              record.fullName.toLowerCase().includes(searchTerm.toLowerCase())
            )}
            rowKey="key"
            pagination={false}
            bordered={true}
            size="middle"
            scroll={{ x: 800 }}
            style={{ marginBottom: 40 }}
            locale={{
              emptyText: selectedClassId
                ? "Tidak ada data siswa ditemukan."
                : "Silakan pilih kelas untuk memuat data siswa.",
            }}
          />
        </Spin>

        <div style={{ height: "50px" }} />
      </Content>
      <ToastContainer
        position="top-right" // Atur posisi (opsional)
        autoClose={5000} // Atur auto close time (opsional)
        hideProgressBar={false} // (opsional)
        newestOnTop={false} // (opsional)
        closeOnClick // (opsional)
        rtl={false} // (opsional)
        pauseOnFocusLoss // (opsional)
        draggable // (opsional)
        pauseOnHover // (opsional)
        theme="light" // (opsional)
      />
    </Layout>
  );
};

export default HomeroomNotesPage;
