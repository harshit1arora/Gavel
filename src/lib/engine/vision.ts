import { API_BASE } from '../api-base';
import { auth } from '../firebase';

/**
 * Vision parsing for statements with no text layer.
 *
 * The browser path reads the PDF text layer locally. A scan or a photograph has
 * none, so the file goes to the decision service, which asks Gemini 2.5 Flash to
 * read the page and returns structured transactions. The engine still makes the
 * decision; the model only transcribes.
 */

export interface VisionParse {
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    type: "credit" | "debit";
    balance?: number | null;
  }>;
  bank?: string | null;
  period?: string | null;
  confidence: number;
  handwritten: boolean;
  notes: string;
  method: string;
  rejected_rows: number;
  processing_ms: number;
}

const directEngine = import.meta.env.VITE_ENGINE_URL as string | undefined;
const ENGINE_URL = directEngine || API_BASE;

export async function extractWithVision(file: File): Promise<VisionParse> {
  const form = new FormData();
  form.append("file", file, file.name);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);

  try {
    const token = directEngine ? undefined : await auth.currentUser?.getIdToken();
    const response = await fetch(`${ENGINE_URL}/v1/parse/vision`, {
      method: "POST",
      body: form,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = `The reading service returned ${response.status}`;
      try {
        const body = await response.json();
        if (body?.detail) detail = String(body.detail);
      } catch {
        /* keep the status message */
      }
      throw new Error(detail);
    }

    return (await response.json()) as VisionParse;
  } finally {
    clearTimeout(timer);
  }
}
