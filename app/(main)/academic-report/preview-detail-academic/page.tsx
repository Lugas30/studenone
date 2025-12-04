"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Table,
  Button,
  Input,
  Select,
  Row,
  Col,
  Typography,
  Breadcrumb,
  Space,
  Spin,
  Modal, // Import Modal untuk Raport
  Descriptions, // Import Descriptions untuk detail Raport
  Divider, // Import Divider untuk memisahkan bagian Raport
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const { Title } = Typography;
const { Option } = Select;

// --- 0. KONFIGURASI API ---
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// --- 1. TIPE DATA (TypeScript Interfaces) ---

interface AcademicYear {
  id: number;
  year: string;
  is_ganjil: boolean;
  is_genap: boolean;
  is_active: boolean;
}

interface Classroom {
  id: number;
  grade: string;
  section: string;
  class_name: string;
  code: string;
}

interface StudentData {
  id: number;
  nis: string;
  nisn: string;
  fullname: string;
  grade: string;
  // Tambahkan detail siswa yang relevan untuk header rapor
  place_birth: string;
  date_of_birth: string;
}

interface StudentRecord {
  id: number;
  student_id: number;
  classroom_id: number;
  student: StudentData;
}

interface AcademicRecordTable {
  key: React.Key;
  nis: string;
  fullName: string;
  studentId: number; // Kunci penting untuk memanggil API Raport
}

interface SpiritualSocialAssessment {
  predicate: string;
  description: string;
}

interface SubjectReport {
  subject_name: string;
  cognitive_score: number | string;
  cognitive_predicate: string;
  cognitive_description: string;
  skill_score: number | string;
  skill_predicate: string;
  skill_description: string;
}

interface RaportData {
  student: StudentData;
  spiSos: {
    spiritual: SpiritualSocialAssessment;
    social: SpiritualSocialAssessment;
  };
  reportSubject: {
    kelompok_a: SubjectReport[];
    kelompok_b: SubjectReport[];
  };
  doaAndHadits: {
    doa: string;
    doa_score: string;
    hadits: string;
    hadits_score: string;
  }[];
  lifeSkillAndIslamicLifeSkill: {
    islamic_life_skill: string;
    islamic_life_skill_score: string;
    life_skill: string;
    life_skill_score: string;
  }[];
  healthConditions: {
    height: number;
    weight: number;
    vision: string;
    hearing: string;
    dental: string;
    note: string;
  }[];
  recapAbsens: {
    present: number;
    absent: number;
    illness: number;
    permission: number;
  }[];
  homeroomNotes: { note: string }[];
}

// --- KOMPONEN PRINT RAPORT ACADEMIC (MODAL) ---

interface PrintRaportAcademicProps {
  studentId: number;
  isVisible: boolean;
  onClose: () => void;
  academicYear: string;
  semester: string;
  className: string;
}

const PrintRaportAcademic: React.FC<PrintRaportAcademicProps> = ({
  studentId,
  isVisible,
  onClose,
  academicYear,
  semester,
  className,
}) => {
  const [raportData, setRaportData] = useState<RaportData | null>(null);
  const [loading, setLoading] = useState(false);

  // Hitung rekap absensi total
  const totalRecapAbsens = useMemo(() => {
    if (!raportData || !raportData.recapAbsens)
      return { present: 0, absent: 0, illness: 0, permission: 0 };
    return raportData.recapAbsens.reduce(
      (acc, curr) => ({
        present: acc.present + curr.present,
        absent: acc.absent + curr.absent,
        illness: acc.illness + curr.illness,
        permission: acc.permission + curr.permission,
      }),
      { present: 0, absent: 0, illness: 0, permission: 0 }
    );
  }, [raportData]);

  // Ambil kondisi kesehatan terbaru
  const latestHealthCondition = useMemo(() => {
    if (
      !raportData ||
      !raportData.healthConditions ||
      raportData.healthConditions.length === 0
    )
      return null;
    return raportData.healthConditions[raportData.healthConditions.length - 1];
  }, [raportData]);

  useEffect(() => {
    if (!isVisible || !studentId) return;

    const fetchRaportData = async () => {
      setLoading(true);
      setRaportData(null);
      try {
        const response = await axios.get<RaportData>(
          `${BASE_URL}/rapor-academic?student_id=${studentId}`
        );
        setRaportData(response.data);
        toast.success(
          `Data Rapor ${response.data.student.fullname} berhasil dimuat.`
        );
      } catch (error) {
        toast.error(
          `Gagal mengambil data rapor untuk Student ID ${studentId}.`
        );
        console.error("Error fetching raport data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRaportData();
  }, [studentId, isVisible]);

  // Kolom untuk Tabel Nilai Mata Pelajaran
  const subjectColumns: ColumnsType<SubjectReport> = [
    {
      title: "Mata Pelajaran",
      dataIndex: "subject_name",
      key: "name",
      width: 200,
    },
    {
      title: "Nilai Kognitif",
      key: "cognitive",
      children: [
        {
          title: "Nilai",
          dataIndex: "cognitive_score",
          key: "cScore",
          width: 60,
          align: "center",
        },
        {
          title: "Predikat",
          dataIndex: "cognitive_predicate",
          key: "cPred",
          width: 80,
          align: "center",
        },
        {
          title: "Deskripsi",
          dataIndex: "cognitive_description",
          key: "cDesc",
        },
      ],
    },
    {
      title: "Nilai Keterampilan",
      key: "skill",
      children: [
        {
          title: "Nilai",
          dataIndex: "skill_score",
          key: "sScore",
          width: 60,
          align: "center",
        },
        {
          title: "Predikat",
          dataIndex: "skill_predicate",
          key: "sPred",
          width: 80,
          align: "center",
        },
        { title: "Deskripsi", dataIndex: "skill_description", key: "sDesc" },
      ],
    },
  ];

  const RaportContent = (
    <div style={{ padding: "20px", backgroundColor: "#fff" }}>
      <Title level={4} style={{ textAlign: "center" }}>
        RAPOR HASIL BELAJAR PESERTA DIDIK
      </Title>
      <Title level={5} style={{ textAlign: "center", marginTop: -10 }}>
        TAHUN AJARAN {academicYear} SEMESTER {semester.toUpperCase()}
      </Title>

      <Divider />

      {raportData && (
        <>
          {/* Informasi Siswa */}
          <Descriptions size="small" bordered column={{ xs: 1, sm: 2, md: 3 }}>
            <Descriptions.Item label="Nama">
              {raportData.student.fullname}
            </Descriptions.Item>
            <Descriptions.Item label="NIS">
              {raportData.student.nis}
            </Descriptions.Item>
            <Descriptions.Item label="Kelas">{className}</Descriptions.Item>
            <Descriptions.Item label="Tempat, Tgl. Lahir">
              {raportData.student.place_birth},{" "}
              {raportData.student.date_of_birth}
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left">A. Sikap Spiritual dan Sosial</Divider>
          <Descriptions
            bordered
            column={1}
            size="small"
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item
              label={
                <span style={{ fontWeight: "bold" }}>
                  Sikap Spiritual (Predikat:{" "}
                  {raportData.spiSos.spiritual.predicate})
                </span>
              }
            >
              {raportData.spiSos.spiritual.description}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <span style={{ fontWeight: "bold" }}>
                  Sikap Sosial (Predikat: {raportData.spiSos.social.predicate})
                </span>
              }
            >
              {raportData.spiSos.social.description}
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left">B. Nilai Mata Pelajaran</Divider>
          <div style={{ marginBottom: 20 }}>
            <Title level={5}>Kelompok A</Title>
            <Table
              columns={subjectColumns}
              dataSource={raportData.reportSubject.kelompok_a.map(
                (item, index) => ({ ...item, key: index })
              )}
              size="small"
              pagination={false}
              bordered
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <Title level={5}>Kelompok B</Title>
            <Table
              columns={subjectColumns}
              dataSource={raportData.reportSubject.kelompok_b.map(
                (item, index) => ({ ...item, key: index })
              )}
              size="small"
              pagination={false}
              bordered
            />
          </div>

          <Divider orientation="left">C. Catatan Guru Kelas & Absensi</Divider>
          <Descriptions
            bordered
            size="small"
            column={1}
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item label="Catatan Guru Kelas">
              {raportData.homeroomNotes.length > 0
                ? raportData.homeroomNotes[raportData.homeroomNotes.length - 1]
                    .note // Ambil catatan terbaru
                : "—"}
            </Descriptions.Item>
          </Descriptions>

          <Row gutter={16}>
            <Col span={12}>
              <Title level={5}>Kondisi Kesehatan</Title>
              <Descriptions bordered size="small" column={1}>
                {latestHealthCondition ? (
                  <>
                    <Descriptions.Item label="Tinggi/Berat Badan">
                      {latestHealthCondition.height} cm /{" "}
                      {latestHealthCondition.weight} kg
                    </Descriptions.Item>
                    <Descriptions.Item label="Penglihatan">
                      {latestHealthCondition.vision}
                    </Descriptions.Item>
                    <Descriptions.Item label="Pendengaran">
                      {latestHealthCondition.hearing}
                    </Descriptions.Item>
                    <Descriptions.Item label="Gigi">
                      {latestHealthCondition.dental}
                    </Descriptions.Item>
                    <Descriptions.Item label="Catatan Kesehatan">
                      {latestHealthCondition.note}
                    </Descriptions.Item>
                  </>
                ) : (
                  <Descriptions.Item label="Data">
                    Tidak tersedia
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Col>
            <Col span={12}>
              <Title level={5}>Rekap Ketidakhadiran</Title>
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Sakit (S)">
                  {totalRecapAbsens.illness} Hari
                </Descriptions.Item>
                <Descriptions.Item label="Izin (I)">
                  {totalRecapAbsens.permission} Hari
                </Descriptions.Item>
                <Descriptions.Item label="Tanpa Keterangan (A)">
                  {totalRecapAbsens.absent} Hari
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>

          <Divider orientation="left">D. Kegiatan Lainnya</Divider>
          {/* Tabel Doa, Hadits, Life Skill */}
          <Row gutter={16}>
            <Col span={12}>
              <Title level={5} style={{ marginBottom: 8 }}>
                Doa & Hadits
              </Title>
              <Table
                dataSource={raportData.doaAndHadits.map((item, index) => ({
                  ...item,
                  key: index,
                }))}
                columns={[
                  { title: "Doa", dataIndex: "doa", key: "doa" },
                  {
                    title: "Nilai",
                    dataIndex: "doa_score",
                    key: "doa_score",
                    width: 60,
                    align: "center",
                  },
                  { title: "Hadits", dataIndex: "hadits", key: "hadits" },
                  {
                    title: "Nilai",
                    dataIndex: "hadits_score",
                    key: "hadits_score",
                    width: 60,
                    align: "center",
                  },
                ]}
                size="small"
                pagination={false}
                bordered
              />
            </Col>
            <Col span={12}>
              <Title level={5} style={{ marginBottom: 8 }}>
                Life Skill
              </Title>
              <Table
                dataSource={raportData.lifeSkillAndIslamicLifeSkill.map(
                  (item, index) => ({ ...item, key: index })
                )}
                columns={[
                  {
                    title: "Islamic Life Skill",
                    dataIndex: "islamic_life_skill",
                    key: "ils",
                  },
                  {
                    title: "Nilai",
                    dataIndex: "islamic_life_skill_score",
                    key: "ils_score",
                    width: 60,
                    align: "center",
                  },
                  { title: "Life Skill", dataIndex: "life_skill", key: "ls" },
                  {
                    title: "Nilai",
                    dataIndex: "life_skill_score",
                    key: "ls_score",
                    width: 60,
                    align: "center",
                  },
                ]}
                size="small"
                pagination={false}
                bordered
              />
            </Col>
          </Row>
        </>
      )}
    </div>
  );

  return (
    <Modal
      title={`Rapor Akademik: ${raportData?.student.fullname || "Memuat..."}`}
      open={isVisible}
      onCancel={onClose}
      width={1000} // Lebar modal yang besar untuk konten rapor
      footer={[
        <Button key="close" onClick={onClose}>
          Tutup
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          disabled={loading || !raportData}
          onClick={() => {
            // Logika sederhana untuk print (bisa diimplementasikan lebih lanjut dengan library)
            const printWindow = window.open("", "_blank");
            printWindow?.document.write(
              "<html><head><title>Print Rapor</title>"
            );
            // Sertakan CSS Antd jika diperlukan untuk tampilan print yang bagus
            printWindow?.document.write("</head><body>");
            printWindow?.document.write(
              (document.getElementById("raport-content") as HTMLElement)
                .innerHTML
            );
            printWindow?.document.write("</body></html>");
            printWindow?.document.close();
            printWindow?.print();
          }}
        >
          Cetak Rapor
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        {/* Konten rapor dimasukkan dalam div dengan ID untuk memudahkan printing */}
        <div id="raport-content">{RaportContent}</div>
      </Spin>
    </Modal>
  );
};

// --- KOMPONEN ACADEMIC PREVIEW YANG DIMODIFIKASI ---

const AcademicPreview: React.FC = () => {
  const [academicYear, setAcademicYear] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>(
    undefined
  );
  const [selectedClassCode, setSelectedClassCode] = useState<string>("");
  const [students, setStudents] = useState<AcademicRecordTable[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // State untuk Modal Raport
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<
    number | undefined
  >(undefined);

  // --- HANDLERS ---

  const handleOpenRaport = (studentId: number) => {
    setSelectedStudentId(studentId);
    setIsModalVisible(true);
  };

  const handleCloseRaport = () => {
    setIsModalVisible(false);
    setSelectedStudentId(undefined);
  };

  const handleClassChange = (value: number) => {
    const selected = classrooms.find((c) => c.id === value);
    if (selected) {
      setSelectedClassId(selected.id);
      setSelectedClassCode(selected.code);
    }
  };

  // ... (Logika Fetch Data useEffect dan useMemo sama seperti sebelumnya) ...
  // Saya hanya akan menyertakan definisi kolom yang dimodifikasi.

  const columnsModified: ColumnsType<AcademicRecordTable> = [
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      width: "40%",
    },
    {
      title: "NIS",
      dataIndex: "nis",
      key: "nis",
      sorter: (a, b) => parseInt(a.nis) - parseInt(b.nis),
      width: "20%",
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <Space>
          <Button
            type="primary"
            // Mengubah aksi: memanggil fungsi untuk membuka modal rapor
            onClick={() => handleOpenRaport(record.studentId)}
          >
            View Report
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() =>
              toast.success(`Mendownload Laporan: ${record.fullName}`)
            }
          >
            Download
          </Button>
        </Space>
      ),
      width: "30%",
    },
  ];

  // Logika Fetch Data dan Filter (dianggap sama dengan kode sebelumnya)

  // 3.1. Fetch Academic Year dan Semester
  useEffect(() => {
    const fetchAcademicYear = async () => {
      try {
        const response = await axios.get<AcademicYear[]>(
          `${BASE_URL}/academic-years`
        );
        const activeYear = response.data.find((year) => year.is_active);

        if (activeYear) {
          const activeSemester = activeYear.is_ganjil
            ? "Ganjil"
            : activeYear.is_genap
            ? "Genap"
            : "T/A";
          setAcademicYear(activeYear.year);
          setSemester(activeSemester);
        } else {
          setAcademicYear("T/A");
          setSemester("T/A");
        }
      } catch (error) {
        toast.error("Gagal mengambil data Tahun Ajaran.", { autoClose: 3000 });
      }
    };
    fetchAcademicYear();
  }, []);

  // 3.2. Fetch Classrooms
  useEffect(() => {
    const fetchClassrooms = async () => {
      setLoading(true);
      try {
        const response = await axios.get<{ data: Classroom[] }>(
          `${BASE_URL}/classrooms`
        );
        setClassrooms(response.data.data);

        if (response.data.data.length > 0) {
          const defaultClass = response.data.data[0];
          setSelectedClassId(defaultClass.id);
          setSelectedClassCode(defaultClass.code);
        }
      } catch (error) {
        toast.error("Gagal mengambil data Kelas.", { autoClose: 3000 });
      } finally {
        setLoading(false);
      }
    };
    fetchClassrooms();
  }, []);

  // 3.3. Fetch Students by Selected Classroom ID
  useEffect(() => {
    if (!selectedClassId) return;

    const fetchStudents = async () => {
      setLoading(true);
      setStudents([]);
      try {
        const response = await axios.get<{ data: StudentRecord[] }>(
          `${BASE_URL}/student/classroom?classroom=${selectedClassId}`
        );

        const studentList: AcademicRecordTable[] = response.data.data.map(
          (record) => ({
            key: record.student.nis,
            nis: record.student.nis.replace(/^0+/, ""),
            fullName: record.student.fullname,
            studentId: record.student_id, // Penting!
          })
        );
        setStudents(studentList);
      } catch (error) {
        toast.error(
          `Gagal mengambil data siswa untuk kelas ID ${selectedClassId}.`
        );
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedClassId, selectedClassCode]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return students;
    return students.filter(
      (record) =>
        record.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.nis.includes(searchTerm)
    );
  }, [students, searchTerm]);

  const currentClassDetails = classrooms.find((c) => c.id === selectedClassId);
  const currentClassName = currentClassDetails
    ? `${currentClassDetails.class_name} (${selectedClassCode})`
    : `${selectedClassCode}`;

  return (
    <div style={{ padding: "24px" }}>
      <ToastContainer position="top-right" />

      {/* Konten Academic Preview (sama seperti sebelumnya) */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>Home</Breadcrumb.Item>
        <Breadcrumb.Item>Academic Report</Breadcrumb.Item>
        <Breadcrumb.Item>Academic Preview</Breadcrumb.Item>
      </Breadcrumb>

      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Academic Preview
          </Title>
        </Col>
        <Col>
          <Title level={3} style={{ margin: 0, fontWeight: "normal" }}>
            {academicYear} ({semester})
          </Title>
        </Col>
      </Row>

      <Row gutter={16} align="middle" style={{ marginBottom: 24 }}>
        <Col flex="auto">
          <Input
            placeholder="Search Full Name atau NIS..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col>
          <Select
            value={selectedClassId}
            style={{ width: 120 }}
            onChange={handleClassChange}
            loading={loading && classrooms.length === 0}
            disabled={loading && classrooms.length === 0}
            placeholder="Pilih Kelas"
          >
            {classrooms.map((c) => (
              <Option key={c.id} value={c.id}>
                {c.code}
              </Option>
            ))}
          </Select>
        </Col>
        <Col>
          <Button
            type="primary"
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
            onClick={() =>
              toast.info(`Filter diterapkan untuk Kelas: ${selectedClassCode}`)
            }
          >
            Apply Filter
          </Button>
        </Col>
        <Col>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => toast.info("Mempersiapkan data untuk diunduh...")}
          />
        </Col>
      </Row>

      <Title level={4} style={{ marginTop: 0, marginBottom: 24 }}>
        Class : {currentClassName}
      </Title>

      <Spin spinning={loading}>
        <Table
          columns={columnsModified} // Menggunakan kolom yang dimodifikasi
          dataSource={filteredData}
          pagination={false}
          style={{
            borderTop: "1px solid #f0f0f0",
            borderBottom: "1px solid #f0f0f0",
          }}
          className="academic-preview-table"
          locale={{ emptyText: "Tidak ada data siswa ditemukan." }}
        />
      </Spin>

      {/* 5. Komponen Modal Raport */}
      {selectedStudentId && (
        <PrintRaportAcademic
          studentId={selectedStudentId}
          isVisible={isModalVisible}
          onClose={handleCloseRaport}
          academicYear={academicYear}
          semester={semester}
          className={currentClassName}
        />
      )}

      {/* Global Style Override */}
      <style jsx global>{`
        .academic-preview-table .ant-table-cell:has(.ant-space) {
          text-align: right;
        }
        .academic-preview-table .ant-table-thead > tr > th {
          background: #fafafa !important;
          border-bottom: 1px solid #f0f0f0 !important;
          font-weight: bold;
        }
        .academic-preview-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f0f0f0 !important;
        }
      `}</style>
    </div>
  );
};

export default AcademicPreview;
