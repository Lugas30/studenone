// app/(main)/layout.tsx

import "../globals.css";
import SidebarLayout from "../components/SidebarLayout";

// Semua halaman di dalam (main) seperti /dashboard dan /role-info
// akan menggunakan Sidebar Layout
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
