// EditTeacherRoleModal.tsx

import React, { useState, useEffect } from "react";
import {
  Modal,
  Select,
  Checkbox,
  Form,
  Space,
  Spin,
  Button,
  message,
} from "antd";
import { toast } from "react-toastify";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const { Option } = Select;

// --- Tipe Data (Sama dengan AddTeacherRoleModal) ---
interface Role {
  id: number;
  role: string;
}
interface TeacherOption {
  id: number;
  name: string;
  nip: string;
}
interface ClassroomOption {
  id: number;
  code: string;
  class_name: string;
}
interface EditRoleFormValues {
  teacher_id: number;
  role_id: number[];
  class_id?: number;
}

interface EditTeacherRoleModalProps {
  isModalOpen: boolean;
  handleCancel: () => void;
  onSuccess: () => void;
  recordId: number; // ID record yang digunakan HANYA untuk mengambil data awal (GET)
}

const EditTeacherRoleModal: React.FC<EditTeacherRoleModalProps> = ({
  isModalOpen,
  handleCancel,
  onSuccess,
  recordId,
}) => {
  const [form] = Form.useForm<EditRoleFormValues>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [roleOptions, setRoleOptions] = useState<Role[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [classroomOptions, setClassroomOptions] = useState<ClassroomOption[]>(
    []
  );
  const [showHomebase, setShowHomebase] = useState(false);

  const homebaseTriggerRoleIds = [2, 3]; // Homeroom Teacher/Assistant ID

  // --- Fungsi Load Data Awal (Dependencies + Data Record) ---
  const loadInitialData = async () => {
    if (!API_BASE_URL) return toast.error("API URL tidak terdefinisi.");

    setInitialLoading(true);
    try {
      // 1. Fetch Dependencies (Roles, Teachers, Classrooms)
      const [rolesRes, teachersRes, classroomsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/roles`),
        axios.get(`${API_BASE_URL}/teachers`),
        axios.get(`${API_BASE_URL}/classrooms`),
      ]);
      setRoleOptions(rolesRes.data.filter((role: Role) => role.id !== 1)); // Filter Admin
      setTeacherOptions(
        teachersRes.data.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          nip: item.nip || item.nuptk,
        }))
      );
      setClassroomOptions(
        classroomsRes.data.data.map((item: any) => ({
          id: item.id,
          code: item.code,
          class_name: item.class_name,
        }))
      );

      // 2. Fetch Data Record yang akan diedit (API GET by ID)
      const recordRes = await axios.get(
        `${API_BASE_URL}/role-teachers/${recordId}`
      );
      const data = recordRes.data.data; // Sesuaikan jika struktur API berbeda

      if (data) {
        const assignedRoles = data.role_teacher_assignments.map(
          (a: any) => a.role_id
        );
        const initialClassId = data.role_teacher_assignments.find((a: any) =>
          homebaseTriggerRoleIds.includes(a.role_id)
        )?.class_id;

        // Cek apakah Homebase harus ditampilkan
        const shouldShow = assignedRoles.some((id: number) =>
          homebaseTriggerRoleIds.includes(id)
        );
        setShowHomebase(shouldShow);

        // Set nilai awal form
        form.setFieldsValue({
          teacher_id: data.teacher_id,
          role_id: assignedRoles,
          class_id: initialClassId || undefined, // Gunakan class_id yang dimuat jika ada
        });
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.error("Gagal memuat data guru atau dependensi.");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (isModalOpen && recordId) {
      loadInitialData();
    } else {
      // Reset form dan state saat modal tertutup
      form.resetFields();
      setShowHomebase(false);
    }
  }, [isModalOpen, recordId, form]); // Tambahkan form ke dependency array

  // --- Fungsi Submit Form (DIUBAH DARI PUT MENJADI POST) ---
  const onFinish = async (values: EditRoleFormValues) => {
    if (!API_BASE_URL) return toast.error("API URL tidak terdefinisi.");

    // Validasi Homebase
    const needsClassId = values.role_id?.some((id) =>
      homebaseTriggerRoleIds.includes(id)
    );
    if (needsClassId && !values.class_id) {
      return toast.warn(
        "Harap pilih Homebase karena Anda memilih Homeroom Teacher/Assistant."
      );
    }

    setLoading(true);
    try {
      const payload = {
        teacher_id: values.teacher_id,
        role_id: values.role_id,
        // Kirim class_id hanya jika diperlukan
        ...(needsClassId && values.class_id && { class_id: values.class_id }),
      };

      // *** PERUBAHAN UTAMA: Menggunakan POST ke endpoint collection untuk update ***
      const response = await axios.post(
        `${API_BASE_URL}/role-teachers`, // Endpoint POST/Create
        payload
      );
      // *************************************************************************

      toast.success(response.data.message || "Peran guru berhasil diperbarui!");

      handleCancel(); // Tutup modal
      onSuccess(); // Refresh data tabel utama
    } catch (error: any) {
      console.error("Error posting data:", error);
      const errorMessage =
        error.response?.data?.message || "Gagal memperbarui peran guru.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- Fungsi Change Handler ---
  const handleRoleChange = (checkedValues: number[]) => {
    const shouldShow = checkedValues.some((id) =>
      homebaseTriggerRoleIds.includes(id)
    );
    setShowHomebase(shouldShow);
    if (!shouldShow) {
      form.setFieldsValue({ class_id: undefined });
    }
  };

  return (
    <Modal
      title={`Edit Role Assignment (ID: ${recordId})`}
      open={isModalOpen}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading || initialLoading}
          onClick={() => form.submit()}
        >
          Save Changes
        </Button>,
      ]}
    >
      <Spin spinning={loading || initialLoading} tip="Loading data...">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* Choose Teacher (Dibuat READONLY agar tidak bisa diubah saat edit) */}
          <Form.Item
            name="teacher_id"
            label="Choose teacher"
            rules={[{ required: true, message: "Please select a teacher!" }]}
          >
            <Select
              showSearch
              placeholder="Select a teacher"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              disabled={true} // Nonaktifkan karena ini edit, Teacher seharusnya tidak berubah
            >
              {teacherOptions.map((teacher) => (
                <Option key={teacher.id} value={teacher.id}>
                  {`${teacher.name} - NIP/NUPTK (${teacher.nip})`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Role */}
          <Form.Item
            name="role_id"
            label="Role (Wajib pilih satu atau lebih)"
            rules={[
              { required: true, message: "Please select at least one role!" },
            ]}
          >
            <Checkbox.Group onChange={handleRoleChange}>
              <Space direction="vertical">
                {roleOptions.map((role) => (
                  <Checkbox key={role.id} value={role.id}>
                    {role.role}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>

          {/* Choose Homebase */}
          {showHomebase && (
            <Form.Item
              name="class_id"
              label="Choose Homebase"
              rules={[{ required: true, message: "Please select a homebase!" }]}
            >
              <Select
                showSearch
                placeholder="Select Homebase"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {classroomOptions.map((classroom) => (
                  <Option key={classroom.id} value={classroom.id}>
                    {`${classroom.code} - ${classroom.class_name}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Spin>
    </Modal>
  );
};

export default EditTeacherRoleModal;
