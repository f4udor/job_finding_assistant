import { NextResponse } from "next/server";
import { absPath, writeJsonFile, writeTextFile } from "@/lib/io";
import { parseJobDescription } from "@/lib/pipeline";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const payload = await req.json();
    const jdText = String(payload.jdText ?? "").trim();
    if (!jdText) {
      return NextResponse.json({ ok: false, error: "jdText is required" }, { status: 400 });
    }

    const jobSpec = await parseJobDescription(jdText);
    const jobDir = absPath("data", "jobs", jobSpec.id);

    await writeJsonFile(absPath(jobDir, "job_spec.json"), jobSpec);
    await writeTextFile(absPath(jobDir, "job_description.txt"), jdText);

    return NextResponse.json({ ok: true, jobSpec });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Job parsing failed" },
      { status: 400 }
    );
  }
}
