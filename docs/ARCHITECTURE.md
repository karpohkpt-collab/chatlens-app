# Architecture

## Stack
- **Frontend**: Next.js 14 (App Router) on Vercel
- **Database**: Supabase (Postgres + Storage)
- **AI**: OpenAI GPT-4o via server-side API route
- **Payments**: Stripe Checkout + webhooks

## What to Build Now vs Later
| Now | Later |
|-----|-------|
| File upload + parser engine | Live Telegram bot integration |
| Rule-based highlight extraction | WhatsApp Business API sync |
| AI thread summary | Scheduled digest emails |
| Digest view (no login) | Team workspaces |
| Stripe one-time paywall | Per-seat subscription billing |

## Key User Action — Step by Step
1. User drops a `.txt` chat export on the upload zone
2. Next.js API route stores raw file text in `chat_uploads`
3. Parser splits text into `parsed_messages` rows (sender, timestamp, body, media_type)
4. Highlight extractor runs regex + keyword rules → inserts `highlights` rows with type, value, source, confidence
5. OpenAI call generates thread summary → stored in `chat_uploads.summary` with source + confidence
6. Digest page fetches highlights + summary, renders grouped cards each anchored to source message
7. Free users see 5 highlights; "Unlock" triggers Stripe Checkout
8. Stripe webhook sets `chat_uploads.paid = true`; full digest unlocks

## Layer Plan
1. **Data first** — tables, parser, rule-based extraction (works with AI off)
2. **App logic** — upload flow, digest render, Stripe checkout
3. **Smart layer** — AI summary, confidence scoring, future ranking

## Core Without AI
Parser + regex highlight extraction run independently. AI summary is additive — digest renders without it if the API is unavailable.