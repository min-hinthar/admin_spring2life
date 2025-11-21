import { UserProfile, ProviderProfile, Appointment } from './types';

export const MOCK_USERS: UserProfile[] = [
  {
    id: 'user-1',
    email: 'jane@example.com',
    fullName: 'Jane Doe',
    role: 'user',
    avatarUrl: 'https://picsum.photos/200/200',
  },
  {
    id: 'admin-1',
    email: 'admin@spring2life.com',
    fullName: 'System Admin',
    role: 'admin',
    avatarUrl: 'https://picsum.photos/201/201',
  },
];

export const MOCK_PROVIDERS: ProviderProfile[] = [
  {
    id: 'provider-1',
    email: 'dr.smith@spring2life.com',
    fullName: 'Dr. Sarah Smith',
    role: 'provider',
    specialty: 'Clinical Psychologist',
    bio: 'Specializing in CBT and anxiety disorders with 10+ years of experience.',
    telehealth: true,
    hourlyRate: 150,
    isActive: true,
    availability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, // Mon
      { dayOfWeek: 3, startTime: '10:00', endTime: '16:00' }, // Wed
      { dayOfWeek: 5, startTime: '09:00', endTime: '14:00' }, // Fri
    ],
    avatarUrl: 'https://picsum.photos/202/202',
  },
  {
    id: 'provider-2',
    email: 'dr.jones@spring2life.com',
    fullName: 'Dr. Michael Jones',
    role: 'provider',
    specialty: 'Psychiatrist',
    bio: 'Expert in medication management and mood disorders.',
    telehealth: true,
    hourlyRate: 200,
    isActive: true,
    availability: [
      { dayOfWeek: 2, startTime: '11:00', endTime: '19:00' }, // Tue
      { dayOfWeek: 4, startTime: '11:00', endTime: '19:00' }, // Thu
    ],
    avatarUrl: 'https://picsum.photos/203/203',
  },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'appt-1',
    userId: 'user-1',
    providerId: 'provider-1',
    providerName: 'Dr. Sarah Smith',
    userName: 'Jane Doe',
    startsAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    durationMinutes: 60,
    status: 'confirmed',
    notes: 'Initial consultation',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'appt-2',
    userId: 'user-1',
    providerId: 'provider-2',
    providerName: 'Dr. Michael Jones',
    userName: 'Jane Doe',
    startsAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    durationMinutes: 45,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  }
];

export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];