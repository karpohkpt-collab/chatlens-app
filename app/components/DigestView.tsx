"use client";

import { useState } from "react";
import type { ChatUpload, Highlight, ParsedMessage } from "@/lib/types";
import {
  HIGHLIGHT_TYPE_LABELS,
  HIGHLIGHT_TYPE_ORDER,
  groupByType,
  rankHighlights,
} from "@/lib/digest";

function downloadHighlightsCsv(filename: string, highlights: Highlight[]) {
  const header = ["type", "value", "source", "confidence", "review_status"];
  const rows = highlights.map((h) => [
    h.highlight_type,
    `"${h.value.replace(/"/g, '""')}"`,
    h.value_source ?? "",
    String(h.value_confidence ?? ""),
    h.value_review_status,
  ]);
  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename.replace(/\.[^/.]+$/, "")}-digest.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const TYPE_ICON: Record<string, string> = {
  date: "📅",
  event: "🗓️",
  address: "📍",
  document: "📄",
  action_item: "✅",
};

export function DigestView({
  upload,
  messages,
  highlights,
}: {
  upload: ChatUpload;
  messages: ParsedMessage[];
  highlights: Highlight[];
}) {
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const messageById = new Map(messages.map((m) => [m.id, m]));
  const activeMessage = activeMessageId ? messageById.get(activeMessageId) : null;

  const ranked = rankHighlights(highlights);
  const grouped = groupByType(ranked);

  async function handleUnlock() {
    setIsCheckingOut(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId: upload.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setCheckoutError(data.error ?? "Checkout failed — please try again.");
        setIsCheckingOut(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setCheckoutError("Checkout failed — please try again.");
      setIsCheckingOut(false);
    }
  }

  if (upload.message_count === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
        No messages found — check the export format.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{upload.filename}</h1>
        <p className="text-sm text-neutral-500">
          {upload.platform} · {upload.message_count} messages
        </p>
      </header>

      {upload.summary && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-blue-900">AI Summary</h2>
            {upload.summary_confidence !== null && upload.summary_confidence < 0.8 && (
              <span className="text-xs rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">
                Review
              </span>
            )}
          </div>
          <p className="text-sm text-blue-900">{upload.summary}</p>
          {upload.summary_confidence !== null && (
            <p className="text-xs text-blue-600">
              Confidence: {Math.round((upload.summary_confidence ?? 0) * 100)}%
            </p>
          )}
        </div>
      )}

      {ranked.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
          No highlights found in this chat.
        </div>
      ) : (
        <div className="space-y-6">
          {HIGHLIGHT_TYPE_ORDER.filter((type) => grouped[type].length > 0).map((type) => (
            <section key={type} className="space-y-2">
              <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
                {TYPE_ICON[type]} {HIGHLIGHT_TYPE_LABELS[type]}
              </h3>
              <div className="grid gap-2">
                {grouped[type].map((highlight) => {
                  return (
                    <button
                      key={highlight.id}
                      onClick={() => setActiveMessageId(highlight.message_id)}
                      className="text-left rounded-lg border border-neutral-200 p-3 hover:border-neutral-400 transition-colors bg-white"
                    >
                      <p className="text-sm text-neutral-900">{highlight.value}</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {highlight.value_source} · {Math.round((highlight.value_confidence ?? 0) * 100)}%
                        confidence
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {!upload.paid && ranked.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center space-y-2">
          <p className="text-sm text-amber-900">
            Want this digest as a CSV you can keep and share?
          </p>
          <button
            onClick={handleUnlock}
            disabled={isCheckingOut}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {isCheckingOut ? "Redirecting to checkout…" : "Unlock CSV download — $9"}
          </button>
          {checkoutError && <p className="text-xs text-red-600">{checkoutError}</p>}
        </div>
      )}

      {upload.paid && (
        <div className="flex justify-end">
          <button
            onClick={() => downloadHighlightsCsv(upload.filename, ranked)}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:border-neutral-500"
          >
            Download CSV
          </button>
        </div>
      )}

      {activeMessage && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-4 z-50"
          onClick={() => setActiveMessageId(null)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-5 space-y-2 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{activeMessage.sender}</span>
              <button
                onClick={() => setActiveMessageId(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              {activeMessage.sent_at ? new Date(activeMessage.sent_at).toLocaleString() : "Unknown time"}
            </p>
            <p className="text-sm text-neutral-800 whitespace-pre-wrap">{activeMessage.body}</p>
            <p className="text-xs text-neutral-400">media: {activeMessage.media_type}</p>
          </div>
        </div>
      )}
    </div>
  );
}
