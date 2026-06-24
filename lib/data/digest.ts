import { createClient } from "@/lib/supabase/server";
import type { ChatUpload, Highlight, ParsedMessage } from "@/lib/types";

export interface DigestData {
  upload: ChatUpload;
  messages: ParsedMessage[];
  highlights: Highlight[];
}

export async function getDigest(uploadId: string): Promise<DigestData | null> {
  const supabase = await createClient();

  const { data: upload } = await supabase
    .from("chat_uploads")
    .select("*")
    .eq("id", uploadId)
    .single();

  if (!upload) return null;

  const { data: messages } = await supabase
    .from("parsed_messages")
    .select("*")
    .eq("upload_id", uploadId)
    .order("sequence_index", { ascending: true });

  const { data: highlights } = await supabase
    .from("highlights")
    .select("*")
    .eq("upload_id", uploadId);

  return {
    upload: upload as ChatUpload,
    messages: (messages ?? []) as ParsedMessage[],
    highlights: (highlights ?? []) as Highlight[],
  };
}

export async function listRecentUploads(limit = 6) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chat_uploads")
    .select("id, filename, platform, message_count, paid, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
