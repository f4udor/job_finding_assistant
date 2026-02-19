import { NextResponse } from "next/server";
import { absPath, writeJsonFile } from "@/lib/io";
import { userProfileSchema } from "@/schemas";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const payload = await req.json();
    const profile = userProfileSchema.parse(payload.profile);

    await writeJsonFile(absPath("data", "user_profile.json"), profile);
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Invalid profile payload" },
      { status: 400 }
    );
  }
}
