import type { MediaType, ParsedMessageInput } from "@/lib/types";

interface TelegramTextEntity {
  type: string;
  text: string;
}

interface TelegramMessage {
  id: number;
  type: string;
  date?: string;
  from?: string;
  actor?: string;
  text?: string | TelegramTextEntity[];
  photo?: string;
  file?: string;
  media_type?: string;
}

interface TelegramExport {
  name?: string;
  messages?: TelegramMessage[];
}

function textToString(text: TelegramMessage["text"]): string {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text.map((entity) => entity.text).join("");
}

function detectMediaType(message: TelegramMessage): MediaType {
  if (message.photo) return "image";
  if (message.media_type === "video_file") return "video";
  if (message.file) return "document";
  return "text";
}

export function parseTelegram(rawText: string): ParsedMessageInput[] {
  let data: TelegramExport;
  try {
    data = JSON.parse(rawText);
  } catch {
    return [];
  }

  const messages = data.messages ?? [];
  const result: ParsedMessageInput[] = [];
  let sequenceIndex = 0;

  for (const message of messages) {
    if (message.type !== "message") continue;
    const body = textToString(message.text);
    const mediaType = detectMediaType(message);
    if (!body.trim() && mediaType === "text") continue;

    sequenceIndex += 1;
    result.push({
      sender: message.from ?? message.actor ?? "Unknown",
      sent_at: message.date ? new Date(message.date).toISOString() : null,
      body: body.trim() || `[${mediaType}]`,
      media_type: mediaType,
      sequence_index: sequenceIndex,
    });
  }

  return result;
}
