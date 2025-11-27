// src/components/KnowledgeSkillFormModal.tsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Modal,
  Form,
  Select,
  Input,
  Button,
  Spin,
  Row,
  Col,
  Typography,
} from "antd";
import axios from "axios";
import { toast } from "react-toastify";
import { LoadingOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Text } = Typography;

// --- Definisi Tipe Data ---

interface SubjectTeacher {
  id: number;
  subject_id: number;
  subject: {
    id: number;
    name: string;
    grade: string;
  };
  teacher: {
    name: string;
  };
  subject_teacher_classes: {
    classroom: {
      grade: string;
    };
  }[];
}

interface InitialFormData {
  id?: number;
  subject_id: number;
  grade: number;
  knowledge: string;
  skill: string;
}

interface KnowledgeSkillFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (mode: "add" | "edit") => void;
  activeGrade: number;
  initialData?: InitialFormData;
}

// --- Konfigurasi ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const SUBJECT_TEACHERS_ENDPOINT = "/subject-teachers";
const INDICATOR_ENDPOINT = "/indicator-knowledge-skill";

const KnowledgeSkillFormModal: React.FC<KnowledgeSkillFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  activeGrade,
  initialData,
}) => {
  const [form] = Form.useForm();
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [subjectTeacherName, setSubjectTeacherName] = useState<string | null>(
    null
  );

  const isEditMode = useMemo(() => !!initialData?.id, [initialData]);
  const modalTitle = isEditMode
    ? "Edit Knowledge & Skill"
    : "Add Knowledge & Skill";

  // --- Ambil Data Subject & Teacher ---
  const fetchSubjectTeachers = useCallback(async () => {
    setFormLoading(true);
    try {
      const response = await axios.get<{ data: SubjectTeacher[] }>(
        `${API_BASE_URL}${SUBJECT_TEACHERS_ENDPOINT}`
      );
      setSubjectTeachers(response.data.data);
    } catch (error) {
      toast.error("Gagal memuat data Mata Pelajaran dan Guru.");
      console.error("Fetch subject teachers error:", error);
    } finally {
      setFormLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSubjectTeachers();
    }
  }, [isOpen, fetchSubjectTeachers]);

  useEffect(() => {
    // Reset fields dan set nilai awal saat modal dibuka atau initialData berubah
    form.resetFields();
    setSubjectTeacherName(null);

    if (isOpen) {
      if (isEditMode && initialData) {
        // Set form values untuk mode Edit
        form.setFieldsValue({
          subject_id: initialData.subject_id,
          knowledge: initialData.knowledge,
          skill: initialData.skill,
        });

        // Cari dan set nama guru di mode Edit
        const initialSubject = subjectTeachers.find(
          (st) => st.subject_id === initialData.subject_id
        );
        setSubjectTeacherName(initialSubject?.teacher.name || "-");
      } else {
        // Clear form untuk mode Add
        form.setFieldsValue({
          subject_id: undefined,
          knowledge: "",
          skill: "",
        });
      }
    }
  }, [isOpen, initialData, isEditMode, form, subjectTeachers]);

  // --- Filtering dan Mapping Data Subject ---

  const subjectOptions = useMemo(() => {
    if (subjectTeachers.length === 0) return [];

    const gradeString = String(activeGrade);

    const filteredSubjects = subjectTeachers.filter((st) => {
      // Filter subjek yang diajar di kelas dengan grade yang aktif
      return st.subject_teacher_classes.some(
        (stc) => String(stc.classroom.grade) === gradeString
      );
    });

    return filteredSubjects.map((st) => ({
      value: st.subject_id,
      label: st.subject.name,
      teacherName: st.teacher.name,
    }));
  }, [subjectTeachers, activeGrade]);

  // --- Handlers ---

  const handleSubjectChange = (subjectId: number) => {
    // Cari nama guru berdasarkan subject_id yang dipilih
    const selectedSubject = subjectOptions.find(
      (opt) => opt.value === subjectId
    );
    setSubjectTeacherName(selectedSubject?.teacherName || null);
  };

  const handleSubmit = async (values: any) => {
    if (!API_BASE_URL) {
      toast.error("API Base URL tidak ditemukan di .env!");
      return;
    }

    setLoading(true);

    const payload = {
      subject_id: values.subject_id,
      grade: activeGrade,
      knowledge: values.knowledge,
      skill: values.skill,
    };

    try {
      // FIX: Pengecekan eksplisit untuk initialData dan initialData.id
      if (isEditMode && initialData && initialData.id) {
        // EDIT Mode (PATCH)
        await axios.patch(
          `${API_BASE_URL}${INDICATOR_ENDPOINT}/${initialData.id}`,
          payload
        );
        toast.success("Data Knowledge & Skill berhasil diperbarui!");
        onSuccess("edit");
      } else {
        // ADD Mode (POST)
        await axios.post(`${API_BASE_URL}${INDICATOR_ENDPOINT}`, payload);
        toast.success("Data Knowledge & Skill berhasil ditambahkan!");
        onSuccess("add");
      }
      onClose();
    } catch (error) {
      toast.error(
        `Gagal ${
          isEditMode ? "memperbarui" : "menambahkan"
        } data. Pastikan semua field benar.`
      );
      console.error("Submission error:", error);
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
          loading={loading}
          onClick={form.submit}
        >
          Submit
        </Button>,
      ]}
      width={600}
    >
      <Spin
        spinning={formLoading}
        tip="Memuat subjek..."
        indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ grade: activeGrade }}
          style={{ paddingTop: "20px" }}
        >
          {/* Baris 1: Subject Name (Select) dan Subject Teacher (Static Input) */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Subject Name"
                name="subject_id"
                rules={[
                  { required: true, message: "Wajib memilih Mata Pelajaran!" },
                ]}
              >
                <Select
                  placeholder="Pilih Mata Pelajaran"
                  onChange={handleSubjectChange}
                  options={subjectOptions}
                  showSearch
                  optionFilterProp="label"
                  disabled={loading || formLoading}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Subject Teacher">
                <Input
                  value={subjectTeacherName || "Belum dipilih"}
                  readOnly
                  placeholder="Nama Guru"
                  style={{ backgroundColor: "#f5f5f5" }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Baris 2: Knowledge (TextArea) */}
          <Form.Item
            label="Knowledge"
            name="knowledge"
            rules={[{ required: true, message: "Wajib mengisi Knowledge!" }]}
          >
            <TextArea
              rows={4}
              placeholder="Masukkan indikator Knowledge..."
              disabled={loading}
            />
          </Form.Item>

          {/* Baris 3: Skill (TextArea) */}
          <Form.Item
            label="Skill"
            name="skill"
            rules={[{ required: true, message: "Wajib mengisi Skill!" }]}
          >
            <TextArea
              rows={4}
              placeholder="Masukkan indikator Skill..."
              disabled={loading}
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default KnowledgeSkillFormModal;
