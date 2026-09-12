interface PdfTextPage {
  getTextContent(): Promise<{ items: unknown[] }>;
  getOperatorList(): Promise<{ fnArray: number[] }>;
}

interface TextItem {
  str: string;
  hasEOL?: boolean;
  transform?: number[];
  height?: number;
  width?: number;
}

const markedContentTypes = new Set([
  "beginMarkedContent",
  "beginMarkedContentProps",
  "endMarkedContent",
]);

function isTextItem(value: Record<string, unknown>): value is Record<string, unknown> & TextItem {
  return typeof value.str === "string"
    && (value.hasEOL === undefined || typeof value.hasEOL === "boolean")
    && (value.transform === undefined || (
      Array.isArray(value.transform)
      && value.transform.length === 6
      && value.transform.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate))
    ))
    && (value.height === undefined || (typeof value.height === "number" && Number.isFinite(value.height) && value.height >= 0))
    && (value.width === undefined || (typeof value.width === "number" && Number.isFinite(value.width) && value.width >= 0));
}

function horizontalPosition(item: TextItem) {
  const transform = item.transform;
  // A Y-coordinate comparison is only meaningful for unrotated text.
  if (!transform || Math.abs(transform[1]) > 0.01 || Math.abs(transform[2]) > 0.01) return null;
  return { x: transform[4], y: transform[5], height: item.height || Math.abs(transform[3]) || 1 };
}

function separator(previous: TextItem, current: TextItem): string {
  const before = horizontalPosition(previous);
  const after = horizontalPosition(current);
  if (before && after) {
    const height = Math.max(before.height, after.height);
    if (Math.abs(before.y - after.y) > Math.max(2, height * 0.5)) return "\n";
    if (previous.width !== undefined && current.width !== undefined) {
      // Keep adjacent glyph runs together, including split numbers and punctuation.
      // Compare intervals without reordering items, which also preserves RTL text.
      const gap = Math.max(after.x - (before.x + previous.width), before.x - (after.x + current.width));
      return gap > Math.max(0.5, height * 0.1) ? " " : "";
    }
  }
  if (/^[,.;:!?%\)\]\}،؛؟]/u.test(current.str) || /[\(\[\{]$/u.test(previous.str)) return "";
  return " ";
}

/**
 * Use embedded text only when the entire page can safely bypass OCR.
 * Raster images may contain additional text even when a header or OCR layer exists.
 * Unavailable operator metadata, malformed text, and extraction failures retain OCR.
 */
export async function extractPdfPageText(page: PdfTextPage, imageOperatorIds: number[]): Promise<string | null> {
  if (!imageOperatorIds.length || imageOperatorIds.some((id) => !Number.isInteger(id) || id < 0)) return null;

  try {
    const [content, operators] = await Promise.all([page.getTextContent(), page.getOperatorList()]);
    if (!content || !Array.isArray(content.items) || !operators || !Array.isArray(operators.fnArray)) return null;
    const imageOperators = new Set(imageOperatorIds);
    if (operators.fnArray.some((id) => !Number.isInteger(id) || id < 0 || imageOperators.has(id))) return null;

    let text = "";
    let previous: TextItem | null = null;
    for (const item of content.items) {
      if (!item || typeof item !== "object") return null;
      const value = item as Record<string, unknown>;
      if (!("str" in value) && typeof value.type === "string" && markedContentTypes.has(value.type)) continue;
      if (!isTextItem(value)) return null;

      if (value.str) {
        if (previous && text) {
          const join = separator(previous, value);
          if (join === "\n" && !/[\r\n]$/u.test(text)) text += join;
          else if (!/\s$/u.test(text) && !/^\s/u.test(value.str)) text += join;
        }
        text += value.str;
        previous = value;
      }
      if (value.hasEOL) {
        text += "\n";
        previous = null;
      }
    }

    // Preserve names, scripts, punctuation and digits as supplied by PDF.js.
    // Missing Unicode maps often produce replacement, private-use or control glyphs.
    if (/[\p{Cc}\p{Co}\p{Cs}\uFFFD\uFFFE\uFFFF]/u.test(text.replace(/[\t\n\r]/g, ""))) return null;
    text = text.trim();
    if ((text.match(/[\p{L}\p{N}]/gu)?.length ?? 0) < 10) return null;
    return text;
  } catch {
    return null;
  }
}
