import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const UNLOCK_PRICE_CENTS = 900;

/**
 * POST /api/checkout
 * Body: { uploadId: string }
 *
 * Creates a one-time Stripe Checkout session that unlocks the full digest
 * for a single chat_upload. Webhook sets `paid = true` on completion.
 */
export async function POST(request: Request) {
  try {
    const { uploadId } = await request.json();
    if (!uploadId) {
      return NextResponse.json({ error: "uploadId is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: upload } = await supabase
      .from("chat_uploads")
      .select("id, filename, paid")
      .eq("id", uploadId)
      .single();

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    if (upload.paid) {
      return NextResponse.json({ error: "Already unlocked" }, { status: 400 });
    }

    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: UNLOCK_PRICE_CENTS,
            product_data: {
              name: `Unlock full digest — ${upload.filename}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { uploadId },
      success_url: `${origin}/success?uploadId=${uploadId}`,
      cancel_url: `${origin}/cancel?uploadId=${uploadId}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
