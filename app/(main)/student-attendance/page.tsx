// student-attendance-standalone.tsx (FINAL UPDATED - Using CODE for Select Label)

"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Typography,
  Input,
  DatePicker,
  Select,
  Button,
  Table,
  Radio,
  Alert,
  Flex,
  Breadcrumb,
  Spin,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import type { TableProps, RadioChangeEvent } from "antd";
import moment from "moment";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const { Title, Text } = Typography;

// --- 1. Konfigurasi API ---
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
  console.error("NEXT_PUBLIC_API_URL is not defined in environment variables.");
}

// --- 2. Tipe Data API dan Lokal ---

export interface ClassroomOption {
  value: number; // ID kelas (untuk selectedClassroomID)
  label: string; // CODE kelas (misal: "P1A") <-- Ringkas dan Sesuai Permintaan
  fullLabel: string; // Nama Kelas Lengkap
  code: string;
  grade: string;
  section: string;
}

export interface AcademicInfo {
  year: string; // Misal: "2024 - 2025"
  isActive: boolean;
}

export interface StudentDataAPI {
  student_id: number;
  nis: string;
  fullName: string;
  gender: "L" | "P";
  status: "present" | "absent" | "illness" | "permission";
  note?: string;
}

export interface Student {
  student_id: number;
  nis: string;
  fullName: string;
  gender: "L" | "P";
  attendance: "Present" | "Absent" | "Illness" | "Permission";
  note?: string;
}

const mapStatusToLocal = (
  apiStatus: StudentDataAPI["status"]
): Student["attendance"] => {
  switch (apiStatus) {
    case "present":
      return "Present";
    case "absent":
      return "Absent";
    case "illness":
      return "Illness";
    case "permission":
      return "Permission";
    default:
      return "Absent";
  }
};

const mapStatusToAPI = (
  localStatus: Student["attendance"]
): StudentDataAPI["status"] => {
  switch (localStatus) {
    case "Present":
      return "present";
    case "Absent":
      return "absent";
    case "Illness":
      return "illness";
    case "Permission":
      return "permission";
    default:
      return "absent";
  }
};

// --- 3. Komponen Utama ---

const StudentAttendancePage: React.FC = () => {
  // State data dari API
  const [academicInfo, setAcademicInfo] = useState<AcademicInfo | null>(null);
  const [classroomOptions, setClassroomOptions] = useState<ClassroomOption[]>(
    []
  );
  const [students, setStudents] = useState<Student[]>([]);

  // State Filter
  const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(
    moment()
  );
  const [selectedClassroomID, setSelectedClassroomID] = useState<
    number | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // State Loading & Proses
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // --- 4. Pengambilan Data Kelas (Classroom) ---

  const fetchClassrooms = useCallback(async () => {
    if (!BASE_URL) return;

    setIsLoading(true);
    try {
      const url = `${BASE_URL}/classrooms`;
      const response = await axios.get(url);

      const apiData = response.data.data as any[];
      const academicYear = response.data.academicYear;

      // Set Academic Info
      if (academicYear) {
        setAcademicInfo({ year: academicYear, isActive: true });
      }

      // Mapping dan Sorting data kelas secara ascending berdasarkan 'grade' dan 'section'
      const mappedOptions: ClassroomOption[] = apiData
        .map((item) => ({
          value: item.id,
          // PERBAIKAN: Menggunakan item.code (misal: "P1A")
          label: item.code,
          fullLabel: `${item.grade}${item.section} - ${item.class_name}`,
          code: item.code,
          grade: item.grade,
          section: item.section,
        }))
        .sort((a, b) => {
          // Sorting: 1. Grade (numerik), 2. Section (abjad)
          const gradeA = parseInt(a.grade);
          const gradeB = parseInt(b.grade);
          if (gradeA !== gradeB) {
            return gradeA - gradeB;
          }
          return a.section.localeCompare(b.section);
        });

      setClassroomOptions(mappedOptions);

      // Set default selectedClassroomID ke kelas pertama jika ada
      if (mappedOptions.length > 0 && !selectedClassroomID) {
        setSelectedClassroomID(mappedOptions[0].value);
      }

      toast.success("Data Kelas berhasil dimuat.");
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      toast.error("Gagal memuat data kelas.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassroomID]);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  // --- 5. Pengambilan Data Kehadiran Siswa ---

  const fetchStudentsAttendance = useCallback(async () => {
    if (!selectedClassroomID || !selectedDate || !BASE_URL) {
      setStudents([]);
      return;
    }

    setIsLoading(true);
    const teacherID = 1;
    const subjectID = 1;
    const formattedDate = selectedDate.format("YYYY-MM-DD");
    const semester = "ganjil";

    try {
      const endpoint = `/presence/students?teacher=${teacherID}&classroom=${selectedClassroomID}&subject=${subjectID}&date=${formattedDate}&semester=${semester}`;
      const url = `${BASE_URL}${endpoint}`;

      const response = await axios.get(url);
      const apiStudents: StudentDataAPI[] = response.data.students || [];

      const mappedStudents: Student[] = apiStudents.map((s) => ({
        student_id: s.student_id,
        nis: s.nis,
        fullName: s.fullName,
        gender: s.gender,
        attendance: mapStatusToLocal(s.status),
        note: s.note,
      }));

      setStudents(mappedStudents);
      toast.success(`Data kehadiran untuk ${formattedDate} berhasil dimuat.`);
    } catch (error) {
      console.error("Error fetching students attendance:", error);
      toast.error("Gagal memuat data kehadiran siswa.");
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassroomID, selectedDate]);

  // Handler untuk tombol "Apply Filter"
  const handleApplyFilter = () => {
    fetchStudentsAttendance();
  };

  // --- 6. Handler Status Kehadiran ---
  const handleAttendanceChange = useCallback(
    (studentID: number, status: Student["attendance"]) => {
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.student_id === studentID
            ? {
                ...student,
                attendance: status,
                note:
                  status === "Present" || status === "Absent"
                    ? undefined
                    : student.note,
              }
            : student
        )
      );
    },
    []
  );

  // --- 7. Simpan Kehadiran ---
  const handleSaveAttendance = async () => {
    if (
      !selectedClassroomID ||
      !selectedDate ||
      students.length === 0 ||
      !BASE_URL
    ) {
      toast.warn("Filter belum lengkap atau data siswa kosong.");
      return;
    }

    setIsSaving(true);
    const teacherID = 1;
    const subjectID = 1;

    const payload = {
      teacher_id: teacherID,
      subject_id: subjectID,
      classroom_id: selectedClassroomID,
      students: students.map((s) => ({
        student_id: s.student_id,
        status: mapStatusToAPI(s.attendance),
        note: s.note,
      })),
    };

    try {
      const url = `${BASE_URL}/presence/students`;
      const response = await axios.post(url, payload);

      if (response.status === 200 || response.status === 201) {
        toast.success("Data Kehadiran Berhasil Disimpan!");
      } else {
        toast.error("Gagal menyimpan data. Status: " + response.status);
      }
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Terjadi kesalahan saat menyimpan data.";
      toast.error(`Gagal menyimpan data: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- 8. Kolom Tabel ---
  const columns: TableProps<Student>["columns"] = [
    {
      title: "NIS",
      dataIndex: "nis",
      key: "nis",
      sorter: (a, b) => a.nis.localeCompare(b.nis),
      width: 100,
    },
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      width: 250,
    },
    { title: "Gender", dataIndex: "gender", key: "gender", width: 100 },
    {
      title: "Attendance",
      key: "attendance",
      render: (_, record) => (
        <Radio.Group
          onChange={(e: RadioChangeEvent) =>
            handleAttendanceChange(
              record.student_id,
              e.target.value as Student["attendance"]
            )
          }
          value={record.attendance}
        >
          <Radio value="Present">Present</Radio>
          <Radio value="Absent">Absent</Radio>
          <Radio value="Illness">Illness</Radio>
          <Radio value="Permission">Permission</Radio>
        </Radio.Group>
      ),
      width: "auto",
    },
    {
      title: "Note",
      key: "note",
      render: (_, record) => (
        <Input
          placeholder="Catatan (Sakit/Izin)"
          disabled={
            record.attendance !== "Illness" &&
            record.attendance !== "Permission"
          }
          value={record.note}
          onChange={(e) => {
            setStudents((prevStudents) =>
              prevStudents.map((s) =>
                s.student_id === record.student_id
                  ? { ...s, note: e.target.value }
                  : s
              )
            );
          }}
        />
      ),
      width: 200,
    },
  ];

  const filteredStudents = students.filter(
    (student) =>
      student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(student.nis).includes(searchQuery)
  );

  return (
    <Spin spinning={isLoading}>
      <div style={{ padding: 24, background: "#fff" }}>
        {/* --- Breadcrumb --- */}
        <div style={{ marginBottom: 16 }}>
          <Breadcrumb
            items={[
              {
                title: (
                  <a href="/">
                    <HomeOutlined /> Home
                  </a>
                ),
              },
              {
                title: "Student Attendance",
              },
            ]}
          />
        </div>

        {/* Header */}
        <Flex
          justify="space-between"
          align="center"
          style={{ marginBottom: 24 }}
        >
          <Title level={2} style={{ margin: 0, fontWeight: 500 }}>
            Student Attendance
          </Title>
          {/* Tampilan Tahun Ajaran Dinamis */}
          <Title
            level={2}
            style={{ margin: 0, fontWeight: 500, color: "#333" }}
          >
            {academicInfo ? academicInfo.year : "Memuat Tahun Ajaran..."}
          </Title>
        </Flex>

        {/* Filter Bar */}
        <Flex gap={8} align="center" style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search student by name or NIS..."
            prefix={<SearchOutlined style={{ color: "#aaa" }} />}
            style={{ width: 300 }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <DatePicker
            value={selectedDate}
            format="YYYY-MM-DD"
            onChange={(date) => setSelectedDate(date)}
            style={{ width: 150 }}
            allowClear={false}
          />
          <Select
            value={selectedClassroomID}
            style={{ width: 150 }}
            placeholder="Choose Class"
            options={classroomOptions}
            onChange={(value) => setSelectedClassroomID(value)}
            disabled={isLoading || classroomOptions.length === 0}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
          <Button
            type="primary"
            style={{ minWidth: 100 }}
            onClick={handleApplyFilter}
            disabled={!selectedClassroomID || !selectedDate || isLoading}
          >
            Apply Filter
          </Button>
          <Button icon={<DownloadOutlined />} disabled={true} />
        </Flex>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredStudents}
          rowKey="student_id"
          pagination={false}
          scroll={{ y: 400 }}
          style={{ border: "1px solid #f0f0f0" }}
          loading={isLoading}
          locale={{
            emptyText:
              'Pilih Kelas dan Tanggal, lalu klik "Apply Filter" untuk memuat data.',
          }}
        />

        {/* Footer / Action Bar */}
        <Flex justify="space-between" align="center" style={{ marginTop: 16 }}>
          {/* Alert */}
          <Alert
            message={
              <Text>
                ⚠️ Please check the Date and Classroom before save data.
              </Text>
            }
            type="warning"
            showIcon={false}
            style={{
              backgroundColor: "#fffbe5",
              border: "1px solid #ffe58f",
              color: "#faad14",
              borderRadius: 4,
            }}
          />

          {/* Save Button */}
          <Button
            type="primary"
            style={{
              backgroundColor: "#52c41a",
              borderColor: "#52c41a",
              minWidth: 150,
            }}
            onClick={handleSaveAttendance}
            loading={isSaving}
            disabled={isLoading || students.length === 0}
          >
            Save Attendance
          </Button>
        </Flex>
      </div>
    </Spin>
  );
};

export default StudentAttendancePage;
