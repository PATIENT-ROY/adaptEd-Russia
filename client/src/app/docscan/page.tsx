"use client";

import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera,
  FileText,
  X,
  Copy,
  Download,
  Loader2,
  Languages,
  CheckCircle,
} from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { createWorker } from "tesseract.js";
import { motion, AnimatePresence } from "framer-motion";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null;

interface ScanResult {
  text: string;
  confidence: number;
  detectedLanguage?: string;
}

const LANG_KEYS: Record<string, string> = {
  ru: "docscan.lang.ru",
  en: "docscan.lang.en",
  fr: "docscan.lang.fr",
  ar: "docscan.lang.ar",
  zh: "docscan.lang.zh",
  unknown: "docscan.lang.unknown",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function DocScanPage() {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string>("ru");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const getLangName = useCallback(
    (code: string) => t(LANG_KEYS[code] || LANG_KEYS.unknown),
    [t]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (file.type.startsWith("image/") || file.type === "application/pdf") {
          setSelectedFile(file);
          setError(null);
        } else {
          setError(t("docscan.error.fileType"));
        }
      }
    },
    [t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  async function loadPdfjs() {
    if (!pdfjsLib) {
      try {
        const getPdfjs = (await import("@/lib/pdfjs")).default;
        pdfjsLib = await getPdfjs();
      } catch (error) {
        console.error("Failed to import PDF.js:", error);
        throw new Error("Failed to load PDF library");
      }
    }
    return pdfjsLib;
  }

  const preprocessImage = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context error"));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          let sumGray = 0;
          let minGray = 255;
          let maxGray = 0;
          const grays: number[] = [];

          for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(
              0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
            );
            grays.push(gray);
            sumGray += gray;
            minGray = Math.min(minGray, gray);
            maxGray = Math.max(maxGray, gray);
          }

          const avgGray = sumGray / (data.length / 4);
          const range = maxGray - minGray;
          const contrast = range < 100 ? 1.2 : range < 150 ? 1.3 : 1.4;
          const brightnessAdjust = avgGray < 100 ? 20 : avgGray > 200 ? -10 : 0;

          for (let i = 0; i < data.length; i += 4) {
            const gray = grays[i / 4];
            let adjusted = gray + brightnessAdjust;
            adjusted = Math.max(0, Math.min(255, adjusted));
            let enhanced = (adjusted - 128) * contrast + 128;
            enhanced = Math.max(0, Math.min(255, enhanced));
            const finalValue = Math.round(enhanced);
            data[i] = finalValue;
            data[i + 1] = finalValue;
            data[i + 2] = finalValue;
          }

          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL("image/png", 0.95));
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error("Image load error"));
      img.src = imageUrl;
    });
  };

  const pdfPageToImage = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdf: any,
    pageNum: number,
    scale = 2
  ): Promise<string> => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas context error");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport } as Parameters<
      typeof page.render
    >[0]).promise;
    return canvas.toDataURL("image/png");
  };

  const detectLanguage = (text: string): string => {
    if (!text.trim()) return "unknown";
    const cyrillicRegex = /[а-яё]/i;
    const arabicRegex = /[\u0600-\u06FF]/;
    const chineseRegex = /[\u4e00-\u9fff]/;
    if (cyrillicRegex.test(text)) return "ru";
    if (arabicRegex.test(text)) return "ar";
    if (chineseRegex.test(text)) return "zh";
    if (/[a-z]/i.test(text)) {
      const commonFrench = /\b(le|la|les|de|du|des|et|ou|un|une|est|sont)\b/i;
      return commonFrench.test(text) ? "fr" : "en";
    }
    return "unknown";
  };

  const processPdf = async (
    file: File,
    ocrWorker: Awaited<ReturnType<typeof createWorker>>
  ) => {
    const pdfjs = await loadPdfjs();
    if (!pdfjs) throw new Error("PDF.js not loaded");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfjsModule = pdfjs as any;
    if (!pdfjsModule.getDocument) throw new Error("getDocument unavailable");

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsModule.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;

    let allText = "";
    let totalConfidence = 0;
    let processedPages = 0;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      setProgress(30 + Math.floor((pageNum / numPages) * 50));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalImageData = await pdfPageToImage(pdf as any, pageNum);
      const processedImageData = await preprocessImage(originalImageData);
      const ocrResult = await ocrWorker.recognize(processedImageData);
      const pageText = ocrResult.data.text?.trim() || "";
      const pageConfidence = ocrResult.data.confidence || 0;

      if (pageText) {
        allText += `\n\n--- Page ${pageNum} ---\n\n${pageText}`;
        totalConfidence += pageConfidence;
        processedPages++;
      }
    }

    return {
      text: allText.trim(),
      confidence: Math.round(processedPages > 0 ? totalConfidence / processedPages : 0),
      detectedLanguage: detectLanguage(allText),
    };
  };

  const processDocument = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(t("docscan.error.fileSize"));
      setIsProcessing(false);
      return;
    }

    let progressInterval: NodeJS.Timeout | null = null;
    let ocrWorker: Awaited<ReturnType<typeof createWorker>> | undefined;

    try {
      setProgress(5);
      ocrWorker = await Promise.race([
        createWorker("rus+eng"),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("OCR load timeout")), 30000)
        ),
      ]);
      setProgress(15);

      progressInterval = setInterval(() => {
        setProgress((prev) => (prev >= 85 ? prev : Math.min(prev + 1, 85)));
      }, 300);

      let scanResult: ScanResult;

      if (file.type === "application/pdf") {
        setProgress(20);
        const pdfResult = await processPdf(file, ocrWorker);
        if (!pdfResult.text) throw new Error("No text detected");
        scanResult = pdfResult;
      } else {
        const originalImageUrl = URL.createObjectURL(file);
        setProgress(25);
        const processedImageUrl = await preprocessImage(originalImageUrl);
        setProgress(35);
        URL.revokeObjectURL(originalImageUrl);

        const ocrResult = await Promise.race([
          ocrWorker.recognize(processedImageUrl),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("OCR recognition timeout")), 60000)
          ),
        ]);

        const text = ocrResult.data.text?.trim() || "";
        if (!text) throw new Error("No text detected");

        scanResult = {
          text,
          confidence: Math.round(ocrResult.data.confidence || 0),
          detectedLanguage: detectLanguage(text),
        };
      }

      if (progressInterval) clearInterval(progressInterval);
      setProgress(95);
      if (ocrWorker) await ocrWorker.terminate();
      setProgress(100);

      setResult(scanResult);
      setShowModal(true);
      setTranslatedText(null);
    } catch (err) {
      console.error("OCR Error:", err);
      if (progressInterval) clearInterval(progressInterval);
      if (ocrWorker) {
        try { await ocrWorker.terminate(); } catch { /* ignore */ }
      }
      setError(
        err instanceof Error ? err.message : "OCR error. Try another file."
      );
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const handleProcess = useCallback(() => {
    if (selectedFile) processDocument(selectedFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile]);

  const handleCameraScan = useCallback(() => {
    showToast(t("docscan.camera.soon"));
  }, [showToast, t]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const copyToClipboard = useCallback(async () => {
    const textToCopy = translatedText || result?.text;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast(t("docscan.copied"));
    } catch {
      /* ignore */
    }
  }, [translatedText, result?.text, showToast, t]);

  const downloadAsTxt = useCallback(() => {
    const text = translatedText || result?.text;
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = translatedText ? "docscan-translated.txt" : "docscan-result.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [translatedText, result?.text]);

  const downloadAsPdf = useCallback(() => {
    const text = translatedText || result?.text;
    if (!text) return;
    const blob = new Blob(
      [
        `<html><head><meta charset="utf-8"><title>DocScan</title></head><body style="font-family:Arial;padding:20px;"><pre style="white-space:pre-wrap;">${text}</pre></body></html>`,
      ],
      { type: "text/html" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = translatedText ? "docscan-translated.html" : "docscan-result.html";
    a.click();
    URL.revokeObjectURL(url);
  }, [translatedText, result?.text]);

  const handleTranslate = useCallback(async () => {
    if (!result?.text) return;
    setIsTranslating(true);
    setError(null);

    try {
      const sourceLang =
        result.detectedLanguage === "unknown" ? "auto" : result.detectedLanguage;
      const maxLength = 500;
      const textParts: string[] = [];
      for (let i = 0; i < result.text.length; i += maxLength) {
        textParts.push(result.text.slice(i, i + maxLength));
      }

      const translations: string[] = [];
      for (const part of textParts) {
        const response = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
            part
          )}&langpair=${sourceLang}|${targetLanguage}`
        );
        const data = await response.json();
        if (data.responseStatus === 200 && data.responseData) {
          translations.push(data.responseData.translatedText);
        } else {
          const fallbackResponse = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
              part
            )}&langpair=auto|${targetLanguage}`
          );
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.responseStatus === 200 && fallbackData.responseData) {
            translations.push(fallbackData.responseData.translatedText);
          }
        }
      }

      if (translations.length > 0) {
        setTranslatedText(translations.join(" "));
      } else {
        throw new Error("Translation failed");
      }
    } catch (err) {
      console.error("Translation error:", err);
      setError(err instanceof Error ? err.message : "Translation error");
    } finally {
      setIsTranslating(false);
    }
  }, [result, targetLanguage]);

  const handleRetranslate = useCallback(() => {
    setTranslatedText(null);
  }, []);

  // Escape key to close modal
  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    // Focus close button on open
    setTimeout(() => closeButtonRef.current?.focus(), 100);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showModal]);

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="rounded-lg bg-gradient-to-br from-[#6A5AE0] to-[#3B82F6] p-3 w-fit">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {t("docscan.title")}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  {t("docscan.subtitle")}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm">
            <h2 className="text-center text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">
              {t("docscan.scan")}
            </h2>

            <div className="max-w-2xl mx-auto space-y-6">
              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm"
                  role="alert"
                >
                  {error}
                </motion.div>
              )}

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed transition-all duration-300 cursor-pointer rounded-2xl bg-white shadow-lg ${
                  isDragActive
                    ? "border-[#6A5AE0] bg-gradient-to-br from-[#6A5AE0]/10 to-[#3B82F6]/10"
                    : selectedFile
                    ? "border-green-300 bg-green-50"
                    : "border-gray-300 hover:border-[#6A5AE0] hover:bg-gray-50"
                }`}
              >
                <div className="p-8 sm:p-12">
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div
                      className={`p-4 rounded-full transition-colors duration-300 ${
                        isDragActive || selectedFile
                          ? "bg-gradient-to-br from-[#6A5AE0] to-[#3B82F6]"
                          : "bg-gray-100"
                      }`}
                    >
                      <FileText
                        className={`h-12 w-12 transition-colors duration-300 ${
                          isDragActive || selectedFile ? "text-white" : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                        {t("docscan.dropzone.title")}
                      </p>
                      <p className="text-sm sm:text-base text-gray-500">
                        {t("docscan.dropzone.subtitle")}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {t("docscan.dropzone.formats")}
                      </p>
                    </div>
                    {selectedFile && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                      >
                        <p className="text-sm text-green-600 font-medium">
                          {t("docscan.dropzone.selected")}: {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={handleProcess}
                  disabled={!selectedFile || isProcessing}
                  className="w-full bg-gradient-to-r from-[#6A5AE0] to-[#3B82F6] hover:from-[#5A4AD0] hover:to-[#2B72E6] text-white text-base sm:text-lg font-semibold py-4 sm:py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                      {t("docscan.processing")} {progress}%
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                      {t("docscan.upload")}
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleCameraScan}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full border-2 border-[#6A5AE0] text-[#6A5AE0] hover:bg-[#6A5AE0] hover:text-white text-base sm:text-lg font-semibold py-4 sm:py-5 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                  {t("docscan.camera")}
                </Button>
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="border-0 shadow-none bg-gray-50 rounded-2xl">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{t("docscan.progress.recognizing")}</span>
                          <span>{progress}%</span>
                        </div>
                        <div
                          className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden"
                          role="progressbar"
                          aria-valuenow={progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${t("docscan.processing")} ${progress}%`}
                        >
                          <motion.div
                            className="bg-gradient-to-r from-[#6A5AE0] to-[#3B82F6] h-2.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </Layout>

      {/* Result Modal */}
      <AnimatePresence>
        {showModal && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6 lg:p-10"
            onClick={handleCloseModal}
            role="dialog"
            aria-modal="true"
            aria-label={t("docscan.result.title")}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative z-10 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl flex flex-col sm:rounded-2xl shadow-2xl overflow-hidden bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex-shrink-0 bg-gradient-to-r from-[#6A5AE0] to-[#3B82F6] p-4 sm:p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {t("docscan.result.title")}
                  </h3>
                  <p className="text-sm text-white/80 mt-1">
                    {t("docscan.result.confidence")}: {result.confidence}%
                    {result.detectedLanguage &&
                      result.detectedLanguage !== "unknown" && (
                        <span className="ml-2">
                          • {t("docscan.result.language")}: {getLangName(result.detectedLanguage)}
                        </span>
                      )}
                  </p>
                </div>
                <Button
                  ref={closeButtonRef}
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseModal}
                  className="h-9 w-9 text-white hover:bg-white/20"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-4xl mx-auto space-y-4">
                  {/* Original text */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-200"
                  >
                    <div className="mb-2 text-xs text-gray-500 font-medium">
                      {t("docscan.result.original")}
                      {result.detectedLanguage &&
                        result.detectedLanguage !== "unknown" && (
                          <span className="ml-2">
                            ({t("docscan.result.language")}: {getLangName(result.detectedLanguage)})
                          </span>
                        )}
                    </div>
                    <pre className="whitespace-pre-wrap text-sm sm:text-base text-gray-700 font-sans">
                      {result.text || t("docscan.result.noText")}
                    </pre>
                  </motion.div>

                  {/* Translated text */}
                  {translatedText && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="bg-blue-50 rounded-2xl p-4 sm:p-6 border border-blue-200"
                    >
                      <div className="mb-2 text-xs text-blue-600 font-medium flex items-center justify-between">
                        <span>
                          {t("docscan.result.translated")} ({getLangName(targetLanguage)})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRetranslate}
                          className="text-blue-600 hover:text-blue-800 h-auto py-1 px-2 text-xs"
                        >
                          {t("docscan.translate.retranslate")}
                        </Button>
                      </div>
                      <pre className="whitespace-pre-wrap text-sm sm:text-base text-gray-700 font-sans">
                        {translatedText}
                      </pre>
                    </motion.div>
                  )}

                  {/* Translation controls */}
                  {result.text && !translatedText && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 }}
                      className="bg-white rounded-2xl p-4 border border-gray-200"
                    >
                      <label
                        htmlFor="translate-lang"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        {t("docscan.translate.label")}
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <select
                            id="translate-lang"
                            value={targetLanguage}
                            onChange={(e) => setTargetLanguage(e.target.value)}
                            className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#6A5AE0] focus:border-[#6A5AE0] cursor-pointer appearance-none hover:border-gray-400 transition-colors"
                          >
                            <option value="ru">{getLangName("ru")}</option>
                            <option value="en">{getLangName("en")}</option>
                            <option value="fr">{getLangName("fr")}</option>
                            <option value="ar">{getLangName("ar")}</option>
                            <option value="zh">{getLangName("zh")}</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        <Button
                          onClick={handleTranslate}
                          disabled={isTranslating}
                          className="bg-gradient-to-r from-[#6A5AE0] to-[#3B82F6] hover:from-[#5A4AD0] hover:to-[#2B72E6] text-white"
                        >
                          {isTranslating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t("docscan.translate.translating")}
                            </>
                          ) : (
                            <>
                              <Languages className="mr-2 h-4 w-4" />
                              {t("docscan.translate.btn")}
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Action buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                  >
                    <Button
                      onClick={copyToClipboard}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-3 sm:py-4"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {translatedText ? t("docscan.copy.translation") : t("docscan.copy")}
                    </Button>
                    <Button
                      onClick={downloadAsTxt}
                      variant="outline"
                      className="flex-1 border-2 rounded-xl py-3 sm:py-4"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t("docscan.download.txt")}
                    </Button>
                    <Button
                      onClick={downloadAsPdf}
                      variant="outline"
                      className="flex-1 border-2 rounded-xl py-3 sm:py-4"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t("docscan.download.pdf")}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl text-sm animate-in slide-in-from-bottom-4 duration-300 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
          {toastMessage}
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/60 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </ProtectedRoute>
  );
}
