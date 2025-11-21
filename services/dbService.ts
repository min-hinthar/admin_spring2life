import { UserProfile, ProviderProfile, Appointment, AppointmentStatus, Role, AvailabilitySlot } from '../types';

// Mock Data Seeds
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

// Storage Keys
const STORAGE = {
  USERS: 's2l_users_v2',
  PROVIDERS: 's2l_providers_v2',
  APPOINTMENTS: 's2l_appointments_v2',
};

// Helper to init storage
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

export const db = {
  users: {
    getAll: (): UserProfile[] => getStorage(STORAGE.USERS, SEED_USERS),
    getById: (id: string) => db.users.getAll().find(u => u.id === id),
    findByEmail: (email: string) => db.users.getAll().find(u => u.email === email),
    create: (user: UserProfile) => {
      const users = db.users.getAll();
      users.push(user);
      setStorage(STORAGE.USERS, users);
      return user;
    },
    update: (id: string, updates: Partial<UserProfile>) => {
      const users = db.users.getAll();
      const index = users.findIndex(u => u.id === id);
      if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        setStorage(STORAGE.USERS, users);
        return users[index];
      }
      return null;
    }
  },
  providers: {
    getAll: (): ProviderProfile[] => getStorage(STORAGE.PROVIDERS, SEED_PROVIDERS),
    getById: (id: string) => db.providers.getAll().find(p => p.id === id),
    findByEmail: (email: string) => db.providers.getAll().find(u => u.email === email),
    create: (provider: ProviderProfile) => {
      const providers = db.providers.getAll();
      providers.push(provider);
      setStorage(STORAGE.PROVIDERS, providers);
      return provider;
    },
    updateAvailability: (id: string, slots: AvailabilitySlot[]) => {
      const providers = db.providers.getAll();
      const index = providers.findIndex(p => p.id === id);
      if (index !== -1) {
        providers[index].availability = slots;
        setStorage(STORAGE.PROVIDERS, providers);
        return providers[index];
      }
    }
  },
  appointments: {
    getAll: (): Appointment[] => getStorage(STORAGE.APPOINTMENTS, SEED_APPOINTMENTS),
    getByUserId: (userId: string) => {
      return db.appointments.getAll()
        .filter(a => a.userId === userId)
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    },
    getByProviderId: (providerId: string) => {
      return db.appointments.getAll()
        .filter(a => a.providerId === providerId)
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    },
    create: (data: Omit<Appointment, 'id' | 'createdAt' | 'providerName' | 'userName'>) => {
      const all = db.appointments.getAll();
      const provider = db.providers.getById(data.providerId);
      const user = db.users.getById(data.userId);
      
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
    },
    updateStatus: (id: string, status: AppointmentStatus) => {
      const all = db.appointments.getAll();
      const idx = all.findIndex(a => a.id === id);
      if (idx !== -1) {
        all[idx].status = status;
        setStorage(STORAGE.APPOINTMENTS, all);
        return all[idx];
      }
    }
  }
};
