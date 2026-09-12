import assert from "node:assert/strict";
import { test } from "node:test";
import { PSM } from "tesseract.js";
import type { RecognizeResult, Worker } from "tesseract.js";
import {
  OCR_LANGUAGES,
  ocrDimensions,
  recognizeDocumentImage,
  withTimeout,
} from "../src/lib/docscan-ocr";

test("every supported source language loads its OCR model, with English for mixed documents", () => {
  assert.deepEqual(OCR_LANGUAGES, {
    ru: "rus+eng", en: "eng", fr: "fra+eng", ar: "ara+eng", zh: "chi_sim+eng", es: "spa+eng",
  });
});

test("small images are enlarged at most twice without stretching and gain a white margin", () => {
  assert.deepEqual(ocrDimensions(600, 900), {
    width: 1220, height: 1820, contentWidth: 1200, contentHeight: 1800, border: 10,
  });
  assert.deepEqual(ocrDimensions(1200, 800), {
    width: 1620, height: 1086, contentWidth: 1600, contentHeight: 1066, border: 10,
  });
  assert.equal(ocrDimensions(2000, 1000).contentWidth, 2000);
});

test("large scans stay within canvas area and edge limits including margins", () => {
  for (const [width, height] of [[10000, 10000], [4032, 3024], [1000, 40000], [50000, 1000], [2480, 3508]]) {
    const result = ocrDimensions(width, height);
    assert.ok(result.width <= 4096 && result.height <= 4096);
    assert.ok(result.width * result.height <= 5_000_000);
    assert.ok(result.contentWidth >= 1 && result.contentHeight >= 1);
    assert.ok(Math.abs(result.contentWidth / result.contentHeight - width / height) <= 1 / result.contentHeight + width / height / result.contentHeight);
  }
});

test("unusable image dimensions fail before allocating a canvas", () => {
  for (const value of [0, -1, NaN, Infinity, -Infinity]) {
    assert.throws(() => ocrDimensions(value, 100), /Invalid image dimensions/);
    assert.throws(() => ocrDimensions(100, value), /Invalid image dimensions/);
  }
});

function workerReturning(text: string, confidence: number) {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const worker: Pick<Worker, "setParameters" | "recognize"> = {
    async setParameters(...args) {
      calls.push({ method: "setParameters", args });
      return { jobId: "test-parameters", data: {} };
    },
    async recognize(...args) {
      calls.push({ method: "recognize", args });
      return { jobId: "test-recognition", data: { text, confidence } } as RecognizeResult;
    },
  };
  return { worker, calls };
}

test("recognition uses automatic page segmentation and deskew in one pass", async () => {
  const { worker, calls } = workerReturning("  First column\nSecond column\n", 82.5);
  const result = await recognizeDocumentImage(worker, "image-fixture");
  assert.deepEqual(result, { text: "First column\nSecond column", confidence: 82.5 });
  assert.deepEqual(calls, [
    { method: "setParameters", args: [{ tessedit_pageseg_mode: PSM.AUTO, user_defined_dpi: "300" }] },
    { method: "recognize", args: ["image-fixture", { rotateAuto: true }, { text: true }] },
  ]);
});

test("empty output and invalid confidence cannot appear as a successful high-confidence scan", async () => {
  assert.deepEqual(await recognizeDocumentImage(workerReturning(" \n ", 99).worker, "image"), { text: "", confidence: 0 });
  for (const confidence of [NaN, Infinity, -Infinity, -15]) {
    assert.equal((await recognizeDocumentImage(workerReturning("Text", confidence).worker, "image")).confidence, 0);
  }
  assert.equal((await recognizeDocumentImage(workerReturning("Text", 105).worker, "image")).confidence, 100);
});

test("recognition errors propagate without manufacturing text", async () => {
  const failure = new Error("Could not read image");
  const { worker } = workerReturning("", 0);
  worker.recognize = async () => { throw failure; };
  await assert.rejects(recognizeDocumentImage(worker, "image"), error => error === failure);
});

test("timeout cleans its timer after success and failure", async context => {
  const clear = context.mock.method(globalThis, "clearTimeout");
  assert.equal(await withTimeout(Promise.resolve("recognized"), 60_000), "recognized");
  assert.equal(clear.mock.callCount(), 1);
  const failure = new Error("Worker failed");
  await assert.rejects(withTimeout(Promise.reject(failure), 60_000), error => error === failure);
  assert.equal(clear.mock.callCount(), 2);
});

test("timeout rejects a stalled operation and clears its timer", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const clear = context.mock.method(globalThis, "clearTimeout");
  const operation = withTimeout(new Promise<never>(() => {}), 1000);
  const assertion = assert.rejects(operation, /OCR timeout/);
  context.mock.timers.tick(1000);
  await assertion;
  assert.equal(clear.mock.callCount(), 1);
});
