import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createWorker, OEM } from "tesseract.js";
import type { Worker } from "tesseract.js";
import { OCR_LANGUAGES, ocrDimensions, recognizeDocumentImage } from "../src/lib/docscan-ocr";

const TRANSCRIPT = [
  "Student guide",
  "Bring your passport and student card.",
  "Check the office hours before your visit.",
  "Keep a copy of each document.",
  "Памятка студента",
  "Возьмите паспорт и студенческий билет.",
  "Проверьте время работы перед визитом.",
  "Сохраните копию каждого документа.",
];

function normalizedText(text: string) {
  return text.normalize("NFC").replace(/\s+/gu, " ").trim();
}

function characterDistance(expected: string, actual: string) {
  const target = Array.from(normalizedText(expected));
  const output = Array.from(normalizedText(actual));
  let previous = Array.from({ length: output.length + 1 }, (_, i) => i);
  for (let row = 1; row <= target.length; row++) {
    const current = [row];
    for (let column = 1; column <= output.length; column++) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + Number(target[row - 1] !== output[column - 1]),
      );
    }
    previous = current;
  }
  return previous[output.length];
}

test("character error metric measures substitutions, omissions, and additions", () => {
  assert.equal(characterDistance("Паспорт 123", "Паспорт 123"), 0);
  assert.equal(characterDistance("abc", "axc"), 1);
  assert.equal(characterDistance("abc", "ac"), 1);
  assert.equal(characterDistance("abc", "abbc"), 1);
  assert.equal(characterDistance("A\nБ", "A Б"), 0);
});

// Opt-in: downloads only the public default Tesseract language models.
// All document pixels and OCR remain local; this fixture contains no user data.
// Sharp exercises equivalent sizing/compositing, not browser-specific interpolation.
// Reference run, 2026-09-12, Tesseract.js 6.0.1 on macOS: 252 normalized
// characters, old pipeline 11 edits (4.37% CER), new pipeline 0 edits (0% CER).
// This result describes this synthetic fixture, not accuracy on arbitrary documents.
test("real OCR recognizes small English and Russian print and reports before/after character errors", {
  skip: process.env.DOCSCAN_REAL_OCR !== "1",
  timeout: 120_000,
}, async context => {
  const { default: sharp } = await import("sharp");
  const width = 560;
  const height = 215;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="white"/>
    <g fill="#363636" font-family="Arial, sans-serif" font-size="11">
      ${TRANSCRIPT.map((line, index) => `<text x="18" y="${22 + index * 24}">${line}</text>`).join("\n")}
    </g>
  </svg>`;
  const original = await sharp(Buffer.from(svg)).png().toBuffer();

  // Reproduce the former browser loop, including its brightness adjustment.
  const { data, info } = await sharp(original).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  let minimum = 255;
  let maximum = 0;
  const grays = new Uint8Array(info.width * info.height);
  for (let offset = 0; offset < data.length; offset += 4) {
    const gray = Math.round(0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2]);
    grays[offset / 4] = gray;
    sum += gray;
    minimum = Math.min(minimum, gray);
    maximum = Math.max(maximum, gray);
  }
  const average = sum / grays.length;
  const contrast = maximum - minimum < 100 ? 1.2 : maximum - minimum < 150 ? 1.3 : 1.4;
  const brightness = average < 100 ? 20 : average > 200 ? -10 : 0;
  for (let offset = 0; offset < data.length; offset += 4) {
    const adjusted = Math.max(0, Math.min(255, grays[offset / 4] + brightness));
    const value = Math.round(Math.max(0, Math.min(255, (adjusted - 128) * contrast + 128)));
    data[offset] = value;
    data[offset + 1] = value;
    data[offset + 2] = value;
  }
  const previousImage = await sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();

  const dimensions = ocrDimensions(width, height);
  const preparedImage = await sharp(original)
    .flatten({ background: "#ffffff" })
    .resize(dimensions.contentWidth, dimensions.contentHeight)
    .extend({ top: dimensions.border, right: dimensions.border, bottom: dimensions.border, left: dimensions.border, background: "#ffffff" })
    .png().toBuffer();

  const cachePath = await mkdtemp(join(tmpdir(), "docscan-real-ocr-"));
  let worker: Worker | undefined;
  try {
    // A separate worker for each pipeline avoids adaptive OCR state carrying over.
    worker = await createWorker(OCR_LANGUAGES.ru, OEM.LSTM_ONLY, { cachePath });
    const before = (await worker.recognize(previousImage)).data;
    await worker.terminate();
    worker = undefined;
    worker = await createWorker(OCR_LANGUAGES.ru, OEM.LSTM_ONLY, { cachePath });
    const after = await recognizeDocumentImage(worker, preparedImage);

    const expected = TRANSCRIPT.join("\n");
    const expectedCharacters = Array.from(normalizedText(expected)).length;
    const beforeErrors = characterDistance(expected, before.text);
    const afterErrors = characterDistance(expected, after.text);
    context.diagnostic(JSON.stringify({
      fixture: "synthetic bilingual print, Arial 11px",
      expectedCharacters,
      before: { errors: beforeErrors, characterErrorRate: beforeErrors / expectedCharacters, text: before.text.trim() },
      after: { errors: afterErrors, characterErrorRate: afterErrors / expectedCharacters, text: after.text },
      note: "One synthetic fixture; engine confidence is not an accuracy measurement.",
    }));
    assert.match(after.text, /passport/iu);
    assert.match(after.text, /student card/iu);
    assert.match(after.text, /паспорт/iu);
    assert.match(after.text, /студенческий билет/iu);
  } finally {
    if (worker) await worker.terminate();
    await rm(cachePath, { recursive: true, force: true });
  }
});
