import * as pdfjs from "pdfjs-dist";
// Vite bundles the worker as a URL; without this the parser silently fails in
// production builds (it only "works" in dev because of a same-origin fallback).
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export interface PdfExtract {
  text: string;
  pages: number;
}

/**
 * Extract the text layer from a PDF entirely in the browser.
 *
 * Nothing is uploaded anywhere; this is the open-source build's promise, and
 * it is also why bank statements can be tried without a signup.
 */
export async function extractPdfText(file: File): Promise<PdfExtract> {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const parts: string[] = [];

  for (let pageNo = 1; pageNo <= doc.numPages; pageNo++) {
    const page = await doc.getPage(pageNo);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    let line = "";

    for (const item of content.items) {
      const it = item as { str?: string; transform?: number[]; hasEOL?: boolean };
      if (typeof it.str !== "string") continue;
      const y = it.transform ? Math.round(it.transform[5]): null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
        parts.push(line.trim());
        line = "";
      }
      line += it.str + (it.hasEOL ? "\n": " ");
      lastY = y;
    }
    if (line.trim()) parts.push(line.trim());
    parts.push("");
  }

  return { text: parts.join("\n"), pages: doc.numPages };
}
