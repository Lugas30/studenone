"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  Checkbox,
  Button,
  Space,
  Typography,
  Spin,
  Alert,
  Row,
} from "antd";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const { Option } = Select;
const { Text } = Typography;

// Ambil base URL dari .env
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://so-api.queensland.id/api";

// API Endpoints
const API_ROLE_TEACHERS = `${BASE_URL}/role-teachers`;
const API_TEACHERS = `${BASE_URL}/teachers`;
const API_CLASSES = `${BASE_URL}/classrooms`;
const API_ROLES = `${BASE_URL}/roles`;

// =======================================================
// 1. DEFINISI TIPE API
// =======================================================

// Tipe untuk data dropdown Guru (Teacher)
interface TeacherOption {
  id: number;
  nip: string;
  name: string;
}

// Tipe untuk data dropdown Kelas (Classroom/Homebase)
interface ClassOption {
  id: number;
  code: string;
  class_name: string;
}

// Tipe untuk data dropdown Peran (Role)
interface RoleOption {
  id: number;
  role: string;
}

// Tipe untuk Response API List
interface ListResponse<T> {
  academicYear: string;
  data: T[];
}

// Tipe untuk Form Value
interface RoleFormValues {
  teacherId: number;
  roleIds: number[];
  classId?: number;
}

// Pengaturan ID Peran yang memicu munculnya Homebase: Homeroom Teacher (2), Homeroom Assistant (3)

const HOMEBASE_TRIGGER_ROLES = [2, 3]; // Menggunakan ID 3 (Homeroom Teacher) dari data API contoh

// =======================================================
// 2. TIPE PROPS MODAL
// =======================================================
interface AddEditRoleModalProps {
  isVisible: boolean;
  mode: "add" | "edit";
  initialData?: {
    id: number;
    teacherId: number;
    roleIds: number[];
    classId?: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

// =======================================================
// 3. HOOK FETCH DATA DROPDOWN
// =======================================================

interface OptionsState {
  teachers: TeacherOption[];
  classes: ClassOption[];
  roles: RoleOption[];
  loading: boolean;
  error: string | null;
}

const useFetchOptions = (isVisible: boolean): OptionsState => {
  const [options, setOptions] = useState<OptionsState>({
    teachers: [],
    classes: [],
    roles: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!isVisible) return;

    const fetchOptions = async () => {
      setOptions((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const [teachersRes, classesRes, rolesRes] = await Promise.all([
          axios.get<ListResponse<TeacherOption>>(API_TEACHERS),
          axios.get<ListResponse<ClassOption>>(API_CLASSES),
          axios.get<RoleOption[]>(API_ROLES), // Role API tidak punya "academicYear" dan "data"
        ]);

        setOptions({
          teachers: teachersRes.data.data,
          classes: classesRes.data.data,
          roles: rolesRes.data.filter((r) => r.role !== "Admin"), // Contoh: filter role Admin
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error("Error fetching options:", err);
        setOptions((prev) => ({
          ...prev,
          loading: false,
          error: "Gagal memuat data Guru, Kelas, atau Peran.",
        }));
      }
    };

    fetchOptions();
  }, [isVisible]);

  return options;
};

// =======================================================
// 4. KOMPONEN MODAL UTAMA
// =======================================================
const AddEditRoleModal: React.FC<AddEditRoleModalProps> = ({
  isVisible,
  mode,
  initialData,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<RoleFormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  // Menggunakan hook untuk fetch data dropdown
  const { teachers, classes, roles, loading, error } =
    useFetchOptions(isVisible);

  // Mengisi form saat mode 'edit'
  useEffect(() => {
    if (isVisible && mode === "edit" && initialData) {
      form.setFieldsValue({
        teacherId: initialData.teacherId,
        roleIds: initialData.roleIds,
        classId: initialData.classId,
      });
      setSelectedRoles(initialData.roleIds);
    } else if (isVisible && mode === "add") {
      form.resetFields();
      setSelectedRoles([]);
    }
  }, [isVisible, mode, initialData, form]);

  // Handler Perubahan Role untuk logika Homebase
  const handleRoleChange = (checkedValues: any) => {
    setSelectedRoles(checkedValues as number[]);
    // Jika tidak ada peran pemicu yang terpilih, hapus Homebase dari form
    if (
      !checkedValues.some((id: number) => HOMEBASE_TRIGGER_ROLES.includes(id))
    ) {
      form.setFieldsValue({ classId: undefined });
    }
  };

  // Cek apakah Homebase harus ditampilkan
  const showHomebase = selectedRoles.some((id) =>
    HOMEBASE_TRIGGER_ROLES.includes(id)
  );

  // Handler Submit Form
  const onFinish = async (values: RoleFormValues) => {
    setIsSubmitting(true);

    // Data Class ID (hanya disertakan jika peran pemicu dipilih)
    const class_id = showHomebase ? values.classId : undefined;

    const payload = {
      teacher_id: values.teacherId,
      role_id: values.roleIds,
      class_id: class_id,
    };

    let url = API_ROLE_TEACHERS;
    let method: "post" | "put" = "post";
    let successMessage = `Tambah data peran guru berhasil!`;

    if (mode === "edit" && initialData?.id) {
      // Skenario Edit: Menggunakan PUT ke URL dengan ID
      url = `${API_ROLE_TEACHERS}/${initialData.id}`;
      method = "put";
      successMessage = `Edit data peran guru berhasil!`;
    }

    try {
      // Gunakan axios generic request dengan properti method dan data
      const response = await axios({
        method,
        url,
        data: payload,
      });

      if (response.status === 201 || response.status === 200) {
        toast.success(successMessage);
        onSuccess();
        onClose();
      } else {
        throw new Error(`Gagal menyimpan data: Status ${response.status}`);
      }
    } catch (error) {
      let errorMessage = `Gagal ${
        mode === "add" ? "menambahkan" : "mengubah"
      } data.`;
      if (axios.isAxiosError(error) && error.response) {
        // Asumsi pesan error ada di error.response.data.message
        errorMessage = error.response.data.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = mode === "add" ? "Add Teacher Role" : "Edit Teacher Role";

  return (
    <>
      <Modal
        title={title}
        open={isVisible}
        onCancel={onClose}
        footer={null}
        destroyOnClose={true}
      >
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <Spin tip="Memuat opsi..." />
          </div>
        ) : error ? (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 15 }}
          />
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              roleIds: [],
            }}
          >
            {/* Pilih Guru */}
            <Form.Item
              label="Choose teacher"
              name="teacherId"
              rules={[{ required: true, message: "Pilih salah satu guru!" }]}
            >
              <Select
                placeholder="Pilih Guru - NIY/NIP (NIP)"
                showSearch
                disabled={mode === "edit"}
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {teachers.map((t) => (
                  <Option key={t.id} value={t.id}>
                    {`${t.name} - ${t.nip}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Pilih Role */}
            <Form.Item
              label={
                <Text type="secondary">
                  Role (Wajib, pilih satu atau lebih)
                </Text>
              }
              name="roleIds"
              rules={[{ required: true, message: "Pilih minimal satu peran!" }]}
            >
              <Checkbox.Group onChange={handleRoleChange}>
                <Space direction="vertical">
                  {roles.map((r) => (
                    <Checkbox key={r.id} value={r.id}>
                      {r.role}
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </Form.Item>

            {/* Pilih Homebase (Tampil Kondisional) */}
            {showHomebase && (
              <Form.Item
                label="Choose Homebase"
                name="classId"
                rules={[{ required: showHomebase, message: "Pilih homebase!" }]}
              >
                <Select
                  placeholder="Pilih Homebase"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {classes.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {/* PERUBAHAN DI SINI: Tampilkan Kode dan Nama Kelas secara lengkap */}
                      {`${c.code} - ${c.class_name}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {/* Footer Buttons */}
            <Row justify="end" style={{ marginTop: 20 }}>
              <Space>
                <Button onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                  Save
                </Button>
              </Space>
            </Row>
          </Form>
        )}
      </Modal>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
};

export default AddEditRoleModal;
