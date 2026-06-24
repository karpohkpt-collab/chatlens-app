import { createClient } from "@/lib/supabase/server";
import { summarizeAndStore } from "@/lib/ai/summarize";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { uploadId } = await request.json();
    if (!uploadId) {
      return NextResponse.json({ error: "uploadId is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const result = await summarizeAndStore(supabase, uploadId);

    if (!result) {
      return NextResponse.json({ summary: null });
    }

    return NextResponse.json({ summary: result.summary, confidence: result.confidence });
  } catch (err) {
    console.error("[summarize] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
