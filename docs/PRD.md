# ChatLens — Product Requirements

## Problem
Important information—addresses, schedules, shared files, photos—disappears into endless WhatsApp and Telegram threads. Users waste time scrolling to recover what was shared.

## Target Users
- **Students** — recover class schedules, shared notes, deadlines from group chats
- **Small businesses** — extract client requests, delivery addresses, orders
- **Families** — find event dates, photos, travel details
- **Community admins** — turn announcement floods into clean digests

## Core Objects
- `chat_upload` — an exported chat file (platform, filename, raw text, paid status)
- `parsed_message` — individual message (sender, timestamp, body, media type)
- `highlight` — extracted item (type: date / address / document / event / action_item, linked to source message)
- `audit_log` — every meaningful system action

## MVP Checklist (v1 must-haves)
- [ ] Upload WhatsApp `.txt` or Telegram `.json`/`.zip` export
- [ ] Parse into sender + timestamp + body + media type
- [ ] Extract highlights via rules (dates, addresses, URLs, media)
- [ ] AI summary of the full thread
- [ ] Digest view: highlights grouped by type, each linked to source message
- [ ] Free preview (first 5 highlights); Stripe checkout unlocks full digest
- [ ] App loads with demo data — no login required

## Non-Goals (v1)
- Live WhatsApp / Telegram API sync
- User accounts or saved history
- Team workspaces
- Mobile app

## Success Criteria
A teacher uploads a 200-message class WhatsApp export, sees a digest with the exam date, the homework PDF, and the study meetup address each linked to the original message, then pays $9 to download the full CSV — all without creating an account.