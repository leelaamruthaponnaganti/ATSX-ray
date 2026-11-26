import mammoth from "mammoth";
import { normalizeText } from "../text/normalize";
import { AnalysisRequestError } from "./validateFile";

export async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return normalizeText(result.value ?? "");
  } catch {
    throw new AnalysisRequestError(
      "DOCX_UNREADABLE",
      "We could not read this DOCX. It may be corrupted or use an unsupported format. Try saving as .docx again or paste the resume text instead.",
      422,
    );
  }
}
