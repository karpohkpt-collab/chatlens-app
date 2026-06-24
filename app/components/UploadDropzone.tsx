"use client";

import { useRouter } from "next/navigation";
import { useState, type DragEvent } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".txt", ".json", ".zip"];

export function UploadDropzone() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    const isAccepted = ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!isAccepted) {
      setError("Unsupported file format — upload a .txt, .json, or .zip export.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File exceeds 10 MB limit.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Upload failed.");
        setIsUploading(false);
        return;
      }

      router.push(`/digest/${data.uploadId}`);
    } catch {
      setError("Upload failed — please try again.");
      setIsUploading(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging ? "border-blue-400 bg-blue-50" : "border-neutral-300"
        }`}
      >
        {isUploading ? (
          <div className="space-y-2">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-500" />
            <p className="text-sm text-neutral-500">Parsing your chat export…</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-600">
              Drop your WhatsApp <code>.txt</code> or Telegram <code>.json</code>/<code>.zip</code> export
              here
            </p>
            <label className="mt-3 inline-block cursor-pointer rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
              Choose file
              <input
                type="file"
                accept=".txt,.json,.zip"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
          </>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
