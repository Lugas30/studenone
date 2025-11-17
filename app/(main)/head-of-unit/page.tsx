"use client";

import React from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Radio,
  Upload,
  Button,
  Row,
  Col,
  Typography,
  Space,
  DatePicker,
} from "antd";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const { Title, Text } = Typography;
const { Option } = Select;

// 1. Tipe Data untuk Formulir
interface PrincipalData {
  fullName: string;
  nip: string;
  contact: string;
  email: string;
  dateOfBirth: string; // Akan diubah ke moment/dayjs saat integrasi antd DatePicker
  responsibleFor: string;
  gender: "Headmistress" | "Headmaster";
  signatureFile?: File;
}

// 2. Dummy Data Awal
const initialValues: PrincipalData = {
  fullName: "Ade Sodikin, S.Sos.I.",
  nip: "56625128890086",
  contact: "0865443xxx",
  email: "adesodikin@gmail.com",
  dateOfBirth: "",
  responsibleFor: "Primary School",
  gender: "Headmaster",
};

// 3. Komponen Utama
const PrincipalForm: React.FC = () => {
  const [form] = Form.useForm<PrincipalData>();

  // Fungsi saat form disubmit
  const onFinish = (values: PrincipalData) => {
    console.log("Form Submitted:", values);

    // Logika pengiriman data ke backend di sini

    // Notifikasi Berhasil (menggunakan React Toastify)
    toast.success("Data Principal berhasil disimpan!", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  // Fungsi saat tombol Cancel diklik
  const handleCancel = () => {
    form.resetFields();
    toast.info("Formulir dibatalkan/di-reset!", {
      position: "top-right",
      autoClose: 2000,
    });
  };

  return (
    <>
      <ToastContainer />
      <div style={{ padding: "24px" }}>
        {/* Header / Breadcrumb */}
        <Space direction="vertical" style={{ width: "100%", marginBottom: 20 }}>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Home / Principal
          </Text>
          <Row justify="space-between" align="middle">
            <Title level={2} style={{ margin: 0 }}>
              Head of Unit
            </Title>
            <Title level={3} style={{ margin: 0, fontWeight: "normal" }}>
              2024-2025
            </Title>
          </Row>
        </Space>

        {/* Form Card */}
        <Card
          bordered={false}
          style={{ boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)" }}
        >
          <Title
            level={4}
            style={{ borderBottom: "1px solid #eee", paddingBottom: 10 }}
          >
            Principal Information
          </Title>

          <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onFinish={onFinish}
            style={{ marginTop: 20 }}
          >
            {/* Full Name & NIP */}
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label="Full Name"
                  name="fullName"
                  rules={[
                    { required: true, message: "Harap masukkan Nama Lengkap!" },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Nama Lengkap"
                    readOnly
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="NIP"
                  name="nip"
                  rules={[{ required: true, message: "Harap masukkan NIP!" }]}
                >
                  <Input placeholder="NIP" readOnly />
                </Form.Item>
              </Col>
            </Row>

            {/* Contact & Email Address */}
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="Contact" name="contact">
                  <Input placeholder="Nomor Kontak" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Email Address"
                  name="email"
                  rules={[
                    { type: "email", message: "Format email tidak valid!" },
                  ]}
                >
                  <Input placeholder="Alamat Email" />
                </Form.Item>
              </Col>
            </Row>

            {/* Date of Birth & Responsible for */}
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item label="Date of Birth" name="dateOfBirth">
                  <DatePicker
                    style={{ width: "100%" }}
                    placeholder="Select date"
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Responsible for"
                  name="responsibleFor"
                  rules={[{ required: true, message: "Harap pilih unit!" }]}
                >
                  <Select placeholder="Pilih unit yang bertanggung jawab">
                    <Option value="Primary School">Primary School</Option>
                    <Option value="Secondary School">Secondary School</Option>
                    <Option value="High School">High School</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* Gender */}
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item
                  label="Gender"
                  name="gender"
                  rules={[
                    { required: true, message: "Harap pilih jenis kelamin!" },
                  ]}
                >
                  <Radio.Group>
                    <Radio value="Headmistress">Headmistress</Radio>
                    <Radio value="Headmaster">Headmaster</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            {/* Upload Signature */}
            <Title
              level={4}
              style={{
                marginTop: 20,
                marginBottom: 10,
                borderTop: "1px solid #eee",
                paddingTop: 20,
              }}
            >
              Upload Signature
            </Title>
            <Form.Item
              name="signatureFile"
              valuePropName="fileList"
              getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
            >
              <Upload.Dragger
                name="file"
                multiple={false}
                beforeUpload={() => false} // Mencegah upload otomatis
                maxCount={1}
                accept=".png,.jpg,.jpeg"
                style={{ padding: "40px 20px" }}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined style={{ color: "#1890ff" }} />
                </p>
                <p className="ant-upload-text">Upload a File</p>
                <p className="ant-upload-hint">Drag and drop files here</p>
              </Upload.Dragger>
            </Form.Item>

            {/* Action Buttons */}
            <Form.Item style={{ textAlign: "right", marginTop: 30 }}>
              <Space>
                <Button onClick={handleCancel}>Cancel</Button>
                <Button type="primary" htmlType="submit">
                  Save
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </>
  );
};

export default PrincipalForm;
