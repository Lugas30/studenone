// components/Layout/SiderMenu.tsx
"use client";

import { Menu, MenuProps } from "antd"; // Import MenuProps untuk typing
import {
  AppstoreOutlined,
  SolutionOutlined,
  FolderOpenOutlined,
  UserOutlined,
  FileTextOutlined,
  // Tambahkan ikon lain jika diperlukan
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

// Definisikan tipe untuk Item Menu Ant Design
type MenuItem = Required<MenuProps>["items"][number];

// --- FUNGSI UTILITY MENU ---

// Fungsi utilitas untuk membuat item menu
function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: "group"
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

// Struktur menu dengan 'group' untuk pemisah/judul section
const items: MenuItem[] = [
  // --- 1. SEPARATOR/GROUP UNTUK DASHBOARD ---
  getItem("Dashboard", "group-dashboard", null, undefined, "group"),
  getItem(
    <Link href="/dashboard">Dashboard</Link>,
    "/dashboard",
    <AppstoreOutlined />
  ),
  getItem(
    <Link href="/role-info">Role Info</Link>,
    "/role-info",
    <SolutionOutlined />
  ),

  // --- 2. SEPARATOR/GROUP UNTUK MASTER DATA ---
  getItem("Master Data", "group-master-data", null, undefined, "group"),
  // Submenu "Academic & Curriculum"
  getItem(
    "Academic & Curriculum",
    "master-data-academic-curriculum",
    <FolderOpenOutlined />,
    [
      getItem(
        <Link href="/academic-year">Academic Year</Link>,
        "/academic-year"
      ),
      getItem(
        <Link href="/grade-classroom">Grade & Classroom</Link>,
        "/grade-classroom"
      ),
      getItem(<Link href="/subject">Subject</Link>, "/subject"),
      getItem(
        <Link href="/predicate-kktp">Predicate KKTP</Link>,
        "/predicate-kktp"
      ),
      getItem(
        <Link href="/extracurricular">Extracurricular</Link>,
        "/extracurricular"
      ),
    ]
  ),
  // Submenu "Personnel"
  getItem("Personnel", "master-data-personnel", <UserOutlined />, [
    getItem(<Link href="/head-of-unit">Head of Unit</Link>, "/head-of-unit"),
    getItem(<Link href="/teachers">Teachers</Link>, "/teachers"),
    getItem(<Link href="/students">Students</Link>, "/students"),
  ]),

  // --- 3. SEPARATOR/GROUP UNTUK ENROLLMENT ---
  getItem("Enrollment", "group-enrollment", null, undefined, "group"),
  // Submenu "Assignment"
  getItem("Assignment", "enrollment-assignment", <FileTextOutlined />, [
    getItem(
      <Link href="/role-assignment">Role Assignment</Link>,
      "/role-assignment"
    ),
    getItem(
      <Link href="/subject-teacher">Subject Teacher</Link>,
      "/subject-teacher"
    ),
    getItem(
      <Link href="/homeroom-teacher">Homeroom Teacher</Link>,
      "/homeroom-teacher"
    ),
    getItem(
      <Link href="/promotion-graduation">Promotion & Graduation</Link>,
      "/promotion-graduation"
    ),
    getItem(
      <Link href="/student-placement">Student Placement</Link>,
      "/student-placement"
    ),
  ]),

  // --- 4. SEPARATOR/GROUP UNTUK ATTENDANCE, HEALTH & INDICATOR ---
  getItem(
    "Attendance, Health & Indicator",
    "group-attendance-health-indicator",
    null,
    undefined,
    "group"
  ),
  // Submenu "Daily & Monthly Report"
  getItem(
    "Daily & Monthly Report",
    "report-daily-monthly",
    <FileTextOutlined />,
    [
      getItem(
        <Link href="/student-attendance">Student Attendance</Link>,
        "/student-attendance"
      ),
      getItem(
        <Link href="/student-attendance-qurans">
          Student Attendance Qurans
        </Link>,
        "/student-attendance-qurans"
      ),
      getItem(
        <Link href="/student-health-condition">Student Health Condition</Link>,
        "/student-health-condition"
      ),
    ]
  ),

  // Submenu "Indicator Input"
  getItem("Indicator Input", "input-indicator", <FileTextOutlined />, [
    getItem(
      <Link href="/indicator-spi-sos">Indicator Spi & Sos</Link>,
      "/indicator-spi-sos"
    ),
    getItem(
      <Link href="/indicator-knowledge-skill">
        Indicator Knowledge & Skill
      </Link>,
      "/indicator-knowledge-skill"
    ),
    getItem(
      <Link href="/indicator-doa-hadits">Indicator Doa & Hadits</Link>,
      "/indicator-doa-hadits"
    ),
    getItem(
      <Link href="/indicator-life-skill">Indicator Life Skill</Link>,
      "/indicator-life-skill"
    ),
    getItem(<Link href="/indicator-pid">Indicator PID</Link>, "/indicator-pid"),
  ]),

  // --- 5. SEPARATOR/GROUP UNTUK ASSESSMENT & REPORT INPUT ---
  getItem(
    "Assessment Report Input",
    "group-assessment-report",
    null,
    undefined,
    "group"
  ),

  // Submenu utama: Academic Report
  getItem("Academic Report", "academic-report", <FileTextOutlined />, [
    getItem(
      <Link href="/academic-report/spi-sos">Spi & Sos</Link>,
      "/academic-report/spi-sos"
    ),
    getItem(
      <Link href="/academic-report/knowledge">Knowledge</Link>,
      "/academic-report/knowledge"
    ),
    getItem(
      <Link href="/academic-report/skills">Skills</Link>,
      "/academic-report/skills"
    ),
    getItem(
      <Link href="/academic-report/doa-hadits">Doa & Hadits</Link>,
      "/academic-report/doa-hadits"
    ),
    getItem(
      <Link href="/academic-report/life-skill">Life Skill</Link>,
      "/academic-report/life-skill"
    ),
    getItem(
      <Link href="/academic-report/body-size-health-absences">
        Body Size, Health, Absences
      </Link>,
      "/academic-report/body-size-health-absences"
    ),
    getItem(
      <Link href="/academic-report/homeroom-notes">Homeroom Notes</Link>,
      "/academic-report/homeroom-notes"
    ),
  ]),

  // Item Laporan Lainnya (Sejajar dengan Academic Report)
  getItem(
    <Link href="/parents-report">Parents Report</Link>,
    "/assessment/parents-report",
    <FileTextOutlined />
  ),

  // Submenu: Qurans Report
  getItem("Qurans Report", "assessment-qurans-report", <FileTextOutlined />, [
    getItem(
      <Link href="/qurans-report/tahsin">Tahsin</Link>,
      "/assessment/qurans-report/tahsin"
    ),
    getItem(
      <Link href="/qurans-report/hapalan">Hapalan</Link>,
      "/assessment/qurans-report/hapalan"
    ),
  ]),

  // Item Laporan Lainnya (Sejajar dengan Academic Report)
  getItem(
    <Link href="/excul-report">Excul Report</Link>,
    "/assessment/excul-report",
    <FileTextOutlined />
  ),
  getItem(
    <Link href="/report-pid">PID Report</Link>,
    "/assessment/pid-report-assessment",
    <FileTextOutlined />
  ),

  // --- 6. SEPARATOR/GROUP Preview & Download Report ---
  getItem(
    "Preview & Download Report",
    "group-preview-download",
    null,
    undefined,
    "group"
  ),
  // Submenu: Qurans Report
  getItem("PID Report", "PID Report", <FileTextOutlined />, [
    getItem(
      <Link href="/access-preview-pid">Access & Preview</Link>,
      "/PID Report/Access & Preview"
    ),
    getItem(
      <Link href="/download-or-print-pid">Download or Print</Link>,
      "/PID Report/Download or Print"
    ),
  ]),
];

const SiderMenu: React.FC = () => {
  const pathname = usePathname();

  // Hitung item yang saat ini dipilih
  const selectedKeys = [pathname];

  // Fungsi utilitas untuk menemukan key yang harus diperluas (tidak ada perubahan pada fungsi ini)
  const getOpenKeys = (items: MenuItem[], currentPath: string): string[] => {
    const keys: string[] = [];
    items.forEach((item) => {
      // Hanya proses item yang memiliki children (submenu) dan bukan group
      if (
        item &&
        "children" in item &&
        item.children &&
        item.type !== "group"
      ) {
        // Cek apakah salah satu child key cocok dengan pathname
        const isChildActive = item.children.some(
          (child) => child && "key" in child && child.key === currentPath
        );

        // Cek apakah child adalah submenu, dan salah satu cucunya aktif
        const isGrandChildActive = item.children.some(
          (child) =>
            child &&
            "children" in child &&
            child.children &&
            child.children.some(
              (grandchild) =>
                grandchild &&
                "key" in grandchild &&
                grandchild.key === currentPath
            )
        );

        if (isChildActive || isGrandChildActive) {
          // Tambahkan key dari submenu (parent) ke daftar openKeys
          keys.push(item.key as string);
        }
      }
    });
    return keys;
  };

  // Fungsi utilitas untuk menemukan key submenu bersarang (nested) yang harus diperluas
  const getNestedOpenKeys = (
    items: MenuItem[],
    currentPath: string
  ): string[] => {
    const nestedKeys: string[] = [];
    items.forEach((item) => {
      if (item && "children" in item && item.children) {
        item.children.forEach((child) => {
          if (
            child &&
            "children" in child &&
            child.children &&
            child.type !== "group" // Pastikan bukan group di level ini juga
          ) {
            // Cek apakah salah satu grand-child key cocok dengan pathname
            const isGrandChildActive = child.children.some(
              (grandchild) =>
                grandchild &&
                "key" in grandchild &&
                grandchild.key === currentPath
            );
            if (isGrandChildActive) {
              // Tambahkan key dari submenu bersarang (child) ke daftar openKeys
              nestedKeys.push(child.key as string);
            }
          }
        });
      }
    });
    return nestedKeys;
  };

  // Gabungkan openKeys dari parent dan nested submenu
  const parentOpenKeys = getOpenKeys(items, pathname);
  const nestedOpenKeys = getNestedOpenKeys(items, pathname);
  // Tambahkan semua key submenu bersarang yang aktif ke daftar openKeys utama
  const openKeys = [...new Set([...parentOpenKeys, ...nestedOpenKeys])];

  return (
    <Menu
      theme="light"
      mode="inline"
      selectedKeys={selectedKeys}
      // Gunakan state untuk openKeys jika ingin mengontrol perilaku expand/collapse sepenuhnya (opsional)
      defaultOpenKeys={openKeys}
      items={items}
      style={{ borderRight: 0 }}
    />
  );
};

export default SiderMenu;
