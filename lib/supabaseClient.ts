import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://nfbpqvzcwjtsvxiopznu.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYnBxdnpjd2p0c3Z4aW9wem51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MzIwMDgsImV4cCI6MjA3OTEwODAwOH0.ucMNNYzojBJ9Tm9QQUPAtdqKmluPyODrhzLClDI7zis';

export const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
