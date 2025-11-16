// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
// 👇 Import AntdRegistry dan ConfigProvider
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";

export const metadata: Metadata = {
  title: "E-Report Student One",
  description: "E-Raport PID milik Sekolah Student One",
};

// Kustomisasi Tema Ant Design (Opsional)
// const customTheme = {
//   token: {
//     colorPrimary: "#52c41a", // Contoh: Warna primer hijau
//   },
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <AntdRegistry>
          {/* Aktifkan ini jika ingin custom theme */}
          {/* <ConfigProvider theme={customTheme}>{children}</ConfigProvider> */}
          <ConfigProvider>{children}</ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
