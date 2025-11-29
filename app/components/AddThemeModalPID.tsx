"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Input, Select, Space, Form } from "antd";
import { PlusOutlined, CloseCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import { toast } from "react-toastify";

// Ambil URL dasar dari .env
const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL || "YOUR_FALLBACK_API_URL";

// --- INTERFACE DATA ---
interface IndicatorForm {
  indicator: string;
  domain: "COGNITIVE" | "AFFECTIVE" | "PSYCHOMOTORIC" | "";
}

interface SubThemeForm {
  subTheme: string;
  indicators: IndicatorForm[];
}

interface AddThemeModalPIDProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subjectId: string;
  grade: string;
  periode: string;
}

// --- ARRAY OPTIONS DOMAIN ---
const domainOptions = [
  { value: "COGNITIVE", label: "COGNITIVE" },
  { value: "AFFECTIVE", label: "AFFECTIVE" },
  { value: "PSYCHOMOTORIC", label: "PSYCHOMOTORIC" },
];

const AddThemeModalPID: React.FC<AddThemeModalPIDProps> = ({
  isVisible,
  onClose,
  onSuccess,
  subjectId,
  grade,
  periode,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [themeName, setThemeName] = useState("");
  const [subThemes, setSubThemes] = useState<SubThemeForm[]>([
    {
      subTheme: "",
      indicators: [
        { indicator: "", domain: "" },
        { indicator: "", domain: "" },
      ],
    },
  ]);

  // --- HANDLER SUB THEME DINAMIS ---
  const handleAddSubTheme = () => {
    setSubThemes((prev) => [
      ...prev,
      {
        subTheme: "",
        indicators: [{ indicator: "", domain: "" }],
      },
    ]);
  };

  const handleRemoveSubTheme = (index: number) => {
    setSubThemes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubThemeChange = (index: number, value: string) => {
    const newSubThemes = [...subThemes];
    newSubThemes[index].subTheme = value;
    setSubThemes(newSubThemes);
    form.setFieldsValue({
      subThemes: newSubThemes,
    });
  };

  // --- HANDLER INDICATOR DINAMIS ---
  const handleAddIndicator = (subThemeIndex: number) => {
    const newSubThemes = [...subThemes];
    newSubThemes[subThemeIndex].indicators.push({
      indicator: "",
      domain: "",
    });
    setSubThemes(newSubThemes);
    form.setFieldsValue({ subThemes: newSubThemes });
  };

  const handleRemoveIndicator = (
    subThemeIndex: number,
    indicatorIndex: number
  ) => {
    const newSubThemes = [...subThemes];
    newSubThemes[subThemeIndex].indicators = newSubThemes[
      subThemeIndex
    ].indicators.filter((_, i) => i !== indicatorIndex);
    setSubThemes(newSubThemes);
    form.setFieldsValue({ subThemes: newSubThemes });
  };

  const handleIndicatorChange = (
    subThemeIndex: number,
    indicatorIndex: number,
    field: keyof IndicatorForm,
    value: string
  ) => {
    const newSubThemes = [...subThemes];
    if (field === "indicator") {
      newSubThemes[subThemeIndex].indicators[indicatorIndex].indicator = value;
    } else if (field === "domain") {
      if (domainOptions.some((opt) => opt.value === value)) {
        newSubThemes[subThemeIndex].indicators[indicatorIndex].domain =
          value as "COGNITIVE" | "AFFECTIVE" | "PSYCHOMOTORIC";
      }
    }
    setSubThemes(newSubThemes);
    form.setFieldsValue({ subThemes: newSubThemes });
  };

  // --- FUNGSI RESET FORM ---
  const resetForm = useCallback(() => {
    setThemeName("");
    setSubThemes([
      {
        subTheme: "",
        indicators: [
          { indicator: "", domain: "" },
          { indicator: "", domain: "" },
        ],
      },
    ]);
    form.resetFields();
    form.setFieldsValue({
      theme: "",
      subThemes: [
        {
          subTheme: "",
          indicators: [
            { indicator: "", domain: "" },
            { indicator: "", domain: "" },
          ],
        },
      ],
    });
  }, [form]);

  useEffect(() => {
    if (isVisible) {
      resetForm();
    }
  }, [isVisible, resetForm]);

  // --- FUNGSI SUBMIT ---
  const handleSubmit = async (values: any) => {
    if (!BASE_API_URL || BASE_API_URL === "YOUR_FALLBACK_API_URL") {
      toast.error("URL API tidak dikonfigurasi. Cek file .env Anda.");
      return;
    }

    try {
      setLoading(true);

      // 1. FILTER DAN VALIDASI DATA LOKAL (subThemes)
      const subthemesPayload = subThemes
        // Filter sub theme yang tidak memiliki nama atau tidak memiliki indikator
        .filter((st) => st.subTheme.trim() !== "" && st.indicators.length > 0)
        .map((st) => ({
          // ✔️ KOREKSI: Mengubah 'subthema' menjadi 'subtheme'
          subtheme: st.subTheme,
          indicators: st.indicators
            // Filter indikator yang tidak memiliki teks atau domain
            .filter((i) => i.indicator.trim() !== "" && i.domain !== "")
            .map((i) => ({
              indicator: i.indicator,
              domain: i.domain,
            })),
        }))
        // Filter kembali untuk memastikan setiap subtheme memiliki setidaknya satu indikator yang valid
        .filter((st) => st.indicators.length > 0);

      // 2. VALIDASI TAMBAHAN: Cek Theme Utama dan Subthemes
      if (!themeName.trim()) {
        throw new Error("Theme Title wajib diisi.");
      }
      if (subthemesPayload.length === 0) {
        throw new Error(
          "Harap tambahkan minimal satu Sub Theme dengan Indicator yang lengkap."
        );
      }

      // 3. BUAT PAYLOAD AKHIR (Menggunakan KEY yang dikoreksi: theme, subthemes, periode)
      const payload = {
        // PERHATIAN: Grade di API POST Anda adalah number (1),
        // namun props grade Anda adalah string. Pastikan API menerima format ini.
        subject_id: parseInt(subjectId),
        grade: grade, // Mengirim grade sebagai string/number (tergantung data yang masuk ke prop)
        // ✔️ KOREKSI: Mengubah 'priode' menjadi 'periode'
        periode: periode,
        // ✔️ KOREKSI: Mengubah 'thema' menjadi 'theme'
        theme: themeName,
        // ✔️ KOREKSI: Mengubah 'subthemas' menjadi 'subthemes'
        subthemes: subthemesPayload,
      };

      // ✔️ KOREKSI: Mengubah endpoint dari /thema menjadi /grade
      const apiUrl = `${BASE_API_URL}/indicator-pid/grade`;

      const response = await axios.post(apiUrl, payload);

      if (response.status === 201 || response.status === 200) {
        toast.success("Theme dan indikator berhasil ditambahkan!");
        onSuccess();
        onClose();
      } else {
        const errorMsg =
          response.data?.message ||
          `Gagal menambahkan Theme. Status: ${response.status}`;
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      let errorMessage = "Terjadi kesalahan saat menyimpan data.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (axios.isAxiosError(error)) {
        errorMessage =
          error.response?.data?.message ||
          error.message ||
          `Gagal koneksi ke API. Status: ${
            error.response?.status || "Unknown"
          }`;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER KOMPONEN ---
  return (
    <Modal
      title={
        <span className="text-xl font-semibold text-gray-800">
          Tambah Theme & Indicator
        </span>
      }
      open={isVisible}
      onCancel={onClose}
      footer={null}
      width={700}
      maskClosable={!loading}
      centered
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div className="p-4">
          {/* Header Add Theme */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Add Theme</h3>
            <Button
              type="primary"
              onClick={handleAddSubTheme}
              icon={<PlusOutlined />}
              disabled={loading}
              size="middle"
              className="bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600"
            >
              Add Sub Theme
            </Button>
          </div>

          {/* Theme Input */}
          <Form.Item
            name="theme"
            label={<span className="font-semibold text-gray-700">Theme</span>}
            rules={[{ required: true, message: "Theme wajib diisi!" }]}
            className="mb-6"
          >
            <Input
              placeholder="example"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              disabled={loading}
              className="py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            />
          </Form.Item>

          {/* Sub Themes & Indicators Section */}
          <div className="space-y-8">
            {subThemes.map((subThemeData, subThemeIndex) => (
              <div
                key={subThemeIndex}
                className="p-4 border border-gray-200 rounded-lg shadow-md bg-gray-50 relative"
              >
                {/* Sub Theme Input & Remove Button */}
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-semibold text-gray-700">
                    Sub Theme {subThemeIndex + 1}
                  </h4>
                  {subThemes.length > 1 && (
                    <Button
                      type="text"
                      icon={<CloseCircleOutlined className="text-red-500" />}
                      onClick={() => handleRemoveSubTheme(subThemeIndex)}
                      danger
                      size="small"
                      disabled={loading}
                    />
                  )}
                </div>

                <Form.Item
                  name={["subThemes", subThemeIndex, "subTheme"]}
                  initialValue={subThemeData.subTheme}
                  rules={[
                    { required: true, message: "Sub Theme wajib diisi!" },
                  ]}
                  className="mb-6"
                >
                  <Input
                    placeholder="example"
                    onChange={(e) =>
                      handleSubThemeChange(subThemeIndex, e.target.value)
                    }
                    value={subThemeData.subTheme}
                    disabled={loading}
                    className="py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                  />
                </Form.Item>

                {/* Indicators Section */}
                <div className="space-y-4 pt-2">
                  <h5 className="text-sm font-semibold text-gray-600 mb-3 pb-2 border-b border-gray-200">
                    Indicators
                  </h5>
                  {subThemeData.indicators.map(
                    (indicatorData, indicatorIndex) => (
                      <div
                        key={indicatorIndex}
                        className="flex items-start space-x-3 gap-2"
                      >
                        {/* Indicator Input */}
                        <Form.Item
                          name={[
                            "subThemes",
                            subThemeIndex,
                            "indicators",
                            indicatorIndex,
                            "indicator",
                          ]}
                          initialValue={indicatorData.indicator}
                          rules={[
                            {
                              required: true,
                              message: "Indicator wajib diisi!",
                            },
                          ]}
                          className="grow mb-0"
                        >
                          <Input
                            placeholder="example"
                            onChange={(e) =>
                              handleIndicatorChange(
                                subThemeIndex,
                                indicatorIndex,
                                "indicator",
                                e.target.value
                              )
                            }
                            value={indicatorData.indicator}
                            disabled={loading}
                            className="py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                          />
                        </Form.Item>

                        {/* Domain Select */}
                        <Form.Item
                          name={[
                            "subThemes",
                            subThemeIndex,
                            "indicators",
                            indicatorIndex,
                            "domain",
                          ]}
                          initialValue={indicatorData.domain}
                          rules={[{ required: true, message: "Domain!" }]}
                          className="w-48 mb-0"
                        >
                          <Select
                            placeholder="Domain"
                            onChange={(value) =>
                              handleIndicatorChange(
                                subThemeIndex,
                                indicatorIndex,
                                "domain",
                                value
                              )
                            }
                            value={indicatorData.domain || undefined}
                            options={domainOptions}
                            disabled={loading}
                            className="w-full"
                          />
                        </Form.Item>

                        {/* Remove Indicator Button */}
                        <Space className="">
                          {subThemeData.indicators.length > 1 && (
                            <Button
                              type="text"
                              icon={
                                <CloseCircleOutlined className="text-red-500" />
                              }
                              onClick={() =>
                                handleRemoveIndicator(
                                  subThemeIndex,
                                  indicatorIndex
                                )
                              }
                              danger
                              disabled={loading}
                            />
                          )}
                        </Space>
                      </div>
                    )
                  )}

                  {/* Add Indicator Button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      type="default"
                      onClick={() => handleAddIndicator(subThemeIndex)}
                      icon={<PlusOutlined />}
                      size="middle"
                      disabled={loading}
                    >
                      Add Indicator
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Submit Button */}
          <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold transition duration-150 ease-in-out"
            >
              Submit Theme & Indicators
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default AddThemeModalPID;
