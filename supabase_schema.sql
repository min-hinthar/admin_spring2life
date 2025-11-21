-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Profiles capture users, providers, and admins
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role text not null check (role in ('user','provider','admin')),
  avatar_url text,
  phone text,
  timezone text,
  specialty text,
  bio text,
  telehealth boolean default true,
  hourly_rate numeric,
  is_active boolean default true,
  created_at timestamptz default now()
);

comment on table public.profiles is 'Unified profile table for patients, providers, and admins.';

create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now()
);

create index if not exists availability_provider_idx on public.availability_slots(provider_id);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  duration_minutes integer not null default 60,
  status text not null check (status in ('pending','confirmed','cancelled')) default 'pending',
  notes text,
  cancelled_reason text,
  created_at timestamptz default now()
);

create index if not exists appointments_user_idx on public.appointments(user_id);
create index if not exists appointments_provider_idx on public.appointments(provider_id);
create index if not exists appointments_start_idx on public.appointments(starts_at desc);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.availability_slots enable row level security;
alter table public.appointments enable row level security;

-- Allow authenticated users to read profiles
create policy "Allow authenticated read profiles" on public.profiles
  for select using (auth.role() = 'authenticated');

-- Users can update their own profile
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Availability: providers can manage their slots
create policy "Providers manage own availability" on public.availability_slots
  for all using (auth.uid() = provider_id);

-- Anyone authenticated can read availability
create policy "Allow authenticated read availability" on public.availability_slots
  for select using (auth.role() = 'authenticated');

-- Appointments: authenticated users can read their related appointments
create policy "Users read own appointments" on public.appointments
  for select using (auth.uid() = user_id or auth.uid() = provider_id);

-- Patients can create appointments for themselves
create policy "Users create their appointments" on public.appointments
  for insert with check (auth.uid() = user_id);

-- Providers can update status on their appointments
create policy "Providers update their appointments" on public.appointments
  for update using (auth.uid() = provider_id);

-- Seed helper view for dashboards (optional)
create or replace view public.provider_overview as
select p.id, p.full_name, p.specialty, p.is_active,
       coalesce(count(a.*) filter (where a.status = 'confirmed'), 0) as confirmed_sessions,
       coalesce(count(a.*) filter (where a.status = 'pending'), 0) as pending_requests
from public.profiles p
left join public.appointments a on a.provider_id = p.id
where p.role = 'provider'
group by p.id;
