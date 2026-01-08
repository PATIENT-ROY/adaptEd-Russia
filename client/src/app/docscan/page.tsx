"use client";

import { Layout } from "@/components/layout/layout";
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
import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { createWorker } from "tesseract.js";
import { motion, AnimatePresence } from "framer-motion";

// Динамический импорт PDF.js будет выполнен при необходимости
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null;

interface ScanResult {
  text: string;
  confidence: number;
  detectedLanguage?: string;
}

export default function DocScanPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string>("ru");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        setSelectedFile(file);
        setError(null);
      } else {
        setError("Поддерживаются только изображения (PNG, JPG) и PDF");
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  // Загрузка PDF.js библиотеки
  async function loadPdfjs() {
    if (!pdfjsLib) {
      try {
        const getPdfjs = (await import("@/lib/pdfjs")).default;
        pdfjsLib = await getPdfjs();
      } catch (error) {
        console.error("Failed to import PDF.js:", error);
        throw new Error(
          "Не удалось загрузить библиотеку PDF. Попробуйте позже."
        );
      }
    }
    return pdfjsLib;
  }

  // Предобработка изображения для улучшения качества OCR
  const preprocessImage = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Не удалось создать canvas context"));
            return;
          }

          // Устанавливаем размер canvas равным размеру изображения
          canvas.width = img.width;
          canvas.height = img.height;

          // Рисуем изображение с улучшенным качеством
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0);

          // Получаем данные пикселей
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Собираем статистику для адаптивной обработки
          let sumGray = 0;
          let minGray = 255;
          let maxGray = 0;
          const grays: number[] = [];

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            grays.push(gray);
            sumGray += gray;
            minGray = Math.min(minGray, gray);
            maxGray = Math.max(maxGray, gray);
          }

          // Вычисляем среднюю яркость и диапазон
          const avgGray = sumGray / (data.length / 4);
          const range = maxGray - minGray;

          // Адаптивные параметры в зависимости от характеристик изображения
          // Если изображение темное или имеет низкий контраст, применяем более мягкую обработку
          const contrast = range < 100 ? 1.2 : range < 150 ? 1.3 : 1.4; // Мягче контраст
          const brightnessAdjust = avgGray < 100 ? 20 : avgGray > 200 ? -10 : 0; // Небольшая коррекция яркости

          // Применяем улучшения для OCR
          for (let i = 0; i < data.length; i += 4) {
            const gray = grays[i / 4];

            // Небольшая коррекция яркости
            let adjusted = gray + brightnessAdjust;
            adjusted = Math.max(0, Math.min(255, adjusted));

            // Умеренное увеличение контраста (не бинаризация!)
            let enhanced = (adjusted - 128) * contrast + 128;
            enhanced = Math.max(0, Math.min(255, enhanced));

            // Используем оттенки серого вместо бинаризации для лучшего качества
            const finalValue = Math.round(enhanced);

            // Применяем результат (оттенки серого, не бинарные)
            data[i] = finalValue; // R
            data[i + 1] = finalValue; // G
            data[i + 2] = finalValue; // B
            // alpha остается без изменений
          }

          // Применяем изменения обратно на canvas
          ctx.putImageData(imageData, 0, 0);

          // Конвертируем в base64 для передачи в OCR
          const processedImageUrl = canvas.toDataURL("image/png", 0.95);
          resolve(processedImageUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error("Не удалось загрузить изображение"));
      };

      img.src = imageUrl;
    });
  };

  // Конвертация PDF страницы в изображение
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
    if (!context) throw new Error("Не удалось создать canvas context");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    } as Parameters<typeof page.render>[0]).promise;

    return canvas.toDataURL("image/png");
  };

  // Обработка PDF файла
  const processPdf = async (
    file: File,
    ocrWorker: Awaited<ReturnType<typeof createWorker>>
  ): Promise<{
    text: string;
    confidence: number;
    detectedLanguage?: string;
  }> => {
    try {
      const pdfjs = await loadPdfjs();
      if (!pdfjs) {
        throw new Error("PDF.js библиотека не загружена");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfjsModule = pdfjs as any;

      if (!pdfjsModule.getDocument) {
        throw new Error("getDocument метод недоступен в PDF.js");
      }

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
        // Предобработка изображения для улучшения качества OCR
        const processedImageData = await preprocessImage(originalImageData);
        const ocrResult = await ocrWorker.recognize(processedImageData);

        const pageText = ocrResult.data.text?.trim() || "";
        const pageConfidence = ocrResult.data.confidence || 0;

        if (pageText) {
          allText += `\n\n--- Страница ${pageNum} ---\n\n${pageText}`;
          totalConfidence += pageConfidence;
          processedPages++;
        }
      }

      const avgConfidence =
        processedPages > 0 ? totalConfidence / processedPages : 0;

      // Определяем язык из распознанного текста
      let detectedLang = "unknown";
      if (allText.trim().length > 0) {
        const cyrillicRegex = /[а-яё]/i;
        const arabicRegex = /[\u0600-\u06FF]/;
        const chineseRegex = /[\u4e00-\u9fff]/;

        if (cyrillicRegex.test(allText)) {
          detectedLang = "ru";
        } else if (arabicRegex.test(allText)) {
          detectedLang = "ar";
        } else if (chineseRegex.test(allText)) {
          detectedLang = "zh";
        } else if (/[a-z]/i.test(allText)) {
          const commonFrench =
            /\b(le|la|les|de|du|des|et|ou|un|une|est|sont)\b/i;
          if (commonFrench.test(allText)) {
            detectedLang = "fr";
          } else {
            detectedLang = "en";
          }
        }
      }

      return {
        text: allText.trim(),
        confidence: Math.round(avgConfidence),
        detectedLanguage: detectedLang,
      };
    } catch (error) {
      console.error("PDF processing error:", error);
      throw error instanceof Error
        ? error
        : new Error(`Ошибка обработки PDF: ${String(error)}`);
    }
  };

  const processDocument = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    // Проверка размера файла
    const maxSize = 20 * 1024 * 1024; // 20MB для PDF
    if (file.size > maxSize) {
      setError(
        "Файл слишком большой (максимум 20MB). Пожалуйста, уменьшите размер файла."
      );
      setIsProcessing(false);
      return;
    }

    let progressInterval: NodeJS.Timeout | null = null;
    let ocrWorker: Awaited<ReturnType<typeof createWorker>> | undefined =
      undefined;

    try {
      setProgress(5);

      // Создаем worker с таймаутом
      ocrWorker = await Promise.race([
        createWorker("rus+eng"),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Таймаут загрузки OCR")), 30000)
        ),
      ]);

      setProgress(15);

      // Симуляция прогресса для OCR
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) return prev;
          return Math.min(prev + 1, 85);
        });
      }, 300);

      let text = "";
      let confidence = 0;

      if (file.type === "application/pdf") {
        // Обработка PDF
        setProgress(20);
        const result = await processPdf(file, ocrWorker);
        text = result.text;
        confidence = result.confidence;

        // Проверяем наличие текста перед сохранением
        if (text.length === 0) {
          throw new Error(
            "Текст не обнаружен в документе. Попробуйте другой файл."
          );
        }

        // Сохраняем результат с языком
        setResult({
          text: text,
          confidence: confidence,
          detectedLanguage: result.detectedLanguage || "unknown",
        });
      } else {
        // Обработка изображения
        const originalImageUrl = URL.createObjectURL(file);
        setProgress(25);

        // Предобработка изображения для улучшения качества OCR
        const processedImageUrl = await preprocessImage(originalImageUrl);
        setProgress(35);

        // Освобождаем память от оригинального изображения
        URL.revokeObjectURL(originalImageUrl);

        // OCR распознавание с таймаутом на улучшенном изображении
        const ocrResult = await Promise.race([
          ocrWorker.recognize(processedImageUrl),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Таймаут распознавания текста")),
              60000
            )
          ),
        ]);

        text = ocrResult.data.text?.trim() || "";
        confidence = ocrResult.data.confidence || 0;

        // Проверяем наличие текста перед сохранением
        if (text.length === 0) {
          throw new Error(
            "Текст не обнаружен в документе. Попробуйте другой файл."
          );
        }

        // Определяем язык из OCR результата
        let detectedLang = "unknown";
        if (text.length > 0) {
          const cyrillicRegex = /[а-яё]/i;
          const arabicRegex = /[\u0600-\u06FF]/;
          const chineseRegex = /[\u4e00-\u9fff]/;

          if (cyrillicRegex.test(text)) {
            detectedLang = "ru";
          } else if (arabicRegex.test(text)) {
            detectedLang = "ar";
          } else if (chineseRegex.test(text)) {
            detectedLang = "zh";
          } else if (/[a-z]/i.test(text)) {
            const commonFrench =
              /\b(le|la|les|de|du|des|et|ou|un|une|est|sont)\b/i;
            if (commonFrench.test(text)) {
              detectedLang = "fr";
            } else {
              detectedLang = "en";
            }
          }
        }

        // Сохраняем результат с языком для изображений
        setResult({
          text: text,
          confidence: Math.round(confidence),
          detectedLanguage: detectedLang,
        });
      }

      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setProgress(95);

      if (ocrWorker) {
        await ocrWorker.terminate();
      }

      setProgress(100);

      setShowModal(true);
      setSelectedFile(null);
      setTranslatedText(null); // Сбрасываем перевод при новом сканировании
    } catch (err) {
      console.error("OCR Error:", err);
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      if (ocrWorker) {
        try {
          await ocrWorker.terminate();
        } catch (e) {
          console.error("Error terminating worker:", e);
        }
      }
      setError(
        err instanceof Error
          ? err.message
          : "Ошибка при распознавании текста. Попробуйте другой файл."
      );
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const handleProcess = () => {
    if (selectedFile) {
      processDocument(selectedFile);
    }
  };

  const handleCameraScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      // Создаем временный video элемент для камеры
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      // TODO: Создать UI для захвата изображения с камеры
      alert("Функция сканирования с камеры будет добавлена в следующей версии");

      stream.getTracks().forEach((track) => track.stop());
    } catch {
      setError("Не удалось получить доступ к камере. Проверьте разрешения.");
    }
  };

  const copyToClipboard = () => {
    const textToCopy = translatedText || result?.text;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      alert(
        translatedText
          ? "Переведенный текст скопирован!"
          : "Текст скопирован в буфер обмена!"
      );
    }
  };

  const downloadAsTxt = () => {
    if (result?.text) {
      const blob = new Blob([result.text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "docscan-result.txt";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const downloadAsPdf = () => {
    if (result?.text) {
      // Простая генерация PDF через window.print или библиотеку
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>DocScan Result</title></head>
            <body style="font-family: Arial; padding: 20px;">
              <pre style="white-space: pre-wrap;">${result.text}</pre>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  // Функция перевода текста
  const handleTranslate = async () => {
    if (!result?.text) return;

    setIsTranslating(true);
    setError(null);
    setTranslatedText(null); // Сбрасываем предыдущий перевод

    try {
      // Используем MyMemory API для перевода
      const sourceLang =
        result.detectedLanguage === "unknown"
          ? "auto"
          : result.detectedLanguage;

      // Разбиваем текст на части для обработки длинных текстов
      const maxLength = 500;
      const textParts = [];
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
          // Fallback: пробуем без определения языка
          const fallbackResponse = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
              part
            )}&langpair=auto|${targetLanguage}`
          );
          const fallbackData = await fallbackResponse.json();
          if (
            fallbackData.responseStatus === 200 &&
            fallbackData.responseData
          ) {
            translations.push(fallbackData.responseData.translatedText);
          }
        }
      }

      if (translations.length > 0) {
        setTranslatedText(translations.join(" "));
      } else {
        throw new Error("Не удалось перевести текст. Попробуйте позже.");
      }
    } catch (err) {
      console.error("Translation error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Ошибка при переводе текста. Попробуйте позже."
      );
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showModal]);

  return (
    <>
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
                  DocScan - Умное сканирование документов
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Drag & Drop загрузка файлов и фото • OCR с поддержкой русского и английского • Экспорт в PDF, TXT, DOCX • Интеграция с AI-помощником
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm">
            <h2 className="text-center text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">
              Сканировать документ
            </h2>

            <div className="max-w-2xl mx-auto space-y-6">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* File Upload Area */}
              <Card
                {...getRootProps()}
                className={`border-2 border-dashed transition-all duration-300 cursor-pointer rounded-2xl ${
                  isDragActive
                    ? "border-[#6A5AE0] bg-gradient-to-br from-[#6A5AE0]/10 to-[#3B82F6]/10"
                    : selectedFile
                    ? "border-green-300 bg-green-50"
                    : "border-gray-300 hover:border-[#6A5AE0] hover:bg-gray-50"
                }`}
              >
                <CardContent className="p-8 sm:p-12">
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
                          isDragActive || selectedFile
                            ? "text-white"
                            : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                        Перетащи файл
                      </p>
                      <p className="text-sm sm:text-base text-gray-500">
                        или выбери из папки
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Поддерживаются: PNG, JPG, PDF
                      </p>
                    </div>
                    {selectedFile && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                      >
                        <p className="text-sm text-green-600 font-medium">
                          Выбран: {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>

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
                      Обработка {progress}%
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                      Загрузить документ
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
                  Сканировать
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
                          <span>
                            Обработка {progress}%... Распознавание текста...
                          </span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
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

      {/* Result Modal with framer-motion animation */}
      <AnimatePresence>
        {showModal && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center p-0"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative z-10 w-full h-full max-h-full flex flex-col rounded-none shadow-2xl overflow-hidden bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-shrink-0 bg-gradient-to-r from-[#6A5AE0] to-[#3B82F6] p-4 sm:p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Результат распознавания
                  </h3>
                  <p className="text-sm text-white/80 mt-1">
                    Уверенность: {result.confidence}%
                    {result.detectedLanguage &&
                      result.detectedLanguage !== "unknown" && (
                        <span className="ml-2">
                          • Язык: {result.detectedLanguage}
                        </span>
                      )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowModal(false)}
                  className="h-9 w-9 text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-4xl mx-auto space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-200"
                  >
                    <div className="mb-2 text-xs text-gray-500 font-medium">
                      Оригинальный текст
                      {result.detectedLanguage &&
                        result.detectedLanguage !== "unknown" && (
                          <span className="ml-2">
                            (язык: {result.detectedLanguage})
                          </span>
                        )}
                    </div>
                    <pre className="whitespace-pre-wrap text-sm sm:text-base text-gray-700 font-sans">
                      {result.text || "Текст не распознан"}
                    </pre>
                  </motion.div>

                  {/* Переведенный текст */}
                  {translatedText && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="bg-blue-50 rounded-2xl p-4 sm:p-6 border border-blue-200"
                    >
                      <div className="mb-2 text-xs text-blue-600 font-medium">
                        Переведенный текст (язык: {targetLanguage})
                      </div>
                      <pre className="whitespace-pre-wrap text-sm sm:text-base text-gray-700 font-sans">
                        {translatedText}
                      </pre>
                    </motion.div>
                  )}

                  {/* Выбор языка перевода */}
                  {result.text && !translatedText && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 }}
                      className="bg-white rounded-2xl p-4 border border-gray-200"
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Перевести на язык:
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <select
                            value={targetLanguage}
                            onChange={(e) => setTargetLanguage(e.target.value)}
                            className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#6A5AE0] focus:border-[#6A5AE0] cursor-pointer appearance-none hover:border-gray-400 transition-colors"
                          >
                            <option value="ru">🇷🇺 Русский</option>
                            <option value="en">🇬🇧 Английский</option>
                            <option value="fr">🇫🇷 Французский</option>
                            <option value="ar">🇸🇦 Арабский</option>
                            <option value="zh">🇨🇳 Китайский</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
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
                        <Button
                          onClick={handleTranslate}
                          disabled={isTranslating}
                          className="bg-gradient-to-r from-[#6A5AE0] to-[#3B82F6] hover:from-[#5A4AD0] hover:to-[#2B72E6] text-white"
                        >
                          {isTranslating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Перевод...
                            </>
                          ) : (
                            <>
                              <Languages className="mr-2 h-4 w-4" />
                              Перевести
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}

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
                      Копировать {translatedText ? "перевод" : "текст"}
                    </Button>
                    <Button
                      onClick={downloadAsTxt}
                      variant="outline"
                      className="flex-1 border-2 rounded-xl py-3 sm:py-4"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Скачать .txt
                    </Button>
                    <Button
                      onClick={downloadAsPdf}
                      variant="outline"
                      className="flex-1 border-2 rounded-xl py-3 sm:py-4"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Скачать .pdf
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

