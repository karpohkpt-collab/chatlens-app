# Agentic Layer

## Risk Levels & Actions

### Low Risk — Auto-execute
- Parse uploaded file into `parsed_messages` (tool: `parse_chat_export`)
- Run regex extractor → insert `highlights` (tool: `extract_highlights`)
- Generate AI thread summary → update `chat_uploads.summary` (tool: `summarize_thread`)

### Medium Risk — Light approval
- Mark a highlight as `reviewed` (tool: `update_highlight_status`) — user clicks confirm
- Pin a highlight (tool: `pin_highlight`) — immediate but logged

### High Risk — Always approval
- Initiate Stripe Checkout session (tool: `create_checkout_session`) — user explicitly clicks Pay
- Mark upload as `paid` on webhook (tool: `mark_upload_paid`) — triggered only by verified Stripe event

### Critical — Human only
- Delete a chat upload and all its data
- Refund via Stripe (done in Stripe dashboard, never in app)

## Named Tools Only
`parse_chat_export`, `extract_highlights`, `summarize_thread`, `update_highlight_status`, `pin_highlight`, `create_checkout_session`, `mark_upload_paid`

No `run_any`, no `send_any`.

## Audit Log Fields
`action`, `entity_type`, `entity_id`, `user_id`, `detail` (JSON with before/after), `created_at`

## v1 vs Later
| v1 | Later |
|----|-------|
| Auto parse + extract on upload | Scheduled re-parse for live-sync chats |
| Manual Stripe checkout | Subscription auto-renewal |
| — | Agent drafts digest email for approval |