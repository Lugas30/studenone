// student-attendance-standalone.tsx (UPDATED)

"use client";

import React, { useState, useCallback } from "react";
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
  Breadcrumb, // <--- Komponen Breadcrumb ditambahkan
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import type { TableProps, RadioChangeEvent } from "antd";
import moment from "moment";

const { Title, Text } = Typography;

// --- 1. Tipe Data & Data Dummy ---

export type Gender = "L" | "P";
export type AttendanceStatus = "Present" | "Absent" | "Illness" | "Permission";

export interface Student {
  nis: number;
  fullName: string;
  gender: Gender;
  attendance: AttendanceStatus;
}

export const dummyStudents: Student[] = [
  {
    nis: 790841,
    fullName: "Aathirah Dhanesa Prayuda",
    gender: "P",
    attendance: "Present",
  },
  {
    nis: 790842,
    fullName: "Abyan Mufid Shaquille",
    gender: "L",
    attendance: "Absent",
  },
  {
    nis: 798699,
    fullName: "Ahza Danendra Abdillah",
    gender: "L",
    attendance: "Present",
  },
  {
    nis: 790752,
    fullName: "Akhtar Khairazky Subiyanto",
    gender: "L",
    attendance: "Present",
  },
  {
    nis: 790955,
    fullName: "Aldebaran Kenan Arrazka",
    gender: "L",
    attendance: "Illness",
  },
  {
    nis: 790843,
    fullName: "Byanca Alesha El Ilbar",
    gender: "P",
    attendance: "Present",
  },
  {
    nis: 790844,
    fullName: "Cherilyn Nafeeza Ardiansyah",
    gender: "P",
    attendance: "Present",
  },
  {
    nis: 790845,
    fullName: "Falisha Tanzeela Rahman",
    gender: "P",
    attendance: "Permission",
  },
  {
    nis: 790846,
    fullName: "Shane Marshall Yusuf",
    gender: "P",
    attendance: "Absent",
  },
];

export const homeroomOptions = [
  { value: "P1A", label: "P1A" },
  { value: "P2A", label: "P2A" },
  { value: "P3B", label: "P3B" },
];

export const defaultHomeroom = "P2A";

// --- 2. Komponen Utama ---

const StudentAttendancePage: React.FC = () => {
  // State initialization... (sama seperti sebelumnya)
  const [students, setStudents] = useState<Student[]>(dummyStudents);
  const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(
    moment("2024-11-08")
  );
  const [selectedHomeroom, setSelectedHomeroom] =
    useState<string>(defaultHomeroom);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Handler untuk mengubah status kehadiran (sama seperti sebelumnya)
  const handleAttendanceChange = useCallback(
    (nis: number, status: AttendanceStatus) => {
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.nis === nis ? { ...student, attendance: status } : student
        )
      );
    },
    []
  );

  // Kolom-kolom untuk Ant Design Table (sama seperti sebelumnya)
  const columns: TableProps<Student>["columns"] = [
    {
      title: "NIS",
      dataIndex: "nis",
      key: "nis",
      sorter: (a, b) => a.nis - b.nis,
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
              record.nis,
              e.target.value as AttendanceStatus
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
  ];

  const handleSaveAttendance = () => {
    alert("Data Kehadiran Berhasil Disimpan!");
  };

  const filteredStudents = students.filter(
    (student) =>
      student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(student.nis).includes(searchQuery)
  );

  return (
    <div style={{ padding: 24, background: "#fff" }}>
      {/* --- Breadcrumb --- */}
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb
          items={[
            {
              // Menggantikan "Home /" di gambar
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
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        {/* Menggantikan Title level 2 dengan gaya yang lebih cocok untuk header */}
        <Title level={2} style={{ margin: 0, fontWeight: 500 }}>
          Student Attendance
        </Title>
        <Title level={2} style={{ margin: 0, fontWeight: 500, color: "#333" }}>
          2024-2025
        </Title>
      </Flex>

      {/* Filter Bar */}
      <Flex gap={8} align="center" style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search customer 100 records..."
          prefix={<SearchOutlined style={{ color: "#aaa" }} />}
          style={{ width: 300 }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <DatePicker
          defaultValue={moment("2024-11-08")}
          format="YYYY-MM-DD"
          onChange={(date) => setSelectedDate(date)}
          style={{ width: 150 }}
        />
        <Select
          defaultValue={defaultHomeroom}
          style={{ width: 150 }}
          placeholder="Choose Homeroom"
          options={homeroomOptions}
          onChange={(value) => setSelectedHomeroom(value)}
        />
        <Button type="primary" style={{ minWidth: 100 }}>
          Apply Filter
        </Button>
        <Button icon={<DownloadOutlined />} />
      </Flex>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredStudents}
        rowKey="nis"
        pagination={false}
        scroll={{ y: 400 }}
        style={{ border: "1px solid #f0f0f0" }}
      />

      {/* Footer / Action Bar */}
      <Flex justify="space-between" align="center" style={{ marginTop: 16 }}>
        {/* Alert */}
        <Alert
          message={
            <Text>⚠️ Please check the Date and Homeroom before save data.</Text>
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
        >
          Save Attendance
        </Button>
      </Flex>
    </div>
  );
};

export default StudentAttendancePage;
