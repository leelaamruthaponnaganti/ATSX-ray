import { LIMITS } from "../constants";

export class AnalysisRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AnalysisRequestError";
  }
}

export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  buffer: Buffer;
}

const PDF_MAGIC = Buffer.from("%PDF-");
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

export function validateUpload(file: UploadedFile): "pdf" | "docx" {
  const extension = file.name.toLowerCase().split(".").pop() ?? "";
  const declaredType = file.type.toLowerCase();

  if (file.size === 0 || file.buffer.length === 0) {
    throw new AnalysisRequestError(
      "EMPTY_FILE",
      "This file is empty. Please export your resume again and retry.",
      400,
    );
  }

  if (file.size > LIMITS.maxFileBytes) {
    throw new AnalysisRequestError(
      "FILE_TOO_LARGE",
      "That file is over 10 MB. Please upload a smaller PDF or DOCX (or paste the text instead).",
      413,
    );
  }

  const looksPdf = file.buffer.subarray(0, 5).equals(PDF_MAGIC);
  const looksZip = file.buffer.subarray(0, 4).equals(ZIP_MAGIC);
  const isPdf = extension === "pdf" && (looksPdf || declaredType === "application/pdf");
  const isDocx =
    extension === "docx" &&
    looksZip &&
    (declaredType.includes("wordprocessingml") || declaredType === "application/octet-stream" || declaredType === "");

  if (isPdf) return "pdf";
  if (isDocx) return "docx";

  throw new AnalysisRequestError(
    "UNSUPPORTED_FILE",
    "Only selectable-text PDF and DOCX files are supported. Please export your resume as PDF or DOCX, or paste the text instead.",
    415,
  );
}
