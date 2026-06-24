# Security

## Secret Handling
- `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` — server-side env vars only, never in client bundle
- Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` exposed to browser
- Stripe webhook endpoint validates `stripe-signature` header before processing

## Permission Model (v1 → lock-down)
- **v1**: permissive RLS — demo works without login; uploads are anonymous
- **Lock-down sprint**: `chat_uploads`, `parsed_messages`, `highlights` policies change to `auth.uid() = user_id`; anonymous rows from demo are not migrated to real users
- Agent actions inherit the session's permission level — no escalation

## Approved Tools Rule
Only the seven named tools in `AGENTIC_LAYER.md` may be invoked programmatically. No wildcard execution. Every tool call is logged to `audit_logs`.

## Audit Principle
Every meaningful state change (parse, payment, pin, review) writes a row to `audit_logs` with `action`, `entity_id`, `user_id`, and a `detail` JSON snapshot. Logs are append-only — no update or delete permissions granted to the app.

## Data Minimisation
`raw_text` is stored only to support re-parsing; it is not indexed or exposed in the UI. It will be deletable by the owner post-lock-down sprint.