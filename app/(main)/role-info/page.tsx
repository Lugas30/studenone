// app/(main)/role-info/page.tsx
"use client";

import { Breadcrumb, Typography, Divider } from "antd";
import React from "react";

const { Title } = Typography;

export default function RoleInfoPage() {
  return (
    <div>
      {/* Breadcrumb sesuai gambar */}
      <Breadcrumb items={[{ title: "Home" }, { title: "Role info" }]} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "16px",
        }}
      >
        <Title level={1} style={{ margin: 0 }}>
          Role info
        </Title>
        <Title level={3} style={{ color: "#888", margin: 0 }}>
          2024-2025
        </Title>
      </div>

      <Divider />

      <Title level={4}>Ini Halaman Role info</Title>

      {/* Konten Role info lainnya... */}
    </div>
  );
}
