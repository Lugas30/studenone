// app/not-found.tsx
"use client";

import { Button, Result } from "antd";
import Link from "next/link";
import React from "react";

// Next.js secara otomatis mengabaikan layout untuk halaman ini.

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#fff",
      }}
    >
      <Result
        status="404"
        title="404"
        subTitle="Maaf, halaman yang Anda cari tidak ditemukan."
        extra={
          <Link href="/dashboard">
            <Button type="primary">Kembali ke Dashboard</Button>
          </Link>
        }
        style={{ padding: "100px 50px" }}
      />
    </div>
  );
}
