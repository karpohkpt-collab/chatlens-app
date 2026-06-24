# Test Plan

## v1 Success Scenario (manual)
1. Open homepage → demo digest loads with seed highlights and AI summary (no login)
2. Click "Upload your chat" → drop a real WhatsApp .txt export
3. Loading spinner appears; digest page loads with ≥3 highlight types
4. Click a highlight card → source message drawer opens showing sender + timestamp + full body
5. AI summary card visible at top; confidence shown
6. Only 5 highlights visible; rest blurred with "Unlock full digest" CTA
7. Click "Unlock" → Stripe Checkout opens with $9 plan
8. Enter test card `4242 4242 4242 4242` → redirect to `/success`
9. Digest reloads — all highlights visible, CSV download active
10. Check `audit_logs` table → rows for `upload.parsed`, `summary.generated`, `payment.completed`

## Empty / Edge Cases
| Case | Expected |
|------|----------|
| Upload non-chat file (e.g. PDF) | Error toast: "Unsupported file format" |
| Upload valid file with 0 messages parsed | Empty state: "No messages found — check the export format" |
| OpenAI API timeout | Digest renders without summary card; no crash |
| Stripe webhook replay (duplicate session) | Idempotent — `paid` already true, no duplicate log |
| Navigate to `/digest/nonexistent-id` | 404 page: "Digest not found" |
| Upload file > 10 MB | Client-side rejection before upload with size error |

## Regression Checks (post each sprint)
- Seed demo data still visible on homepage
- Highlight → source message link still works
- Stripe test payment still completes end-to-end
- `audit_logs` row written for every action above