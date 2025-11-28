// components/ViewRoleModal.tsx
import React from "react";
import {
  Modal,
  Typography,
  Descriptions,
  Spin,
  Alert,
  Tag,
  Button,
} from "antd";

const { Title, Text } = Typography;

// Definisikan Tipe Data yang sama dengan yang digunakan di RoleAssignmentPage
interface TeacherRoleData {
  key: number;
  id: number; // ID RoleTeacher
  teacherId: number; // ID Guru
  NIP: string;
  teacherName: string;
  gender: "L" | "P";
  role: string; // Gabungan dari semua peran (string)
  roleIds: number[]; // ID Role dalam bentuk array
  classId: number | undefined; // ID Homebase
  homeroomDisplay: string; // Nama Homebase (Code - Class Name)
}

interface ViewRoleModalProps {
  isVisible: boolean;
  data: TeacherRoleData | null;
  onClose: () => void;
}

const ViewRoleModal: React.FC<ViewRoleModalProps> = ({
  isVisible,
  data,
  onClose,
}) => {
  return (
    <Modal
      title={<Title level={4}>Detail Role Assignment</Title>}
      open={isVisible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Tutup
        </Button>,
      ]}
      width={600}
    >
      {data ? (
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="ID Assignment">{data.id}</Descriptions.Item>
          <Descriptions.Item label="Nama Guru">
            <Text strong>{data.teacherName}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="NIP">{data.NIP}</Descriptions.Item>
          <Descriptions.Item label="ID Guru (DB)">
            {data.teacherId}
          </Descriptions.Item>
          <Descriptions.Item label="Jenis Kelamin">
            {data.gender === "L" ? "Laki-laki" : "Perempuan"}
          </Descriptions.Item>
          <Descriptions.Item label="Peran (Roles)">
            {/* Memisahkan peran untuk tampilan Tag yang lebih baik */}
            {data.role.split(", ").map((roleName, index) => (
              <Tag key={index} color="blue" style={{ marginBottom: "4px" }}>
                {roleName}
              </Tag>
            ))}
          </Descriptions.Item>
          <Descriptions.Item label="Homebase (Wali Kelas)">
            <Text type={data.homeroomDisplay === "-" ? "secondary" : undefined}>
              {data.homeroomDisplay}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Alert message="Memuat data..." type="info" showIcon />
      )}
    </Modal>
  );
};

export default ViewRoleModal;
