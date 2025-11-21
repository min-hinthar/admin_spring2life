-- Supabase schema for Spring2Life
-- Run this script inside your Supabase project's SQL editor.

-- Enable UUID helper
create extension if not exists "pgcrypto";

-- User profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null check (role in ('user','provider','admin')),
  avatar_url text,
  timezone text,
  specialty text,
  bio text,
  telehealth boolean default true,
  hourly_rate numeric(10,2),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Availability for providers
create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time text not null,
  end_time text not null,
  created_at timestamptz default now()
);

-- Appointments
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  duration_minutes int not null default 60,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  notes text,
  cancelled_reason text,
  created_at timestamptz default now()
);

-- Helpful indexes
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_availability_provider on public.availability_slots(provider_id);
create index if not exists idx_appointments_user on public.appointments(user_id);
create index if not exists idx_appointments_provider on public.appointments(provider_id);
create index if not exists idx_appointments_starts_at on public.appointments(starts_at);

-- Basic RLS policies
alter table public.profiles enable row level security;
alter table public.availability_slots enable row level security;
alter table public.appointments enable row level security;

-- Profiles: users can read any, update their own
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Availability slots: providers manage their own, everyone can view
create policy "Availability readable" on public.availability_slots for select using (true);
create policy "Providers manage availability" on public.availability_slots for insert with check (auth.uid() = provider_id);
create policy "Providers update availability" on public.availability_slots for update using (auth.uid() = provider_id);
create policy "Providers delete availability" on public.availability_slots for delete using (auth.uid() = provider_id);

-- Appointments: provider or user may access their rows
create policy "Appointments readable" on public.appointments for select using (auth.uid() = user_id or auth.uid() = provider_id);
create policy "Users create appointments" on public.appointments for insert with check (auth.uid() = user_id);
create policy "Providers update appointment status" on public.appointments for update using (auth.uid() = provider_id);

-- Seed demo data (optional)
insert into public.profiles (id, email, full_name, role, avatar_url, specialty, bio, telehealth, hourly_rate, is_active)
values
  ('00000000-0000-0000-0000-000000000001', 'jane@example.com', 'Jane Doe', 'user', 'https://i.pravatar.cc/150?u=jane', null, null, true, null, true)
  on conflict (id) do nothing,
  ('00000000-0000-0000-0000-000000000002', 'admin@spring2life.com', 'System Admin', 'admin', 'https://i.pravatar.cc/150?u=admin', null, null, true, null, true) on conflict (id) do nothing,
  ('00000000-0000-0000-0000-000000000003', 'dr.smith@spring2life.com', 'Dr. Sarah Smith', 'provider', 'https://i.pravatar.cc/150?u=sarah', 'Clinical Psychologist', 'Specializing in CBT and anxiety disorders with 10+ years of experience.', true, 150, true) on conflict (id) do nothing,
  ('00000000-0000-0000-0000-000000000004', 'dr.jones@spring2life.com', 'Dr. Michael Jones', 'provider', 'https://i.pravatar.cc/150?u=michael', 'Psychiatrist', 'Expert in medication management and mood disorders.', true, 200, true) on conflict (id) do nothing;

insert into public.availability_slots (provider_id, day_of_week, start_time, end_time)
values
  ('00000000-0000-0000-0000-000000000003', 1, '09:00', '17:00'),
  ('00000000-0000-0000-0000-000000000003', 3, '10:00', '16:00'),
  ('00000000-0000-0000-0000-000000000003', 5, '09:00', '14:00'),
  ('00000000-0000-0000-0000-000000000004', 2, '11:00', '19:00'),
  ('00000000-0000-0000-0000-000000000004', 4, '11:00', '19:00')
  on conflict do nothing;
