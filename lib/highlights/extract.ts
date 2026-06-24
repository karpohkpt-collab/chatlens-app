import type { HighlightInput, ParsedMessageInput } from "@/lib/types";

const MONTHS =
  "Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?";

const DATE_PATTERNS = [
  new RegExp(`\\b(${MONTHS})\\.?\\s+\\d{1,2}(st|nd|rd|th)?(,?\\s+\\d{4})?\\b`, "gi"),
  new RegExp(`\\b\\d{1,2}(st|nd|rd|th)?\\s+(${MONTHS})\\.?(,?\\s+\\d{4})?\\b`, "gi"),
  /\b\d{4}-\d{2}-\d{2}\b/g,
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
];

const ADDRESS_PATTERN =
  /\b\d{1,5}\s+[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Terrace|Way|Court|Ct)\b\.?/g;

const URL_PATTERN = /https?:\/\/\S+/g;

const DOCUMENT_KEYWORDS = /\b(pdf|document|notes?|file attached|sharing.*(file|notes)|attachment)\b/i;

const EVENT_KEYWORDS = /\b(meet(ing|up)?|party|dinner|gathering|lunch|appointment|call)\b/i;

const ACTION_KEYWORDS = /\b(pending|please send|can you|need to|don't forget|reminder|deposit|asap|TODO)\b/i;

function extractMatches(body: string, pattern: RegExp): string[] {
  const matches = body.match(pattern);
  return matches ? Array.from(new Set(matches.map((m) => m.trim()))) : [];
}

export function extractHighlights(messages: ParsedMessageInput[]): HighlightInput[] {
  const highlights: HighlightInput[] = [];

  messages.forEach((message, index) => {
    const body = message.body;
    if (!body) return;

    for (const pattern of DATE_PATTERNS) {
      for (const match of extractMatches(body, pattern)) {
        highlights.push({
          message_index: index,
          highlight_type: "date",
          value: match,
          value_source: "regex",
          value_confidence: 0.97,
        });
      }
    }

    for (const match of extractMatches(body, ADDRESS_PATTERN)) {
      highlights.push({
        message_index: index,
        highlight_type: "address",
        value: match,
        value_source: "regex",
        value_confidence: 0.9,
      });
    }

    for (const match of extractMatches(body, URL_PATTERN)) {
      highlights.push({
        message_index: index,
        highlight_type: "document",
        value: match,
        value_source: "regex",
        value_confidence: 0.99,
      });
    }

    if (message.media_type === "document" || DOCUMENT_KEYWORDS.test(body)) {
      highlights.push({
        message_index: index,
        highlight_type: "document",
        value: message.media_type === "document" ? `Shared document from ${message.sender}` : body.slice(0, 120),
        value_source: "regex",
        value_confidence: message.media_type === "document" ? 0.99 : 0.8,
      });
    }

    const hasDate = DATE_PATTERNS.some((p) => {
      p.lastIndex = 0;
      return p.test(body);
    });
    if (EVENT_KEYWORDS.test(body) && hasDate) {
      highlights.push({
        message_index: index,
        highlight_type: "event",
        value: body.slice(0, 140),
        value_source: "regex",
        value_confidence: 0.75,
      });
    }

    if (ACTION_KEYWORDS.test(body)) {
      highlights.push({
        message_index: index,
        highlight_type: "action_item",
        value: `${message.sender}: ${body.slice(0, 120)}`,
        value_source: "regex",
        value_confidence: 0.78,
      });
    }
  });

  return highlights;
}
