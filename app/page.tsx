import { getDigest, listRecentUploads } from "@/lib/data/digest";
import { UploadDropzone } from "@/app/components/UploadDropzone";
import { DigestView } from "@/app/components/DigestView";
import Link from "next/link";

const DEMO_UPLOAD_ID = "a1000000-0000-0000-0000-000000000001";

export default async function Home() {
  const [demo, recentUploads] = await Promise.all([
    getDigest(DEMO_UPLOAD_ID),
    listRecentUploads(8),
  ]);

  return (
    <main className="min-h-screen max-w-3xl mx-auto p-6 space-y-10">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">ChatLens</h1>
        <p className="text-neutral-500">
          Turn WhatsApp and Telegram exports into a searchable, AI-summarized digest.
        </p>
      </header>

      <UploadDropzone />

      {recentUploads.length > 1 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
            Recent uploads
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {recentUploads.map((u) => (
              <Link
                key={u.id}
                href={`/digest/${u.id}`}
                className="rounded-lg border border-neutral-200 p-3 hover:border-neutral-400 transition-colors"
              >
                <p className="text-sm font-medium truncate">{u.filename}</p>
                <p className="text-xs text-neutral-400">
                  {u.platform} · {u.message_count} messages {u.paid ? "· paid" : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
          Demo digest
        </h2>
        {demo ? (
          <DigestView upload={demo.upload} messages={demo.messages} highlights={demo.highlights} />
        ) : (
          <p className="text-sm text-neutral-400">Demo digest unavailable.</p>
        )}
      </section>
    </main>
  );
}
