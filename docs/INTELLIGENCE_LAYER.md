# Intelligence Layer

## Messy Input
Raw WhatsApp export line:
```
01/11/2024, 09:14 - Aisha K.: Hey everyone, midterm is Nov 14. Meet Friday 6pm library Room 3B!
```

## Auto-Structure Schema (per highlight)
```json
{
  "highlight_type": "event",
  "value": "Study meetup: Friday 6pm, Library Room 3B",
  "value_source": "gpt-4o",
  "value_confidence": 0.92,
  "value_review_status": "unreviewed",
  "message_id": "<uuid>"
}
```

## Events to Track
- Chat uploaded
- Parse completed (message_count)
- Highlights extracted (count by type)
- Summary generated (confidence score)
- User paid
- User pinned a highlight

## Scoring Rules (v1 — rule-based first)
| Rule | Confidence |
|------|------------|
| ISO date regex match | 0.97 |
| Street address pattern (number + street name) | 0.90 |
| URL / file attachment flag | 0.99 |
| AI-extracted event phrase | 0.75–0.95 |

## What Gets Ranked
- Highlights sorted by: pinned first → confidence desc → recency
- Free preview shows top 5 by confidence

## v1 vs Later
| v1 | Later |
|----|-------|
| Regex + GPT summary | Per-highlight GPT extraction |
| Confidence from rules | Fine-tuned classifier |
| Manual review_status | Auto-approve high-confidence items |