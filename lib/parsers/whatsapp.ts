import type { MediaType, ParsedMessageInput } from "@/lib/types";

// Matches both common WhatsApp export formats:
//   01/11/2024, 09:14 - Aisha K.: message text
//   [01/11/24, 9:14:00 AM] Aisha K.: message text
const LINE_START =
  /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s?(?:[AaPp][Mm])?)\]?\s*-?\s*([^:]+):\s(.*)$/;

function detectMediaType(body: string): MediaType {
  const lower = body.toLowerCase();
  if (lower.includes("image omitted") || lower.includes("photo omitted")) return "image";
  if (lower.includes("video omitted")) return "video";
  if (lower.includes("document omitted") || lower.includes("(file attached)")) return "document";
  return "text";
}

function parseDate(dateStr: string, timeStr: string): string | null {
  const [d1, d2, d3] = dateStr.split("/").map((n) => parseInt(n, 10));
  if (!d1 || !d2 || !d3) return null;
  const year = d3 < 100 ? 2000 + d3 : d3;
  // WhatsApp exports are ambiguous between DD/MM and MM/DD; assume DD/MM/YYYY (most common export locale).
  const day = d1;
  const month = d2;

  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s?([AaPp][Mm])?/);
  if (!timeMatch) return null;
  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
  const meridiem = timeMatch[4]?.toLowerCase();
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;

  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function parseWhatsApp(rawText: string): ParsedMessageInput[] {
  const lines = rawText.split(/\r?\n/);
  const messages: ParsedMessageInput[] = [];
  let sequenceIndex = 0;

  for (const line of lines) {
    const match = line.match(LINE_START);
    if (match) {
      const [, dateStr, timeStr, sender, body] = match;
      sequenceIndex += 1;
      messages.push({
        sender: sender.trim(),
        sent_at: parseDate(dateStr, timeStr),
        body: body.trim(),
        media_type: detectMediaType(body),
        sequence_index: sequenceIndex,
      });
    } else if (messages.length > 0 && line.trim().length > 0) {
      // Continuation of a multi-line message
      const last = messages[messages.length - 1];
      last.body = `${last.body}\n${line.trim()}`;
    }
  }

  return messages;
}
