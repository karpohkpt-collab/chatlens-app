import Link from "next/link";

export default function DigestNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold">Digest not found</h1>
        <p className="text-neutral-500">This chat upload doesn&apos;t exist or was removed.</p>
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to ChatLens
        </Link>
      </div>
    </main>
  );
}
