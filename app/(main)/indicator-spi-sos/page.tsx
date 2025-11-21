"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Row,
  Col,
  Input,
  Select,
  Button,
  Card,
  Space,
  Breadcrumb,
} from "antd";
import { SearchOutlined, DownloadOutlined } from "@ant-design/icons";
import Head from "next/head";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const GET_API_ENDPOINT = `${API_URL}/indicator-spi-sos`;
const POST_API_ENDPOINT = `${API_URL}/indicator-spi-sos`;
// Endpoint PUT akan menjadi: {{base_url}}/indicator-spi-sos/:id

// --- 1. TIPE DATA & CONSTANTA BARU ---

interface AttitudeIndicator {
  id: number | null; // Nullable untuk entri baru
  grade: number; // Menggunakan number sesuai API
  spiritual: string;
  social: string;
  semester: string;
  academicYear?: string; // Opsional
}

// Grade secara default terdiri dari grade 1 - 6
const gradeOptions = [1, 2, 3, 4, 5, 6].map((g) => ({
  label: `Grade ${g}`,
  value: g,
}));

// Hapus semua data dummy

// --- 2. KOMPONEN UTAMA ---

const { Title } = Typography;
const { TextArea } = Input;

interface FilterState {
  grade: number; // Default grade 1
}

const SpiSosPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterState>({ grade: 1 });
  const [currentIndicator, setCurrentIndicator] =
    useState<AttitudeIndicator | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [displayYear, setDisplayYear] = useState<string>("Tahun Akademik");
  const [displaySemester, setDisplaySemester] = useState<string>("Semester");

  // State untuk form edit/create
  const [formSpiritual, setFormSpiritual] = useState<string>("");
  const [formSocial, setFormSocial] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState<boolean>(false); // Mode edit atau create

  // Mengambil data dari API berdasarkan filter grade
  const fetchIndicatorData = useCallback(async () => {
    if (!API_URL) {
      toast.error("API URL belum dikonfigurasi di .env");
      return;
    }

    setIsLoading(true);
    setCurrentIndicator(null); // Reset data saat fetching
    setFormSpiritual("");
    setFormSocial("");
    setIsEditMode(false); // Default ke mode create

    try {
      const response = await axios.get(GET_API_ENDPOINT);
      const { academicYear, semester, data } = response.data;

      setDisplayYear(academicYear || "N/A");
      setDisplaySemester(semester || "N/A");

      const indicatorData = data.find(
        (item: any) => item.grade === filter.grade
      );

      if (indicatorData) {
        // Data Ditemukan (Mode Edit)
        const formattedData: AttitudeIndicator = {
          id: indicatorData.id,
          grade: indicatorData.grade,
          spiritual: indicatorData.spiritual,
          social: indicatorData.social,
          semester: indicatorData.semester,
          academicYear: academicYear,
        };
        setCurrentIndicator(formattedData);
        setFormSpiritual(indicatorData.spiritual);
        setFormSocial(indicatorData.social);
        setIsEditMode(true); // Masuk ke mode edit
        toast.success(`Data indikator Grade ${filter.grade} berhasil dimuat.`);
      } else {
        // Data Tidak Ditemukan (Mode Create)
        setCurrentIndicator(null);
        setFormSpiritual(""); // Kosongkan form untuk create baru
        setFormSocial("");
        setIsEditMode(false);
        toast.warn(
          `Data indikator Grade ${filter.grade} belum ada. Silakan buat baru.`
        );
      }
    } catch (error) {
      console.error("Error fetching indicator data:", error);
      toast.error("Gagal memuat data indikator dari API.");
    } finally {
      setIsLoading(false);
    }
  }, [filter.grade]);

  // Handler saat tombol 'Apply Filter' ditekan
  const applyFilter = () => {
    fetchIndicatorData();
  };

  useEffect(() => {
    // Jalankan fetch awal saat komponen dimuat atau filter.grade berubah
    fetchIndicatorData();
  }, [fetchIndicatorData]);

  const handleGradeChange = (value: number) => {
    setFilter((prev) => ({ ...prev, grade: value }));
  };

  // Handler untuk menyimpan/mengubah data
  const handleSubmit = async () => {
    if (!formSpiritual || !formSocial) {
      toast.error("Indikator Spiritual dan Sosial tidak boleh kosong.");
      return;
    }

    const payload = {
      grade: filter.grade,
      spiritual: formSpiritual,
      social: formSocial,
    };

    setIsLoading(true);
    try {
      let response;
      if (isEditMode && currentIndicator?.id) {
        // Mode EDIT (PUT)
        response = await axios.put(
          `${POST_API_ENDPOINT}/${currentIndicator.id}`,
          payload
        );
      } else {
        // Mode CREATE (POST)
        response = await axios.post(POST_API_ENDPOINT, payload);
      }

      // Tampilkan notifikasi sukses
      toast.success(response.data.message || "Data berhasil disimpan.");

      // Refresh data setelah berhasil disimpan/diubah
      fetchIndicatorData();
    } catch (error: any) {
      console.error("Error submitting data:", error);
      const errorMessage =
        error.response?.data?.message || "Gagal menyimpan data ke API.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Spiritual and Social Attitudes</title>
      </Head>
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

      {/* 1. Breadcrumb */}
      <Breadcrumb
        items={[{ title: "Home" }, { title: "Spiritual and Social Attitudes" }]}
        style={{ marginBottom: "16px" }}
      />

      {/* 2. Title dan Tahun Akademik */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "16px 0 24px 0",
        }}
      >
        <Title level={1} style={{ margin: 0 }}>
          Spiritual and Social Attitudes
        </Title>
        <Title level={3} style={{ color: "#888", margin: 0 }}>
          <span style={{ fontWeight: 700, color: "#333" }}>{displayYear}</span>{" "}
          ({displaySemester})
        </Title>
      </div>

      {/* 3. Toolbar: Filter */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end", // Posisikan filter di kanan
          marginBottom: "24px",
        }}
      >
        <Space>
          <Select
            value={filter.grade}
            placeholder="Pilih Grade"
            onChange={handleGradeChange}
            options={gradeOptions}
            style={{ minWidth: 120 }}
            dropdownStyle={{ border: "none" }}
            disabled={isLoading}
          />
          <Button
            type="primary"
            onClick={applyFilter}
            loading={isLoading}
            style={{
              backgroundColor: "#1890ff",
              borderColor: "#1890ff",
            }}
          >
            Apply Filter
          </Button>
          <Button
            icon={<DownloadOutlined style={{ fontSize: 16 }} />}
            style={{
              border: "1px solid #d9d9d9",
              backgroundColor: "#fff",
            }}
            disabled={isLoading}
          />
        </Space>
      </div>

      {/* 4. Content Utama - Card Container */}
      <div
        style={{
          border: "1px solid #f0f0f0",
          borderRadius: "4px",
          padding: "24px",
          backgroundColor: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <Title level={4} style={{ marginBottom: "24px", textAlign: "center" }}>
          {isEditMode
            ? `Edit Indikator Grade ${filter.grade}`
            : `Buat Indikator Grade ${filter.grade}`}
        </Title>

        {/* --- CARD SPIRITUAL (Full Width) --- */}
        <Card
          title={
            <Title level={4} style={{ margin: 0 }}>
              Spiritual
            </Title>
          }
          bordered={true}
          size="small"
          style={{
            borderRadius: 4,
            boxShadow: "none",
            border: "1px solid #f0f0f0",
            marginBottom: "24px",
          }}
          headStyle={{ backgroundColor: "#fafafa" }}
        >
          <TextArea
            rows={6}
            value={formSpiritual}
            onChange={(e) => setFormSpiritual(e.target.value)}
            placeholder={`Masukkan indikator spiritual untuk Grade ${filter.grade}...`}
            style={{ resize: "none" }}
            disabled={isLoading}
          />
        </Card>

        {/* --- CARD SOCIAL (Full Width) --- */}
        <Card
          title={
            <Title level={4} style={{ margin: 0 }}>
              Social
            </Title>
          }
          bordered={true}
          size="small"
          style={{
            borderRadius: 4,
            boxShadow: "none",
            border: "1px solid #f0f0f0",
          }}
          headStyle={{ backgroundColor: "#fafafa" }}
        >
          <TextArea
            rows={6}
            value={formSocial}
            onChange={(e) => setFormSocial(e.target.value)}
            placeholder={`Masukkan indikator sosial untuk Grade ${filter.grade}...`}
            style={{ resize: "none" }}
            disabled={isLoading}
          />
        </Card>

        {/* TOMBOL SUBMIT */}
        <Row justify="start" style={{ marginTop: 24 }}>
          <Col>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={isLoading}
              style={{
                backgroundColor: "#52c41a", // Warna Hijau untuk Submit
                borderColor: "#52c41a",
                fontWeight: 600,
              }}
              disabled={isLoading}
            >
              {isEditMode ? "Update Data" : "Simpan Data Baru"}
            </Button>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default SpiSosPage;
