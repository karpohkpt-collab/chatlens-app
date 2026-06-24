import { createClient } from "@/lib/supabase/server";
import { parseWhatsApp } from "@/lib/parsers/whatsapp";
import { parseTelegram } from "@/lib/parsers/telegram";
import { extractHighlights } from "@/lib/highlights/extract";
import { summarizeAndStore } from "@/lib/ai/summarize";
import { logAudit } from "@/lib/audit";
import type { Platform } from "@/lib/types";
import { NextResponse } from "next/server";
import AdmZip from "adm-zip";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function detectPlatformAndText(
  filename: string,
  buffer: Buffer,
): { platform: Platform; rawText: string } | null {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".txt")) {
    return { platform: "whatsapp", rawText: buffer.toString("utf-8") };
  }

  if (lower.endsWith(".json")) {
    return { platform: "telegram", rawText: buffer.toString("utf-8") };
  }

  if (lower.endsWith(".zip")) {
    try {
      const zip = new AdmZip(buffer);
      const jsonEntry = zip.getEntries().find((e) => e.entryName.toLowerCase().endsWith(".json"));
      if (jsonEntry) {
        return { platform: "telegram", rawText: zip.readAsText(jsonEntry) };
      }
      const txtEntry = zip.getEntries().find((e) => e.entryName.toLowerCase().endsWith(".txt"));
      if (txtEntry) {
        return { platform: "whatsapp", rawText: zip.readAsText(txtEntry) };
      }
    } catch {
      return null;
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectPlatformAndText(file.name, buffer);

    if (!detected) {
      return NextResponse.json({ error: "Unsupported file format" }, { status: 400 });
    }

    const { platform, rawText } = detected;
    const supabase = await createClient();

    const { data: upload, error: uploadError } = await supabase
      .from("chat_uploads")
      .insert({ filename: file.name, platform, raw_text: rawText })
      .select()
      .single();

    if (uploadError || !upload) {
      console.error("[upload] insert chat_uploads failed:", uploadError);
      return NextResponse.json({ error: "Failed to save upload" }, { status: 500 });
    }

    const parsedMessages =
      platform === "whatsapp" ? parseWhatsApp(rawText) : parseTelegram(rawText);

    if (parsedMessages.length === 0) {
      await supabase.from("chat_uploads").update({ message_count: 0 }).eq("id", upload.id);
      return NextResponse.json({ uploadId: upload.id, messageCount: 0 });
    }

    const { data: insertedMessages, error: messagesError } = await supabase
      .from("parsed_messages")
      .insert(parsedMessages.map((m) => ({ ...m, upload_id: upload.id })))
      .select();

    if (messagesError || !insertedMessages) {
      console.error("[upload] insert parsed_messages failed:", messagesError);
      return NextResponse.json({ error: "Failed to save parsed messages" }, { status: 500 });
    }

    const highlightInputs = extractHighlights(parsedMessages);
    if (highlightInputs.length > 0) {
      const { error: highlightsError } = await supabase.from("highlights").insert(
        highlightInputs.map((h) => ({
          upload_id: upload.id,
          message_id: insertedMessages[h.message_index].id,
          highlight_type: h.highlight_type,
          value: h.value,
          value_source: h.value_source,
          value_confidence: h.value_confidence,
        })),
      );
      if (highlightsError) {
        console.error("[upload] insert highlights failed:", highlightsError);
      }
    }

    await supabase
      .from("chat_uploads")
      .update({ message_count: insertedMessages.length })
      .eq("id", upload.id);

    await logAudit(supabase, "upload.parsed", "chat_upload", upload.id, {
      message_count: insertedMessages.length,
      highlight_count: highlightInputs.length,
      platform,
    });

    // AI summary is additive — upload + highlights already work without it.
    await summarizeAndStore(supabase, upload.id);

    return NextResponse.json({ uploadId: upload.id, messageCount: insertedMessages.length });
  } catch (err) {
    console.error("[upload] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
