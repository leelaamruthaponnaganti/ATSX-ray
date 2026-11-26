import { LIMITS } from "../constants";
import { normalizeText } from "../text/normalize";
import { parseDocx } from "./parseDocx";
import { parsePdf } from "./parsePdf";
import { AnalysisRequestError, validateUpload, type UploadedFile } from "./validateFile";

export const SCANNED_PDF_MESSAGE =
  "Scanned/Image PDF Detected: ATS bots cannot read images. Please upload a text-based PDF or DOCX.";

export interface ParsedDocument {
  rawText: string;
  text: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  pages: number | null;
}

export async function parseResume(file: UploadedFile): Promise<ParsedDocument> {
  const kind = validateUpload(file);
  const extracted = kind === "pdf" ? await parsePdf(file.buffer) : { text: await parseDocx(file.buffer), pages: null };
  const rawText = extracted.text ?? "";

  if (rawText.replace(/\s/g, "").length < LIMITS.scannedPdfThreshold) {
    throw new AnalysisRequestError("NO_SELECTABLE_TEXT", SCANNED_PDF_MESSAGE, 422);
  }

  const text = normalizeText(rawText);
  if (text.trim().length < LIMITS.minResumeChars) {
    throw new AnalysisRequestError(
      "RESUME_TOO_SHORT",
      "We extracted only a small amount of text from this file. Please check the file or paste the full resume text instead.",
      422,
    );
  }

  return {
    rawText,
    text,
    fileName: file.name,
    fileType: kind,
    fileSize: file.size,
    pages: extracted.pages,
  };
}
