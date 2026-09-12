import { PSM } from "tesseract.js";
import type { ImageLike, Worker } from "tesseract.js";

export type OcrLanguage = "ru" | "en" | "fr" | "ar" | "zh" | "es";

export const OCR_LANGUAGES: Record<OcrLanguage, string> = {
  ru: "rus+eng",
  en: "eng",
  fr: "fra+eng",
  ar: "ara+eng",
  zh: "chi_sim+eng",
  es: "spa+eng",
};

const IMAGE_BORDER = 10;
const MAX_CANVAS_EDGE = 4096;
const MAX_CANVAS_PIXELS = 5_000_000;

export function ocrDimensions(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("Invalid image dimensions");
  }

  const padding = IMAGE_BORDER * 2;
  const upscale = width < 1600 ? Math.min(2, 1600 / width) : 1;
  const scale = Math.min(
    upscale,
    (MAX_CANVAS_EDGE - padding) / width,
    (MAX_CANVAS_EDGE - padding) / height,
  );
  let contentWidth = Math.max(1, Math.floor(width * scale));
  let contentHeight = Math.max(1, Math.floor(height * scale));

  if ((contentWidth + padding) * (contentHeight + padding) > MAX_CANVAS_PIXELS) {
    // Solve (width * scale + padding) * (height * scale + padding) = pixel cap.
    // Account for the border so the canvas itself also stays within the cap.
    const area = contentWidth * contentHeight;
    const sides = padding * (contentWidth + contentHeight);
    const available = MAX_CANVAS_PIXELS - padding * padding;
    const pixelScale = (2 * available) / (sides + Math.sqrt(sides * sides + 4 * area * available));
    contentWidth = Math.max(1, Math.floor(contentWidth * pixelScale));
    contentHeight = Math.max(1, Math.floor(contentHeight * pixelScale));
  }

  return {
    width: contentWidth + padding,
    height: contentHeight + padding,
    contentWidth,
    contentHeight,
    border: IMAGE_BORDER,
  };
}

export async function prepareOcrImage(imageUrl: string): Promise<HTMLCanvasElement> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image load error"));
    image.src = imageUrl;
  });
  const dimensions = ocrDimensions(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context error");

  // Composite transparent input onto paper white and retain the original tones.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, dimensions.border, dimensions.border, dimensions.contentWidth, dimensions.contentHeight);
  return canvas;
}

export async function recognizeDocumentImage(
  worker: Pick<Worker, "setParameters" | "recognize">,
  image: ImageLike,
): Promise<{ text: string; confidence: number }> {
  await worker.setParameters({
    tessedit_pageseg_mode: PSM.AUTO,
    user_defined_dpi: "300",
  });
  const result = await worker.recognize(image, { rotateAuto: true }, { text: true });
  const text = result.data.text?.trim() || "";
  const confidence = text && Number.isFinite(result.data.confidence)
    ? Math.max(0, Math.min(100, result.data.confidence))
    : 0;
  return { text, confidence };
}

export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("OCR timeout")), ms);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
