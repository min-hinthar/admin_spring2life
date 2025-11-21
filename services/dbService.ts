'use client';

import { supabase } from '../lib/supabaseClient';
import { Appointment, AppointmentStatus, AvailabilitySlot, Notification, ProviderProfile, UserProfile } from '../types';

const seedUsers: UserProfile[] = [
  {
    id: 'user-1',
    email: 'jane@example.com',
    fullName: 'Jane Doe',
    role: 'user',
    avatarUrl: 'https://i.pravatar.cc/150?u=jane',
    timezone: 'America/New_York',
  },
  {
    id: 'admin-1',
    email: 'admin@spring2life.com',
    fullName: 'System Admin',
    role: 'admin',
    avatarUrl: 'https://i.pravatar.cc/150?u=admin',
  },
];

const seedProviders: ProviderProfile[] = [
  {
    id: 'provider-1',
    email: 'dr.smith@spring2life.com',
    fullName: 'Dr. Sarah Smith',
    role: 'provider',
    specialty: 'Clinical Psychologist',
    bio: 'Specializing in CBT and anxiety disorders with 10+ years of experience. I focus on a holistic approach to mental wellness.',
    telehealth: true,
    hourlyRate: 150,
    isActive: true,
    availability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '10:00', endTime: '16:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '14:00' },
    ],
    avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
  },
  {
    id: 'provider-2',
    email: 'dr.jones@spring2life.com',
    fullName: 'Dr. Michael Jones',
    role: 'provider',
    specialty: 'Psychiatrist',
    bio: 'Expert in medication management and mood disorders. Dedicated to finding the right balance for your life.',
    telehealth: true,
    hourlyRate: 200,
    isActive: true,
    availability: [
      { dayOfWeek: 2, startTime: '11:00', endTime: '19:00' },
      { dayOfWeek: 4, startTime: '11:00', endTime: '19:00' },
    ],
    avatarUrl: 'https://i.pravatar.cc/150?u=michael',
  },
];

const seedAppointments: Appointment[] = [
  {
    id: 'appt-1',
    userId: 'user-1',
    providerId: 'provider-1',
    providerName: 'Dr. Sarah Smith',
    userName: 'Jane Doe',
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    durationMinutes: 60,
    status: 'confirmed',
    notes: 'Initial consultation for anxiety',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'appt-2',
    userId: 'user-1',
    providerId: 'provider-2',
    providerName: 'Dr. Michael Jones',
    userName: 'Jane Doe',
    startsAt: new Date(Date.now() - 86400000).toISOString(),
    durationMinutes: 45,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
];

const seedNotifications: Notification[] = [
  {
    id: 'note-1',
    userId: 'user-1',
    message: 'Welcome back! You have an upcoming session with Dr. Sarah Smith.',
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'note-2',
    userId: 'provider-1',
    message: 'New appointment request from Jane Doe pending review.',
    read: false,
    createdAt: new Date().toISOString(),
  },
];

const memory = {
  users: [...seedUsers],
  providers: [...seedProviders],
  appointments: [...seedAppointments],
  notifications: [...seedNotifications],
};

const mapProfile = (row: any): UserProfile => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name,
  role: row.role,
  avatarUrl: row.avatar_url ?? undefined,
  timezone: row.timezone ?? undefined,
  bio: row.bio ?? undefined,
  specialty: row.specialty ?? undefined,
  telehealth: row.telehealth ?? undefined,
  hourlyRate: row.hourly_rate ?? undefined,
  isActive: row.is_active ?? undefined,
});

const mapAppointment = (row: any, profileLookup: Record<string, UserProfile>): Appointment => ({
  id: row.id,
  userId: row.user_id,
  providerId: row.provider_id,
  startsAt: row.starts_at,
  durationMinutes: row.duration_minutes,
  status: row.status,
  notes: row.notes ?? undefined,
  cancelledReason: row.cancelled_reason ?? undefined,
  updatedAt: row.updated_at ?? undefined,
  createdAt: row.created_at ?? new Date().toISOString(),
  userName: profileLookup[row.user_id]?.fullName ?? 'Patient',
  providerName: profileLookup[row.provider_id]?.fullName ?? 'Provider',
  providerAvatar: profileLookup[row.provider_id]?.avatarUrl,
});

export const db = {
  users: {
    async getAll(): Promise<UserProfile[]> {
      if (supabase) {
        const { data, error } = await supabase.from('profiles').select('*');
        if (!error && data) return data.map(mapProfile);
        if (error) console.error('Profile list failed', error.message);
      }
      return memory.users;
    },
    async upsertProfile(profile: { id: string; email: string; fullName: string; role: string }) {
      if (supabase) {
        const { error } = await supabase.from('profiles').upsert({
          id: profile.id,
          email: profile.email,
          full_name: profile.fullName,
          role: profile.role,
        });
        if (error) console.error('Profile upsert failed', error.message);
      } else {
        const existingIndex = memory.users.findIndex(u => u.id === profile.id);
        if (existingIndex >= 0) memory.users[existingIndex] = { ...memory.users[existingIndex], ...profile } as UserProfile;
        else memory.users.push({ ...profile, role: profile.role as any });
      }
    },
    async getById(id: string): Promise<UserProfile | undefined> {
      if (supabase) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
        if (error) {
          console.error('Profile fetch failed', error.message);
          return memory.users.find(u => u.id === id);
        }
        return mapProfile(data);
      }
      return memory.users.find(u => u.id === id);
    },
    async findByEmail(email: string): Promise<UserProfile | undefined> {
      if (supabase) {
        const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
        if (error) {
          console.error('findByEmail failed', error.message);
          return memory.users.find(u => u.email === email);
        }
        return data ? mapProfile(data) : undefined;
      }
      return memory.users.find(u => u.email === email);
    },
  },
  providers: {
    async getAll(): Promise<ProviderProfile[]> {
      if (supabase) {
        const [{ data, error }, availability] = await Promise.all([
          supabase.from('profiles').select('*').eq('role', 'provider').eq('is_active', true),
          supabase.from('provider_availability').select('*'),
        ]);
        if (!error && data) {
          const grouped = (availability.data ?? []).reduce<Record<string, AvailabilitySlot[]>>((acc, slot) => {
            const slotData: AvailabilitySlot = {
              id: slot.id,
              providerId: slot.provider_id,
              dayOfWeek: slot.day_of_week,
              startTime: slot.start_time,
              endTime: slot.end_time,
            };
            acc[slot.provider_id] = acc[slot.provider_id] ? [...acc[slot.provider_id], slotData] : [slotData];
            return acc;
          }, {});
          return data.map(mapProfile).map(p => ({ ...p, availability: grouped[p.id] ?? [], specialty: p.specialty || 'General', bio: p.bio || '', telehealth: p.telehealth ?? true, hourlyRate: p.hourlyRate ?? 150, isActive: p.isActive ?? true })) as ProviderProfile[];
        }
        if (error) console.error('provider list failed', error.message);
      }
      return memory.providers;
    },
    async getById(id: string): Promise<ProviderProfile | undefined> {
      const providers = await this.getAll();
      return providers.find(p => p.id === id);
    },
    async updateAvailability(id: string, slots: AvailabilitySlot[]) {
      if (supabase) {
        await supabase.from('provider_availability').delete().eq('provider_id', id);
        const payload = slots.map(slot => ({
          provider_id: id,
          day_of_week: slot.dayOfWeek,
          start_time: slot.startTime,
          end_time: slot.endTime,
        }));
        const { error } = await supabase.from('provider_availability').insert(payload);
        if (error) console.error('availability update failed', error.message);
      }
      const idx = memory.providers.findIndex(p => p.id === id);
      if (idx !== -1) memory.providers[idx].availability = slots;
    },
  },
  appointments: {
    async getAll(): Promise<Appointment[]> {
      if (supabase) {
        const { data, error } = await supabase.from('appointments').select('*').order('starts_at', { ascending: true });
        if (!error && data) {
          const profileLookup: Record<string, UserProfile> = {};
          const profileIds = Array.from(new Set(data.flatMap(d => [d.user_id, d.provider_id])));
          if (profileIds.length) {
            const { data: profiles } = await supabase.from('profiles').select('*').in('id', profileIds);
            profiles?.forEach(p => {
              profileLookup[p.id] = mapProfile(p);
            });
          }
          return data.map(row => mapAppointment(row, profileLookup));
        }
        if (error) console.error('appointment fetch failed', error.message);
      }
      return [...memory.appointments];
    },
    async getByUserId(userId: string) {
      const all = await this.getAll();
      return all.filter(a => a.userId === userId).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    },
    async getByProviderId(providerId: string) {
      const all = await this.getAll();
      return all.filter(a => a.providerId === providerId).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    },
    async create(data: { userId: string; providerId: string; startsAt: string; durationMinutes: number; notes?: string; createdBy?: string; }) {
      if (supabase) {
        const payload = {
          user_id: data.userId,
          provider_id: data.providerId,
          starts_at: data.startsAt,
          duration_minutes: data.durationMinutes,
          notes: data.notes,
          status: 'pending' as AppointmentStatus,
          created_by: data.createdBy,
        };
        const { data: row, error } = await supabase.from('appointments').insert(payload).select('*').single();
        if (!error && row) {
          await db.notifications.create({ userId: data.userId, message: 'Appointment request submitted.' });
          await db.notifications.create({ userId: data.providerId, message: 'New appointment request received.' });
          const profiles = await db.users.getById(data.providerId);
          return mapAppointment(row, {
            [data.userId]: (await db.users.getById(data.userId))!,
            [data.providerId]: profiles!,
          });
        }
        if (error) console.error('appointment create failed', error.message);
      }
      const provider = memory.providers.find(p => p.id === data.providerId);
      const user = memory.users.find(u => u.id === data.userId);
      const newAppt: Appointment = {
        id: `appt-${Date.now()}`,
        userId: data.userId,
        providerId: data.providerId,
        startsAt: data.startsAt,
        durationMinutes: data.durationMinutes,
        status: 'pending',
        notes: data.notes,
        createdAt: new Date().toISOString(),
        providerName: provider?.fullName || 'Provider',
        providerAvatar: provider?.avatarUrl,
        userName: user?.fullName || 'Patient',
      };
      memory.appointments.push(newAppt);
      memory.notifications.push({ id: `note-${Date.now()}`, userId: data.userId, message: 'Appointment request submitted.', read: false, createdAt: new Date().toISOString() });
      return newAppt;
    },
    async updateStatus(id: string, status: AppointmentStatus) {
      if (supabase) {
        const { data: row, error } = await supabase.from('appointments').update({ status }).eq('id', id).select('*').single();
        if (!error && row) {
          const profiles = await supabase.from('profiles').select('*').in('id', [row.user_id, row.provider_id]);
          const lookup: Record<string, UserProfile> = {};
          profiles.data?.forEach(p => { lookup[p.id] = mapProfile(p); });
          return mapAppointment(row, lookup);
        }
        if (error) console.error('updateStatus failed', error.message);
      }
      const idx = memory.appointments.findIndex(a => a.id === id);
      if (idx !== -1) memory.appointments[idx].status = status;
      return memory.appointments[idx];
    },
    async cancel(id: string, reason?: string) {
      if (supabase) {
        const { data: row, error } = await supabase.from('appointments').update({ status: 'cancelled', cancelled_reason: reason }).eq('id', id).select('*').single();
        if (!error && row) {
          const profiles = await supabase.from('profiles').select('*').in('id', [row.user_id, row.provider_id]);
          const lookup: Record<string, UserProfile> = {};
          profiles.data?.forEach(p => { lookup[p.id] = mapProfile(p); });
          return mapAppointment(row, lookup);
        }
      }
      const idx = memory.appointments.findIndex(a => a.id === id);
      if (idx !== -1) {
        memory.appointments[idx].status = 'cancelled';
        memory.appointments[idx].cancelledReason = reason;
      }
      return memory.appointments[idx];
    },
    async reschedule(id: string, startsAt: string, durationMinutes?: number, notes?: string) {
      if (supabase) {
        const { data: row, error } = await supabase.from('appointments').update({
          starts_at: startsAt,
          duration_minutes: durationMinutes,
          notes,
          status: 'rescheduled',
          rescheduled_from: new Date().toISOString(),
        }).eq('id', id).select('*').single();
        if (!error && row) {
          const profiles = await supabase.from('profiles').select('*').in('id', [row.user_id, row.provider_id]);
          const lookup: Record<string, UserProfile> = {};
          profiles.data?.forEach(p => { lookup[p.id] = mapProfile(p); });
          return mapAppointment(row, lookup);
        }
      }
      const idx = memory.appointments.findIndex(a => a.id === id);
      if (idx !== -1) {
        memory.appointments[idx].startsAt = startsAt;
        memory.appointments[idx].durationMinutes = durationMinutes ?? memory.appointments[idx].durationMinutes;
        memory.appointments[idx].notes = notes ?? memory.appointments[idx].notes;
        memory.appointments[idx].status = 'rescheduled';
      }
      return memory.appointments[idx];
    },
  },
  notifications: {
    async getByUserId(userId: string) {
      if (supabase) {
        const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (!error && data) return data.map(n => ({ id: n.id, userId: n.user_id, message: n.message, read: n.read, meta: n.meta ?? undefined, createdAt: n.created_at ?? new Date().toISOString() }));
        if (error) console.error('notifications fetch failed', error.message);
      }
      return memory.notifications.filter(n => n.userId === userId);
    },
    async create({ userId, message }: { userId: string; message: string }) {
      if (supabase) {
        const { data, error } = await supabase.from('notifications').insert({ user_id: userId, message }).select('*').single();
        if (!error && data) return data;
        if (error) console.error('notification create failed', error.message);
      }
      const newNote: Notification = { id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, userId, message, read: false, createdAt: new Date().toISOString() };
      memory.notifications.push(newNote);
      return newNote;
    },
    async markRead(id: string) {
      if (supabase) await supabase.from('notifications').update({ read: true }).eq('id', id);
      const idx = memory.notifications.findIndex(n => n.id === id);
      if (idx !== -1) memory.notifications[idx].read = true;
    },
  },
};
