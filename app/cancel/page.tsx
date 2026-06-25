import Link from "next/link";

export default async function CancelPage({
  searchParams,
}: {
  searchParams: Promise<{ uploadId?: string }>;
}) {
  const { uploadId } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold">Checkout canceled</h1>
        <p className="text-neutral-500">No payment was made — your free preview is still available.</p>
        {uploadId && (
          <Link href={`/digest/${uploadId}`} className="text-blue-600 hover:underline">
            ← Back to digest
          </Link>
        )}
      </div>
    </main>
  );
}
