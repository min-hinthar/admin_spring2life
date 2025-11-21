import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nfbpqvzcwjtsvxiopznu.supabase.co';
// Using the anon key for client-side operations
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYnBxdnpjd2p0c3Z4aW9wem51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MzIwMDgsImV4cCI6MjA3OTEwODAwOH0.ucMNNYzojBJ9Tm9QQUPAtdqKmluPyODrhzLClDI7zis';

export const supabase = createClient(supabaseUrl, supabaseKey);
