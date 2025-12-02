// PreviewDetailPID.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Layout,
  Typography,
  Table,
  Input,
  Select,
  Button,
  Space,
  message,
  Spin,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
} from "@ant-design/icons"; // Tambahkan EyeOutlined
import type { ColumnType } from "antd/es/table";
import type { SelectProps } from "antd";
import axios from "axios";
import { useSearchParams } from "next/navigation";
// Import komponen PrintRaportPID
import PrintRaportPID from "../../components/PrintRaportPID";

const { Content } = Layout;
const { Title, Text } = Typography;

// Definisikan BASE_URL dari environment variable
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// --- 1. Definisi Tipe Data (Interfaces) ---

interface AcademicYear {
  id: number;
  year: string;
  is_ganjil: boolean;
  is_genap: boolean;
  is_active: boolean;
}

interface StudentApiData {
  id: number;
  nis: string;
  fullname: string;
}

interface ClassroomData {
  id: number;
  grade: string;
  section: string;
  class_name: string;
  code: string;
}

interface ReportResponse {
  classroom: ClassroomData;
  student: StudentApiData[];
}

interface StudentTableData {
  key: string; // key adalah student id dalam bentuk string
  fullName: string;
  nis: string;
}

// Map Triwulan value ke format API
const periodeMap: { [key: string]: string } = {
  "Triwulan 1": "triwulan_1",
  "Triwulan 2": "triwulan_2",
  "Triwulan 3": "triwulan_3",
  "Triwulan 4": "triwulan_4",
};

// --- 2. Komponen Utama ---

const PreviewDetailPID: React.FC = () => {
  const searchParams = useSearchParams();

  // Ambil classroom_id dari parameter URL.
  const classroomId = searchParams.get("classroom_id");

  // --- State untuk Data dan Loading ---
  const [isLoading, setIsLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
  const [semester, setSemester] = useState<string>("");
  const [triwulanOptions, setTriwulanOptions] = useState<
    SelectProps["options"]
  >([]);
  const [selectedTriwulan, setSelectedTriwulan] = useState<string>("");

  const [studentData, setStudentData] = useState<StudentTableData[]>([]);
  const [classroomData, setClassroomData] = useState<ClassroomData | null>(
    null
  );
  const [searchText, setSearchText] = useState("");

  // --- State untuk Modal PrintRaportPID ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null
  );

  // --- Fungsi Modal Handler ---
  const handleOpenReportModal = (studentId: number) => {
    if (!selectedTriwulan) {
      return message.error("Pilih periode (Triwulan) terlebih dahulu.");
    }
    setSelectedStudentId(studentId);
    setIsModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setIsModalOpen(false);
    setSelectedStudentId(null);
  };

  // --- Definisi Kolom Tabel (Didefinisikan di sini agar bisa mengakses handleOpenReportModal) ---
  const columns: ColumnType<StudentTableData>[] = [
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      width: "50%",
    },
    {
      title: "NIS",
      dataIndex: "nis",
      key: "nis",
      sorter: (a, b) => a.nis.localeCompare(b.nis),
      width: "20%",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EyeOutlined />} // Ikon mata untuk view
            onClick={() => handleOpenReportModal(parseInt(record.key))} // Menggunakan record.key sebagai studentId
          >
            View Report
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() =>
              message.info(`Download Report for ${record.fullName}`)
            }
          >
            Download
          </Button>
        </Space>
      ),
      width: "30%",
    },
  ];
  // --- Akhir Definisi Kolom Tabel ---

  // 3.1 Fungsi Fetch Data Siswa
  const fetchStudentReport = useCallback(
    async (cId: string, periode: string) => {
      if (!periode || !cId) return;

      setIsLoading(true);
      const apiPeriode = periodeMap[periode];

      try {
        const response = await axios.get<ReportResponse>(`${BASE_URL}/report`, {
          params: {
            classroom_id: cId,
            periode: apiPeriode,
          },
        });

        const mappedData: StudentTableData[] = response.data.student.map(
          (s) => ({
            key: s.id.toString(), // student ID sebagai key
            fullName: s.fullname,
            // Menghapus 0 di depan NIS jika ada
            nis: s.nis.replace(/^0+/, ""),
          })
        );

        setStudentData(mappedData);
        setClassroomData(response.data.classroom);
        setSearchText("");
      } catch (error) {
        console.error("Error fetching student report:", error);
        message.error("Gagal mengambil data laporan siswa.");
        setStudentData([]);
        setClassroomData(null);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 3.2 Fungsi Fetch Tahun Akademik
  const fetchAcademicYear = useCallback(async () => {
    if (!classroomId) {
      setIsLoading(false);
      return message.warning("Parameter classroom_id tidak ditemukan di URL.");
    }

    try {
      const response = await axios.get<AcademicYear[]>(
        `${BASE_URL}/academic-years`
      );
      const activeYear = response.data.find((year) => year.is_active);

      if (activeYear) {
        setAcademicYear(activeYear);
        let options: SelectProps["options"] = [];
        let defaultTriwulan = "";
        let currentSemester = "";

        if (activeYear.is_ganjil) {
          currentSemester = "Ganjil";
          options = [
            { value: "Triwulan 1", label: "Triwulan 1" },
            { value: "Triwulan 2", label: "Triwulan 2" },
          ];
          defaultTriwulan = "Triwulan 1";
        } else if (activeYear.is_genap) {
          currentSemester = "Genap";
          options = [
            { value: "Triwulan 3", label: "Triwulan 3" },
            { value: "Triwulan 4", label: "Triwulan 4" },
          ];
          defaultTriwulan = "Triwulan 3";
        }

        setSemester(currentSemester);
        setTriwulanOptions(options);
        setSelectedTriwulan(defaultTriwulan);

        if (defaultTriwulan) {
          await fetchStudentReport(classroomId, defaultTriwulan);
        }
      } else {
        message.error("Tidak ada tahun akademik yang aktif ditemukan.");
      }
    } catch (error) {
      console.error("Error fetching academic year:", error);
      message.error("Gagal mengambil data tahun akademik.");
    } finally {
      setIsLoading(false);
    }
  }, [classroomId, fetchStudentReport]);

  // 3.3 useEffect untuk Ambil Data Akademik Awal
  useEffect(() => {
    if (classroomId) {
      fetchAcademicYear();
    }
  }, [classroomId, fetchAcademicYear]);

  // 3.4 Handler Filter dan Search

  const handleApplyFilter = () => {
    if (classroomId && selectedTriwulan) {
      fetchStudentReport(classroomId, selectedTriwulan);
    } else {
      message.warning("Pilih Triwulan atau pastikan Classroom ID tersedia.");
    }
  };

  const handleTriwulanChange = (value: string) => {
    setSelectedTriwulan(value);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
  };

  // Logika filter client-side
  const filteredData = studentData.filter(
    (student) =>
      student.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
      student.nis.includes(searchText)
  );

  // 4. Rendering

  const academicDisplay = academicYear
    ? `${academicYear.year} (${semester})`
    : "Memuat...";
  const classDisplay = classroomData
    ? `Class : ${classroomData.class_name} (${classroomData.code}) - ${selectedTriwulan}`
    : `Class : Memuat...`;

  return (
    <Layout style={{ padding: "24px", backgroundColor: "#fff" }}>
      {/* Header Halaman */}
      <Space direction="vertical" style={{ width: "100%" }}>
        <Space split=" / ">
          <Text type="secondary">Home</Text>
          <Text type="secondary">PID Access & Preview</Text>
          <Text strong>Preview Detail PID</Text>
        </Space>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            Preview Detail PID
          </Title>
          {/* Tampilkan Tahun Akademik Aktif */}
          <Title level={3} style={{ margin: 0 }}>
            {academicDisplay}
          </Title>
        </div>
      </Space>

      {/* Area Filter dan Aksi */}
      <Space size="middle" style={{ marginBottom: "24px" }}>
        <Input
          placeholder="Search customer 100 records..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={searchText}
          onChange={handleSearch}
          disabled={isLoading}
        />
        {/* Select Triwulan - Dibuat dinamis */}
        <Select
          value={selectedTriwulan}
          style={{ width: 120 }}
          onChange={handleTriwulanChange}
          options={triwulanOptions}
          // PERBAIKAN TS: Tambahkan !triwulanOptions untuk mengatasi kemungkinan 'undefined' sebelum mengakses .length
          disabled={
            isLoading || !triwulanOptions || triwulanOptions.length === 0
          }
          loading={isLoading && triwulanOptions && triwulanOptions.length === 0}
        />
        <Button
          type="primary"
          onClick={handleApplyFilter}
          style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
          disabled={isLoading || !selectedTriwulan}
        >
          Apply Filter
        </Button>
        <Button
          icon={<DownloadOutlined />}
          onClick={() =>
            message.info(`Download All Data for ${selectedTriwulan}`)
          }
          disabled={isLoading || filteredData.length === 0}
        />
      </Space>

      {/* Judul Detail Kelas */}
      <Title level={4} style={{ marginTop: 0, marginBottom: "24px" }}>
        {classDisplay}
      </Title>

      {/* Tabel Data Siswa */}
      <Spin spinning={isLoading} tip="Memuat data siswa...">
        <Table
          columns={columns} // Menggunakan columns yang baru
          dataSource={filteredData}
          pagination={false}
          bordered={false}
          size="middle"
          style={{ padding: 0 }}
          locale={{ emptyText: "Tidak ada data siswa ditemukan." }}
          title={() => (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 16px",
                borderBottom: "1px solid #f0f0f0",
              }}
            ></div>
          )}
        />
      </Spin>

      {/* Komponen Modal PrintRaportPID */}
      <PrintRaportPID
        isOpen={isModalOpen}
        onClose={handleCloseReportModal}
        studentId={selectedStudentId}
        periode={selectedTriwulan}
        academicYearDisplay={academicDisplay}
      />
    </Layout>
  );
};

export default PreviewDetailPID;
