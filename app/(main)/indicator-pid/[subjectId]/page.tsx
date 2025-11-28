// src/app/personal-indicator/[subjectId]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Layout,
  Typography,
  Alert,
  Input,
  Button,
  Table,
  Space,
  Pagination,
  Spin,
  Tag,
  Select,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  DownloadOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// Ambil BASE_URL dari environment variable
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ===================================
// 1. INTERFACES
// ===================================

interface AcademicYear {
  id: number;
  year: string;
  is_ganjil: boolean;
  is_genap: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SubjectDetail {
  id: number;
  code: string;
  category: string;
  name: string;
  grade: string;
  kkm: number;
  is_ganjil: boolean;
  is_genap: boolean;
  academic_id: number;
  created_at: string;
  updated_at: string;
  academic_year: AcademicYear;
}

interface SubjectAPIResponse {
  academicYear: string;
  data: SubjectDetail[];
}

interface IndicatorDetail {
  id: number;
  subthema_indicator_pid_id: number;
  ic: number;
  indicator: string;
  domain: "PSYCHOMOTORIC" | "COGNITIVE" | "AFFECTIVE";
  created_at: string;
  updated_at: string;
}

interface SubThema {
  id: number;
  thema_indicator_pid_id: number;
  subthema: string;
  created_at: string;
  updated_at: string;
  indicators: IndicatorDetail[];
}

interface Thema {
  id: number;
  personal_indicator_id: number;
  thema: string;
  created_at: string;
  updated_at: string;
  subthemas: SubThema[];
}

interface PersonalIndicatorAPIResponse {
  id: number;
  academic_year_id: number;
  semester: "ganjil" | "genap";
  subject_id: number;
  grade: number;
  priode: string; // Misal: "triwulan_1"
  created_at: string;
  updated_at: string;
  themas: Thema[];
}

// Tipe data untuk tampilan tabel
interface IndicatorItem {
  key: string;
  indicatorId: number;
  theme: string;
  subTheme: string;
  ic: number;
  indicator: string;
  domain: "PSYCHOMOTORIC" | "COGNITIVE" | "AFFECTIVE";
}

// ===================================
// 2. HELPER FUNCTIONS
// ===================================

// Fungsi untuk mendapatkan warna Tag Domain
const getDomainColor = (domain: IndicatorItem["domain"]) => {
  switch (domain) {
    case "PSYCHOMOTORIC":
      return "blue";
    case "COGNITIVE":
      return "green";
    case "AFFECTIVE":
      return "red";
    default:
      return "default";
  }
};

// Fungsi untuk meratakan (flatten) data API dari nested structure
const flattenIndicators = (
  apiResponse: PersonalIndicatorAPIResponse[]
): IndicatorItem[] => {
  const flatList: IndicatorItem[] = [];

  apiResponse.forEach((personalIndicator) => {
    personalIndicator.themas.forEach((themaBlock) => {
      themaBlock.subthemas.forEach((subThemaBlock) => {
        subThemaBlock.indicators.forEach((item) => {
          flatList.push({
            key: String(item.id),
            indicatorId: item.id,
            theme: themaBlock.thema,
            subTheme: subThemaBlock.subthema,
            ic: item.ic,
            indicator: item.indicator,
            domain: item.domain,
          });
        });
      });
    });
  });
  return flatList;
};

// ===================================
// 3. KOMPONEN UTAMA
// ===================================

const PersonalIndicatorListBySubjectPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  // 3.1. Ambil Parameter dari URL
  const subjectId = params.subjectId as string;
  const grade = searchParams.get("grade") || "N/A";
  const urlPeriode = searchParams.get("priode") || "N/A";

  // State tambahan untuk data Subject
  const [currentSubjectName, setCurrentSubjectName] = useState(
    "Memuat Mata Pelajaran..."
  );
  const [academicYear, setAcademicYear] = useState("Memuat Tahun Ajaran...");

  const [periodeDisplay, setPeriodeDisplay] = useState(
    urlPeriode.replace(/_/g, " ").toUpperCase()
  );
  const [data, setData] = useState<IndicatorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 3.2. LOGIKA FETCH DATA SUBJECT (BARU)
  const fetchSubjects = useCallback(async () => {
    if (!BASE_URL) return;

    try {
      const apiUrl = `${BASE_URL}/subjects`;
      const response = await axios.get<SubjectAPIResponse>(apiUrl);

      if (response.data && response.data.data) {
        // PERBAIKAN: Cari subject berdasarkan subjectId dari URL (string)
        // Gunakan konversi ke string untuk perbandingan yang aman: String(subj.id) === subjectId
        const foundSubject = response.data.data.find(
          (subj) => String(subj.id) === subjectId
        );

        if (foundSubject) {
          setCurrentSubjectName(foundSubject.name);
        } else {
          setCurrentSubjectName("Subject Tidak Ditemukan");
        }

        // Ambil Tahun Akademik dari API Response
        setAcademicYear(response.data.academicYear);
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setCurrentSubjectName("Gagal Memuat Subject");
      setAcademicYear("Gagal Memuat Tahun Ajaran");
    }
  }, [subjectId]); // subjectId adalah string dari URL parameter

  // 3.3. LOGIKA FETCH DATA INDICATOR
  const fetchData = useCallback(async () => {
    if (
      !BASE_URL ||
      grade === "N/A" ||
      !subjectId || // Menggunakan !subjectId untuk mengecek undefined/null/string kosong
      urlPeriode === "N/A"
    ) {
      if (!BASE_URL) setError("NEXT_PUBLIC_API_URL is not defined in .env");
      // Memastikan subjectId ada dan bukan string "undefined"
      else setError("Parameter Grade, Subject ID, atau Periode tidak lengkap.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setData([]);

    try {
      const apiUrl = `${BASE_URL}/indicator-pid/subject?grade=${grade}&subject_id=${subjectId}&priode=${urlPeriode}`;

      const response = await axios.get<PersonalIndicatorAPIResponse[]>(apiUrl);

      if (response.data && response.data.length > 0) {
        // SORTASI DATA UNTUK MEMASTIKAN ROW SPAN BEKERJA DENGAN BENAR
        const transformedData = flattenIndicators(response.data);
        const sortedData = transformedData.sort((a, b) => {
          if (a.theme.localeCompare(b.theme) !== 0) {
            return a.theme.localeCompare(b.theme);
          }
          if (a.subTheme.localeCompare(b.subTheme) !== 0) {
            return a.subTheme.localeCompare(b.subTheme);
          }
          return a.ic - b.ic;
        });

        setData(sortedData);
        // Update display periode dari data API
        setPeriodeDisplay(
          response.data[0].priode.replace(/_/g, " ").toUpperCase()
        );
      } else {
        setData([]);
        setError(
          `Tidak ada data Personal Indicator ditemukan untuk subjek ini (Grade ${grade}, ${urlPeriode}).`
        );
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
  }, [subjectId, grade, urlPeriode]);

  useEffect(() => {
    // Fetch Subject data and Academic Year first
    fetchSubjects();

    // Then fetch the main indicator data
    if (subjectId && grade && urlPeriode !== "N/A") {
      fetchData();
    }
  }, [subjectId, grade, urlPeriode, fetchData, fetchSubjects]);

  // 3.4. Filter dan Pagination
  const filteredData = data.filter(
    (item) =>
      item.theme.toLowerCase().includes(searchText.toLowerCase()) ||
      item.subTheme.toLowerCase().includes(searchText.toLowerCase()) ||
      item.indicator.toLowerCase().includes(searchText.toLowerCase())
  );
  const totalRecords = filteredData.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const dataToShow = filteredData.slice(startIndex, endIndex);

  // 3.5. LOGIKA ROW SPAN (Merged Cells)

  /**
   * Menghitung nilai rowSpan untuk kolom Theme dan SubTheme.
   */
  const getMergedCellProps = (
    dataList: IndicatorItem[],
    dataIndex: keyof IndicatorItem,
    record: IndicatorItem,
    index: number
  ) => {
    // Hitung rowSpan untuk Theme
    if (dataIndex === "theme") {
      const prevRecord = dataList[index - 1];
      if (index > 0 && record.theme === prevRecord.theme) {
        return { rowSpan: 0 };
      } else {
        let rowSpan = 1;
        for (let i = index + 1; i < dataList.length; i++) {
          if (dataList[i].theme === record.theme) {
            rowSpan++;
          } else {
            break;
          }
        }
        return { rowSpan };
      }
    }

    // Hitung rowSpan untuk SubTheme
    if (dataIndex === "subTheme") {
      const prevRecord = dataList[index - 1];
      if (
        index > 0 &&
        record.theme === prevRecord.theme &&
        record.subTheme === prevRecord.subTheme
      ) {
        return { rowSpan: 0 };
      } else {
        let rowSpan = 1;
        for (let i = index + 1; i < dataList.length; i++) {
          if (
            dataList[i].theme === record.theme &&
            dataList[i].subTheme === record.subTheme
          ) {
            rowSpan++;
          } else {
            break;
          }
        }
        return { rowSpan };
      }
    }

    return { rowSpan: 1 }; // Default untuk kolom lain
  };

  // 3.6. DEFINISI KOLOM (Menggunakan useMemo)
  const columns: ColumnsType<IndicatorItem> = React.useMemo(() => {
    const dataForMerge = filteredData;

    return [
      {
        title: "Theme",
        dataIndex: "theme",
        key: "theme",
        onCell: (record, index) => ({
          ...getMergedCellProps(dataForMerge, "theme", record, index!),
          style: { borderRight: "1px solid #f0f0f0" },
        }),
        onHeaderCell: () => ({
          style: {
            backgroundColor: "#f0f0f0",
            fontWeight: "bold",
            borderRight: "1px solid #f0f0f0",
          },
        }),
      },
      {
        title: "Sub Theme",
        dataIndex: "subTheme",
        key: "subTheme",
        onCell: (record, index) => ({
          ...getMergedCellProps(dataForMerge, "subTheme", record, index!),
          style: { borderRight: "1px solid #f0f0f0" },
        }),
        onHeaderCell: () => ({
          style: {
            backgroundColor: "#f0f0f0",
            fontWeight: "bold",
            borderRight: "1px solid #f0f0f0",
          },
        }),
      },
      {
        title: "IC",
        dataIndex: "ic",
        key: "ic",
        align: "center",
        width: 50,
        sorter: (a, b) => a.ic - b.ic,
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
        title: "Indicator",
        dataIndex: "indicator",
        key: "indicator",
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
        title: "Domain",
        dataIndex: "domain",
        key: "domain",
        align: "center",
        width: 130,
        render: (domain: IndicatorItem["domain"]) => (
          <Tag color={getDomainColor(domain)} style={{ fontWeight: "bold" }}>
            {domain}
          </Tag>
        ),
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
        width: 80,
        render: (_, record) => (
          <Space size={4}>
            <Button
              icon={<EditOutlined />}
              type="text"
              style={{ padding: "0 4px", color: "#1890ff" }}
              onClick={() => console.log("Edit Indicator", record)}
            />
          </Space>
        ),
        onHeaderCell: () => ({
          style: {
            backgroundColor: "#f0f0f0",
            fontWeight: "bold",
            borderRight: "1px solid #f0f0f0",
          },
        }),
        onCell: () => ({ style: { borderRight: "1px solid #f0f0f0" } }),
      },
    ];
  }, [filteredData]);

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
        {/* Header dan Breadcrumb */}
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
              <span
                onClick={() => router.back()}
                style={{ cursor: "pointer", color: "#1890ff" }}
              >
                Personal Indicator List
              </span>{" "}
              / <span style={{ fontWeight: "bold" }}>List by Subject</span>
            </Text>
            <Title
              level={1}
              style={{ margin: 0, fontWeight: "bold", fontSize: "30px" }}
            >
              Personal Indicator List by Subject
            </Title>
          </div>
          {/* Menggunakan Tahun Akademik dari API */}
          <Title
            level={2}
            style={{ margin: 0, color: "#333", fontSize: "24px" }}
          >
            {academicYear}
          </Title>
        </div>
        <div
          style={{ borderBottom: "1px solid #f0f0f0", margin: "16px 0 24px 0" }}
        ></div>

        {/* Detail Subject */}
        <div style={{ display: "flex", gap: "30px", marginBottom: "24px" }}>
          {/* Menggunakan Nama Subject dari API */}
          <Text style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}>
            Subject:{" "}
            <span style={{ fontWeight: "normal" }}>{currentSubjectName}</span>
          </Text>
          <Text style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}>
            Grade: <span style={{ fontWeight: "normal" }}>{grade}</span>
          </Text>
          <Text style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}>
            Periode:{" "}
            <span style={{ fontWeight: "normal" }}>{periodeDisplay}</span>
          </Text>
        </div>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: "16px" }}
          />
        )}

        {/* Filter dan Search Bar */}
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Input
            placeholder="Search indicator records..."
            prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
            style={{ width: 300, borderRadius: "2px", height: "32px" }}
            onChange={(e) => setSearchText(e.target.value)}
            value={searchText}
            disabled={loading}
          />
          <Space size={8}>
            <Select
              placeholder="Pilih Tema (Dummy)"
              style={{ width: 140 }}
              disabled={loading}
            >
              <Option value="T1">Tema 1</Option>
              <Option value="T2">Tema 2</Option>
            </Select>

            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
              style={{
                height: "32px",
                borderRadius: "2px",
                borderColor: "#faad14",
                color: "#faad14",
              }}
              disabled={loading}
            >
              Back
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{
                backgroundColor: "#52c41a",
                borderColor: "#52c41a",
                borderRadius: "2px",
                height: "32px",
                fontWeight: "normal",
              }}
              onClick={() => console.log("Add New Indicator")}
              disabled={loading || data.length === 0}
            >
              Add New
            </Button>
            <Button
              icon={<DownloadOutlined />}
              style={{ height: "32px", borderRadius: "2px" }}
              disabled={loading}
            />
          </Space>
        </div>

        {/* Tabel Indikator */}
        <Spin spinning={loading} tip="Memuat daftar indikator...">
          <Table
            columns={columns}
            dataSource={dataToShow}
            pagination={false}
            bordered={true}
            style={{ marginBottom: "16px" }}
            locale={{
              emptyText: error
                ? "Gagal memuat data"
                : "Tidak ada indikator yang ditemukan untuk mata pelajaran ini.",
            }}
          />
        </Spin>

        {/* Custom Footer Pagination */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Text
              style={{ fontSize: "14px", color: "#666", fontWeight: "bold" }}
            >
              Row per page
            </Text>
            <Select
              defaultValue="10"
              style={{ width: 70 }}
              onChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
              disabled={loading}
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
                if (page > 0 && page <= Math.ceil(totalRecords / pageSize)) {
                  setCurrentPage(page);
                }
              }}
              disabled={loading}
            />
          </div>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalRecords}
            showSizeChanger={false}
            onChange={(page) => setCurrentPage(page)}
            disabled={loading}
          />
        </div>
      </Content>
    </Layout>
  );
};

export default PersonalIndicatorListBySubjectPage;
