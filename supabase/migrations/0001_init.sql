create table if not exists chat_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  filename text not null,
  platform text not null,
  raw_text text,
  message_count integer default 0,
  paid boolean not null default false,
  stripe_session_id text,
  summary text,
  summary_source text,
  summary_confidence numeric,
  summary_review_status text default 'unreviewed'
);

alter table chat_uploads enable row level security;
drop policy if exists "chat_uploads_v1_read" on chat_uploads;
create policy "chat_uploads_v1_read" on chat_uploads for select using (true);
drop policy if exists "chat_uploads_v1_write" on chat_uploads;
create policy "chat_uploads_v1_write" on chat_uploads for all using (true) with check (true);

create table if not exists parsed_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  upload_id uuid not null references chat_uploads(id) on delete cascade,
  sender text,
  sent_at timestamptz,
  body text,
  media_type text,
  sequence_index integer
);

alter table parsed_messages enable row level security;
drop policy if exists "parsed_messages_v1_read" on parsed_messages;
create policy "parsed_messages_v1_read" on parsed_messages for select using (true);
drop policy if exists "parsed_messages_v1_write" on parsed_messages;
create policy "parsed_messages_v1_write" on parsed_messages for all using (true) with check (true);

create table if not exists highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  upload_id uuid not null references chat_uploads(id) on delete cascade,
  message_id uuid references parsed_messages(id) on delete set null,
  highlight_type text not null,
  value text not null,
  value_source text,
  value_confidence numeric,
  value_review_status text default 'unreviewed',
  is_pinned boolean default false
);

alter table highlights enable row level security;
drop policy if exists "highlights_v1_read" on highlights;
create policy "highlights_v1_read" on highlights for select using (true);
drop policy if exists "highlights_v1_write" on highlights;
create policy "highlights_v1_write" on highlights for all using (true) with check (true);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  action text not null,
  entity_type text,
  entity_id uuid,
  detail jsonb
);

alter table audit_logs enable row level security;
drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_v1_read" on audit_logs for select using (true);
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);

insert into chat_uploads (id, filename, platform, message_count, paid, summary, summary_source, summary_confidence, summary_review_status) values
  ('a1000000-0000-0000-0000-000000000001', 'CS301_Group_Chat.txt', 'whatsapp', 142, false,
   'The group discussed the upcoming midterm on Nov 14th. Key topics: chapters 4–7. Shared study notes PDF. Meeting at library Room 3B at 6pm Friday.',
   'gpt-4o', 0.91, 'reviewed'),
  ('a1000000-0000-0000-0000-000000000002', 'Bakery_Clients_Oct.txt', 'whatsapp', 87, true,
   'Three custom cake orders confirmed: Sarah (Nov 5), Tom (Nov 12), Priya (Nov 20). Deposit payments pending from Tom. Delivery address shared by Priya.',
   'gpt-4o', 0.88, 'reviewed'),
  ('a1000000-0000-0000-0000-000000000003', 'Family_Group.zip', 'telegram', 203, false,
   'Christmas gathering planned for Dec 24 at Grandma''s house (42 Elm Street). Flight details shared by Uncle Mike. 14 photos uploaded from Thanksgiving.',
   'gpt-4o', 0.85, 'unreviewed');

insert into parsed_messages (id, upload_id, sender, sent_at, body, media_type, sequence_index) values
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Aisha K.', '2024-11-01 09:14:00+00', 'Hey everyone, midterm is Nov 14. Let''s meet Friday 6pm library Room 3B!', 'text', 1),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Raj M.', '2024-11-01 09:22:00+00', 'Sharing my notes for ch4-7', 'document', 2),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'Sarah T.', '2024-10-28 11:05:00+00', 'Hi! I need a custom cake for Nov 5, chocolate with red velvet layers. Deliver to 8 Oak Ave.', 'text', 1),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'Tom B.', '2024-10-29 14:33:00+00', 'Can I order for Nov 12? Will send deposit soon.', 'text', 2),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', 'Uncle Mike', '2024-11-15 08:00:00+00', 'My flight lands Dec 23 at 7pm, Terminal 2. See you all at Grandma''s — 42 Elm Street.', 'text', 1),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000003', 'Mom', '2024-11-15 08:45:00+00', 'Christmas dinner Dec 24, starts at 4pm. Bring a dish!', 'text', 2);

insert into highlights (upload_id, message_id, highlight_type, value, value_source, value_confidence, value_review_status) values
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'date', 'Midterm: November 14', 'regex', 0.97, 'reviewed'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'event', 'Study meetup: Friday 6pm, Library Room 3B', 'gpt-4o', 0.92, 'reviewed'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'document', 'Study notes ch4-7 (PDF)', 'regex', 0.99, 'reviewed'),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 'address', '8 Oak Ave', 'regex', 0.95, 'reviewed'),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 'date', 'Cake order: November 5', 'regex', 0.97, 'reviewed'),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 'action_item', 'Tom B. deposit payment pending', 'gpt-4o', 0.83, 'unreviewed'),
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000005', 'address', '42 Elm Street (Grandma''s house)', 'regex', 0.96, 'reviewed'),
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000005', 'date', 'Flight arrival: December 23, 7pm, Terminal 2', 'regex', 0.95, 'reviewed'),
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006', 'event', 'Christmas dinner: December 24, 4pm', 'gpt-4o', 0.93, 'reviewed');