-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Role and status enums
create type user_role as enum ('user', 'provider', 'admin');
create type appointment_status as enum ('pending', 'confirmed', 'rescheduled', 'cancelled', 'completed');

-- Profiles table keeps a single source of truth for all roles
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null unique,
  full_name text not null,
  role user_role not null default 'user',
  avatar_url text,
  timezone text,
  specialty text,
  bio text,
  telehealth boolean default true,
  hourly_rate numeric,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Availability for providers
create table if not exists public.provider_availability (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now()
);

-- Appointment lifecycle
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  appointment_type text,
  starts_at timestamptz not null,
  duration_minutes int not null default 60,
  status appointment_status not null default 'pending',
  notes text,
  cancelled_reason text,
  rescheduled_from timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_appointments_user_id on public.appointments(user_id);
create index if not exists idx_appointments_provider_id on public.appointments(provider_id);

-- Notification stream
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  meta jsonb default '{}'::jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

-- Lightweight audit log for compliance-friendly tracking
create table if not exists public.audit_logs (
  id bigserial primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  payload jsonb,
  created_at timestamptz default now()
);

-- Helper function to check admin role
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

-- Enable row level security
alter table public.profiles enable row level security;
alter table public.provider_availability enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles policies
create policy "Profiles are viewable by self or admins"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "Profiles are insertable by authenticated users"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Profiles are updatable by owner or admins"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin(auth.uid()));

-- Provider availability policies
create policy "Providers can manage their availability"
  on public.provider_availability for all
  using (auth.uid() = provider_id or public.is_admin(auth.uid()))
  with check (auth.uid() = provider_id or public.is_admin(auth.uid()));

-- Appointment policies
create policy "Users can see their appointments"
  on public.appointments for select
  using (
    auth.uid() = user_id
    or auth.uid() = provider_id
    or public.is_admin(auth.uid())
  );

create policy "Users can create appointments for themselves"
  on public.appointments for insert
  with check (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "Users or admins can update status"
  on public.appointments for update
  using (
    auth.uid() = user_id
    or auth.uid() = provider_id
    or public.is_admin(auth.uid())
  );

-- Notification policies
create policy "Notifications are scoped to recipient"
  on public.notifications for all
  using (auth.uid() = user_id or public.is_admin(auth.uid()))
  with check (auth.uid() = user_id or public.is_admin(auth.uid()));

-- Audit logs are viewable by admins only
create policy "Audit logs readable by admins"
  on public.audit_logs for select
  using (public.is_admin(auth.uid()));
