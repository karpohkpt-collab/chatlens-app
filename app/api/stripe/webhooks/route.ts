import { constructWebhookEvent } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

/**
 * POST /api/stripe/webhooks
 *
 * Register this URL in the Stripe dashboard → Webhooks, listening for:
 *   - checkout.session.completed
 */
export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(payload, signature);
  } catch (err) {
    console.error("[stripe/webhooks] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const uploadId = session.metadata?.uploadId;
      if (!uploadId) {
        return NextResponse.json({ received: true });
      }

      const { data: upload } = await supabase
        .from("chat_uploads")
        .select("paid")
        .eq("id", uploadId)
        .single();

      // Idempotent: webhook replays / duplicate sessions don't double-log.
      if (!upload?.paid) {
        await supabase
          .from("chat_uploads")
          .update({ paid: true, stripe_session_id: session.id })
          .eq("id", uploadId);

        await logAudit(supabase, "payment.completed", "chat_upload", uploadId, {
          stripe_session_id: session.id,
          amount_total: session.amount_total,
        });
      }
    }
  } catch (err) {
    console.error(`[stripe/webhooks] error handling ${event.type}:`, err);
    // Return 200 anyway — Stripe retries on 5xx, not on handler errors.
  }

  return NextResponse.json({ received: true });
}
