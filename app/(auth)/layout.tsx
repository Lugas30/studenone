// app/(auth)/layout.tsx

import "../globals.css";

// Layout ini sengaja TIDAK mengimpor SidebarLayout
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Hanya menggunakan div sederhana. Styling pusat biasanya ada di halaman page.tsx-nya.
    <div style={{ minHeight: "100vh" }}>{children}</div>
  );
}
