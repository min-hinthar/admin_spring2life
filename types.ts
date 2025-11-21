export type Role = 'user' | 'provider' | 'admin';

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl?: string;
  phone?: string;
  timezone?: string;
  createdAt?: string;
}

export interface ProviderProfile extends UserProfile {
  specialty: string;
  bio: string;
  telehealth: boolean;
  hourlyRate: number;
  isActive: boolean;
  availability: AvailabilitySlot[];
}

export interface AvailabilitySlot {
  id?: string;
  providerId?: string;
  dayOfWeek: number; // 0 = Sunday
  startTime: string; // "09:00"
  endTime: string; // "17:00"
}

export interface Appointment {
  id: string;
  userId: string;
  providerId: string;
  // Hydrated fields for UI convenience
  providerName: string;
  providerAvatar?: string;
  userName: string;
  
  startsAt: string; // ISO String
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string;
  cancelledReason?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
}
