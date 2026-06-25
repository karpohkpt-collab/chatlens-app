import Link from "next/link";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ uploadId?: string }>;
}) {
  const { uploadId } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold">Payment successful 🎉</h1>
        <p className="text-neutral-500">Your full digest is now unlocked.</p>
        {uploadId && (
          <Link href={`/digest/${uploadId}`} className="text-blue-600 hover:underline">
            View full digest →
          </Link>
        )}
      </div>
    </main>
  );
}
