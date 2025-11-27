// src/components/AddEditSubjectTeacherModal.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Form,
  Select,
  Checkbox,
  Button,
  Row,
  Col,
  Spin,
  message,
  Space,
} from "antd";

const { Option } = Select;

// =================================================================
// ## 1. Definisi Interface (DIPINDAHKAN DAN DISATUKAN)
// =================================================================

// Data Teacher dari /teachers
interface TeacherData {
  id: number;
  name: string;
  nip: string;
}

// Data Subject dari /subjects
interface SubjectData {
  id: number;
  name: string;
}

// Data Classroom dari /classrooms
interface ClassroomData {
  id: number;
  code: string; // P1A, P2B, etc.
  class_name: string;
}

// Data Subject Teacher untuk Edit (disederhanakan dari API utama)
export interface InitialSubjectTeacherData {
  id: number;
  teacher_id: number; // ID guru yang terpilih
  subject_id: number; // ID mata pelajaran yang terpilih
  classroom_ids: number[]; // Array ID kelas yang terpilih (untuk Class List)
  is_ganjil: boolean;
  is_genap: boolean;
}

// Struktur Payload untuk API POST/PUT
interface SubjectTeacherPayload {
  subject_id: number;
  teacher_id: number;
  is_ganjil: boolean;
  is_genap: boolean;
  classroom_ids: number[];
}

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Data yang dilewatkan saat mode Edit. Jika null, maka mode Add.
  initialData?: InitialSubjectTeacherData | null;
  // Fungsi yang dipanggil setelah sukses submit (untuk me-refresh tabel)
  onSuccess: () => void;
}

// =================================================================
// ## 2. Komponen Utama
// =================================================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://so-api.queensland.id/api";

const AddEditSubjectTeacherModal: React.FC<AddEditModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // State untuk menyimpan data dropdown dari API
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomData[]>([]);

  // Judul Modal
  const isEditMode = initialData && initialData.id;
  const modalTitle = isEditMode
    ? "Edit Subject Teacher"
    : "Add Subject Teacher";

  // --- Fetching Data Dropdown ---
  const fetchDropdownData = useCallback(async () => {
    setDataLoading(true);
    try {
      // Mengambil data dari tiga endpoint secara paralel
      const [teachersRes, subjectsRes, classroomsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/teachers`).then((res) => res.json()),
        fetch(`${API_BASE_URL}/subjects`).then((res) => res.json()),
        fetch(`${API_BASE_URL}/classrooms`).then((res) => res.json()),
      ]);

      setTeachers(teachersRes.data || []);
      setSubjects(subjectsRes.data || []);
      setClassrooms(classroomsRes.data || []);
    } catch (error) {
      console.error("Failed to fetch dropdown data:", error);
      message.error("Gagal memuat data guru, mata pelajaran, atau kelas.");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
      // Set nilai form jika dalam mode Edit
      if (isEditMode && initialData) {
        form.setFieldsValue({
          teacher_id: initialData.teacher_id,
          subject_id: initialData.subject_id,
          classroom_ids: initialData.classroom_ids,
          is_ganjil: initialData.is_ganjil,
          is_genap: initialData.is_genap,
        });
      } else {
        form.resetFields();
      }
    }
  }, [isOpen, initialData, form, isEditMode, fetchDropdownData]);

  // --- Submit Form (Add/Edit) ---
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload: SubjectTeacherPayload = {
        subject_id: values.subject_id,
        teacher_id: values.teacher_id,
        is_ganjil: values.is_ganjil || false,
        is_genap: values.is_genap || false,
        classroom_ids: values.classroom_ids || [],
      };

      const url = isEditMode
        ? `${API_BASE_URL}/subject-teachers/${initialData?.id}`
        : `${API_BASE_URL}/subject-teachers`;

      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          // 'Authorization': `Bearer ${token}`, // Tambahkan Auth jika ada
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Mencoba membaca body error jika ada
        const errorBody = await response.json();
        throw new Error(
          errorBody.message ||
            `Failed to ${isEditMode ? "update" : "create"} subject teacher`
        );
      }

      message.success(
        `Data guru mata pelajaran berhasil di${
          isEditMode ? "ubah" : "tambah"
        }kan.`
      );
      onSuccess(); // Panggil fungsi refresh
      onClose(); // Tutup modal
    } catch (error: any) {
      console.error("Submission error:", error);
      message.error(
        `Gagal ${isEditMode ? "mengubah" : "menambah"} data. Error: ${
          error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={modalTitle}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={form.submit}
          loading={loading}
          style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}
        >
          Save
        </Button>,
      ]}
    >
      {/* Tampilan seperti gambar:  */}
      {dataLoading ? (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin tip="Memuat pilihan data..." />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ is_ganjil: false, is_genap: false }}
        >
          <Row gutter={16}>
            {/* Choose Teacher */}
            <Col span={12}>
              <Form.Item
                name="teacher_id"
                label="Choose teacher"
                rules={[{ required: true, message: "Pilih guru!" }]}
              >
                <Select placeholder="Pilih Guru">
                  {teachers.map((t) => (
                    <Option key={t.id} value={t.id}>
                      {t.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            {/* Subjects */}
            <Col span={12}>
              <Form.Item
                name="subject_id"
                label="Subjects"
                rules={[{ required: true, message: "Pilih mata pelajaran!" }]}
              >
                <Select placeholder="Pilih Mata Pelajaran">
                  {subjects.map((s) => (
                    <Option key={s.id} value={s.id}>
                      {s.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Class List (Multiple Select) */}
          <Form.Item
            name="classroom_ids"
            label="Class List"
            rules={[{ required: true, message: "Pilih minimal satu kelas!" }]}
          >
            <Select
              mode="multiple" // Kunci implementasi multiple selection
              placeholder="Pilih kelas"
              // Custom tag render untuk meniru gaya tag (seperti a10 x, c12 x)
              tagRender={(props) => {
                const { label, closable, onClose } = props;
                return (
                  <span
                    style={{
                      backgroundColor: "#f0f0f0",
                      padding: "2px 8px",
                      margin: "2px 4px 2px 0",
                      borderRadius: "4px",
                      border: "1px solid #d9d9d9",
                      cursor: "default",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    {label}
                    {closable && (
                      <span
                        onClick={onClose}
                        style={{
                          marginLeft: 6,
                          cursor: "pointer",
                          color: "#8c8c8c",
                        }}
                      >
                        ×
                      </span>
                    )}
                  </span>
                );
              }}
            >
              {classrooms.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.code}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Semester Checkboxes */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Form.Item
                name="is_ganjil"
                valuePropName="checked"
                style={{ display: "inline-block" }}
              >
                <Checkbox>Ganjil</Checkbox>
              </Form.Item>
              <Form.Item
                name="is_genap"
                valuePropName="checked"
                style={{ display: "inline-block" }}
              >
                <Checkbox>Genap</Checkbox>
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default AddEditSubjectTeacherModal;
