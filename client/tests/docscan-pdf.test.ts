import assert from "node:assert/strict";
import { test } from "node:test";
import { extractPdfPageText } from "../src/lib/docscan-pdf";

const imageOperatorIds = [85, 86, 87, 88];

function page(items: unknown[], fnArray: number[] = [1, 2, 3]) {
  return {
    getTextContent: async () => ({ items }),
    getOperatorList: async () => ({ fnArray }),
  };
}

function positioned(str: string, x: number, y: number, width: number) {
  return { str, transform: [12, 0, 0, 12, x, y], height: 12, width };
}

test("native text preserves names, document numbers, dates and punctuation", async () => {
  const text = "Иванов Иван Петрович\nПаспорт: 45 12 № 007891\nДата: 02.09.2026";
  assert.equal(await extractPdfPageText(page([
    { str: "Иванов Иван Петрович", hasEOL: true },
    { str: "Паспорт: 45 12 № 007891", hasEOL: true },
    { str: "Дата: 02.09.2026" },
  ]), imageOperatorIds), text);
});

test("explicit line endings and RTL strings retain the provided order", async () => {
  assert.equal(await extractPdfPageText(page([
    { str: "مرحبا بالعالم", hasEOL: true },
    { str: "מספר מסמך: 1234567890", hasEOL: true },
    { str: "End of document." },
  ]), imageOperatorIds), "مرحبا بالعالم\nמספר מסמך: 1234567890\nEnd of document.");
});

test("geometry recovers missing line endings without splitting adjacent numeric runs", async () => {
  assert.equal(await extractPdfPageText(page([
    positioned("Document", 10, 100, 50),
    positioned("123", 65, 100, 18),
    positioned("4567890", 83, 100, 42),
    positioned("Issued: 02.09.2026", 10, 80, 120),
  ]), imageOperatorIds), "Document 1234567890\nIssued: 02.09.2026");
});

test("geometry does not reorder right-to-left items", async () => {
  assert.equal(await extractPdfPageText(page([
    positioned("مرحبا", 100, 100, 35),
    positioned("بالعالم", 40, 100, 50),
  ]), imageOperatorIds), "مرحبا بالعالم");
});

test("existing spaces do not suppress geometry-based line endings", async () => {
  assert.equal(await extractPdfPageText(page([
    positioned("Document number ", 10, 100, 100),
    positioned("1234567890", 10, 80, 60),
  ]), imageOperatorIds), "Document number \n1234567890");
});

test("small baseline differences and rotated text do not create spurious lines", async () => {
  assert.equal(await extractPdfPageText(page([
    positioned("Document", 10, 100, 50),
    positioned("number", 65, 99, 36),
    { str: "1234567890", transform: [0, 12, -12, 0, 120, 10] },
  ]), imageOperatorIds), "Document number 1234567890");
});

test("marked-content metadata and empty EOL items are supported", async () => {
  assert.equal(await extractPdfPageText(page([
    { type: "beginMarkedContentProps", id: "section-1" },
    { str: "Document number", hasEOL: false },
    { str: "", hasEOL: true },
    { str: "1234567890" },
    { type: "endMarkedContent" },
  ]), imageOperatorIds), "Document number\n1234567890");
});

test("separate punctuation and existing spaces are preserved", async () => {
  assert.equal(await extractPdfPageText(page([
    { str: "Document" }, { str: ":" }, { str: " 1234567890" }, { str: "." },
  ]), imageOperatorIds), "Document: 1234567890.");
});

for (const imageOperator of imageOperatorIds) {
  test(`image operator ${imageOperator} requires OCR even with a native header`, async () => {
    assert.equal(await extractPdfPageText(page([
      { str: "Official document: text header only" },
    ], [1, imageOperator, 3]), imageOperatorIds), null);
  });
}

test("an empty or invalid image operator list cannot establish a text-only page", async () => {
  const native = page([{ str: "Document number 1234567890" }]);
  for (const ids of [[], [NaN], [-1], [85, Infinity]]) {
    assert.equal(await extractPdfPageText(native, ids), null);
  }
});

test("blank, punctuation-only and very short text retain OCR", async () => {
  for (const items of [[], [{ str: " \n\t " }], [{ str: "---  ... !!!" }], [{ str: "Page 1" }]]) {
    assert.equal(await extractPdfPageText(page(items), imageOperatorIds), null);
  }
});

test("replacement, private-use, control glyphs and invalid Unicode retain OCR", async () => {
  for (const badGlyph of ["\uFFFD", "\uE123", "\u0001", "\u0085", "\uD800"]) {
    assert.equal(await extractPdfPageText(page([{ str: `Document number 1234567890 ${badGlyph}` }]), imageOperatorIds), null);
  }
});

test("malformed text items cannot silently remove part of the document", async () => {
  for (const invalidItem of [
    null, 123, {}, { str: 123 }, { str: "Text", hasEOL: "yes" },
    { str: "Text", transform: [1, 2] },
    { str: "Text", transform: [12, 0, 0, 12, 0, NaN] },
    { str: "Text", height: -12 }, { str: "Text", width: Infinity },
  ]) {
    assert.equal(await extractPdfPageText(page([
      { str: "Valid header text with sufficient characters" }, invalidItem,
    ]), imageOperatorIds), null);
  }
});

test("malformed operator output retains OCR", async () => {
  assert.equal(await extractPdfPageText(page([{ str: "Document number 1234567890" }], [NaN]), imageOperatorIds), null);
});

test("either PDF.js operation failing retains OCR", async () => {
  const good = page([{ str: "Document number 1234567890" }]);
  const fail = async (): Promise<never> => { throw new Error("PDF data unavailable"); };
  assert.equal(await extractPdfPageText({ ...good, getTextContent: fail }, imageOperatorIds), null);
  assert.equal(await extractPdfPageText({ ...good, getOperatorList: fail }, imageOperatorIds), null);
  assert.equal(await extractPdfPageText({ ...good, getTextContent: () => { throw new Error("invalid page"); } }, imageOperatorIds), null);
});
