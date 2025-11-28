"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Layout,
  Typography,
  Alert,
  Input,
  Button,
  Table,
  Select,
  Space,
  Pagination,
  Spin,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import axios from "axios";
// 1. Import useRouter dari next/navigation (Untuk Next.js 13+ App Router)
import { useRouter } from "next/navigation";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// --- 1. DEFINISI INTERFACE (Tipe Data) ---

// Interface untuk setiap objek dalam array 'dataSubject' dari respons API
interface DataSubject {
  // Menambahkan ID karena ini data dari API
  id: number; // Tambahkan jika API mengembalikan ID di level ini (meski tidak ada di body respons API yang Anda berikan, ini adalah praktik umum)
  periode: string;
  subject_id: number; // Ini yang penting untuk dikirimkan
  code: string;
  name: string;
  grade: string;
  kkm: number;
  category: string;
  is_ganjil: boolean;
  is_genap: boolean;
  academic_id: number;
  created_at: string;
  updated_at: string;
}

// Interface untuk data yang akan ditampilkan di tabel
interface SubjectPIDTable {
  key: string;
  subjectCode: string;
  subject: string;
  periode: string;
  grade: number; // Ubah ke number
  kkm: number;
  category: string;
  // Menambahkan properti yang diperlukan untuk navigasi/API call berikutnya
  subject_id: number;
  original_grade: string; // Menyimpan grade asli (string) jika diperlukan
}

// Interface untuk struktur lengkap respons API
interface APIResponse {
  grade: string;
  dataSubject: DataSubject[];
}

// --- 2. FUNGSI TRANSFORMASI DATA ---
const transformData = (data: DataSubject[]): SubjectPIDTable[] => {
  return data.map((item, index) => ({
    key: `${item.subject_id}-${item.periode}-${index}`,
    subjectCode: item.code,
    subject: item.name,
    periode: item.periode,
    grade: parseInt(item.grade, 10), // Grade dalam bentuk number untuk tampilan/sorting
    kkm: item.kkm,
    category: item.category,
    subject_id: item.subject_id, // Simpan subject_id
    original_grade: item.grade, // Simpan grade asli dalam string (misalnya '1')
  }));
};

// --- 3. DEFINISI KOLOM DENGAN TIPE YANG BENAR (Diubah menjadi fungsi) ---

// Kolom sekarang menerima fungsi handleEdit sebagai prop
const getColumns = (
  handleEdit: (record: SubjectPIDTable) => void
): ColumnsType<SubjectPIDTable> => [
  {
    title: "Subject Code",
    dataIndex: "subjectCode",
    key: "subjectCode",
    sorter: (a: SubjectPIDTable, b: SubjectPIDTable) =>
      a.subjectCode.localeCompare(b.subjectCode),
    align: "left",
    onHeaderCell: () => ({
      style: {
        backgroundColor: "#f0f0f0",
        fontWeight: "bold",
        borderRight: "1px solid #f0f0f0",
      },
    }),
    onCell: () => ({ style: { borderRight: "1px solid #f0f0f0" } }),
  },
  {
    title: "Subject",
    dataIndex: "subject",
    key: "subject",
    sorter: (a: SubjectPIDTable, b: SubjectPIDTable) =>
      a.subject.localeCompare(b.subject),
    align: "left",
    onHeaderCell: () => ({
      style: {
        backgroundColor: "#f0f0f0",
        fontWeight: "bold",
        borderRight: "1px solid #f0f0f0",
      },
    }),
    onCell: () => ({ style: { borderRight: "1px solid #f0f0f0" } }),
  },
  {
    title: "Periode",
    dataIndex: "periode",
    key: "periode",
    sorter: (a: SubjectPIDTable, b: SubjectPIDTable) =>
      a.periode.localeCompare(b.periode),
    align: "left",
    onHeaderCell: () => ({
      style: {
        backgroundColor: "#f0f0f0",
        fontWeight: "bold",
        borderRight: "1px solid #f0f0f0",
      },
    }),
    onCell: () => ({ style: { borderRight: "1px solid #f0f0f0" } }),
  },
  {
    title: "Grade",
    dataIndex: "grade",
    key: "grade",
    sorter: (a: SubjectPIDTable, b: SubjectPIDTable) => a.grade - b.grade,
    align: "left",
    onHeaderCell: () => ({
      style: {
        backgroundColor: "#f0f0f0",
        fontWeight: "bold",
        borderRight: "1px solid #f0f0f0",
      },
    }),
    onCell: () => ({ style: { borderRight: "1px solid #f0f0f0" } }),
  },
  {
    title: "Category",
    dataIndex: "category",
    key: "category",
    align: "left",
    onHeaderCell: () => ({
      style: {
        backgroundColor: "#f0f0f0",
        fontWeight: "bold",
        borderRight: "1px solid #f0f0f0",
      },
    }),
    onCell: () => ({ style: { borderRight: "1px solid #f0f0f0" } }),
  },
  {
    title: "KKM",
    dataIndex: "kkm",
    key: "kkm",
    align: "center",
    onHeaderCell: () => ({
      style: {
        backgroundColor: "#f0f0f0",
        fontWeight: "bold",
        borderRight: "1px solid #f0f0f0",
      },
    }),
    onCell: () => ({ style: { borderRight: "1px solid #f0f0f0" } }),
  },
  {
    title: "Actions",
    key: "actions",
    align: "center",
    onHeaderCell: () => ({
      style: {
        backgroundColor: "#f0f0f0",
        fontWeight: "bold",
        borderRight: "1px solid #f0f0f0",
      },
    }),
    onCell: () => ({ style: { borderRight: "1px solid #f0f0f0" } }),
    render: (_, record: SubjectPIDTable) => (
      <Space size={4}>
        <Button
          icon={<EyeOutlined />}
          type="text"
          style={{ padding: "0 4px", color: "#1890ff" }}
          onClick={() => console.log("View", record)}
        />
        {/* 4. Panggil handleEdit saat tombol Edit diklik */}
        <Button
          icon={<EditOutlined />}
          type="text"
          style={{ padding: "0 4px", color: "#faad14" }} // Ubah warna untuk Edit
          onClick={() => handleEdit(record)}
        />
      </Space>
    ),
  },
];

// --- 4. KOMPONEN HALAMAN ---
const PersonalIndicatorPage = () => {
  // Inisialisasi router
  const router = useRouter();

  // State untuk Data API
  const [data, setData] = useState<SubjectPIDTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // State untuk Grade yang dipilih (default ke Grade 1)
  const [selectedGrade, setSelectedGrade] = useState<string>("1");
  // State untuk Grade yang akan diterapkan (untuk tombol "Apply Filter")
  const [appliedGrade, setAppliedGrade] = useState<string>("1");

  // State untuk Pagination (sesuaikan dengan data real)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalRecords = data.length;

  // Fungsi untuk mengambil data dari API
  const fetchDataByGrade = useCallback(async (grade: string) => {
    if (!BASE_URL) {
      setError("NEXT_PUBLIC_API_URL is not defined in .env");
      return;
    }

    setLoading(true);
    setError(null);
    setData([]);

    try {
      // URL API untuk mengambil daftar Subject per Grade
      const apiUrl = `${BASE_URL}/indicator-pid/grade?grade=${grade}`;
      const response = await axios.get<APIResponse>(apiUrl);

      if (response.data && Array.isArray(response.data.dataSubject)) {
        const transformedData = transformData(response.data.dataSubject);
        setData(transformedData);
        setCurrentPage(1);
      } else {
        setData([]);
        setError("Format data API tidak sesuai atau dataSubject kosong.");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      if (axios.isAxiosError(err)) {
        setError(`Gagal mengambil data: ${err.message}`);
      } else {
        setError("Terjadi kesalahan saat mengambil data.");
      }
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Dipanggil saat komponen pertama kali dimuat dan saat appliedGrade berubah
  useEffect(() => {
    fetchDataByGrade(appliedGrade);
  }, [appliedGrade, fetchDataByGrade]);

  // --- 5. Fungsi handleEdit untuk Navigasi dan Mengirim Data (PERBAIKAN PERIODE) ---
  const handleEdit = (record: SubjectPIDTable) => {
    const { original_grade, subject_id, periode } = record;

    // Pastikan nilai periode menggunakan lowercase dan underscore jika aslinya mengandung spasi atau huruf besar,
    // namun karena data dari API sudah diasumsikan seperti 'triwulan_1', kita hanya perlu
    // menggunakan encodeURIComponent untuk memastikan keamanan URL, dan menggunakan 'priode'
    // sebagai nama parameter sesuai permintaan.
    const encodedPeriode = encodeURIComponent(
      periode.toLowerCase().replace(/ /g, "_")
    );

    // Membuat URL dengan Query Parameter
    // Menggunakan 'priode' sebagai nama parameter dan nilai yang sudah di-encode
    const url = `/indicator-pid/subject?grade=${original_grade}&subject_id=${subject_id}&priode=${encodedPeriode}`;

    // Navigasi ke halaman tujuan
    router.push(url);
  };
  // -------------------------------------------------------------

  // Handler untuk Select Grade
  const handleGradeChange = (value: string) => {
    setSelectedGrade(value);
  };

  // Handler untuk tombol Apply Filter
  const handleApplyFilter = () => {
    setAppliedGrade(selectedGrade);
  };

  // Handler untuk Pagination
  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // Logika untuk menampilkan data per halaman
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const dataToShow = data.slice(startIndex, endIndex);

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      <Content
        style={{
          padding: "24px",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Header Area ... (Konten tidak diubah) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "20px",
          }}
        >
          <div>
            <Text
              style={{
                fontSize: "12px",
                color: "#666",
                marginBottom: "4px",
                display: "block",
              }}
            >
              Home /{" "}
              <span style={{ fontWeight: "bold" }}>Personal Indicator</span>
            </Text>
            <Title
              level={1}
              style={{ margin: 0, fontWeight: "bold", fontSize: "30px" }}
            >
              Personal Indicator
            </Title>
          </div>
          <Title
            level={2}
            style={{ margin: 0, color: "#333", fontSize: "24px" }}
          >
            2024-2025
          </Title>
        </div>

        <div
          style={{ borderBottom: "1px solid #f0f0f0", margin: "16px 0 24px 0" }}
        ></div>

        {/* Alert / Peringatan ... (Konten tidak diubah) */}
        <Alert
          message={
            <>
              Pastikan data pada menu <Text strong>Subject</Text> telah diisi
              terlebih dahulu. Saat ini menampilkan data untuk{" "}
              <Text strong>Grade {appliedGrade}</Text>.
            </>
          }
          type="info"
          showIcon={false}
          style={{
            marginBottom: "24px",
            backgroundColor: "#e6f7ff",
            borderColor: "#91d5ff",
            color: "#1890ff",
            padding: "12px 16px",
            borderRadius: "2px",
            fontSize: "14px",
            lineHeight: "22px",
          }}
        />

        {/* Sub Judul Subject PID ... (Konten tidak diubah) */}
        <Title level={3} style={{ marginBottom: "16px", fontSize: "20px" }}>
          Subject PID
        </Title>

        {/* Filter dan Search Bar ... (Konten tidak diubah) */}
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Input
            placeholder="Search customer 100 records..."
            prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
            style={{ width: 300, borderRadius: "2px", height: "32px" }}
          />
          <Space size={8}>
            {/* Select Grade */}
            <Select
              value={selectedGrade}
              style={{ width: 140 }}
              placeholder="Pilih Grade"
              onChange={handleGradeChange}
              disabled={loading}
            >
              {Array.from({ length: 6 }, (_, i) => i + 1).map((grade) => (
                <Option key={grade} value={String(grade)}>
                  Grade {grade}
                </Option>
              ))}
            </Select>

            {/* Tombol Apply Filter */}
            <Button
              type="primary"
              style={{
                backgroundColor: "#52c41a",
                borderColor: "#52c41a",
                borderRadius: "2px",
                height: "32px",
                fontWeight: "normal",
              }}
              onClick={handleApplyFilter}
              loading={loading}
              disabled={loading || selectedGrade === appliedGrade}
            >
              Apply Filter
            </Button>
            <Button
              icon={<DownloadOutlined />}
              style={{ height: "32px", borderRadius: "2px" }}
              disabled={loading}
            />
          </Space>
        </div>

        {/* Notifikasi Error ... (Konten tidak diubah) */}
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: "16px" }}
          />
        )}

        {/* Table / Loading */}
        <Spin spinning={loading} tip="Memuat data mata pelajaran...">
          <Table
            // 6. Gunakan getColumns(handleEdit)
            columns={getColumns(handleEdit)}
            dataSource={dataToShow}
            pagination={false}
            bordered={true}
            style={{ marginBottom: "16px" }}
            locale={{
              emptyText: error
                ? "Gagal memuat data"
                : "Tidak ada data untuk Grade ini",
            }}
          />
        </Spin>

        <div
          style={{ borderBottom: "1px solid #f0f0f0", margin: "16px 0 24px 0" }}
        ></div>

        {/* Custom Footer Pagination ... (Konten tidak diubah) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
          }}
        >
          {/* Kontrol Kiri: Row per page & Go to */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Text
              style={{ fontSize: "14px", color: "#666", fontWeight: "bold" }}
            >
              Row per page
            </Text>
            <Select
              defaultValue="10"
              style={{ width: 70 }}
              onChange={(value) => setPageSize(Number(value))}
            >
              <Option value="10">10</Option>
              <Option value="20">20</Option>
              <Option value="50">50</Option>
            </Select>
            <Text
              style={{
                fontSize: "14px",
                color: "#666",
                marginLeft: "16px",
                fontWeight: "bold",
              }}
            >
              Go to
            </Text>
            <Input
              type="number"
              value={currentPage}
              style={{
                width: 50,
                textAlign: "center",
                borderRadius: "2px",
                border: "1px solid #d9d9d9",
              }}
              min={1}
              max={Math.ceil(totalRecords / pageSize)}
              onChange={(e) => {
                const page = Number(e.target.value);
                const maxPage = Math.ceil(totalRecords / pageSize);
                if (page > 0 && page <= maxPage) {
                  setCurrentPage(page);
                }
              }}
            />
          </div>

          {/* Kontrol Kanan: Pagination */}
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalRecords}
            showSizeChanger={false}
            onChange={handlePageChange}
          />
        </div>
      </Content>
    </Layout>
  );
};

export default PersonalIndicatorPage;
