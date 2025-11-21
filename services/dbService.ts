import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AvailabilitySlot, Appointment, AppointmentStatus, ProviderProfile, Role, UserProfile } from '../types';

// Local mock data fallback
const SEED_USERS: UserProfile[] = [
  {
    id: 'user-1',
    email: 'jane@example.com',
    fullName: 'Jane Doe',
    role: 'user',
    avatarUrl: 'https://i.pravatar.cc/150?u=jane',
    timezone: 'America/New_York'
  },
  {
    id: 'admin-1',
    email: 'admin@spring2life.com',
    fullName: 'System Admin',
    role: 'admin',
    avatarUrl: 'https://i.pravatar.cc/150?u=admin',
  },
];

const SEED_PROVIDERS: ProviderProfile[] = [
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

const SEED_APPOINTMENTS: Appointment[] = [
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
  }
];

// Storage Keys for local fallback
const STORAGE = {
  USERS: 's2l_users_v2',
  PROVIDERS: 's2l_providers_v2',
  APPOINTMENTS: 's2l_appointments_v2',
};

const getStorage = <T>(key: string, seed: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(stored);
};

const setStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const mapProfile = (row: any): ProviderProfile | UserProfile => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name || row.fullName,
  role: row.role as Role,
  avatarUrl: row.avatar_url || row.avatarUrl,
  timezone: row.timezone,
  specialty: row.specialty,
  bio: row.bio,
  telehealth: row.telehealth,
  hourlyRate: row.hourly_rate,
  isActive: row.is_active,
  availability: row.availability || [],
});

const mapAppointment = (row: any): Appointment => ({
  id: row.id,
  userId: row.user_id,
  providerId: row.provider_id,
  providerName: row.provider?.full_name || row.providerName,
  providerAvatar: row.provider?.avatar_url,
  userName: row.user?.full_name || row.userName,
  startsAt: row.starts_at,
  durationMinutes: row.duration_minutes,
  status: row.status as AppointmentStatus,
  notes: row.notes,
  cancelledReason: row.cancelled_reason,
  createdAt: row.created_at,
});

const fetchAvailability = async (providerIds: string[]): Promise<Record<string, AvailabilitySlot[]>> => {
  if (!isSupabaseConfigured || providerIds.length === 0) return {};
  const { data, error } = await supabase
    .from('availability_slots')
    .select('id, provider_id, day_of_week, start_time, end_time')
    .in('provider_id', providerIds);
  if (error) throw error;
  const grouped: Record<string, AvailabilitySlot[]> = {};
  data?.forEach(slot => {
    const providerId = slot.provider_id;
    if (!grouped[providerId]) grouped[providerId] = [];
    grouped[providerId].push({
      id: slot.id,
      providerId,
      dayOfWeek: slot.day_of_week,
      startTime: slot.start_time,
      endTime: slot.end_time,
    });
  });
  return grouped;
};

export const db = {
  users: {
    getAll: async (): Promise<UserProfile[]> => {
      if (!isSupabaseConfigured) return getStorage(STORAGE.USERS, SEED_USERS);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['user', 'admin'])
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapProfile) as UserProfile[];
    },
    getById: async (id: string) => {
      if (!isSupabaseConfigured) return db.users.getAll().then(users => users.find(u => u.id === id));
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? (mapProfile(data) as UserProfile) : undefined;
    },
    findByEmail: async (email: string) => {
      if (!isSupabaseConfigured) return db.users.getAll().then(users => users.find(u => u.email === email));
      const { data, error } = await supabase.from('profiles').select('*').ilike('email', email).maybeSingle();
      if (error) throw error;
      return data ? (mapProfile(data) as UserProfile) : undefined;
    },
    create: async (user: UserProfile) => {
      if (!isSupabaseConfigured) {
        const users = db.users.getAll();
        return users.then(existing => {
          const updated = [...existing, user];
          setStorage(STORAGE.USERS, updated);
          return user;
        });
      }
      const { data, error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        avatar_url: user.avatarUrl,
        timezone: user.timezone,
      }).select().maybeSingle();
      if (error) throw error;
      return data ? (mapProfile(data) as UserProfile) : user;
    },
    update: async (id: string, updates: Partial<UserProfile>) => {
      if (!isSupabaseConfigured) {
        const users = await db.users.getAll();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
          users[index] = { ...users[index], ...updates } as UserProfile;
          setStorage(STORAGE.USERS, users);
          return users[index];
        }
        return null;
      }
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl,
          timezone: updates.timezone,
        })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data ? (mapProfile(data) as UserProfile) : null;
    }
  },
  providers: {
    getAll: async (): Promise<ProviderProfile[]> => {
      if (!isSupabaseConfigured) return getStorage(STORAGE.PROVIDERS, SEED_PROVIDERS);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'provider')
        .order('full_name');
      if (error) throw error;
      const providerIds = (data || []).map(row => row.id);
      const availabilityMap = await fetchAvailability(providerIds);
      return (data || []).map(row => ({
        ...mapProfile(row),
        availability: availabilityMap[row.id] || [],
      })) as ProviderProfile[];
    },
    getById: async (id: string) => {
      if (!isSupabaseConfigured) return db.providers.getAll().then(providers => providers.find(p => p.id === id));
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) return undefined;
      const availabilityMap = await fetchAvailability([id]);
      return {
        ...mapProfile(data),
        availability: availabilityMap[id] || [],
      } as ProviderProfile;
    },
    findByEmail: async (email: string) => {
      if (!isSupabaseConfigured) return db.providers.getAll().then(providers => providers.find(u => u.email === email));
      const { data, error } = await supabase.from('profiles').select('*').eq('email', email).eq('role', 'provider').maybeSingle();
      if (error) throw error;
      return data ? (mapProfile(data) as ProviderProfile) : undefined;
    },
    create: async (provider: ProviderProfile) => {
      if (!isSupabaseConfigured) {
        const providers = await db.providers.getAll();
        const updated = [...providers, provider];
        setStorage(STORAGE.PROVIDERS, updated);
        return provider;
      }
      const { data, error } = await supabase.from('profiles').upsert({
        id: provider.id,
        email: provider.email,
        full_name: provider.fullName,
        role: provider.role,
        avatar_url: provider.avatarUrl,
        specialty: provider.specialty,
        bio: provider.bio,
        telehealth: provider.telehealth,
        hourly_rate: provider.hourlyRate,
        is_active: provider.isActive,
      }).select().maybeSingle();
      if (error) throw error;
      if (provider.availability?.length) {
        await db.providers.updateAvailability(provider.id, provider.availability);
      }
      return data ? (mapProfile(data) as ProviderProfile) : provider;
    },
    updateAvailability: async (id: string, slots: AvailabilitySlot[]) => {
      if (!isSupabaseConfigured) {
        const providers = await db.providers.getAll();
        const index = providers.findIndex(p => p.id === id);
        if (index !== -1) {
          providers[index].availability = slots;
          setStorage(STORAGE.PROVIDERS, providers);
          return providers[index];
        }
      } else {
        await supabase.from('availability_slots').delete().eq('provider_id', id);
        if (slots.length) {
          const toInsert = slots.map(slot => ({
            provider_id: id,
            day_of_week: slot.dayOfWeek,
            start_time: slot.startTime,
            end_time: slot.endTime,
          }));
          const { error } = await supabase.from('availability_slots').insert(toInsert);
          if (error) throw error;
        }
        return db.providers.getById(id);
      }
    }
  },
  appointments: {
    getAll: async (): Promise<Appointment[]> => {
      if (!isSupabaseConfigured) return getStorage(STORAGE.APPOINTMENTS, SEED_APPOINTMENTS);
      const { data, error } = await supabase
        .from('appointments')
        .select('*, provider:provider_id(full_name, avatar_url), user:user_id(full_name)')
        .order('starts_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapAppointment);
    },
    getByUserId: async (userId: string) => {
      if (!isSupabaseConfigured) {
        const all = getStorage(STORAGE.APPOINTMENTS, SEED_APPOINTMENTS);
        return all.filter(a => a.userId === userId).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
      }
      const { data, error } = await supabase
        .from('appointments')
        .select('*, provider:provider_id(full_name, avatar_url), user:user_id(full_name)')
        .eq('user_id', userId)
        .order('starts_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapAppointment);
    },
    getByProviderId: async (providerId: string) => {
      if (!isSupabaseConfigured) {
        const all = getStorage(STORAGE.APPOINTMENTS, SEED_APPOINTMENTS);
        return all.filter(a => a.providerId === providerId).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
      }
      const { data, error } = await supabase
        .from('appointments')
        .select('*, provider:provider_id(full_name, avatar_url), user:user_id(full_name)')
        .eq('provider_id', providerId)
        .order('starts_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(mapAppointment);
    },
    create: async (data: Omit<Appointment, 'id' | 'createdAt' | 'providerName' | 'userName'>) => {
      if (!isSupabaseConfigured) {
        const all = getStorage(STORAGE.APPOINTMENTS, SEED_APPOINTMENTS);
        const provider = await db.providers.getById(data.providerId);
        const user = await db.users.getById(data.userId);
        if (!provider || !user) throw new Error("Invalid user or provider");
        const newAppt: Appointment = {
          ...data,
          id: `appt-${Date.now()}`,
          createdAt: new Date().toISOString(),
          providerName: provider.fullName,
          providerAvatar: provider.avatarUrl,
          userName: user.fullName,
        };
        all.push(newAppt);
        setStorage(STORAGE.APPOINTMENTS, all);
        return newAppt;
      }
      const { data: inserted, error } = await supabase.from('appointments').insert({
        user_id: data.userId,
        provider_id: data.providerId,
        starts_at: data.startsAt,
        duration_minutes: data.durationMinutes,
        status: data.status,
        notes: data.notes,
      }).select('*, provider:provider_id(full_name, avatar_url), user:user_id(full_name)').maybeSingle();
      if (error) throw error;
      if (!inserted) throw new Error('Failed to create appointment');
      return mapAppointment(inserted);
    },
    updateStatus: async (id: string, status: AppointmentStatus) => {
      if (!isSupabaseConfigured) {
        const all = getStorage(STORAGE.APPOINTMENTS, SEED_APPOINTMENTS);
        const idx = all.findIndex(a => a.id === id);
        if (idx !== -1) {
          all[idx].status = status;
          setStorage(STORAGE.APPOINTMENTS, all);
          return all[idx];
        }
      } else {
        const { data, error } = await supabase
          .from('appointments')
          .update({ status })
          .eq('id', id)
          .select('*, provider:provider_id(full_name, avatar_url), user:user_id(full_name)')
          .maybeSingle();
        if (error) throw error;
        return data ? mapAppointment(data) : undefined;
      }
    }
  }
};
