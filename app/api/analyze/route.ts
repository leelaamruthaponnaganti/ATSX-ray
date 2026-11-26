import { NextResponse, type NextRequest } from "next/server";
import { LIMITS } from "@/lib/constants";
import { parseResume } from "@/lib/parsing/parseResume";
import { AnalysisRequestError } from "@/lib/parsing/validateFile";
import { getProvider } from "@/lib/providers";

export const runtime = "nodejs";
export const maxDuration = 60;

interface JsonBody {
  resumeText?: unknown;
  jobDescription?: unknown;
  fileName?: unknown;
  fileType?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let resumeText = "";
    let rawText = "";
    let jobDescription = "";
    let fileName: string | undefined;
    let fileType: string | undefined;
    let fileSize: number | undefined;
    let pages: number | null = null;

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as JsonBody;
      jobDescription = typeof body.jobDescription === "string" ? body.jobDescription : "";
      resumeText = typeof body.resumeText === "string" ? body.resumeText : "";
      rawText = resumeText;
      fileName = typeof body.fileName === "string" ? body.fileName : undefined;
      fileType = typeof body.fileType === "string" ? body.fileType : undefined;
      fileSize = Buffer.byteLength(resumeText, "utf8");

      if (resumeText.trim().length < LIMITS.minResumeChars) {
        throw new AnalysisRequestError(
          "RESUME_TOO_SHORT",
          "Please paste at least 80 characters of resume text, or upload a PDF/DOCX file.",
          400,
        );
      }
    } else {
      const formData = await request.formData();
      const upload = formData.get("resume");
      const description = formData.get("jobDescription");
      jobDescription = typeof description === "string" ? description : "";

      if (!(upload instanceof File)) {
        throw new AnalysisRequestError(
          "MISSING_RESUME",
          "Please upload a PDF or DOCX resume before analyzing.",
          400,
        );
      }

      const buffer = Buffer.from(await upload.arrayBuffer());
      const parsed = await parseResume({
        name: upload.name,
        type: upload.type,
        size: upload.size,
        buffer,
      });
      resumeText = parsed.text;
      rawText = parsed.rawText;
      fileName = parsed.fileName;
      fileType = parsed.fileType;
      fileSize = parsed.fileSize;
      pages = parsed.pages;
    }

    if (jobDescription.trim().length < LIMITS.minJobDescriptionChars) {
      throw new AnalysisRequestError(
        "JD_TOO_SHORT",
        "Please provide a job description with at least 40 characters so we can identify real requirements.",
        400,
      );
    }

    const result = await getProvider().analyze({
      resumeText,
      rawText,
      jobDescription,
      fileName,
      fileType,
      fileSize,
      pages,
    });

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AnalysisRequestError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    console.error("ATS analysis failed:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Something went wrong while analyzing. Please try again.",
        },
      },
      { status: 500 },
    );
  }
}
