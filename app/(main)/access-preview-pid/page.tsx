"use client";
// AccessPreviewPID.tsx

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Switch,
  Tag,
  Row,
  Col,
  Typography,
  Space,
  Select,
  Pagination,
  Spin,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const { Title, Text } = Typography;
const { Option } = Select;

// --- KONSTANTA GLOBAL ---
const INITIAL_PAGE_SIZE = 10;
const INITIAL_CURRENT_PAGE = 1;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ===================================
// 1. INTERFACE API & DATA
// ===================================

/**
 * Interface untuk struktur data laporan dari API
 */
interface ApiReportRecord {
  pid_assessment_id: number | null;
  classroom_id: number;
  code: string;
  grade: string; // Grade dari API adalah string
  class_name: string;
  status: "true" | "false" | "-"; // Status dari API adalah string
  publish: "true" | "false" | "-"; // Publish dari API adalah string
}

/**
 * Interface untuk data yang akan digunakan di komponen (dipetakan dari API)
 */
interface ReportRecord {
  key: string; // Digunakan Ant Design Table
  id: number | null; // pid_assessment_id
  code: string;
  grade: number; // Diubah menjadi number
  className: string;
  status: "Open" | "Closed" | "Not Assigned"; // Status untuk UI
  isPublished: boolean | null; // Null jika belum di-assign
  rawRecord: ApiReportRecord; // Simpan data mentah
}

// ===================================
// 2. KOMPONEN UTAMA
// ===================================

const AccessPreviewPID: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState<ReportRecord[]>([]);
  const [filteredData, setFilteredData] = useState<ReportRecord[]>([]);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(INITIAL_CURRENT_PAGE);
  const [pageSize, setPageSize] = useState(INITIAL_PAGE_SIZE);

  // --- Utility: Mapping Data API ke Data UI ---
  const mapApiDataToReportRecord = (apiData: ApiReportRecord): ReportRecord => {
    const statusMap: Record<ApiReportRecord["status"], ReportRecord["status"]> =
      {
        true: "Open",
        false: "Closed",
        "-": "Not Assigned",
      };

    const isPublished: boolean | null =
      apiData.publish === "true"
        ? true
        : apiData.publish === "false"
        ? false
        : null;

    return {
      key: apiData.classroom_id.toString(), // Gunakan classroom_id sebagai key sementara
      id: apiData.pid_assessment_id,
      code: apiData.code,
      grade: parseInt(apiData.grade) || 0,
      className: apiData.class_name,
      status: statusMap[apiData.status],
      isPublished: isPublished,
      rawRecord: apiData,
    };
  };

  // --- API: Fetch Data ---
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/pid-assignments`);
      const apiData: ApiReportRecord[] = response.data;
      const mappedData = apiData.map(mapApiDataToReportRecord);

      setAllData(mappedData);
      setFilteredData(mappedData);
      toast.success("Data laporan berhasil dimuat! 👍");
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      toast.error("Gagal memuat data laporan dari API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Handlers: Pencarian ---

  const handleSearch = useCallback(
    (value: string, dataToFilter: ReportRecord[]) => {
      setSearchText(value);
      setCurrentPage(1); // Reset halaman ke 1 setelah filter

      if (!value) {
        setFilteredData(allData);
        return;
      }

      const filtered = dataToFilter.filter(
        (record) =>
          record.className.toLowerCase().includes(value.toLowerCase()) ||
          record.code.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredData(filtered);
    },
    [allData]
  );

  // Trigger search on data change (initial load)
  useEffect(() => {
    handleSearch(searchText, allData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allData]);

  // --- API: Mengubah Status Akses (Open/Close) ---

  const handleAccessChange = useCallback(
    async (record: ReportRecord, open: boolean) => {
      if (record.id === null) {
        toast.warn(
          `Akses untuk ${record.className} belum di-assign PID. Tidak dapat diubah.`
        );
        return;
      }
      const endpoint = open
        ? `${API_URL}/pid-assignment/open`
        : `${API_URL}/pid-assignment/close`;
      const action = open ? "Buka Akses" : "Tutup Akses";
      const newStatus: ReportRecord["status"] = open ? "Open" : "Closed";

      try {
        setLoading(true);
        await axios.post(endpoint, { pid_assessment_id: record.id });

        // Update state lokal setelah sukses
        setAllData((prevData) =>
          prevData.map((item) =>
            item.key === record.key ? { ...item, status: newStatus } : item
          )
        );
        toast.success(`${action} untuk ${record.className} berhasil! 🎉`);
      } catch (error) {
        console.error(`Gagal ${action}:`, error);
        toast.error(`Gagal ${action} untuk ${record.className}.`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // --- API: Mengubah Status Publish ---

  const handlePublishChange = useCallback(
    async (record: ReportRecord, published: boolean) => {
      if (record.id === null) {
        toast.warn(
          `Publish untuk ${record.className} belum di-assign PID. Tidak dapat diubah.`
        );
        return;
      }
      const action = published ? "Publish" : "Unpublish";

      try {
        setLoading(true);
        await axios.post(`${API_URL}/pid-assignment/publish`, {
          pid_assessment_id: record.id,
          status_publish: published,
        });

        // Update state lokal setelah sukses
        setAllData((prevData) =>
          prevData.map((item) =>
            item.key === record.key ? { ...item, isPublished: published } : item
          )
        );
        toast.success(`${action} untuk ${record.className} berhasil! 🚀`);
      } catch (error) {
        console.error(`Gagal ${action}:`, error);
        toast.error(`Gagal ${action} untuk ${record.className}.`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // --- Logika Tampilan Data (Pagination) ---

  /**
   * Menghitung data yang akan ditampilkan berdasarkan halaman dan ukuran.
   */
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    // Gunakan data hasil filter (filteredData) sebagai sumber
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // --- Definisi Kolom Tabel Ant Design ---

  const columns: ColumnsType<ReportRecord> = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: "Grade",
      dataIndex: "grade",
      key: "grade",
      sorter: (a, b) => a.grade - b.grade,
    },
    {
      title: "Classroom Name",
      dataIndex: "className",
      key: "className",
      sorter: (a, b) => a.className.localeCompare(b.className),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: ReportRecord["status"]) => (
        <Tag
          color={
            status === "Open"
              ? "green"
              : status === "Closed"
              ? "red"
              : "default"
          }
          style={{ minWidth: 90, textAlign: "center" }}
        >
          {status}
        </Tag>
      ),
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        // Cek apakah data sudah di-assign (punya PID)
        const isAssigned = record.id !== null;

        if (!isAssigned) {
          // Ganti Tag "Add Access" dengan null (kosong)
          return null;
        }

        return (
          <Space size={8}>
            {record.status === "Open" ? (
              <Button
                type="primary"
                danger // Warna merah untuk Close
                onClick={() => handleAccessChange(record, false)}
                style={{ minWidth: 100 }}
                loading={loading}
              >
                Close Access
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={() => handleAccessChange(record, true)}
                style={{
                  minWidth: 100,
                  backgroundColor: "#52c41a", // Warna Hijau untuk Open Access
                  borderColor: "#52c41a",
                }}
                loading={loading}
              >
                Open Access
              </Button>
            )}
            <Button
              onClick={() => console.log("Preview:", record.code)}
              type="primary"
              style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}
            >
              Preview
            </Button>
          </Space>
        );
      },
    },
    {
      title: "Publish",
      dataIndex: "isPublished",
      key: "isPublished",
      render: (isPublished: boolean | null, record) => (
        <Switch
          checked={isPublished ?? false} // Gunakan false jika null
          onChange={(checked) => handlePublishChange(record, checked)}
          disabled={record.id === null} // Nonaktifkan jika belum di-assign
        />
      ),
    },
  ];

  // --- Rendering Utama ---
  return (
    <Spin spinning={loading} tip="Memuat data...">
      <div style={{ padding: 24, minHeight: "100vh", backgroundColor: "#fff" }}>
        <ToastContainer position="top-right" autoClose={3000} />
        {/* --- Header Halaman --- */}
        <Text type="secondary" style={{ fontSize: 12 }}>
          Home / Academic Report / PID Access & Preview
        </Text>

        <Row
          justify="space-between"
          align="middle"
          style={{ margin: "8px 0 20px 0" }}
        >
          <Col>
            <Title level={2} style={{ margin: 0, fontWeight: 500 }}>
              PID Report Access & Preview
            </Title>
          </Col>
          <Col>
            <Title level={4} style={{ margin: 0, fontWeight: 400 }}>
              2024-2025 (Ganjil)
            </Title>
          </Col>
        </Row>

        {/* --- Filter & Search Bar --- */}
        <Row style={{ marginBottom: 20 }}>
          <Col span={24}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search customer records..."
              value={searchText}
              onChange={(e) => handleSearch(e.target.value, allData)}
              onPressEnter={() => handleSearch(searchText, allData)}
              style={{ maxWidth: 260, borderRadius: 6 }}
            />
          </Col>
        </Row>

        {/* --- Tabel Data --- */}
        <Table<ReportRecord>
          columns={columns}
          dataSource={paginatedData.length > 0 ? paginatedData : []}
          pagination={false} // Menonaktifkan pagination default AntD
          bordered={false}
          style={{ marginBottom: 16 }}
        />

        {/* --- Custom Pagination Footer --- */}
        <Row justify="space-between" align="middle">
          {/* Kontrol Jumlah Baris & Go To */}
          <Col>
            <Space>
              <Text>Row per page</Text>
              <Select
                value={pageSize}
                style={{ width: 60 }}
                onChange={(value) => {
                  setPageSize(value);
                  setCurrentPage(1); // Reset ke halaman 1
                }}
              >
                <Option value={10}>10</Option>
                <Option value={20}>20</Option>
                <Option value={50}>50</Option>
              </Select>
              <Text>Go to</Text>
              <Input
                value={currentPage}
                style={{ width: 50 }}
                onChange={(e) => {
                  const num = parseInt(e.target.value);
                  const totalRecords = filteredData.length;
                  const maxPage = Math.ceil(totalRecords / pageSize);
                  if (!isNaN(num) && num >= 1 && num <= maxPage) {
                    setCurrentPage(num);
                  } else if (e.target.value === "") {
                    // Izinkan input kosong sementara
                    setCurrentPage(1);
                  }
                }}
                onBlur={() => {
                  const totalRecords = filteredData.length;
                  const maxPage = Math.ceil(totalRecords / pageSize);
                  if (currentPage > maxPage) setCurrentPage(maxPage);
                  if (currentPage < 1) setCurrentPage(1);
                }}
              />
            </Space>
          </Col>

          {/* Navigasi Halaman Utama */}
          <Col>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredData.length}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
              itemRender={(page, type, originalElement) => {
                const lastPage = Math.ceil(filteredData.length / pageSize);

                if (type === "page") {
                  const isBoundary = page === 1 || page === lastPage;
                  const isNearCurrent =
                    page >= currentPage - 2 && page <= currentPage + 2;

                  if (isBoundary || isNearCurrent) {
                    return (
                      <Button
                        key={page}
                        type={page === currentPage ? "primary" : "default"}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  }
                  if (page === 2 && currentPage > 4) {
                    return (
                      <span key="ellipsis-start" style={{ padding: "0 8px" }}>
                        ...
                      </span>
                    );
                  }
                  if (page === lastPage - 1 && currentPage < lastPage - 3) {
                    return (
                      <span key="ellipsis-end" style={{ padding: "0 8px" }}>
                        ...
                      </span>
                    );
                  }
                  return null;
                }
                return originalElement;
              }}
            />
          </Col>
        </Row>
      </div>
    </Spin>
  );
};

export default AccessPreviewPID;
