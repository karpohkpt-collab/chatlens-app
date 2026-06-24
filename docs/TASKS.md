# Tasks & Sprints

## Sprint 1 — DB, parser engine, digest view
**Goal**: Upload a real chat export and see a working digest. No login required.

- [ ] Run migration SQL (chat_uploads, parsed_messages, highlights, audit_logs + seed data)
- [ ] File upload component (drag-and-drop, accepts .txt .zip .json)
- [ ] `/api/upload` route: save raw text to `chat_uploads`, trigger parse
- [ ] WhatsApp .txt parser (regex for date-sender-body format)
- [ ] Telegram .json parser (iterate messages array)
- [ ] Highlight extractor: date, address, URL, document, phone regex rules
- [ ] Insert `parsed_messages` + `highlights` rows, update `message_count`
- [ ] Write `upload.parsed` to `audit_logs`
- [ ] Digest page `/digest/[id]`: highlights grouped by type, each linked to source message
- [ ] Source message drawer/modal on highlight click
- [ ] Empty state (no highlights found), error state (bad file format), loading state
- [ ] Seed demo digest auto-loaded on homepage

**Definition of Done**: Upload a real .txt WhatsApp export → digest renders with ≥3 highlight types → clicking a highlight shows source message.

---

## Sprint 2 — AI summary ⭐ v1 functional milestone
**Goal**: Thread summary appears above digest; app is fully demoable end-to-end.

- [ ] `/api/summarize` route: send parsed messages to GPT-4o, store result in `chat_uploads`
- [ ] Store `summary_source`, `summary_confidence`, `summary_review_status`
- [ ] Summary card at top of digest page
- [ ] 'Review' badge on low-confidence summary (< 0.80)
- [ ] Fallback: if OpenAI unavailable, show rule-based highlight list with no summary card
- [ ] Log `summary.generated` to audit_logs

**Definition of Done**: Upload → parse → summary card visible → source links work → AI off = graceful fallback. **This is the v1 functional milestone.**

---

## Sprint 3 — Stripe checkout + paywall
**Goal**: Tool can take a real payment.

- [ ] Stripe product + price created ($9/mo), price ID in env
- [ ] Free users see first 5 highlights + blurred remainder + "Unlock full digest" CTA
- [ ] `/api/checkout` route: create Stripe Checkout session, redirect
- [ ] `/api/webhooks/stripe` route: verify signature, set `paid = true` on `chat_uploads`
- [ ] Success page (`/success`) and cancel page (`/cancel`)
- [ ] Paid users see full digest + CSV download button
- [ ] Log `payment.completed` to audit_logs

**Definition of Done**: Full checkout flow works with Stripe test card; paid upload unlocks full digest; audit log has payment row.

---

## Sprint 4 — Auth + lock-down
**Goal**: Per-user data isolation.

- [ ] Supabase Auth: email/password sign-up + login pages
- [ ] Set `user_id = auth.uid()` on upload
- [ ] Replace permissive RLS policies with owner-scoped policies
- [ ] User dashboard `/dashboard`: list past uploads, status, paid badge
- [ ] Post-parse redirect to sign-up for anonymous users (convert flow)

**Definition of Done**: User A cannot read User B's uploads. Demo seed rows remain visible as examples.

---

## Sprint 5 — Search & filters
**Goal**: Find anything across the digest.

- [ ] Full-text search across `parsed_messages.body` for a given upload
- [ ] Filter highlights by type (chips: All / Dates / Addresses / Files / Actions)
- [ ] Sender filter dropdown
- [ ] Shareable digest link (public token on `chat_uploads`)

**Definition of Done**: Search returns correct messages; filters update digest in real time.

---

## Gantt (which sprint each task lands in)
```
Sprint 1  |████ DB + parser + digest view
Sprint 2  |     ████ AI summary (v1 functional ⭐)
Sprint 3  |          ████ Stripe paywall
Sprint 4  |               ████ Auth + RLS lock-down
Sprint 5  |                    ████ Search + filters
```