import { PDFParse } from "pdf-parse";
import { AnalysisRequestError } from "./validateFile";

export interface PdfExtraction {
  text: string;
  pages: number | null;
}

export async function parsePdf(buffer: Buffer): Promise<PdfExtraction> {
  let parser: PDFParse | null = null;
  try {
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return {
      text: result.text ?? "",
      pages: typeof result.total === "number" ? result.total : null,
    };
  } catch {
    throw new AnalysisRequestError(
      "PDF_UNREADABLE",
      "We could not read this PDF. It may be password-protected or damaged. Try exporting it again or paste the resume text instead.",
      422,
    );
  } finally {
    if (parser) {
      await parser.destroy().catch(() => undefined);
    }
  }
}
