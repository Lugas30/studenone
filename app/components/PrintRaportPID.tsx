// components/PrintRaportPID.tsx
"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  Modal,
  Typography,
  Divider,
  Spin,
  message,
  Row,
  Col,
  Table,
  Space,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import axios from "axios";
import type { ColumnsType } from "antd/es/table";
// Library PDF
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import logo_so from "../../public/images/logo-so.png";
import logo_tutwuri from "../../public/images/logo-tutwuri.jpg";

const { Title, Text } = Typography;

// Definisikan BASE_URL dan IMAGE_URL dari environment variable
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const IMAGE_URL = process.env.NEXT_PUBLIC_API_IMAGE_URL;

// --- Definisi Tipe Data (Tetap Sama) ---
interface Teacher {
  id: number;
  name: string;
  nip: string | null;
  signature: string | null;
  is_active: boolean;
}

interface TeachersResponse {
  academicYear: string;
  data: Teacher[];
}

interface HeadOfUnit {
  id: number;
  name: string;
  nip: string | null;
  responsibility_area: string;
  gender: string;
  signature: string | null;
}

interface HeadOfUnitsResponse {
  academicYear: string;
  data: HeadOfUnit[];
}

interface Indicator {
  id: number;
  ic: number;
  indicator: string;
  domain: string;
  predicate: string | null;
  description: string | null;
}

interface Subthema {
  id: number;
  subthema: string;
  indicators: Indicator[];
}

interface Thema {
  id: number;
  thema: string;
  subthemas: Subthema[];
}

interface PidAssessment {
  themas: Thema[];
}

interface ReportItem {
  subject: {
    id: number;
    name: string;
  };
  pidAssessment: PidAssessment;
}

interface StudentData {
  id: number;
  nis: string;
  nisn: string;
  fullname: string;
  notes: string | null;
  homeroom_teacher_id?: number | null;
  classrooms: {
    grade: string;
    section: string;
    class_name: string;
    code: string;
  }[];
}

interface ApiReportResponse {
  students: StudentData;
  reportData: ReportItem[];
}

interface DisplayIndicatorData {
  key: string;
  themaName: string;
  subthemaName: string;
  indicator: string;
  predicate: string | null;
  rowSpanThema: number;
  rowSpanSubthema: number;
}

interface DisplaySubjectData {
  subjectName: string;
  indicators: DisplayIndicatorData[];
  subjectDescription: string | null;
}

interface PrintRaportPIDProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number | null;
  periode: string;
  academicYearDisplay: string;
}

const periodeMapApi: { [key: string]: string } = {
  "Triwulan 1": "triwulan_1",
  "Triwulan 2": "triwulan_2",
  "Triwulan 3": "triwulan_3",
  "Triwulan 4": "triwulan_4",
};

const determineFase = (
  gradeString: string | undefined
): "A" | "B" | "C" | "-" => {
  if (!gradeString) {
    return "-";
  }

  const gradeMatch = gradeString.match(/\d+/);
  if (gradeMatch) {
    const grade = parseInt(gradeMatch[0], 10);
    if (grade >= 1 && grade <= 2) {
      return "A"; // Grade 1-2 = Fase A
    } else if (grade >= 3 && grade <= 4) {
      return "B"; // Grade 3-4 = Fase B
    } else if (grade >= 5 && grade <= 6) {
      return "C"; // Grade 5-6 = Fase C
    }
  }

  return "-";
};

const renderGradeCell = (predicate: string | null, target: "T" | "C" | "I") => {
  return (
    <div style={{ textAlign: "center" }}>
      {predicate === target ? <CheckOutlined style={{ color: "#000" }} /> : ""}
    </div>
  );
};

const pidColumns: ColumnsType<DisplayIndicatorData> = [
  {
    title: "No",
    dataIndex: "key",
    key: "key",
    width: 50,
    align: "center",
    render: (value) => value,
  },
  {
    title: "Theme",
    dataIndex: "themaName",
    key: "themaName",
    width: 150,
    render: (value, row) => {
      const obj = {
        children: <Text>{value}</Text>,
        props: { rowSpan: row.rowSpanThema },
      };
      return row.rowSpanThema === 0
        ? { children: "", props: { rowSpan: 0 } }
        : obj;
    },
  },
  {
    title: "Sub Theme",
    dataIndex: "subthemaName",
    key: "subthemaName",
    width: 200,
    render: (value, row) => {
      const obj = {
        children: value,
        props: { rowSpan: row.rowSpanSubthema },
      };
      return row.rowSpanSubthema === 0
        ? { children: "", props: { rowSpan: 0 } }
        : obj;
    },
  },
  {
    title: "Indicators",
    dataIndex: "indicator",
    key: "indicator",
    width: 400,
  },
  {
    title: "Grade",
    children: [
      {
        title: "Thorough",
        dataIndex: "predicateT",
        key: "T",
        width: 100,
        align: "center",
        render: (text, record) => renderGradeCell(record.predicate, "T"),
      },
      {
        title: "Complete",
        dataIndex: "predicateC",
        key: "C",
        width: 100,
        align: "center",
        render: (text, record) => renderGradeCell(record.predicate, "C"),
      },
      {
        title: "Inchoate",
        dataIndex: "predicateI",
        key: "I",
        width: 100,
        align: "center",
        render: (text, record) => renderGradeCell(record.predicate, "I"),
      },
    ],
  },
];

const PrintRaportPID: React.FC<PrintRaportPIDProps> = ({
  isOpen,
  onClose,
  studentId,
  periode,
  academicYearDisplay,
}) => {
  // --- REFERENSI DOM UNTUK PDF ---
  const reportContentRef = useRef<HTMLDivElement>(null);

  const [reportData, setReportData] = useState<ApiReportResponse | null>(null);
  const [displaySubjectData, setDisplaySubjectData] = useState<
    DisplaySubjectData[]
  >([]);
  // --- State untuk Tanda Tangan ---
  const [headmasterData, setHeadmasterData] = useState<HeadOfUnit | null>(null);
  const [homeroomData, setHomeroomData] = useState<Teacher | null>(null);

  // --- State Loading ---
  const [isLoading, setIsLoading] = useState(false);
  const [isSignatureLoading, setIsSignatureLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const schoolName = "STUDENT ONE ISLAMIC SCHOOL";

  const studentDetail = reportData?.students;
  const classDetail = studentDetail?.classrooms?.[0];

  const calculatedFase = determineFase(classDetail?.grade);

  const transformReportData = useCallback(
    (apiData: ApiReportResponse): DisplaySubjectData[] => {
      const subjectData: DisplaySubjectData[] = [];

      apiData.reportData.forEach((reportItem) => {
        const currentSubject: DisplaySubjectData = {
          subjectName: reportItem.subject.name,
          indicators: [],
          subjectDescription: null,
        };

        let themaStartIndex = 0;
        let firstDescription: string | null = null;

        reportItem.pidAssessment.themas.forEach((thema) => {
          thema.subthemas.forEach((subthema) => {
            const initialIndicatorsCount = currentSubject.indicators.length;

            subthema.indicators.forEach((indicator) => {
              if (firstDescription === null && indicator.description) {
                firstDescription = indicator.description;
              }

              currentSubject.indicators.push({
                key: "",
                themaName: thema.thema,
                subthemaName: subthema.subthema,
                indicator: indicator.indicator,
                predicate: indicator.predicate,
                rowSpanThema: 1,
                rowSpanSubthema: 1,
              });
            });

            const subthemaLength =
              currentSubject.indicators.length - initialIndicatorsCount;
            if (subthemaLength > 0) {
              currentSubject.indicators[
                initialIndicatorsCount
              ].rowSpanSubthema = subthemaLength;
              for (
                let i = initialIndicatorsCount + 1;
                i < currentSubject.indicators.length;
                i++
              ) {
                currentSubject.indicators[i].rowSpanSubthema = 0;
              }
            }
          });

          const themaLength =
            currentSubject.indicators.length - themaStartIndex;
          if (themaLength > 0) {
            currentSubject.indicators[themaStartIndex].rowSpanThema =
              themaLength;
            for (
              let i = themaStartIndex + 1;
              i < currentSubject.indicators.length;
              i++
            ) {
              currentSubject.indicators[i].rowSpanThema = 0;
            }
          }
          themaStartIndex = currentSubject.indicators.length;
        });

        currentSubject.indicators.forEach((item, index) => {
          item.key = (index + 1).toString();
        });

        currentSubject.subjectDescription = firstDescription;

        subjectData.push(currentSubject);
      });

      return subjectData;
    },
    []
  );

  // --- FUNGSI FETCH HOMEROOM TEACHER ---
  const fetchHomeroomData = useCallback(
    async (homeroomTeacherId: number | null) => {
      if (!BASE_URL || !homeroomTeacherId) {
        setHomeroomData(null);
        return;
      }

      const apiUrl = `${BASE_URL}/teachers`;

      try {
        const response = await axios.get<TeachersResponse>(apiUrl);
        const homeroom = response.data.data.find(
          (teacher) => teacher.id === homeroomTeacherId && teacher.is_active
        );

        if (homeroom) {
          setHomeroomData(homeroom);
        } else {
          console.warn(
            `Homeroom Teacher dengan ID ${homeroomTeacherId} tidak ditemukan.`
          );
          setHomeroomData(null);
        }
      } catch (error) {
        console.error("Error fetching homeroom detail:", error);
        setHomeroomData(null);
      }
    },
    []
  );
  // --- AKHIR FUNGSI FETCH HOMEROOM TEACHER ---

  // --- FUNGSI FETCH KEPALA SEKOLAH ---
  const fetchHeadmasterData = useCallback(async () => {
    if (!BASE_URL) {
      setHeadmasterData(null);
      return;
    }

    const apiUrl = `${BASE_URL}/headofunits`;

    try {
      const response = await axios.get<HeadOfUnitsResponse>(apiUrl);
      const primaryHeadmaster = response.data.data.find(
        (unit) =>
          unit.responsibility_area === "primary" && unit.gender === "headmaster"
      );

      if (primaryHeadmaster) {
        setHeadmasterData(primaryHeadmaster);
      } else {
        setHeadmasterData(response.data.data[0] || null);
      }
    } catch (error) {
      console.error("Error fetching headmaster detail:", error);
      setHeadmasterData(null);
    }
  }, []);
  // --- AKHIR FUNGSI FETCH KEPALA SEKOLAH ---

  const fetchReportDetail = useCallback(
    async (sId: number, p: string) => {
      if (!sId || !p) return;

      setIsLoading(true);
      const apiPeriode = periodeMapApi[p];

      const apiUrl = `${BASE_URL}/raport-student`;

      try {
        const response = await axios.get<ApiReportResponse>(apiUrl, {
          params: {
            student_id: sId,
            periode: apiPeriode,
          },
        });

        const apiData = response.data;

        // --- ASUMSI UNTUK DEMONSTRASI: Inject homeroom_teacher_id ---
        const studentDataWithHomeroom = {
          ...apiData.students,
          homeroom_teacher_id: 6, // Hardcode ID 6 untuk Fanny Ghaisani
        } as StudentData;

        apiData.students = studentDataWithHomeroom;
        // -----------------------------------------------------------

        setReportData(apiData);
        const transformed = transformReportData(apiData);
        setDisplaySubjectData(transformed);
      } catch (error) {
        console.error("Error fetching report detail:", error);
        message.error(
          "Gagal mengambil detail laporan siswa. Pastikan API tersedia."
        );
        setReportData(null);
        setDisplaySubjectData([]);
      } finally {
        setIsLoading(false);
      }
    },
    [transformReportData]
  );

  useEffect(() => {
    if (!BASE_URL) {
      message.error("NEXT_PUBLIC_API_URL belum dikonfigurasi.");
      return;
    }

    if (isOpen && studentId && periode) {
      // --- LOGIKA LOADING TANDA TANGAN DI useEffect ---
      const loadAllSignatures = async () => {
        setIsSignatureLoading(true);

        const headmasterPromise = fetchHeadmasterData();

        await fetchReportDetail(studentId, periode);

        await headmasterPromise;

        setIsSignatureLoading(false);
      };

      loadAllSignatures();
    }
  }, [isOpen, studentId, periode, fetchReportDetail, fetchHeadmasterData]);

  // Panggil fetchHomeroomData setelah reportData update
  useEffect(() => {
    if (isOpen && reportData?.students.homeroom_teacher_id) {
      fetchHomeroomData(reportData.students.homeroom_teacher_id);
    }
  }, [isOpen, reportData?.students.homeroom_teacher_id, fetchHomeroomData]);

  // ---------------------------------------------------
  // --- FUNGSI UTAMA UNTUK CETAK/SAVE PDF (Implementasi jsPDF) ---
  // ---------------------------------------------------
  const handlePrint = async () => {
    if (!reportContentRef.current || isPrinting) {
      message.error(
        "Konten rapor belum siap atau proses cetak sedang berlangsung."
      );
      return;
    }

    setIsPrinting(true);
    message.info("Memproses pembuatan PDF, mohon tunggu...");

    reportContentRef.current.classList.add("raport-pdf-mode");

    try {
      // Mengubah elemen DOM (Konten Rapor) menjadi Canvas
      const canvas = await html2canvas(reportContentRef.current, {
        scale: 2, // Meningkatkan resolusi menjadi 2x
        useCORS: true, // Penting jika ada gambar eksternal (logo/tanda tangan)
        logging: true,
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0); // Gunakan JPEG untuk ukuran file lebih kecil

      // Inisialisasi jsPDF (A4, Portrait, Satuan mm)
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let position = 0; // Posisi vertikal saat menambahkan gambar

      // Menghitung jumlah halaman yang dibutuhkan (solusi multi-halaman)
      let heightLeft = imgHeight;

      // Halaman pertama
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Tambahkan halaman berikutnya jika konten lebih panjang dari satu halaman
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Tentukan nama file
      const fileName = `Raport_PID_${studentDetail?.fullname.replace(
        /\s/g,
        "_"
      )}_${periode}.pdf`;
      pdf.save(fileName);

      message.success("PDF Rapor berhasil dibuat dan diunduh!");
    } catch (error) {
      console.error("Gagal membuat PDF:", error);
      message.error("Gagal membuat PDF. Periksa log konsol untuk detail.");
    } finally {
      // Hapus class khusus setelah selesai
      reportContentRef.current.classList.remove("raport-pdf-mode");
      setIsPrinting(false);
    }
  };
  // ---------------------------------------------------

  const semesterDisplay =
    periode.includes("1") || periode.toLowerCase().includes("ganjil")
      ? "1 (GANJIL)"
      : "2 (GENAP)";

  const classNameDisplay = classDetail ? classDetail.class_name : "-";

  // --- KOMPONEN HEADER (Tetap Sama) ---
  const ReportHeader = () => (
    <div style={{ padding: "0 20px 20px", borderBottom: "1px solid #f0f0f0" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        {/* Logo Kiri (Student One) */}
        <div style={{ width: "120px", height: "auto" }}>
          <img
            src={logo_so.src}
            alt="Student One Logo"
            style={{ width: "120px", height: "auto" }}
            crossOrigin="anonymous"
          />
        </div>

        {/* Judul Tengah */}
        <div style={{ textAlign: "center", flexGrow: 1 }}>
          <Title level={5} style={{ margin: 0, fontWeight: "normal" }}>
            PERSONAL INDICATORS OF DEVELOPMENT REPORT
          </Title>
          <Title level={3} style={{ margin: "5px 0 0", color: "#000" }}>
            {schoolName}
          </Title>
        </div>

        {/* Logo Kanan (Kemendikbud/Tut Wuri Handayani) */}
        <div style={{ width: "100px", height: "auto" }}>
          <img
            src={logo_tutwuri.src}
            alt="Kemendikbud Logo"
            style={{ width: "100%", height: "auto" }}
            crossOrigin="anonymous"
          />
        </div>
      </div>

      {/* Detail Siswa dan Kelas (Tabel 2 Kolom) */}
      <Row gutter={[5, 5]} style={{ fontSize: "12px" }}>
        {/* Baris 1 */}
        <Col span={5}>Nama Peserta Didik</Col>
        <Col span={7}>
          : <Text strong>{studentDetail?.fullname || "-"}</Text>
        </Col>

        <Col span={6}>Fase</Col>
        <Col span={6}>
          : <Text strong>{calculatedFase}</Text>
        </Col>

        {/* Baris 2 */}
        <Col span={6}>Name</Col>
        <Col span={6}></Col>
        <Col span={6}>Phase</Col>
        <Col span={6}></Col>

        {/* Baris 3 */}
        <Col span={5}>NIS</Col>
        <Col span={7}>: {studentDetail?.nis || "-"}</Col>
        <Col span={6}>Kelas</Col>
        <Col span={6}>
          :{" "}
          <Text strong>
            {classNameDisplay} {classDetail?.code}
          </Text>
        </Col>

        {/* Baris 4 */}
        <Col span={6}>Student's ID</Col>
        <Col span={6}></Col>
        <Col span={6}>Grade</Col>
        <Col span={6}></Col>

        {/* Baris 5 */}
        <Col span={5}>NISN</Col>
        <Col span={7}>: {studentDetail?.nisn || "-"}</Col>
        <Col span={6}>Semester</Col>
        <Col span={6}>
          : <Text strong>{semesterDisplay}</Text>
        </Col>

        {/* Baris 6 */}
        <Col span={6}>National Student's ID</Col>
        <Col span={6}></Col>
        <Col span={6}>Semester</Col>
        <Col span={6}></Col>

        {/* Baris 7 (School Name & Academic Year) */}
        <Col span={5}>Nama Sekolah</Col>
        <Col span={7}>
          : <Text strong>{schoolName}</Text>
        </Col>
        <Col span={6}>Tahun Pelajaran</Col>
        <Col span={6}>
          : <Text strong>{academicYearDisplay}</Text>
        </Col>

        {/* Baris 8 */}
        <Col span={6}>School Name</Col>
        <Col span={6}></Col>
        <Col span={6}>Academic Year</Col>
        <Col span={6}></Col>
      </Row>
    </div>
  );
  // --- AKHIR KOMPONEN HEADER ---

  // --- KOMPONEN Tanda Tangan (Perbaikan Impelementasi URL) ---
  const ReportSignature = () => {
    const formattedDate = `Gunungsindur, 20th Desember 2024`;

    // Data Kepala Sekolah
    const headmasterName = headmasterData?.name || "Nama Kepala Sekolah";
    const headmasterSignaturePath = headmasterData?.signature;

    // Data Homeroom Teacher (Wali Kelas)
    const homeroomTeacherName = homeroomData?.name || "Nama Wali Kelas";
    const homeroomSignaturePath = homeroomData?.signature;

    // PERBAIKAN: Menggabungkan IMAGE_URL dengan path tanpa menambahkan '/' lagi, karena IMAGE_URL sudah mengandung '/' di akhir.
    const headmasterSignatureUrl =
      headmasterSignaturePath && IMAGE_URL
        ? `${IMAGE_URL}${headmasterSignaturePath}`
        : null;

    const homeroomSignatureUrl =
      homeroomSignaturePath && IMAGE_URL
        ? `${IMAGE_URL}${homeroomSignaturePath}`
        : null;

    return (
      <div style={{ marginTop: "50px", fontSize: "12px" }}>
        <Row
          justify="end"
          style={{ marginBottom: "50px", marginRight: "70px" }}
        >
          <Col>
            <Text>{formattedDate}</Text>
          </Col>
        </Row>
        <Row
          justify="space-between"
          style={{ textAlign: "center", fontWeight: "bold" }}
        >
          <Col span={10}>
            <Text>Acknowledged by,</Text>
          </Col>
          <Col span={10}>
            <Text>Homeroom Teacher</Text>
          </Col>
        </Row>
        <Row
          justify="space-between"
          style={{ textAlign: "center", fontWeight: "bold" }}
        >
          <Col span={10}>
            <Text>Headmaster</Text>
          </Col>
          <Col span={10}>{/* Kosong sesuai gambar */}</Col>
        </Row>

        {/* Area Tanda Tangan */}
        <Row style={{ height: "70px" }} justify="space-between">
          {/* Tanda Tangan Kepala Sekolah */}
          <Col span={10} style={{ textAlign: "center", position: "relative" }}>
            {isSignatureLoading && (
              <Spin
                size="small"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}
            {headmasterSignatureUrl && !isSignatureLoading && (
              // PERBAIKAN: Menampilkan gambar dengan URL yang dikonstruksi
              <img
                src={headmasterSignatureUrl}
                alt="Tanda Tangan Kepala Sekolah"
                style={{
                  height: "70px",
                  width: "auto",
                  position: "relative",
                }}
                crossOrigin="anonymous"
              />
            )}
          </Col>

          {/* Tanda Tangan Wali Kelas */}
          <Col span={10} style={{ textAlign: "center", position: "relative" }}>
            {isSignatureLoading && (
              <Spin
                size="small"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}
            {homeroomSignatureUrl && !isSignatureLoading && (
              // PERBAIKAN: Menampilkan gambar dengan URL yang dikonstruksi
              <img
                src={homeroomSignatureUrl}
                alt="Tanda Tangan Wali Kelas"
                style={{
                  height: "70px",
                  width: "auto",
                  position: "relative",
                }}
                crossOrigin="anonymous"
              />
            )}
          </Col>
        </Row>

        {/* Nama dan NIP */}
        <Row justify="space-between" style={{ textAlign: "center" }}>
          <Col span={10}>
            <Text strong underline>
              {headmasterName}
            </Text>
          </Col>
          <Col span={10}>
            <Text strong underline>
              {homeroomTeacherName}
            </Text>
          </Col>
        </Row>
      </div>
    );
  };
  // --- AKHIR KOMPONEN Tanda Tangan ---

  return (
    <Modal
      title={null}
      open={isOpen}
      onCancel={onClose}
      width={1000}
      // Sembunyikan Modal Footer saat sedang mencetak
      footer={
        <div
          key="footer-actions"
          className="pdf-hide-footer"
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Text type="secondary">Rapor Periode: {periode}</Text>
          <div>
            <button
              key="back"
              onClick={onClose}
              style={{
                marginRight: "8px",
                padding: "6.4px 15px",
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
                cursor: "pointer",
                backgroundColor: "white",
              }}
              disabled={isPrinting}
            >
              Tutup
            </button>
            <button
              key="print"
              onClick={handlePrint}
              style={{
                padding: "6.4px 15px",
                borderRadius: "6px",
                cursor: "pointer",
                backgroundColor: "#1677ff",
                color: "white",
                border: "none",
              }}
              disabled={isLoading || !studentDetail || isPrinting}
            >
              {isPrinting ? "Membuat PDF..." : "📥 Cetak Rapor"}
            </button>
          </div>
        </div>
      }
    >
      <Spin
        spinning={isLoading || isSignatureLoading || isPrinting}
        tip={
          isPrinting
            ? "Membuat PDF..."
            : "Memuat data rapor dan tanda tangan..."
        }
      >
        {studentDetail && displaySubjectData.length > 0 ? (
          // --- KONTEN UTAMA RAPOR DIBUNGKUS DENGAN useRef ---
          <div
            ref={reportContentRef}
            style={{
              padding: "20px",
            }}
            id="raport-content"
          >
            <ReportHeader />

            {/* Loop untuk setiap Mata Pelajaran */}
            {displaySubjectData.map((subjectItem, index) => (
              <div
                key={index}
                style={{ marginBottom: "30px", paddingTop: "20px" }}
                className="raport-subject-section"
              >
                {/* Baris Nama Mata Pelajaran */}
                <div style={{ display: "flex", marginBottom: "5px" }}>
                  <Text strong style={{ minWidth: "80px" }}>
                    Subject
                  </Text>
                  <Text style={{ minWidth: "10px" }}>:</Text>
                  <Text strong>{subjectItem.subjectName.toUpperCase()}</Text>
                  {subjectItem.subjectName
                    .toLowerCase()
                    .includes("pancasila") && (
                    <Text type="secondary" style={{ marginLeft: "10px" }}>
                      (CIVICS)
                    </Text>
                  )}
                </div>

                {/* Tabel Penilaian Inti */}
                <Table
                  columns={pidColumns}
                  dataSource={subjectItem.indicators}
                  pagination={false}
                  bordered
                  size="small"
                  scroll={{ x: 950 }}
                  locale={{ emptyText: "Tidak ada data penilaian ditemukan." }}
                  showHeader={true}
                  style={{ border: "1px solid #f0f0f0" }}
                  footer={() => (
                    <div style={{ padding: 0 }}>
                      <div
                        style={{
                          borderTop: "1px solid #f0f0f0",
                          margin: "-1px",
                          width: "calc(100% + 2px)",
                          boxSizing: "content-box",
                        }}
                      >
                        {/* Baris Header STUDENT'S DEVELOPMENT */}
                        <Row>
                          <Col
                            span={24}
                            style={{
                              backgroundColor: "#f0f0f0",
                              padding: "5px 8px",
                              textAlign: "center",
                              fontWeight: "bold",
                              borderBottom: "1px solid #f0f0f0",
                              borderLeft: "1px solid #f0f0f0",
                              borderRight: "1px solid #f0f0f0",
                            }}
                          >
                            STUDENT'S DEVELOPMENT
                          </Col>
                        </Row>
                        {/* Baris Konten Deskripsi */}
                        <Row>
                          <Col
                            span={24}
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #f0f0f0",
                              borderLeft: "1px solid #f0f0f0",
                              borderRight: "1px solid #f0f0f0",
                              backgroundColor: "#fff",
                            }}
                          >
                            <Text>
                              {subjectItem.subjectDescription ||
                                "Tidak ada catatan perkembangan spesifik untuk mata pelajaran ini."}
                            </Text>
                          </Col>
                        </Row>
                      </div>
                    </div>
                  )}
                />
              </div>
            ))}

            {/* Bagian tanda tangan */}
            <ReportSignature />
          </div>
        ) : (
          // --- AKHIR KONTEN UTAMA RAPOR ---
          <div style={{ textAlign: "center", padding: "50px" }}>
            {isLoading || isSignatureLoading || isPrinting ? (
              <Text>Mohon Tunggu, sedang memuat data rapor dari server...</Text>
            ) : (
              <Text type="danger">
                Data rapor {periode} untuk siswa ini tidak ditemukan atau gagal
                dimuat.
              </Text>
            )}
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default PrintRaportPID;
