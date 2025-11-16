// app/(auth)/login/page.tsx
"use client";

import { Card, Form, Input, Button, Typography } from "antd";

const { Title } = Typography;

export default function LoginPage() {
  const onFinish = (values: any) => {
    console.log("Success:", values);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f0f2f5",
      }}
    >
      <Card
        title={
          <Title level={3} style={{ textAlign: "center" }}>
            E-Report Login
          </Title>
        }
        style={{ width: 400, boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
      >
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Masukkan username Anda!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Masukkan password Anda!" }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
              Log in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
