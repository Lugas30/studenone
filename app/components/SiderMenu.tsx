// components/Layout/SiderMenu.tsx
"use client";

import { Menu, MenuProps } from "antd";
import {
  AppstoreOutlined,
  SolutionOutlined,
  FolderOpenOutlined,
  UserOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";

// --- PERBAIKAN 1: DEFINISI TIPE MENUITEM ---

// Definisikan tipe dasar dari MenuItem Ant Design
type AntdMenuItem = Required<MenuProps>["items"][number];

// Perluas tipe AntdMenuItem, tambahkan pemeriksaan untuk memastikan item memiliki 'children'
// Tipe ini akan digunakan dalam logika rekursif di bawah.
type MenuItem = AntdMenuItem & {
  path?: string;
  // Membantu TypeScript mengetahui kapan sebuah item adalah SubMenu:
  children?: MenuItem[];
};

// --- FUNGSI UTILITY MENU ---

// Fungsi utilitas untuk membuat item menu
function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: "group"
): MenuItem {
  const path = typeof key === "string" ? key : undefined;

  return {
    key,
    icon,
    children,
    label,
    type,
    path: path,
  } as MenuItem; // Assertion karena kita tahu struktur yang kita buat
}

// --- FUNGSI REKURSIF PERBAIKAN TS2339 ---

// Fungsi rekursif untuk mencari semua parent keys yang harus terbuka
const getOpenKeysFromPath = (
  items: MenuItem[],
  currentPath: string
): string[] => {
  const openKeys: string[] = [];

  const findKeys = (
    currentItems: MenuItem[],
    parentKeys: string[]
  ): boolean => {
    for (const item of currentItems) {
      // PERBAIKAN 2: Pemeriksaan Tipe untuk mengakses 'children'
      // Ant Design memerlukan pemeriksaan 'children' ada di dalam objek
      // dan pastikan item tersebut BUKAN bertipe 'group' atau 'divider'
      const isSubMenu = item && "children" in item && item.type !== "group";

      // 1. Cek apakah item saat ini adalah path yang dicari
      // Kita harus memastikan 'key' ada dan bertipe string untuk perbandingan path
      if (item && typeof item.key === "string" && item.key === currentPath) {
        // Jika path ditemukan, tambahkan semua parent key
        openKeys.push(...parentKeys);
        return true;
      }

      // 2. Jika item adalah Submenu (sudah lolos pemeriksaan isSubMenu)
      if (isSubMenu && item.children && item.children.length > 0) {
        const currentKey = item.key as string;
        // Tambahkan key saat ini ke daftar parent untuk rekursi
        if (
          findKeys(item.children as MenuItem[], [...parentKeys, currentKey])
        ) {
          // Jika ditemukan di level yang lebih dalam, key saat ini sudah ditambahkan
          return true;
        }
      }
    }
    return false;
  };

  findKeys(items, []);
  return Array.from(new Set(openKeys));
};

// --- STRUKTUR MENU (TETAP SAMA) ---

const items: MenuItem[] = [
  // --- 1. DASHBOARD ---
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

  // --- 2. MASTER DATA ---
  getItem("Master Data", "group-master-data", null, undefined, "group"),
  // Submenu "Academic & Curriculum"
  getItem(
    "Academic & Curriculum",
    "master-data-academic-curriculum", // Key untuk submenu parent
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

  // --- 3. ENROLLMENT ---
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

  // --- 4. ATTENDANCE, HEALTH & INDICATOR ---
  getItem(
    "Attendance, Health & Indicator",
    "group-attendance-health-indicator",
    null,
    undefined,
    "group"
  ),
  // Submenu "Report"
  getItem("Report", "report-daily-monthly", <FileTextOutlined />, [
    getItem(
      <Link href="/student-attendance">Student Attendance</Link>,
      "/student-attendance"
    ),
    getItem(
      <Link href="/student-attendance-qurans">Student Attendance Qurans</Link>,
      "/student-attendance-qurans"
    ),
    getItem(
      <Link href="/student-health-condition">Student Health Condition</Link>,
      "/student-health-condition"
    ),
  ]),

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

  // --- 5. ASSESSMENT & REPORT INPUT ---
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
      <Link href="/academic-report/health-attendance">
        Health & Attendance
      </Link>,
      "/academic-report/health-attendance"
    ),
    getItem(
      <Link href="/academic-report/homeroom-notes">Homeroom Notes</Link>,
      "/academic-report/homeroom-notes"
    ),
  ]),

  // Item Laporan Lainnya
  getItem(
    <Link href="/parents-report">Parents Report</Link>,
    "/parents-report",
    <FileTextOutlined />
  ),

  // Submenu: Qurans Report
  getItem("Qurans Report", "assessment-qurans-report", <FileTextOutlined />, [
    getItem(
      <Link href="/qurans-report/tahsin">Tahsin</Link>,
      "/qurans-report/tahsin"
    ),
    getItem(
      <Link href="/qurans-report/hapalan">Hapalan</Link>,
      "/qurans-report/hapalan"
    ),
  ]),

  // Item Laporan Lainnya
  getItem(
    <Link href="/excul-report">Excul Report</Link>,
    "/excul-report",
    <FileTextOutlined />
  ),
  getItem(
    <Link href="/report-pid">PID Report</Link>,
    "/report-pid",
    <FileTextOutlined />
  ),

  // --- 6. Preview & Download Report ---
  getItem(
    "Preview & Download Report",
    "group-preview-download",
    null,
    undefined,
    "group"
  ),
  // Submenu: PID Report
  getItem("PID Report", "preview-download-pid-report", <FileTextOutlined />, [
    getItem(
      <Link href="/access-preview-pid">Access & Preview</Link>,
      "/access-preview-pid"
    ),
    getItem(
      <Link href="/download-or-print-pid">Download or Print</Link>,
      "/download-or-print-pid"
    ),
  ]),
];

// --- KOMPONEN UTAMA (TETAP SAMA) ---

const SiderMenu: React.FC = () => {
  const pathname = usePathname();

  // 1. Hitung item yang saat ini dipilih
  const selectedKeys = [pathname];

  // 2. Tentukan initial open keys berdasarkan path saat ini
  const initialOpenKeys = React.useMemo(
    () => getOpenKeysFromPath(items, pathname),
    [pathname]
  );

  // 3. Gunakan state untuk mengontrol openKeys
  const [openKeys, setOpenKeys] = useState<string[]>(initialOpenKeys);

  // Efek untuk memperbarui openKeys saat pathname berubah (navigasi)
  useEffect(() => {
    const newOpenKeys = getOpenKeysFromPath(items, pathname);
    // Gabungkan openKeys lama dengan openKeys baru
    setOpenKeys((prevKeys) =>
      Array.from(new Set([...prevKeys, ...newOpenKeys]))
    );
  }, [pathname]);

  // Handler untuk mengontrol openKeys saat pengguna mengklik submenu
  const onOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  return (
    <Menu
      theme="light"
      mode="inline"
      selectedKeys={selectedKeys}
      openKeys={openKeys}
      onOpenChange={onOpenChange}
      items={items}
      style={{ borderRight: 0 }}
    />
  );
};

export default SiderMenu;
