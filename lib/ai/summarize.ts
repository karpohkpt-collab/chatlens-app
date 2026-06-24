import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import type { SupabaseClient } from "@supabase/supabase-js";

const OPENAI_TIMEOUT_MS = 15000;

interface SummaryResult {
  summary: string;
  confidence: number;
}

export async function generateSummary(
  messages: { sender: string; body: string }[],
): Promise<SummaryResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || messages.length === 0) return null;

  const transcript = messages
    .slice(0, 300)
    .map((m) => `${m.sender}: ${m.body}`)
    .join("\n")
    .slice(0, 12000);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Summarize this group chat export in 2-3 sentences, highlighting key dates, addresses, decisions, and action items. Respond with JSON only: {"summary": string, "confidence": number between 0 and 1 reflecting how clear and complete the thread was}.',
          },
          { role: "user", content: transcript },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (typeof parsed.summary !== "string" || !parsed.summary.trim()) return null;

    const confidence =
      typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.8;

    return { summary: parsed.summary, confidence };
  } catch (err) {
    console.error("[ai/summarize] generation failed:", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function summarizeAndStore(supabase: SupabaseClient, uploadId: string) {
  const { data: messages } = await supabase
    .from("parsed_messages")
    .select("sender, body")
    .eq("upload_id", uploadId)
    .order("sequence_index", { ascending: true });

  const result = await generateSummary(
    (messages ?? []).map((m) => ({ sender: m.sender ?? "Unknown", body: m.body ?? "" })),
  );

  if (!result) return null;

  await supabase
    .from("chat_uploads")
    .update({
      summary: result.summary,
      summary_source: "gpt-4o",
      summary_confidence: result.confidence,
      summary_review_status: "unreviewed",
    })
    .eq("id", uploadId);

  await logAudit(supabase, "summary.generated", "chat_upload", uploadId, {
    confidence: result.confidence,
  });

  return result;
}

export async function summarizeUploadStandalone(uploadId: string) {
  const supabase = await createClient();
  return summarizeAndStore(supabase, uploadId);
}
