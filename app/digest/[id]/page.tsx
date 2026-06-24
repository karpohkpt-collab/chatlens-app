import { getDigest } from "@/lib/data/digest";
import { DigestView } from "@/app/components/DigestView";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function DigestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const digest = await getDigest(id);

  if (!digest) {
    notFound();
  }

  return (
    <main className="min-h-screen max-w-3xl mx-auto p-6 space-y-6">
      <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600">
        ← Back to ChatLens
      </Link>
      <DigestView upload={digest.upload} messages={digest.messages} highlights={digest.highlights} />
    </main>
  );
}
