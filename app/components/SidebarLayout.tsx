// components/Layout/SidebarLayout.tsx
"use client";

import React, { useState } from "react";
import { Layout, Button, Space, Typography, Input, Badge, Avatar } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import SiderMenu from "./SiderMenu";
import Link from "next/link";
import Logo from "@/public/images/studentone-logo.png";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const SidebarLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  const headerContent = (
    <Space
      size="large"
      style={{
        width: "100%",
        justifyContent: "flex-end",
        paddingRight: "24px",
      }}
    >
      <Input
        prefix={<SearchOutlined />}
        placeholder="Ctrl + K"
        style={{ width: 250 }}
      />
      <Badge count={5} dot>
        <BellOutlined style={{ fontSize: "18px", cursor: "pointer" }} />
      </Badge>
      <Avatar icon={<UserOutlined />} />
      <Text strong>User Name</Text>
    </Space>
  );

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: "#f0f2f5" /* Latar belakang abu-abu muda */,
      }}
    >
      {/* Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        theme="light"
        width={250}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          borderRight: "1px solid #f0f0f0",
        }}
      >
        <div
          className="logo"
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            paddingLeft: "24px",
            fontWeight: "bold",
            fontSize: "18px",
            borderBottom: "1px solid #f0f0f0",
            color: "#262626",
          }}
        >
          {/* Logo E-Report - Ganti dengan komponen atau img Anda */}
          <img src={Logo.src} alt="StudentOne Logo" style={{ height: 40 }} />
          E-Report
        </div>
        <SiderMenu />
      </Sider>

      {/* Main Content Layout */}
      <Layout
        style={{ marginLeft: collapsed ? 80 : 250, transition: "margin 0.2s" }}
      >
        <Header
          style={{
            padding: 0,
            background: "#fff",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: "16px", width: 64, height: 64 }}
          />
          {headerContent}
        </Header>

        <Content
          style={{
            margin: "16px",
            padding: 0,
          }}
        >
          {/* Konten Halaman akan berada di sini */}
          <div
            style={{
              padding: 24,
              minHeight: "80vh",
              background: "#fff",
              borderRadius: 8,
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default SidebarLayout;
