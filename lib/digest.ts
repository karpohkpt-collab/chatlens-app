import type { Highlight, HighlightType } from "@/lib/types";

export const HIGHLIGHT_TYPE_ORDER: HighlightType[] = [
  "date",
  "event",
  "address",
  "document",
  "action_item",
];

export const HIGHLIGHT_TYPE_LABELS: Record<HighlightType, string> = {
  date: "Dates",
  event: "Events",
  address: "Addresses",
  document: "Documents",
  action_item: "Action Items",
};

export function rankHighlights(highlights: Highlight[]): Highlight[] {
  return [...highlights].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    const confDiff = (b.value_confidence ?? 0) - (a.value_confidence ?? 0);
    if (confDiff !== 0) return confDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function groupByType(highlights: Highlight[]): Record<HighlightType, Highlight[]> {
  const groups: Record<HighlightType, Highlight[]> = {
    date: [],
    event: [],
    address: [],
    document: [],
    action_item: [],
  };
  for (const highlight of highlights) {
    groups[highlight.highlight_type].push(highlight);
  }
  return groups;
}
