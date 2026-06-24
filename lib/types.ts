export type Platform = "whatsapp" | "telegram";

export type MediaType = "text" | "image" | "document" | "video";

export type HighlightType = "date" | "address" | "document" | "event" | "action_item";

export type ReviewStatus = "unreviewed" | "reviewed";

export interface ChatUpload {
  id: string;
  user_id: string | null;
  created_at: string;
  filename: string;
  platform: Platform;
  raw_text: string | null;
  message_count: number;
  paid: boolean;
  stripe_session_id: string | null;
  summary: string | null;
  summary_source: string | null;
  summary_confidence: number | null;
  summary_review_status: ReviewStatus;
}

export interface ParsedMessage {
  id: string;
  user_id: string | null;
  created_at: string;
  upload_id: string;
  sender: string | null;
  sent_at: string | null;
  body: string | null;
  media_type: MediaType;
  sequence_index: number;
}

export interface Highlight {
  id: string;
  user_id: string | null;
  created_at: string;
  upload_id: string;
  message_id: string | null;
  highlight_type: HighlightType;
  value: string;
  value_source: string | null;
  value_confidence: number | null;
  value_review_status: ReviewStatus;
  is_pinned: boolean;
}

export interface ParsedMessageInput {
  sender: string;
  sent_at: string | null;
  body: string;
  media_type: MediaType;
  sequence_index: number;
}

export interface HighlightInput {
  message_index: number;
  highlight_type: HighlightType;
  value: string;
  value_source: "regex" | "gpt-4o";
  value_confidence: number;
}
