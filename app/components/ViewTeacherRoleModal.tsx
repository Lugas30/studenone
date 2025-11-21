// ViewTeacherRoleModal.tsx

import React, { useState, useEffect } from "react";
import {
  Modal,
  Spin,
  Descriptions,
  Tag,
  Space,
  Typography,
  Button,
} from "antd";
import { toast } from "react-toastify";
import axios from "axios";

const { Item } = Descriptions;
const { Title, Text } = Typography;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// --- Tipe Data untuk Tampilan ---
interface RoleViewData {
  id: number;
  teacherName: string;
  nip: string;
  gender: string;
  roles: string[];
  homebaseClass: string;
  academicYear: string;
}

interface ViewTeacherRoleModalProps {
  isModalOpen: boolean;
  handleCancel: () => void;
  recordId: number;
}

const ViewTeacherRoleModal: React.FC<ViewTeacherRoleModalProps> = ({
  isModalOpen,
  handleCancel,
  recordId,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RoleViewData | null>(null);

  // --- Fungsi Load Data View (API GET by ID) ---
  const loadViewData = async () => {
    if (!API_BASE_URL) return toast.error("API URL tidak terdefinisi.");

    setLoading(true);
    setData(null); // Reset data sebelumnya

    try {
      // Fetch Data Record yang akan dilihat
      const recordRes = await axios.get(
        `${API_BASE_URL}/role-teachers/${recordId}`
      );
      const apiData = recordRes.data.data; // Asumsi data record di sini
      const academicYear = recordRes.data.academicYear || "N/A";

      // 1. Format Data Role
      const roles = apiData.role_teacher_assignments.map(
        (a: any) => a.role.role
      );

      // 2. Tentukan Homebase (Asumsi: Role Homebase memiliki class_id yang terisi)
      const homebaseAssignment = apiData.role_teacher_assignments.find(
        (a: any) =>
          (a.role.role === "Homeroom Teacher" ||
            a.role.role === "Homeroom Assistant") &&
          a.class_id // Asumsi field class_id ada dan terisi di assignment
      );

      let homebaseClass = "Tidak Ditugaskan";
      if (homebaseAssignment) {
        // Jika Anda memiliki API Classroom, Anda perlu melakukan GET tambahan
        // atau mengasumsikan data kelasnya sudah ter-join (untuk kesederhanaan, kita asumsikan namanya 'class_name' di sini)
        // Karena data API /role-teachers/{id} tidak ditampilkan, kita akan menggunakan placeholder logika
        homebaseClass = homebaseAssignment.class_name
          ? `${homebaseAssignment.class_name} (${homebaseAssignment.class_code})`
          : "Ditugaskan (Detail Kelas tidak tersedia)";
      }

      // 3. Simpan data yang diformat
      setData({
        id: apiData.id,
        teacherName: apiData.teacher.name,
        nip: apiData.teacher.nip,
        gender: apiData.teacher.gender === "male" ? "Laki-laki" : "Perempuan",
        roles: roles,
        homebaseClass: homebaseClass,
        academicYear: academicYear,
      });
    } catch (error) {
      console.error("Error loading view data:", error);
      toast.error("Gagal memuat detail peran guru.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isModalOpen && recordId) {
      loadViewData();
    }
  }, [isModalOpen, recordId]);

  return (
    <Modal
      title={`Detail Role Assignment (ID: ${recordId})`}
      open={isModalOpen}
      onCancel={handleCancel}
      footer={[
        <Button key="close" onClick={handleCancel}>
          Close
        </Button>,
      ]}
    >
      <Spin spinning={loading} tip="Loading detail...">
        {data ? (
          <Descriptions
            bordered
            column={1}
            size="middle"
            style={{ marginTop: 20 }}
          >
            <Item label="Nama Guru">{data.teacherName}</Item>
            <Item label="NIP">{data.nip}</Item>
            <Item label="Gender">{data.gender}</Item>
            <Item label="Tahun Akademik">{data.academicYear}</Item>

            <Item label="Roles">
              <Space direction="vertical">
                {data.roles.map((role, index) => (
                  <Tag key={index} color="blue">
                    {role}
                  </Tag>
                ))}
              </Space>
            </Item>

            <Item label="Homebase">
              <Text strong>{data.homebaseClass}</Text>
            </Item>
          </Descriptions>
        ) : (
          !loading && <Text type="secondary">Data tidak ditemukan.</Text>
        )}
      </Spin>
    </Modal>
  );
};

export default ViewTeacherRoleModal;
