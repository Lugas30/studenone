import React, { useState, useEffect } from "react";
import { Modal, Select, Checkbox, Form, Space, Spin, Button } from "antd";
import { toast } from "react-toastify";
import axios from "axios";

// Ambil BASE URL dari .env
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// --- 1. Definisi Tipe Data untuk Form dan API ---

interface Role {
  id: number;
  role: string;
}

// Sesuaikan dengan data API /teachers
interface TeacherOption {
  id: number;
  name: string;
  nip: string; // Menggunakan NIP sebagai identifikasi
  nuptk: string; // Jika NUPTK juga tersedia
}

interface ClassroomOption {
  id: number;
  code: string;
  class_name: string;
}

interface AddRoleFormValues {
  teacher_id: number;
  role_id: number[];
  class_id?: number;
}

interface AddTeacherRoleModalProps {
  isModalOpen: boolean;
  handleCancel: () => void;
  onSuccess: () => void; // Fungsi untuk refresh data tabel
}

// --- 2. Komponen Modal ---

const AddTeacherRoleModal: React.FC<AddTeacherRoleModalProps> = ({
  isModalOpen,
  handleCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm<AddRoleFormValues>();
  const [loading, setLoading] = useState(false);
  const [roleOptions, setRoleOptions] = useState<Role[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [classroomOptions, setClassroomOptions] = useState<ClassroomOption[]>(
    []
  );
  const [showHomebase, setShowHomebase] = useState(false);

  // ID Role yang memicu tampilnya Homebase (Homeroom Teacher=2, Homeroom Assistant=3)
  const homebaseTriggerRoleIds = [2, 3];

  // --- 3. Fungsi Ambil Data API ---

  const fetchDependencies = async () => {
    if (!API_BASE_URL) return toast.error("API URL tidak terdefinisi.");

    setLoading(true);
    try {
      // 1. Fetch Roles
      const rolesRes = await axios.get(`${API_BASE_URL}/roles`);
      setRoleOptions(rolesRes.data);

      // 2. Fetch Teachers (ENDPOINT BARU: /teachers)
      const teachersRes = await axios.get(`${API_BASE_URL}/teachers`);
      const extractedTeachers: TeacherOption[] = teachersRes.data.data.map(
        (item: any) => ({
          id: item.id,
          name: item.name,
          nip: item.nip || item.nuptk, // Gunakan NIP atau NUPTK
        })
      );
      setTeacherOptions(extractedTeachers);

      // 3. Fetch Classrooms
      const classroomRes = await axios.get(`${API_BASE_URL}/classrooms`);
      const extractedClassrooms: ClassroomOption[] = classroomRes.data.data.map(
        (item: any) => ({
          id: item.id,
          code: item.code,
          class_name: item.class_name,
        })
      );
      setClassroomOptions(extractedClassrooms);
    } catch (error) {
      console.error("Error fetching dependencies:", error);
      toast.error("Gagal memuat data Role, Guru, atau Kelas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      fetchDependencies();
      form.resetFields(); // Reset form saat modal dibuka
      setShowHomebase(false); // Sembunyikan Homebase saat modal dibuka
    }
  }, [isModalOpen]);

  // --- 4. Fungsi Submit Form ---

  const onFinish = async (values: AddRoleFormValues) => {
    if (!API_BASE_URL) return toast.error("API URL tidak terdefinisi.");

    // Validasi tambahan: Jika Homebase terlihat tapi class_id kosong
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
        // Kirim class_id hanya jika diperlukan (Homebase terlihat)
        ...(needsClassId && values.class_id && { class_id: values.class_id }),
      };

      const response = await axios.post(
        `${API_BASE_URL}/role-teachers`,
        payload
      );

      // Tampilkan pesan sukses dari API atau pesan default
      toast.success(
        response.data.message || "Peran guru berhasil ditambahkan!"
      );

      form.resetFields();
      setShowHomebase(false);
      handleCancel(); // Tutup modal
      onSuccess(); // Refresh data tabel utama
    } catch (error: any) {
      console.error("Error posting data:", error);
      const errorMessage =
        error.response?.data?.message || "Gagal menambahkan peran guru.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- 5. Fungsi Change Handler ---

  const handleRoleChange = (checkedValues: number[]) => {
    // Tentukan apakah ada ID role pemicu Homebase yang dipilih
    const shouldShow = checkedValues.some((id) =>
      homebaseTriggerRoleIds.includes(id)
    );
    setShowHomebase(shouldShow);

    // Jika Homebase disembunyikan, hapus nilai class_id dari form
    if (!shouldShow) {
      form.setFieldsValue({ class_id: undefined });
    }
  };

  return (
    <Modal
      title="Add Teacher Role"
      open={isModalOpen}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
        >
          Save
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            teacher_id: undefined,
            role_id: [],
            class_id: undefined,
          }}
        >
          {/* Choose Teacher */}
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
            >
              {teacherOptions.map((teacher) => (
                <Select.Option key={teacher.id} value={teacher.id}>
                  {/* Format tampilan sesuai gambar: Nama - NIP/NUPTK (Nomor) */}
                  {`${teacher.name} - NIY/NIP (${teacher.nip})`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Role (Wajib pilih satu atau lebih) */}
          <Form.Item
            name="role_id"
            label="Role (Wajib pilih satu atau lebih)"
            rules={[
              { required: true, message: "Please select at least one role!" },
            ]}
          >
            <Checkbox.Group onChange={handleRoleChange}>
              <Space direction="vertical">
                {roleOptions
                  // Filter role Admin (ID 1)
                  .filter((role) => role.id !== 1)
                  .map((role) => (
                    <Checkbox key={role.id} value={role.id}>
                      {role.role}
                    </Checkbox>
                  ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>

          {/* Choose Homebase (Hanya tampil jika Homeroom Teacher/Assistant dipilih) */}
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
                  <Select.Option key={classroom.id} value={classroom.id}>
                    {`${classroom.code} - ${classroom.class_name}`}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Spin>
    </Modal>
  );
};

export default AddTeacherRoleModal;
