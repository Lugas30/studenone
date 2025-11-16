// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
// 👇 Import AntdRegistry dan ConfigProvider
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { Public_Sans } from "next/font/google";

const publicSans = Public_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-public-sans",
});

export const metadata: Metadata = {
  title: "E-Report Student One",
  description: "E-Raport PID milik Sekolah Student One",
};

// Kustomisasi Tema Ant Design (Opsional)
const customTheme = {
  token: {
    // colorPrimary: "#52c41a", // Contoh: Warna primer hijau
    fontFamily: "var(--font-public-sans)",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${publicSans.className}`}
    >
      <body className={`antialiased`}>
        <AntdRegistry>
          {/* Aktifkan ini jika ingin custom theme */}
          <ConfigProvider theme={customTheme}>{children}</ConfigProvider>
          {/* <ConfigProvider>{children}</ConfigProvider> */}
        </AntdRegistry>
      </body>
    </html>
  );
}
