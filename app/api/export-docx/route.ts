import { NextResponse, type NextRequest } from "next/server";
import { Document, HeadingLevel, Packer, Paragraph } from "docx";

export const runtime = "nodejs";

const HEADINGS = new Set(["SUMMARY", "TECHNICAL SKILLS", "EXPERIENCE", "PROJECTS", "EDUCATION"]);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { text?: unknown; fileName?: unknown };
    const text = typeof body.text === "string" ? body.text.replace(/\r\n?/g, "\n").trim() : "";
    if (text.length < 20) {
      return NextResponse.json(
        { error: { code: "EMPTY_RESUME", message: "Generate or edit a tailored resume before exporting." } },
        { status: 400 },
      );
    }

    const children = text.split("\n").map((line) => {
      const clean = line.trimEnd();
      const upper = clean.trim().toUpperCase();
      if (HEADINGS.has(upper)) {
        return new Paragraph({ text: upper, heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 120 } });
      }
      if (!clean.trim()) return new Paragraph({ text: "", spacing: { after: 60 } });
      return new Paragraph({ text: clean, spacing: { after: 100 } });
    });

    const document = new Document({
      creator: "ATSXray",
      title: "Tailored ATS Resume",
      sections: [{ children }],
    });
    const buffer = await Packer.toBuffer(document);

    const rawName = typeof body.fileName === "string" && body.fileName.trim() ? body.fileName.trim() : "tailored-resume";
    const safeName = rawName
      .replace(/\.docx$/i, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "tailored-resume";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeName}.docx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "EXPORT_FAILED", message: "We could not create the Word document. Please try again." } },
      { status: 500 },
    );
  }
}
