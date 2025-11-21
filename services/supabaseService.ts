import { supabase } from '../lib/supabaseClient';
import { Appointment, AppointmentStatus, AvailabilitySlot, ProviderProfile, Role, UserProfile } from '../types';

const mapProfile = (row: any): UserProfile | ProviderProfile => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name,
  role: row.role,
  avatarUrl: row.avatar_url ?? undefined,
  phone: row.phone ?? undefined,
  timezone: row.timezone ?? undefined,
  specialty: row.specialty ?? undefined,
  bio: row.bio ?? undefined,
  telehealth: row.telehealth ?? undefined,
  hourlyRate: row.hourly_rate ?? undefined,
  isActive: row.is_active ?? undefined,
  availability: row.availability ?? [],
  createdAt: row.created_at ?? undefined,
} as ProviderProfile);

const mapAppointment = (row: any): Appointment => ({
  id: row.id,
  userId: row.user_id,
  providerId: row.provider_id,
  providerName: row.provider?.full_name ?? row.provider_name ?? 'Provider',
  providerAvatar: row.provider?.avatar_url ?? undefined,
  userName: row.user?.full_name ?? row.user_name ?? 'Client',
  startsAt: row.starts_at,
  durationMinutes: row.duration_minutes,
  status: row.status,
  notes: row.notes ?? undefined,
  cancelledReason: row.cancelled_reason ?? undefined,
  createdAt: row.created_at,
});

export const authApi = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },
  async signUp(email: string, password: string, fullName: string, role: Role) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Unable to create account');

    // Create profile row
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      role,
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
    });
    if (profileError) throw profileError;

    return data.user;
  },
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  async getProfile(userId: string): Promise<UserProfile | ProviderProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapProfile(data);
  },
  async getSessionUser() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session?.user ?? null;
  },
};

export const providerApi = {
  async getAll(): Promise<ProviderProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'provider')
      .eq('is_active', true);
    if (error) throw error;

    const providers = data?.map(mapProfile) ?? [];

    // Fetch availability for providers
    const providerIds = providers.map((p) => p.id);
    if (providerIds.length === 0) return providers;

    const { data: availability, error: availabilityError } = await supabase
      .from('availability_slots')
      .select('*')
      .in('provider_id', providerIds);

    if (availabilityError) throw availabilityError;

    const grouped: Record<string, AvailabilitySlot[]> = {};
    availability?.forEach((slot) => {
      const entry = {
        id: slot.id,
        providerId: slot.provider_id,
        dayOfWeek: slot.day_of_week,
        startTime: slot.start_time,
        endTime: slot.end_time,
      } as AvailabilitySlot;
      grouped[slot.provider_id] = [...(grouped[slot.provider_id] || []), entry];
    });

    return providers.map((p) => ({ ...p, availability: grouped[p.id] || [] }));
  },

  async getById(id: string): Promise<ProviderProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'provider')
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const provider = mapProfile(data);

    const { data: availability } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('provider_id', id);

    return {
      ...provider,
      availability: (availability || []).map((slot) => ({
        id: slot.id,
        providerId: slot.provider_id,
        dayOfWeek: slot.day_of_week,
        startTime: slot.start_time,
        endTime: slot.end_time,
      })),
    };
  },

  async updateAvailability(providerId: string, slots: AvailabilitySlot[]) {
    const { error: deleteError } = await supabase
      .from('availability_slots')
      .delete()
      .eq('provider_id', providerId);
    if (deleteError) throw deleteError;

    if (slots.length === 0) return [] as AvailabilitySlot[];

    const payload = slots.map((slot) => ({
      provider_id: providerId,
      day_of_week: slot.dayOfWeek,
      start_time: slot.startTime,
      end_time: slot.endTime,
    }));

    const { data, error } = await supabase
      .from('availability_slots')
      .insert(payload)
      .select();

    if (error) throw error;

    return data?.map((slot) => ({
      id: slot.id,
      providerId: slot.provider_id,
      dayOfWeek: slot.day_of_week,
      startTime: slot.start_time,
      endTime: slot.end_time,
    })) ?? [];
  },
};

export const appointmentApi = {
  async getByUserId(userId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, provider:provider_id(full_name, avatar_url), user:user_id(full_name)')
      .eq('user_id', userId)
      .order('starts_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapAppointment);
  },

  async getByProviderId(providerId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, provider:provider_id(full_name, avatar_url), user:user_id(full_name)')
      .eq('provider_id', providerId)
      .order('starts_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapAppointment);
  },

  async getAll(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, provider:provider_id(full_name, avatar_url), user:user_id(full_name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapAppointment);
  },

  async create(data: { userId: string; providerId: string; startsAt: string; durationMinutes: number; notes?: string }) {
    const { data: inserted, error } = await supabase
      .from('appointments')
      .insert({
        user_id: data.userId,
        provider_id: data.providerId,
        starts_at: data.startsAt,
        duration_minutes: data.durationMinutes,
        notes: data.notes,
        status: 'pending',
      })
      .select('*, provider:provider_id(full_name, avatar_url), user:user_id(full_name)')
      .single();
    if (error) throw error;
    return mapAppointment(inserted);
  },

  async updateStatus(id: string, status: AppointmentStatus) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select('*, provider:provider_id(full_name, avatar_url), user:user_id(full_name)')
      .single();
    if (error) throw error;
    return mapAppointment(data);
  },
};

export const adminApi = {
  async getAllProfiles(): Promise<UserProfile[]> {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return (data || []).map(mapProfile);
  },
};
