"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios, { AxiosInstance } from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  Layout,
  Typography,
  Card,
  Input,
  Select,
  Button,
  Table,
  Space,
} from "antd";
import type { ColumnsType } from "antd/es/table";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// --- 1. SETUP AXIOS INSTANCE & BASE URL ---

// Pastikan variabel lingkungan ini sudah disetel di file .env.local Anda
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
  console.error("NEXT_PUBLIC_API_URL is not set in .env file.");
}

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
});

// --- 2. INTERFACE & TIPE DATA ---

type Predicate = "A" | "B" | "C" | "D";
const PREDICATE_OPTIONS: Predicate[] = ["A", "B", "C", "D"];

// BARU: Interface untuk data Tahun Akademik
interface AcademicYear {
  id: number;
  year: string;
  is_ganjil: boolean;
  is_genap: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Classroom {
  id: number;
  grade: string;
  section: string;
  class_name: string;
  code: string;
}

// DIPERBAIKI: ClassroomResponse tidak lagi membawa academicYear
interface ClassroomResponse {
  data: Classroom[];
}

interface StudentData {
  id: number; // id dari tabel pivot student_classroom
  student_id: number; // id siswa
  classroom_id: number;
  student: {
    id: number;
    fullname: string;
    nis: string;
    nisn: string;
    grade: string;
  };
}

interface StudentResponse {
  academicYear: string;
  data: StudentData[];
}

interface ExistingReport {
  id: number;
  student_id: number;
  spi_predicate: Predicate;
  sos_predicate: Predicate;
  classroom_id: number;
}

interface ReportData {
  key: number;
  student_id: number;
  full_name: string;
  nis: string;
  spi_predicate: Predicate | null; // Null jika belum diisi
  sos_predicate: Predicate | null; // Null jika belum diisi
  current_report_id?: number;
}

// --- 3. KOMPONEN UTAMA ---

const AttitudesReportPage: React.FC = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedClassDetails, setSelectedClassDetails] =
    useState<Classroom | null>(null);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // BARU: State untuk menyimpan tahun akademik yang aktif
  const [activeAcademicYear, setActiveAcademicYear] =
    useState<AcademicYear | null>(null);

  useEffect(() => {
    // Ambil tahun akademik dan kelas saat komponen dimuat
    fetchAcademicYears();
    fetchClassrooms();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudentData(selectedClassId);
    } else {
      setReportData([]);
      setSelectedClassDetails(null);
    }
  }, [selectedClassId]);

  // BARU: Fungsi untuk mengambil data tahun akademik
  const fetchAcademicYears = useCallback(async () => {
    try {
      const response = await api.get<AcademicYear[]>("/academic-years");
      // Cari tahun akademik yang statusnya aktif (is_active: true)
      const activeYear = response.data.find((year) => year.is_active);

      if (activeYear) {
        setActiveAcademicYear(activeYear);
      } else {
        toast.warn("Tidak ada Tahun Akademik yang aktif ditemukan.");
      }
    } catch (error) {
      toast.error("Gagal mengambil data Tahun Akademik.");
    }
  }, []);

  const fetchClassrooms = useCallback(async () => {
    setLoading(true);
    try {
      // Endpoint /classrooms sekarang hanya mengembalikan data kelas
      const response = await api.get<ClassroomResponse>("/classrooms");

      const sortedClassrooms = response.data.data.sort((a, b) =>
        a.code.localeCompare(b.code)
      );

      setClassrooms(sortedClassrooms);
      setLoading(false);
      setSelectedClassId(null);
    } catch (error) {
      toast.error("Gagal mengambil data kelas. Pastikan API berjalan.");
      setLoading(false);
    }
  }, []);

  const fetchStudentData = useCallback(
    async (classroomId: number) => {
      setLoading(true);
      const loadingToastId = toast.loading(
        "Mengambil data siswa dan laporan..."
      );

      try {
        // 1. Ambil Data Siswa per Kelas
        const studentRes = await api.get<StudentResponse>(
          `/student/classroom?classroom=${classroomId}`
        );

        // 2. Ambil Laporan Predikat yang sudah diinput
        const reportRes = await api.get<ExistingReport[]>(
          `/report-spi-sos?classroom_id=${classroomId}`
        );
        const existingReports: ExistingReport[] = reportRes.data;

        // Cari detail kelas yang terpilih
        const currentClassDetail =
          classrooms.find((c) => c.id === classroomId) || null;
        setSelectedClassDetails(currentClassDetail);

        // 3. Gabungkan data Siswa dengan Laporan
        const combinedData: ReportData[] = studentRes.data.data.map(
          (studentPivot) => {
            const existingReport = existingReports.find(
              (report) => report.student_id === studentPivot.student.id
            );

            return {
              key: studentPivot.student.id,
              student_id: studentPivot.student.id,
              full_name: studentPivot.student.fullname,
              nis: studentPivot.student.nis,
              // Set ke null jika tidak ada laporan (sesuai permintaan)
              spi_predicate: existingReport?.spi_predicate || null,
              sos_predicate: existingReport?.sos_predicate || null,
              current_report_id: existingReport?.id,
            };
          }
        );

        setReportData(combinedData);
        toast.update(loadingToastId, {
          render: "Data berhasil dimuat!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } catch (error) {
        toast.update(loadingToastId, {
          render: "Gagal mengambil data siswa atau laporan.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      } finally {
        setLoading(false);
      }
    },
    [classrooms]
  );

  const handlePredicateChange = (
    studentId: number,
    key: "spi_predicate" | "sos_predicate",
    value: Predicate
  ) => {
    setReportData((prevData) =>
      prevData.map((record) =>
        record.student_id === studentId ? { ...record, [key]: value } : record
      )
    );
  };

  const handleSubmit = async (record: ReportData) => {
    if (!selectedClassId) {
      toast.error("Pilih kelas terlebih dahulu.");
      return;
    }

    // Validasi Predikat tidak boleh null
    if (!record.spi_predicate || !record.sos_predicate) {
      toast.warn(
        `Predikat SPI dan SOS untuk ${record.full_name} harus dipilih.`
      );
      return;
    }

    setLoading(true);
    const submitToastId = toast.loading(
      `Submitting data for ${record.full_name}...`
    );

    const payload = {
      student_id: record.student_id,
      spi_predicate: record.spi_predicate,
      sos_predicate: record.sos_predicate,
      classroom_id: selectedClassId,
    };

    try {
      await api.post("/report-spi-sos", payload);

      // Refresh data siswa untuk menampilkan status terbaru
      await fetchStudentData(selectedClassId);

      toast.update(submitToastId, {
        render: `Predikat ${record.full_name} berhasil disimpan!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      toast.update(submitToastId, {
        render: `Gagal menyimpan data predikat ${record.full_name}.`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClassroomSelect = (value: number | null) => {
    setSelectedClassId(value);
  };

  // --- 4. DEFINISI KOLOM TABLE ---

  const columns: ColumnsType<ReportData> = [
    {
      title: "Full Name",
      dataIndex: "full_name",
      key: "full_name",
      width: "35%",
    },
    {
      title: "NIS",
      dataIndex: "nis",
      key: "nis",
      align: "center",
      width: "10%",
    },
    {
      title: "Predicate SPI",
      dataIndex: "spi_predicate",
      key: "spi_predicate",
      width: "20%",
      render: (predicate: Predicate | null, record) => (
        <Select
          value={predicate}
          style={{ width: "100%" }}
          onChange={(value: Predicate) =>
            handlePredicateChange(record.student_id, "spi_predicate", value)
          }
          placeholder="-"
          disabled={loading}
        >
          {PREDICATE_OPTIONS.map((option) => (
            <Option key={option} value={option}>
              {option}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Predicate SOS",
      dataIndex: "sos_predicate",
      key: "sos_predicate",
      width: "20%",
      render: (predicate: Predicate | null, record) => (
        <Select
          value={predicate}
          style={{ width: "100%" }}
          onChange={(value: Predicate) =>
            handlePredicateChange(record.student_id, "sos_predicate", value)
          }
          placeholder="-"
          disabled={loading}
        >
          {PREDICATE_OPTIONS.map((option) => (
            <Option key={option} value={option}>
              {option}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: "15%",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleSubmit(record)}
          disabled={loading}
        >
          {record.current_report_id ? "Update" : "Simpan"}
        </Button>
      ),
    },
  ];

  // --- 5. RENDER KOMPONEN ---

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {/* Container untuk React Toastify */}
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
        theme="light"
      />
      {/* Header Area */}
      <Header
        style={{
          padding: "0 20px",
          background: "white",
          height: 40,
          lineHeight: "40px",
        }}
      >
        <Text type="secondary" style={{ fontSize: 12 }}>
          Home / Academic Report / Spiritual and Social Attitudes
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
            Sikap Spiritual dan Sosial
          </Title>
          {/* Tampilkan Tahun Akademik Aktif dan Semester */}
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>
            {activeAcademicYear
              ? `${activeAcademicYear.year} (${
                  activeAcademicYear.is_ganjil
                    ? "Ganjil"
                    : activeAcademicYear.is_genap
                    ? "Genap"
                    : "Tidak Aktif"
                })`
              : "Memuat Tahun Akademik..."}
          </Text>
        </div>

        {/* Definition Card */}
        <Card
          variant="outlined"
          style={{ marginBottom: 20, background: "#f0f0f0" }}
        >
          <Space direction="vertical" size={5}>
            <Text strong style={{ fontSize: 18 }}>
              Spiritual (SPI):
            </Text>
            <Text>
              Memberi salam, Tawakal, Bersyukur atas nikmat & karunia Allah SWT,
              toleransi, dan bersyukur atas keberhasilan.
            </Text>
            <Text strong style={{ fontSize: 18 }}>
              Sosial (SOS):
            </Text>
            <Text>kejujuran, kedisiplinan, tanggung jawab, dan toleransi.</Text>
          </Space>
        </Card>

        {/* Filter & Select Class */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            marginBottom: 30,
          }}
        >
          <Search
            placeholder="Search by name or NIS..."
            style={{ width: 300, marginRight: 10 }}
            allowClear
            disabled={loading}
          />
          <Select
            value={selectedClassId}
            style={{ width: 150, marginRight: 10 }}
            onChange={handleClassroomSelect}
            loading={loading && classrooms.length === 0}
            disabled={loading}
            placeholder="Select Class"
          >
            {classrooms.map((cls) => (
              <Option key={cls.id} value={cls.id}>
                {cls.code}
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
            onClick={() => selectedClassId && fetchStudentData(selectedClassId)}
            disabled={loading || !selectedClassId}
          >
            Apply Filter
          </Button>
        </div>

        {/* Class Title */}
        <Title level={4} style={{ marginBottom: 15 }}>
          Class :{" "}
          {selectedClassDetails
            ? `${selectedClassDetails.class_name} (${selectedClassDetails.code})`
            : "Select Class"}
        </Title>

        {/* Data Table */}
        <Table
          columns={columns}
          dataSource={reportData}
          rowKey="student_id"
          pagination={false}
          bordered={true}
          size="middle"
          loading={loading}
          locale={{
            emptyText: selectedClassId
              ? "Tidak ada data siswa dalam kelas ini."
              : "Silakan pilih kelas terlebih dahulu.",
          }}
        />
      </Content>
    </Layout>
  );
};

export default AttitudesReportPage;
