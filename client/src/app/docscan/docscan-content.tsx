"use client";

import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { FeaturePreviewGate } from "@/components/auth/FeaturePreviewGate";
import { AppToast } from "@/components/ui/app-toast";
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
} from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useDropzone } from "react-dropzone";
import type { FileRejection } from "react-dropzone";
import type { Worker } from "tesseract.js";
import { OCR_LANGUAGES, prepareOcrImage, recognizeDocumentImage, withTimeout, type OcrLanguage } from "@/lib/docscan-ocr";
import { extractPdfPageText } from "@/lib/docscan-pdf";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null;

interface ScanResult {
  text: string;
  confidence: number | null;
  textSource?: "pdf" | "ocr" | "mixed";
  detectedLanguage?: string;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const LANG_KEYS: Record<string, string> = {
  ru: "docscan.lang.ru",
  en: "docscan.lang.en",
  fr: "docscan.lang.fr",
  ar: "docscan.lang.ar",
  zh: "docscan.lang.zh",
  es: "docscan.lang.es",
  unknown: "docscan.lang.unknown",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function DocScanContent() {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sourceLanguage, setSourceLanguage] = useState<OcrLanguage>("ru");
  const processingRef = useRef(false);
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
        if (file.size > MAX_FILE_SIZE) {
          setSelectedFile(null);
          setError(t("docscan.error.fileSize"));
          return;
        }
        if (file.type.startsWith("image/") || file.type === "application/pdf") {
          setSelectedFile(file);
          setError(null);
        } else {
          setSelectedFile(null);
          setError(t("docscan.error.fileType"));
        }
      }
    },
    [t]
  );

  const onDropRejected = useCallback(
    (fileRejections: readonly FileRejection[]) => {
      const code = fileRejections[0]?.errors?.[0]?.code;
      setSelectedFile(null);
      setError(
        code === "file-too-large"
          ? t("docscan.error.fileSize")
          : t("docscan.error.fileType"),
      );
    },
    [t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: isProcessing,
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

  const detectLanguage = (text: string): string => {
    if (!text.trim()) return "unknown";
    const cyrillicRegex = /[а-яё]/i;
    const arabicRegex = /[\u0600-\u06FF]/;
    const chineseRegex = /[\u4e00-\u9fff]/;
    if (cyrillicRegex.test(text)) return "ru";
    if (arabicRegex.test(text)) return "ar";
    if (chineseRegex.test(text)) return "zh";
    if (/[a-z]/i.test(text)) {
      if (["en", "fr", "es"].includes(sourceLanguage)) return sourceLanguage;
      const commonFrench = /\b(le|la|les|de|du|des|et|ou|un|une|est|sont)\b/i;
      return commonFrench.test(text) ? "fr" : "en";
    }
    return "unknown";
  };

  const processPdf = async (file: File, getWorker: () => Promise<Worker>): Promise<ScanResult> => {
    const pdfjs = await loadPdfjs();
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];
    let weightedConfidence = 0;
    let ocrCharacters = 0;
    let nativePages = 0;
    let ocrPages = 0;
    const imageOperators = Object.entries(pdfjs.OPS || {})
      .filter(([name]) => /paint.*Image/.test(name))
      .map(([, value]) => Number(value));

    try {
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        try {
          let pageText = await extractPdfPageText(page, imageOperators);
          if (pageText !== null) {
            nativePages++;
          } else {
            // Render scans at up to 216 DPI, bounded for mobile canvas memory.
            const base = page.getViewport({ scale: 1 });
            const scale = Math.min(3, 4000 / base.width, 4000 / base.height,
              Math.sqrt(4_800_000 / (base.width * base.height)));
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement("canvas");
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            const context = canvas.getContext("2d");
            if (!context) throw new Error("Canvas context error");
            try {
              await withTimeout(page.render({ canvasContext: context, viewport, background: "white" }).promise, 60000);
              const worker = await getWorker();
              const recognized = await withTimeout(recognizeDocumentImage(worker, canvas), 60000);
              pageText = recognized.text;
              if (pageText) {
                weightedConfidence += recognized.confidence * pageText.length;
                ocrCharacters += pageText.length;
                ocrPages++;
              }
            } finally {
              canvas.width = 0;
              canvas.height = 0;
            }
          }
          if (pageText) pages.push(`--- Page ${pageNum} ---\n\n${pageText}`);
          setProgress(20 + Math.floor((pageNum / pdf.numPages) * 65));
        } finally {
          page.cleanup();
        }
      }
      const text = pages.join("\n\n");
      return {
        text,
        confidence: ocrCharacters ? Math.round(weightedConfidence / ocrCharacters) : null,
        detectedLanguage: detectLanguage(text),
        textSource: nativePages && ocrPages ? "mixed" : nativePages ? "pdf" : "ocr",
      };
    } finally {
      await pdf.destroy();
    }
  };

  const processDocument = async (file: File) => {
    if (processingRef.current) return;
    if (file.size > MAX_FILE_SIZE) {
      setError(t("docscan.error.fileSize"));
      return;
    }
    processingRef.current = true;
    setIsProcessing(true);
    setProgress(5);
    setError(null);
    let ocrWorker: Worker | undefined;
    let workerPromise: Promise<Worker> | undefined;
    let finished = false;

    const getWorker = async () => {
      if (!workerPromise) {
        workerPromise = import("tesseract.js").then(({ createWorker }) =>
          createWorker(OCR_LANGUAGES[sourceLanguage]));
        // A loading timeout must not leave a late worker running in the background.
        void workerPromise.then(worker => {
          if (finished) void worker.terminate().catch(() => {});
        }).catch(() => {});
      }
      ocrWorker = await withTimeout(workerPromise, 60000);
      return ocrWorker;
    };

    try {
      let scanResult: ScanResult;
      if (file.type === "application/pdf") {
        scanResult = await processPdf(file, getWorker);
      } else {
        const originalImageUrl = URL.createObjectURL(file);
        let image: HTMLCanvasElement | undefined;
        try {
          image = await prepareOcrImage(originalImageUrl);
          setProgress(25);
          const worker = await getWorker();
          setProgress(40);
          const recognized = await withTimeout(recognizeDocumentImage(worker, image), 60000);
          scanResult = { ...recognized, confidence: Math.round(recognized.confidence), detectedLanguage: detectLanguage(recognized.text), textSource: "ocr" };
        } finally {
          URL.revokeObjectURL(originalImageUrl);
          if (image) { image.width = 0; image.height = 0; }
        }
      }
      if (!scanResult.text) throw new Error(t("docscan.error.noText"));
      setProgress(100);
      setResult(scanResult);
      setShowModal(true);
      setTranslatedText(null);
    } catch (err) {
      console.error("OCR Error:", err);
      setError(err instanceof Error && err.message === t("docscan.error.noText")
        ? t("docscan.error.noText") : t("docscan.error.ocr"));
    } finally {
      finished = true;
      if (ocrWorker) {
        try { await ocrWorker.terminate(); } catch { /* already stopped */ }
      }
      processingRef.current = false;
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleProcess = () => {
    if (selectedFile) void processDocument(selectedFile);
  };

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
      setError(t("docscan.error.translation"));
    } finally {
      setIsTranslating(false);
    }
  }, [result, targetLanguage, t]);

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

  useBodyScrollLock(showModal);

  return (
    <ProtectedRoute
      fallback={
        <FeaturePreviewGate
          featureName={t("nav.docscan")}
          previewTitle={t("docscan.preview.title")}
          previewText={t("docscan.preview.text")}
        />
      }
    >
      <Layout>
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1">
              <div className="row-span-2 self-center rounded-lg bg-gradient-to-br from-[#6A5AE0] to-[#3B82F6] p-2.5 sm:p-3">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" aria-hidden />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-none self-end">
                DocScan
              </h1>
              <p className="text-sm sm:text-base text-gray-600 self-start">
                {t("docscan.subtitle")}
              </p>
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
                <div
                  className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm"
                  role="alert"
                >
                  {error}
                </div>
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
                      <div className="text-center">
                        <p className="text-sm text-green-600 font-medium">
                          {t("docscan.dropzone.selected")}: {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="docscan-source-language" className="block text-sm font-medium text-gray-700">
                  {t("docscan.sourceLanguage")}
                </label>
                <div className="relative">
                  <select
                    id="docscan-source-language"
                    value={sourceLanguage}
                    onChange={(event) =>
                      setSourceLanguage(event.target.value as OcrLanguage)
                    }
                    disabled={isProcessing}
                    className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-3 py-3 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6A5AE0] focus:border-[#6A5AE0] disabled:opacity-60"
                    aria-describedby="docscan-quality-tip"
                  >
                    {(Object.keys(OCR_LANGUAGES) as OcrLanguage[]).map(
                      (code) => (
                        <option key={code} value={code}>
                          {getLangName(code)}
                        </option>
                      ),
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                <p id="docscan-quality-tip" className="text-sm text-gray-500">{t("docscan.qualityTip")}</p>
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
                  disabled
                  title={t("docscan.camera.soon")}
                  variant="outline"
                  className="w-full border-2 border-[#6A5AE0]/40 text-[#6A5AE0]/60 text-base sm:text-lg font-semibold py-4 sm:py-5 rounded-2xl cursor-not-allowed opacity-70"
                >
                  <Camera className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                  {t("docscan.camera")}
                </Button>
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div>
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
                          <div
                            className="bg-gradient-to-r from-[#6A5AE0] to-[#3B82F6] h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>

      {/* Result Modal */}
      {showModal && result && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6 lg:p-10"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-label={t("docscan.result.title")}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div
            ref={modalRef}
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
                  {result.confidence === null
                    ? t("docscan.result.nativeText")
                    : <>{t("docscan.result.confidence")}: {result.confidence}%</>}
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
                aria-label={t("docscan.close")}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
              <div className="max-w-4xl mx-auto space-y-4">
                <p className="text-sm text-gray-600">{t("docscan.result.confidenceNote")}</p>
                {result.textSource === "mixed" && <p className="text-sm text-gray-500">{t("docscan.result.mixedText")}</p>}
                {/* Original text */}
                <div
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
                </div>

                {/* Translated text */}
                {translatedText && (
                  <div
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
                  </div>
                )}

                {/* Translation controls */}
                {result.text && !translatedText && (
                  <div
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
                  </div>
                )}

                {/* Action buttons */}
                <div
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <AppToast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </ProtectedRoute>
  );
}
