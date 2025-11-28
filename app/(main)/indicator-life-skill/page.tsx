// app/(main)/indicator-life-skill/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Breadcrumb,
  Select,
  Input,
  Button,
  Table,
  Space,
  Row,
  Col,
  Typography,
  theme,
  Alert,
  Modal,
  Form,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// --- Global Config ---
const { Title, Text } = Typography;
const { useToken } = theme;
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://so-api.queensland.id/api";

const gradeOptions = Array.from({ length: 6 }, (_, i) => ({
  value: String(i + 1),
  label: `Grade ${i + 1}`,
}));

// --- Type Definitions ---
interface ApiItem {
  id: number;
  grade: number;
  indicator: string;
}

interface ApiResponse {
  academicYear: string;
  semester: string;
  data: ApiItem[];
}

export type LifeSkill = {
  id: string;
  subject: string;
  grade: number;
};

export type LifeSkillCategory = "Islamic Life Skill" | "Life Skill";

interface ModalState {
  visible: boolean;
  type: LifeSkillCategory;
  mode: "add" | "edit";
  data: LifeSkill | null;
}

// --- Component: LifeSkillModal (Add/Edit) ---

interface LifeSkillModalProps {
  modalState: ModalState;
  currentGrade: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const LifeSkillModal: React.FC<LifeSkillModalProps> = ({
  modalState,
  currentGrade,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const { visible, type, mode, data } = modalState;
  const isIslamic = type === "Islamic Life Skill";
  const skillType = isIslamic ? "Islamic Life Skill" : "Life Skill";
  const apiEndpoint = isIslamic
    ? "indicator-islamic-lifeskill"
    : "indicator-lifeskill";

  const gradeDisplay = currentGrade || "N/A";
  const titleText = `${
    mode === "add" ? "Tambah" : "Edit"
  } ${skillType} (Grade ${gradeDisplay})`;

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        indicator: data ? data.subject : "",
      });
    }
  }, [visible, form, data]);

  const handleSubmit = async (values: any) => {
    if (!currentGrade) {
      toast.error("Pilih Grade terlebih dahulu sebelum menambah/mengedit!");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        grade: parseInt(currentGrade),
        indicator: values.indicator,
      };

      let response;

      if (mode === "add") {
        // API POST
        response = await axios.post(`${API_BASE_URL}/${apiEndpoint}`, payload);
      } else if (mode === "edit" && data) {
        // API PUT
        response = await axios.put(
          `${API_BASE_URL}/${apiEndpoint}/${data.id}`,
          payload
        );
      }

      toast.success(
        response?.data?.message ||
          `${skillType} berhasil ${
            mode === "add" ? "ditambahkan" : "diperbarui"
          }!`
      );
      onSuccess();
      onClose();
      form.resetFields();
    } catch (error: any) {
      console.error("API Error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        `Gagal ${mode === "add" ? "menambah" : "mengubah"} data.`;
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={titleText}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose} disabled={submitting}>
          Batal
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          onClick={form.submit}
          disabled={!currentGrade}
        >
          Simpan
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="indicator"
          label="Indikator / Subjek"
          rules={[
            { required: true, message: "Mohon masukkan indikator/subjek!" },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder={`Contoh: ${
              isIslamic ? "ADAB KETIKA MARAH" : "GARDENING"
            }`}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// --- Component: LifeSkillTable ---
interface LifeSkillTableProps {
  title: string;
  data: LifeSkill[];
  onAdd: (type: LifeSkillCategory) => void; // Updated signature
  onEdit: (item: LifeSkill) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
  isLoading?: boolean;
}

const LifeSkillTable: React.FC<LifeSkillTableProps> = ({
  title,
  data,
  onAdd,
  onEdit,
  onDelete,
  disabled,
  isLoading = false,
}) => {
  const { token } = useToken();
  const category: LifeSkillCategory = title as LifeSkillCategory;

  const columns = [
    {
      title: <span style={{ color: token.colorTextSecondary }}>Subject :</span>,
      dataIndex: "subject",
      key: "subject",
      render: (text: string) => (
        <span style={{ fontWeight: 500, fontSize: "14px" }}>{text}</span>
      ),
      sorter: (a: LifeSkill, b: LifeSkill) =>
        a.subject.localeCompare(b.subject),
    },
    {
      title: <span style={{ color: token.colorTextSecondary }}>Actions</span>,
      key: "actions",
      width: 100,
      align: "right" as const,
      render: (_: any, record: LifeSkill) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: token.colorWarning }} />}
            onClick={() => onEdit(record)}
            disabled={disabled}
          />
          <Button
            type="text"
            icon={<DeleteOutlined style={{ color: token.colorError }} />}
            onClick={() => onDelete(record.id)}
            disabled={disabled}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>{title}</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => onAdd(category)}
          disabled={disabled}
        >
          {`Add ${title}`}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={false}
        loading={isLoading}
        size="large"
        components={{
          header: {
            row: ({ children, ...props }) => (
              <tr {...props} style={{ backgroundColor: token.colorFillAlter }}>
                {children}
              </tr>
            ),
          },
        }}
        style={{ marginBottom: 40 }}
        locale={{
          emptyText: isLoading
            ? "Memuat data..."
            : disabled
            ? "Pilih Grade terlebih dahulu untuk melihat data."
            : "Tidak ada data yang ditemukan untuk Grade ini.",
        }}
      />
    </>
  );
};

// --- Main Component: LifeSkillInputPage ---
const LifeSkillInputPage: React.FC = () => {
  const [ilsList, setIlsList] = useState<LifeSkill[]>([]);
  const [lsList, setLsList] = useState<LifeSkill[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState("N/A");
  const [semester, setSemester] = useState("N/A");
  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    type: "Life Skill",
    mode: "add",
    data: null,
  });

  const isGradeSelected = selectedGrade !== null;

  // Function to fetch data from API
  const fetchData = useCallback(async () => {
    if (!selectedGrade) {
      setIlsList([]);
      setLsList([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setIlsList([]);
    setLsList([]);

    try {
      const [ilsResponse, lsResponse] = await Promise.all([
        axios.get<ApiResponse>(`${API_BASE_URL}/indicator-islamic-lifeskill`),
        axios.get<ApiResponse>(`${API_BASE_URL}/indicator-lifeskill`),
      ]);

      if (ilsResponse.data.academicYear) {
        setAcademicYear(ilsResponse.data.academicYear);
        setSemester(ilsResponse.data.semester);
      }

      const currentGradeNum = parseInt(selectedGrade);

      // Filter Islamic Life Skill (ILS)
      const filteredIls = ilsResponse.data.data
        .filter((item) => item.grade === currentGradeNum)
        .map((item) => ({
          id: String(item.id),
          subject: item.indicator,
          grade: item.grade,
        }));

      // Filter Life Skill (LS)
      const filteredLs = lsResponse.data.data
        .filter((item) => item.grade === currentGradeNum)
        .map((item) => ({
          id: String(item.id),
          subject: item.indicator,
          grade: item.grade,
        }));

      setIlsList(filteredIls);
      setLsList(filteredLs);

      if (!loading && selectedGrade && !modalState.visible)
        toast.info("Data berhasil diperbarui.", { autoClose: 1000 });
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Gagal memuat data dari API. Periksa koneksi atau URL.");
      toast.error("Gagal memuat data!");
    } finally {
      setLoading(false);
    }
  }, [selectedGrade, modalState.visible]);

  // Fetch data when component mounts or selectedGrade changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGradeChange = (value: string) => {
    setSelectedGrade(value);
  };

  const handleOpenAdd = (type: LifeSkillCategory) => {
    if (selectedGrade) {
      setModalState({ visible: true, type, mode: "add", data: null });
    } else {
      toast.warn("Pilih Grade terlebih dahulu.");
    }
  };

  const handleOpenEdit = (item: LifeSkill) => {
    if (selectedGrade) {
      const type: LifeSkillCategory = ilsList.some((i) => i.id === item.id)
        ? "Islamic Life Skill"
        : "Life Skill";
      setModalState({ visible: true, type, mode: "edit", data: item });
    } else {
      toast.warn("Pilih Grade terlebih dahulu.");
    }
  };

  const handleCloseModal = () => {
    setModalState({ ...modalState, visible: false });
  };

  const handleDelete = (id: string) => {
    console.log(`Delete skill ID: ${id}`);
    if (window.confirm(`Yakin ingin menghapus Life Skill ID: ${id}?`)) {
      // Logic for actual API DELETE call goes here
      toast.success(`Simulasi: Menghapus Life Skill ID: ${id}`);
    }
  };

  // Combine and filter data based on search query
  const allData: { category: LifeSkillCategory; skills: LifeSkill[] }[] = [
    { category: "Islamic Life Skill", skills: ilsList },
    { category: "Life Skill", skills: lsList },
  ];

  const filteredData = allData.map((categoryData) => ({
    ...categoryData,
    skills: categoryData.skills.filter((skill) =>
      skill.subject.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }));

  return (
    <div style={{ padding: "24px" }}>
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

      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>Life Skill</Breadcrumb.Item>
      </Breadcrumb>

      <Row justify="space-between" align="top" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={1} style={{ margin: 0, fontWeight: 500 }}>
            Life Skill Indicator
          </Title>
        </Col>
        <Col style={{ textAlign: "right" }}>
          <Title
            level={2}
            style={{ margin: 0, fontWeight: "normal", fontSize: "20px" }}
          >
            {academicYear} ({semester})
          </Title>
          <div style={{ marginTop: 8 }}>
            <Space>
              <Text>Select grade :</Text>
              <Select
                value={selectedGrade}
                style={{ width: 120 }}
                onChange={handleGradeChange}
                options={gradeOptions}
                placeholder="Select Grade"
                disabled={loading}
              />
            </Space>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 20 }}
        />
      )}

      <div style={{ marginBottom: 40, width: "300px" }}>
        <Input
          prefix={<SearchOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
          placeholder="Cari Subjek Life Skill..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={!isGradeSelected}
        />
      </div>

      {filteredData.map((categoryData) => (
        <LifeSkillTable
          key={categoryData.category}
          title={categoryData.category}
          data={categoryData.skills}
          isLoading={loading}
          onAdd={handleOpenAdd}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          disabled={!isGradeSelected || loading}
        />
      ))}

      <LifeSkillModal
        modalState={modalState}
        currentGrade={selectedGrade}
        onClose={handleCloseModal}
        onSuccess={fetchData} // Refresh data after success
      />
    </div>
  );
};

export default LifeSkillInputPage;
