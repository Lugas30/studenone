// components/Layout/SiderMenu.tsx
"use client";

import { Menu, MenuProps } from "antd"; // Import MenuProps untuk typing
import {
  AppstoreOutlined,
  SolutionOutlined,
  FolderOpenOutlined,
  UserOutlined, // Ikon untuk Personnel
  FileTextOutlined, // Ikon untuk Assignment/Enrollment, Assessment/Report
  // Tambahkan ikon lain jika diperlukan, namun untuk keseragaman, saya gunakan FileTextOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

// Definisikan tipe untuk Item Menu Ant Design
type MenuItem = Required<MenuProps>["items"][number];

// Struktur menu dengan 'group' untuk pemisah/judul section
const items: MenuItem[] = [
  // --- 1. SEPARATOR/GROUP UNTUK DASHBOARD ---
  {
    key: "group-dashboard", // Key unik untuk group
    type: "group", // Menggunakan 'group' untuk judul section
    label: "Dashboard", // Teks yang akan ditampilkan sebagai pemisah
  },
  {
    key: "/dashboard",
    icon: <AppstoreOutlined />,
    label: <Link href="/dashboard">Dashboard</Link>,
  },
  {
    key: "/role-info",
    icon: <SolutionOutlined />,
    label: <Link href="/role-info">Role Info</Link>,
  },

  // --- 2. SEPARATOR/GROUP UNTUK MASTER DATA ---
  {
    key: "group-master-data", // Key unik untuk group
    type: "group", // Menggunakan 'group' untuk judul section
    label: "Master Data", // Teks yang akan ditampilkan sebagai pemisah
  },
  // Submenu "Academic & Curriculum"
  {
    key: "master-data-academic-curriculum",
    icon: <FolderOpenOutlined />,
    label: "Academic & Curriculum",
    type: "submenu",
    children: [
      {
        // URL diubah dari /master-data/academic-year menjadi /academic-year
        key: "/academic-year",
        label: <Link href="/academic-year">Academic Year</Link>,
      },
      {
        // URL diubah dari /master-data/grade-classroom menjadi /grade-classroom
        key: "/grade-classroom",
        label: <Link href="/grade-classroom">Grade & Classroom</Link>,
      },
      {
        // URL diubah dari /master-data/subject menjadi /subject
        key: "/subject",
        label: <Link href="/subject">Subject</Link>,
      },
      {
        // URL diubah dari /master-data/predicate-kktp menjadi /predicate-kktp
        key: "/predicate-kktp",
        label: <Link href="/predicate-kktp">Predicate KKTP</Link>,
      },
      {
        // URL diubah dari /master-data/extracurricular menjadi /extracurricular
        key: "/extracurricular",
        label: <Link href="/extracurricular">Extracurricular</Link>,
      },
    ],
  },
  // Submenu "Personnel"
  {
    key: "master-data-personnel",
    icon: <UserOutlined />,
    label: "Personnel",
    type: "submenu",
    children: [
      {
        // URL diubah dari /master-data/personnel/principal menjadi /personnel/principal
        key: "/head-of-unit",
        label: <Link href="/head-of-unit">Head of Unit</Link>,
      },
      {
        // URL diubah dari /master-data/personnel/teachers menjadi /personnel/teachers
        key: "/teachers",
        label: <Link href="/teachers">Teachers</Link>,
      },
      {
        // URL diubah dari /master-data/personnel/students menjadi /personnel/students
        key: "/students",
        label: <Link href="/students">Students</Link>,
      },
    ],
  },

  // --- 3. SEPARATOR/GROUP UNTUK ENROLLMENT ---
  {
    key: "group-enrollment",
    type: "group",
    label: "Enrollment",
  },
  // Submenu "Assignment"
  {
    key: "enrollment-assignment",
    icon: <FileTextOutlined />,
    label: "Assignment",
    type: "submenu",
    children: [
      {
        // URL diubah dari /enrollment/role-assignment menjadi /role-assignment
        key: "/role-assignment",
        label: <Link href="/role-assignment">Role Assignment</Link>,
      },
      {
        // URL diubah dari /enrollment/subject-teacher menjadi /subject-teacher
        key: "/subject-teacher",
        label: <Link href="/subject-teacher">Subject Teacher</Link>,
      },
      {
        // URL diubah dari /enrollment/homeroom-teacher menjadi /homeroom-teacher
        key: "/homeroom-teacher",
        label: <Link href="/homeroom-teacher">Homeroom Teacher</Link>,
      },
      {
        // URL diubah dari /enrollment/promotion-graduation menjadi /promotion-graduation
        key: "/promotion-graduation",
        label: <Link href="/promotion-graduation">Promotion & Graduation</Link>,
      },
      {
        // URL diubah dari /enrollment/student-placement menjadi /student-placement
        key: "/student-placement",
        label: <Link href="/student-placement">Student Placement</Link>,
      },
    ],
  },

  // === START: PENAMBAHAN MENU DARI GAMBAR ===

  // --- 4. SEPARATOR/GROUP UNTUK ASSESSMENT & REPORT ---
  {
    key: "group-attendance-health-indicator",
    type: "group",
    label: "Attendance, Health & Indicator",
  },

  // Submenu "Daily & Monthly Report"
  {
    key: "report-daily-monthly",
    icon: <FileTextOutlined />,
    label: "Daily & Monthly Report",
    type: "submenu",
    children: [
      {
        key: "/report/student-attendance",
        label: (
          <Link href="/report/student-attendance">Student Attendance</Link>
        ),
      },
      {
        key: "/report/student-attendance-qurans",
        label: (
          <Link href="/report/student-attendance-qurans">
            Student Attendance Qurans
          </Link>
        ),
      },
      {
        key: "/report/student-health-condition",
        label: (
          <Link href="/report/student-health-condition">
            Student Health Condition
          </Link>
        ),
      },
    ],
  },

  // Submenu "Indicator Input"
  {
    key: "input-indicator",
    icon: <FileTextOutlined />,
    label: "Indicator Input",
    type: "submenu",
    children: [
      {
        key: "/indicator-spi-sos",
        label: <Link href="/indicator-spi-sos">Indicator Spi & Sos</Link>,
      },
      {
        key: "/indicator-knowledge-skill",
        label: (
          <Link href="/indicator-knowledge-skill">
            Indicator Knowledge & Skill
          </Link>
        ),
      },
      {
        key: "/indicator-doa-hadits",
        label: <Link href="/indicator-doa-hadits">Indicator Doa & Hadits</Link>,
      },
      {
        key: "/indicator-life-skill",
        label: <Link href="/indicator-life-skill">Indicator Life Skill</Link>,
      },
      {
        key: "/indicator-pid",
        label: <Link href="/indicator-pid">Indicator PID</Link>,
      },
    ],
  },

  // Submenu "Assessment Report Input"
  {
    key: "input-assessment-report",
    icon: <FileTextOutlined />,
    label: "Assessment Report Input",
    type: "submenu",
    children: [
      // Submenu: Academic Report (Dropdown)
      {
        key: "assessment/academic-report", // Key unik untuk submenu yang dapat dibuka
        label: "Academic Report", // Label submenu
        type: "submenu", // Tipe submenu agar dapat di-dropdown
        children: [
          {
            key: "/assessment/academic-report/spi-sos",
            label: (
              <Link href="/assessment/academic-report/spi-sos">Spi & Sos</Link>
            ),
          },
          {
            key: "/assessment/academic-report/knowledge",
            label: (
              <Link href="/assessment/academic-report/knowledge">
                Knowledge
              </Link>
            ),
          },
          {
            key: "/assessment/academic-report/skills",
            label: (
              <Link href="/assessment/academic-report/skills">Skills</Link>
            ),
          },
          {
            key: "/assessment/academic-report/doa-hadits",
            label: (
              <Link href="/assessment/academic-report/doa-hadits">
                Doa & Hadits
              </Link>
            ),
          },
          {
            key: "/assessment/academic-report/life-skill",
            label: (
              <Link href="/assessment/academic-report/life-skill">
                Life Skill
              </Link>
            ),
          },
          {
            key: "/assessment/academic-report/body-size-health-absences",
            label: (
              <Link href="/assessment/academic-report/body-size-health-absences">
                Body Size, Health, Absences
              </Link>
            ),
          },
          {
            key: "/assessment/academic-report/homeroom-notes",
            label: (
              <Link href="/assessment/academic-report/homeroom-notes">
                Homeroom Notes
              </Link>
            ),
          },
        ],
      },
      // Item lainnya
      {
        key: "/assessment/parents-report",
        label: <Link href="/assessment/parents-report">Parents Report</Link>,
      },
      // Submenu: Qurans Report (Dropdown)
      {
        key: "assessment/qurans-report", // Key unik untuk submenu yang dapat dibuka
        label: "Qurans Report", // Label submenu
        type: "submenu", // Tipe submenu agar dapat di-dropdown
        children: [
          {
            key: "/assessment/qurans-report/tahsin",
            label: <Link href="/assessment/qurans-report/tahsin">Tahsin</Link>,
          },
          {
            key: "/assessment/qurans-report/hapalan",
            label: (
              <Link href="/assessment/qurans-report/hapalan">Hapalan</Link>
            ),
          },
        ],
      },
      // Item lainnya
      {
        key: "/assessment/excul-report",
        label: <Link href="/assessment/excul-report">Excul Report</Link>,
      },
      {
        key: "/assessment/pid-report",
        label: <Link href="/assessment/pid-report">PID Report</Link>,
      },
    ],
  },
  // === END: PENAMBAHAN MENU DARI GAMBAR ===
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

        // Jika child aktif, atau jika child itu sendiri adalah submenu yang salah satu cucunya aktif
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
  const openKeys = [...new Set([...parentOpenKeys, ...nestedOpenKeys])];

  return (
    <Menu
      theme="light"
      mode="inline"
      selectedKeys={selectedKeys}
      defaultOpenKeys={openKeys}
      // items harus memiliki tipe ItemType<MenuItemType>[] yang sesuai
      items={items}
      style={{ borderRight: 0 }}
    />
  );
};

export default SiderMenu;
