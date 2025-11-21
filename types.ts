export type Role = 'user' | 'provider' | 'admin';

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'rescheduled' | 'completed';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl?: string;
  phone?: string;
  timezone?: string;
  createdAt?: string;
  bio?: string;
  specialty?: string;
  telehealth?: boolean;
  hourlyRate?: number;
  isActive?: boolean;
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
  updatedAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
  meta?: Record<string, unknown>;
}

// Minimal Database helper type to keep supabase client strongly typed.
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: Role;
          avatar_url: string | null;
          timezone: string | null;
          specialty: string | null;
          bio: string | null;
          telehealth: boolean | null;
          hourly_rate: number | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & {
          id: string;
          email: string;
          role: Role;
          full_name: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      provider_availability: {
        Row: {
          id: string;
          provider_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['provider_availability']['Row']> & {
          provider_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
        };
        Update: Partial<Database['public']['Tables']['provider_availability']['Row']>;
      };
      appointments: {
        Row: {
          id: string;
          user_id: string;
          provider_id: string;
          appointment_type: string | null;
          starts_at: string;
          duration_minutes: number;
          status: AppointmentStatus;
          notes: string | null;
          cancelled_reason: string | null;
          rescheduled_from: string | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['appointments']['Row']> & {
          user_id: string;
          provider_id: string;
          starts_at: string;
          duration_minutes: number;
        };
        Update: Partial<Database['public']['Tables']['appointments']['Row']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          read: boolean;
          meta: Record<string, unknown> | null;
          created_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['notifications']['Row']> & {
          user_id: string;
          message: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Row']>;
      };
    };
  };
}
