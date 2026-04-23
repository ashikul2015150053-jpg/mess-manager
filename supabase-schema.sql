-- =============================================
-- MESS MANAGEMENT SYSTEM — Supabase Schema
-- Run this in Supabase → SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- STUDENTS TABLE
-- =============================================
create table students (
  id uuid primary key default uuid_generate_v4(),
  mess_id text unique not null,         -- e.g. MESS-001
  name text not null,
  phone text not null,
  guardian_phone text,
  university text,
  room_number text,
  seat_type text default 'single',      -- single | shared
  monthly_rent numeric not null default 3000,
  joining_date date not null default current_date,
  status text default 'active',         -- active | left
  left_date date,
  created_at timestamptz default now()
);

-- =============================================
-- PAYMENTS TABLE
-- =============================================
create table payments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references students(id) on delete cascade,
  month text not null,                  -- e.g. "2025-01"
  amount numeric not null,
  bkash_trx_id text,
  payment_method text default 'bkash',  -- bkash | cash | other
  status text default 'pending',        -- pending | verified | rejected
  submitted_at timestamptz default now(),
  verified_at timestamptz,
  verified_by text,
  notes text,
  created_at timestamptz default now()
);

-- =============================================
-- NOTICES TABLE
-- =============================================
create table notices (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  priority text default 'normal',       -- normal | urgent
  created_at timestamptz default now()
);

-- =============================================
-- ROOMS TABLE
-- =============================================
create table rooms (
  id uuid primary key default uuid_generate_v4(),
  room_number text unique not null,
  capacity integer not null default 1,
  floor integer default 1,
  created_at timestamptz default now()
);

-- =============================================
-- AUTO-INCREMENT MESS ID FUNCTION
-- =============================================
create or replace function generate_mess_id()
returns trigger as $$
declare
  next_num integer;
  new_id text;
begin
  select count(*) + 1 into next_num from students;
  new_id := 'MESS-' || lpad(next_num::text, 3, '0');
  -- ensure uniqueness
  while exists (select 1 from students where mess_id = new_id) loop
    next_num := next_num + 1;
    new_id := 'MESS-' || lpad(next_num::text, 3, '0');
  end loop;
  new.mess_id := new_id;
  return new;
end;
$$ language plpgsql;

create trigger set_mess_id
before insert on students
for each row
when (new.mess_id is null or new.mess_id = '')
execute function generate_mess_id();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
alter table students enable row level security;
alter table payments enable row level security;
alter table notices enable row level security;
alter table rooms enable row level security;

-- Allow all operations for authenticated users (admin uses anon key with service role)
-- For simplicity: use anon key + disable RLS, OR use service role key in your app
-- OPTION A (simple): disable RLS for now — admin-only app
alter table students disable row level security;
alter table payments disable row level security;
alter table notices disable row level security;
alter table rooms disable row level security;

-- =============================================
-- SAMPLE DATA (optional — delete in production)
-- =============================================
insert into rooms (room_number, capacity, floor) values
  ('101', 1, 1), ('102', 2, 1), ('103', 2, 1),
  ('201', 1, 2), ('202', 2, 2), ('203', 1, 2);

insert into students (mess_id, name, phone, guardian_phone, university, room_number, seat_type, monthly_rent, joining_date) values
  ('MESS-001', 'Rakibul Hasan', '01712345678', '01898765432', 'RUET', '101', 'single', 3500, '2024-09-01'),
  ('MESS-002', 'Farhan Ahmed', '01812345678', '01798765432', 'Begum Rokeya University', '102', 'shared', 2500, '2024-10-01'),
  ('MESS-003', 'Sabbir Rahman', '01912345678', '01698765432', 'Carmichael College', '102', 'shared', 2500, '2024-11-01');

insert into notices (title, body, priority) values
  ('January Rent Due', 'Please pay your January rent by 7th. bKash to 017XXXXXXXX, reference: your MESS ID.', 'urgent'),
  ('Water Supply Notice', 'Water will be unavailable on Friday 10am-2pm for maintenance.', 'normal');
