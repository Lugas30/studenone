"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Typography,
  Row,
  Col,
  Select,
  Button,
  Input,
  Table,
  Card,
  Space,
  Spin,
} from "antd";
import type { TableProps } from "antd";
import { SearchOutlined, CloseCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const { Title, Text } = Typography;

// --- Konfigurasi API ---
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const api = axios.create({
  baseURL: BASE_URL,
});

// --- 1. TIPE DATA (Interfaces) ---

interface AcademicYear {
  id: number;
  year: string;
  is_active: boolean;
}

interface Classroom {
  id: number;
  grade: string;
  section: string;
  code: string; // Contoh: P1A, P2B
}

interface StudentAPI {
  id: number;
  nis: string;
  fullname: string;
  grade: string;
  academic_year: AcademicYear;
}

interface Student extends StudentAPI {
  key: string;
  currentClass: string;
}

interface PlacementData {
  id: number; // ID Siswa
  nis: string;
  fullname: string;
  key: string;
}

// UBAH: Menggunakan nama yang berbeda untuk menghindari konflik saat menggunakan null
type GradeOptionType = "1" | "2" | "3" | "4" | "5" | "6";

// ---------------------------------------------------
// 2. DEFINISI KOLOM TABLE
// ---------------------------------------------------

const studentColumns: TableProps<Student>["columns"] = [
  {
    title: "NIS",
    dataIndex: "nis",
    key: "nis",
    width: "30%",
    sorter: (a: Student, b: Student) => a.nis.localeCompare(b.nis),
  },
  {
    title: "Student Name",
    dataIndex: "fullname",
    key: "fullname",
    sorter: (a: Student, b: Student) => a.fullname.localeCompare(b.fullname),
  },
  {
    title: "Grade",
    dataIndex: "grade",
    key: "grade",
    width: "20%",
  },
];

const placementColumns = (
  handleRemove: (nis: string) => void
): TableProps<PlacementData>["columns"] => [
  {
    title: "NIS",
    dataIndex: "nis",
    key: "nis",
    width: "30%",
  },
  {
    title: "Student Name",
    dataIndex: "fullname",
    key: "fullname",
  },
  {
    title: "",
    key: "action",
    width: "15%",
    render: (text: string, record: PlacementData) => (
      <Button
        danger
        type="text"
        icon={<CloseCircleOutlined style={{ fontSize: "18px" }} />}
        onClick={() => handleRemove(record.nis)}
      />
    ),
  },
];

// ---------------------------------------------------
// 3. KOMPONEN UTAMA
// ---------------------------------------------------

const StudentPlacement: React.FC = () => {
  // --- State Management ---
  const [loading, setLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState("Memuat...");

  // UBAH: Default null
  const [currentGrade, setCurrentGrade] = useState<GradeOptionType | null>(
    null
  );
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  const [availableClasses, setAvailableClasses] = useState<Classroom[]>([]);
  // SUDAH: Default null
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedClassName, setSelectedClassName] =
    useState<string>("Pilih Kelas"); // SUDAH: Default "Pilih Kelas"

  const [placementData, setPlacementData] = useState<PlacementData[]>([]);
  const [selectedStudentKeys, setSelectedStudentKeys] = useState<React.Key[]>(
    []
  );

  const [searchStudent, setSearchStudent] = useState<string>("");
  const [searchPlacement, setSearchPlacement] = useState<string>("");

  // --- Fetch Data Hooks ---

  const fetchClassrooms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/classrooms");
      const data = response.data.data as Classroom[];
      setAvailableClasses(data);

      const year =
        response.data.academicYear || "Tahun Akademik Tidak Ditemukan";
      setAcademicYear(year);

      // PASTIKAN Class ID dan Class Name kosong saat dimuat/refresh
      setSelectedClassId(null);
      setSelectedClassName("Pilih Kelas");
    } catch (error) {
      toast.error("❌ Gagal memuat data Kelas atau Tahun Akademik.");
      console.error("Error fetching classrooms:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // UBAH: Terima GradeOptionType | null
  const fetchStudents = useCallback(async (grade: GradeOptionType | null) => {
    if (!grade) {
      // TAMBAH: Pengecekan jika grade null
      setAllStudents([]);
      setPlacementData([]);
      setSelectedStudentKeys([]);
      return;
    }

    setLoading(true);
    setAllStudents([]);
    setPlacementData([]);
    setSelectedStudentKeys([]);

    try {
      const response = await api.get(
        `/pag/students/status-grade-student/${grade}`
      );
      const fetchedStudents: Student[] = response.data.data.map(
        (s: StudentAPI) => ({
          id: s.id,
          nis: s.nis || "N/A",
          fullname: s.fullname,
          currentClass: `Grade ${s.grade}`,
          grade: s.grade,
          key: s.id.toString(),
        })
      );

      setAllStudents(fetchedStudents);
      toast.info(
        `Berhasil memuat ${fetchedStudents.length} siswa Grade ${grade}.`
      );
    } catch (error) {
      toast.error(`❌ Gagal memuat data siswa Grade ${grade}.`);
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  useEffect(() => {
    // TAMBAH: Hanya panggil fetchStudents jika currentGrade BUKAN null
    if (currentGrade !== null) {
      fetchStudents(currentGrade);
    } else {
      // Kosongkan daftar siswa dan penempatan jika Grade belum dipilih
      setAllStudents([]);
      setPlacementData([]);
      setSelectedStudentKeys([]);
    }
  }, [currentGrade, fetchStudents]);

  // --- Logic Penempatan Siswa (UI Side) ---

  const handleAddToClass = () => {
    if (!selectedClassId) {
      toast.error("Pilih kelas tujuan terlebih dahulu!");
      return;
    }
    if (selectedStudentKeys.length === 0) {
      toast.warning("Silakan pilih minimal satu siswa untuk ditambahkan.");
      return;
    }

    const studentsToPlace: PlacementData[] = allStudents
      .filter((student) => selectedStudentKeys.includes(student.key))
      .map((student) => ({
        id: student.id,
        nis: student.nis,
        fullname: student.fullname,
        key: student.key,
      }));

    const newPlacementData = [...placementData];
    studentsToPlace.forEach((student) => {
      if (!newPlacementData.some((p) => p.id === student.id)) {
        newPlacementData.push(student);
      }
    });

    setPlacementData(newPlacementData);
    setSelectedStudentKeys([]);
    toast.success(
      `${studentsToPlace.length} siswa ditambahkan ke kelas ${selectedClassName}.`
    );
  };

  const handleRemoveFromPlacement = (nis: string) => {
    setPlacementData((prev) => prev.filter((student) => student.nis !== nis));
    toast.warn(`Siswa dengan NIS ${nis} dibatalkan dari penempatan.`);
  };

  // --- Logic Submit Penempatan (API POST) ---
  const handleSubmitPlacement = async () => {
    if (placementData.length === 0) {
      toast.error("Silakan tambahkan siswa ke kelas tujuan sebelum submit!");
      return;
    }
    if (!selectedClassId) {
      toast.error("Kelas tujuan belum dipilih.");
      return;
    }

    const studentIds = placementData.map((s) => s.id);

    const postData = {
      student_id: studentIds,
      classroom_id: selectedClassId,
    };

    setLoading(true);

    try {
      const response = await api.post("/pag/students/classroom", postData);

      if (response.status === 200 || response.status === 201) {
        toast.success(
          `✅ ${placementData.length} siswa berhasil ditempatkan di kelas ${selectedClassName}!`
        );

        // Panggil fetchStudents dengan grade saat ini (yang tidak null)
        if (currentGrade) {
          fetchStudents(currentGrade);
        }
        setPlacementData([]);
      } else {
        toast.error(
          `Gagal submit: ${response.data.message || "Respons tidak terduga."}`
        );
      }
    } catch (error) {
      let errorMessage = "Gagal memproses penempatan. Silakan coba lagi.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      toast.error(`❌ ${errorMessage}`);
      console.error("Submit Placement Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Computed Values (Pencarian & Filtering UI) ---

  const filteredStudents = useMemo(() => {
    const available = allStudents.filter(
      (student) => !placementData.some((p) => p.id === student.id)
    );
    return available.filter(
      (student) =>
        student.nis.includes(searchStudent) ||
        student.fullname.toLowerCase().includes(searchStudent.toLowerCase())
    );
  }, [searchStudent, allStudents, placementData]);

  const filteredPlacement = useMemo(() => {
    return placementData.filter(
      (student) =>
        student.nis.includes(searchPlacement) ||
        student.fullname.toLowerCase().includes(searchPlacement.toLowerCase())
    );
  }, [searchPlacement, placementData]);

  // Opsi Select Kelas: Mengurutkan secara ascending berdasarkan code
  const classOptions = useMemo(() => {
    const sortedClasses = [...availableClasses].sort((a, b) => {
      // Mengurutkan string kode kelas (P1A < P1B, P2A < P2B)
      return a.code.localeCompare(b.code);
    });

    return sortedClasses.map((c) => ({
      value: c.id,
      label: c.code,
      grade: c.grade,
    }));
  }, [availableClasses]);

  // --- Konfigurasi Ant Design Table ---

  const rowSelection = {
    selectedRowKeys: selectedStudentKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedStudentKeys(selectedKeys);
    },
    getCheckboxProps: (record: Student) => ({
      disabled: placementData.some((p) => p.id === record.id),
    }),
  };

  return (
    <div style={{ padding: 24, minHeight: "100vh" }} className="bg-zinc-100">
      <Spin spinning={loading} tip="Memuat Data atau Memproses Penempatan...">
        {/* Header Path */}
        <div style={{ padding: "0 0 16px 0" }}>
          <Text type="secondary">Home / Student List / Placement</Text>
        </div>

        {/* Title */}
        <Row justify="space-between" align="top" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Student Placement
            </Title>
          </Col>
          <Col>
            <Title level={2} style={{ margin: 0, color: "#4096FF" }}>
              {academicYear}
            </Title>
          </Col>
        </Row>

        {/* Grade Selection */}
        <Row gutter={16} align="middle" style={{ marginBottom: 40 }}>
          <Col style={{ display: "flex", alignItems: "center" }}>
            <Text style={{ marginRight: 8 }}>
              Select current grade of students
            </Text>
          </Col>
          <Col>
            <Select
              // UBAH: value sekarang bisa null
              value={currentGrade}
              style={{ minWidth: 120 }}
              // UBAH: Cast ke GradeOptionType
              onChange={(value) => setCurrentGrade(value as GradeOptionType)}
              options={[
                // TAMBAH: Opsi default null/kosong
                { value: null, label: "Select Grade", disabled: true },
                ...["1", "2", "3", "4", "5", "6"].map((g) => ({
                  value: g,
                  label: g,
                })),
              ]}
              disabled={loading}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              // UBAH: Panggil fetchStudents dengan nilai currentGrade dan tambahkan disabled
              onClick={() => currentGrade && fetchStudents(currentGrade)}
              disabled={loading || currentGrade === null}
            >
              Refresh List
            </Button>
          </Col>
        </Row>

        {/* Main Content: Two Cards */}
        <Row gutter={24}>
          {/* Kolom Kiri: Students in grade (Tersedia untuk ditempatkan) */}
          <Col span={12}>
            <Card
              variant="borderless"
              title={
                <Space size="large">
                  <Text strong>
                    Students in grade : {currentGrade || "N/A"}
                  </Text>
                  <Text type="secondary">
                    Total : {filteredStudents.length}
                  </Text>
                </Space>
              }
            >
              {/* Search Bar */}
              <Input
                placeholder="Search by NIS or Student Name"
                prefix={<SearchOutlined />}
                style={{ marginBottom: 16 }}
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
              />

              {/* Students Table */}
              <Table
                rowKey="key"
                rowSelection={rowSelection}
                columns={studentColumns}
                dataSource={filteredStudents}
                pagination={false}
                size="small"
                scroll={{ y: 300 }}
                style={{ border: "1px solid #f0f0f0" }}
              />

              {/* Add to Class Button */}
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <Button
                  type="primary"
                  style={{
                    backgroundColor: "#52c41a",
                    borderColor: "#52c41a",
                    fontWeight: "bold",
                  }}
                  onClick={handleAddToClass}
                  disabled={
                    selectedStudentKeys.length === 0 ||
                    loading ||
                    !selectedClassId || // Disabled jika selectedClassId null
                    currentGrade === null // Disabled jika Grade belum dipilih
                  }
                >
                  Add to Class
                </Button>
              </div>
            </Card>
          </Col>

          {/* Kolom Kanan: Class Placement (Kelas Tujuan) */}
          <Col span={12}>
            <Card
              bordered={false}
              title={
                <Space size="large">
                  <Text strong>Class Placement</Text>
                  <Select
                    // SUDAH: value menggunakan selectedClassId (null)
                    value={selectedClassId}
                    onChange={(value) => {
                      // UBAH: Pastikan value adalah number atau null
                      const classId = value as number | null;
                      setSelectedClassId(classId);
                      const selected = availableClasses.find(
                        (c) => c.id === classId
                      );
                      setSelectedClassName(
                        selected ? selected.code : "Select Class"
                      );
                    }}
                    options={[
                      // TAMBAH: Opsi default null/kosong
                      { value: null, label: "Select Class", disabled: true },
                      ...classOptions, // Sudah diurutkan secara ascending
                    ]}
                    style={{ minWidth: 100 }}
                    disabled={loading}
                  />
                  <Text type="secondary">
                    Total : {filteredPlacement.length}
                  </Text>
                </Space>
              }
            >
              {/* Search Bar */}
              <Input
                placeholder="Search by NIS or Student Name"
                prefix={<SearchOutlined />}
                style={{ marginBottom: 16 }}
                value={searchPlacement}
                onChange={(e) => setSearchPlacement(e.target.value)}
              />

              {/* Placed Students Table */}
              <Table
                rowKey="key"
                columns={placementColumns(handleRemoveFromPlacement)}
                dataSource={filteredPlacement}
                pagination={false}
                size="small"
                scroll={{ y: 300 }}
                style={{ border: "1px solid #f0f0f0" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Submit Placement Section */}
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <div
            style={{
              display: "inline-block",
              padding: "24px 32px",
              backgroundColor: "#fffbe6",
              border: "1px solid #ffe58f",
              borderRadius: 4,
              boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
            }}
          >
            <Text strong type="warning">
              Please kindly check before submit the placement to **
              {selectedClassName}** !
            </Text>
          </div>
          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmitPlacement}
              disabled={
                placementData.length === 0 || loading || !selectedClassId
              }
              style={{
                height: 50,
                padding: "0 50px",
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              Submit Placement
            </Button>
          </div>
        </div>
      </Spin>
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
    </div>
  );
};

export default StudentPlacement;
