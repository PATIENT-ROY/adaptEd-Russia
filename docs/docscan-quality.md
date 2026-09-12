# DocScan recognition quality

Changes are local; no production deployment or external OCR service was added.

- Source language is explicit: Russian/English, English, French/English,
  Arabic/English, simplified Chinese/English, or Spanish/English.
- Small images are enlarged up to 2x; transparent pixels are composited on white.
  Original tones are retained instead of unconditional grayscale contrast clipping.
  Canvas size is bounded to 5 million pixels / 4096 pixels per edge for mobile use.
- Tesseract automatic page segmentation and small-angle deskew are enabled.
  This is not a guarantee of correcting sideways or upside-down photos.
- Text-only PDF pages use their embedded text; raster-image pages and uncertain
  extraction fall back to OCR. Native extraction does not claim 100% confidence.
  PDF scans render at up to 216 DPI, with a canvas memory bound.
- Worker loading/recognition timers and worker/PDF/image resources are cleaned up.
  No model-generated text correction changes names, dates or document numbers.

Confidence is the engine's score, not measured character accuracy. Names, dates,
numbers and low-resolution/blurred scans still require comparison with the source.
Cropping out surrounding interface elements and taking a sharp, glare-free image
remain important. Reference: https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html

## Verification

- `npm run test:docscan --workspace client`: unit tests for language mapping,
  dimension limits, honest confidence, timeouts and conservative PDF extraction.
- Build the client, then `npm run test:docscan-ui --workspace client`: synthetic
  PDF/photo UI tests with mocked OCR workers, six locales, desktop and mobile.
- `DOCSCAN_REAL_OCR=1 npm run test:docscan --workspace client`: opt-in real local
  Tesseract test; downloads public language models, never uploads a document.
  Its Sharp renderer approximates browser resizing; it is not a browser pixel test.

On the synthetic 11px English/Russian sample (252 whitespace-normalized characters),
the old pipeline produced 11 character edits, the new one 0. This is one controlled
sample, not a promise of 100% on arbitrary files. The user's original document was
not supplied; its reported 86% result has not been independently reproduced.

The existing optional translation flow is unchanged and still uses an external
translation service when the user requests translation.
