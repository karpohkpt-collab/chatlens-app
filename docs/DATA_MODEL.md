# Data Model

## chat_uploads
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| user_id | uuid nullable | set after auth sprint |
| created_at | timestamptz | |
| filename | text | original upload name |
| platform | text | `whatsapp` or `telegram` |
| raw_text | text | full export content |
| message_count | integer | set after parse |
| paid | boolean | unlocked via Stripe |
| stripe_session_id | text | for reconciliation |
| summary | text | **AI field** |
| summary_source | text | e.g. `gpt-4o` |
| summary_confidence | numeric | 0–1 |
| summary_review_status | text | `unreviewed` / `reviewed` |

## parsed_messages
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| user_id | uuid nullable | |
| created_at | timestamptz | |
| upload_id | uuid FK → chat_uploads | cascade delete |
| sender | text | extracted name/number |
| sent_at | timestamptz | parsed from export |
| body | text | message text |
| media_type | text | `text`, `image`, `document`, `video` |
| sequence_index | integer | order in thread |

## highlights
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| user_id | uuid nullable | |
| created_at | timestamptz | |
| upload_id | uuid FK → chat_uploads | |
| message_id | uuid FK → parsed_messages | source anchor |
| highlight_type | text | `date`, `address`, `document`, `event`, `action_item` |
| value | text | **AI field** — extracted content |
| value_source | text | `regex`, `gpt-4o` |
| value_confidence | numeric | 0–1 |
| value_review_status | text | `unreviewed` / `reviewed` |
| is_pinned | boolean | user can pin |

## audit_logs
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| user_id | uuid nullable | |
| created_at | timestamptz | |
| action | text | e.g. `upload.parsed`, `payment.completed` |
| entity_type | text | `chat_upload`, `highlight` |
| entity_id | uuid | |
| detail | jsonb | extra context |

## RLS
All tables: permissive v1 policies (read+write open). Lock-down sprint replaces with `auth.uid() = user_id`.