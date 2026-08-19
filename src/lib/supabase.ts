import { createClient } from '@supabase/supabase-js';

const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://akqcrvawyqiveqzjgltv.supabase.co';

// The standard PostgREST anon JWT for project akqcrvawyqiveqzjgltv
const standardAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrcWNydmF3eXFpdmVxempnbHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNTU4MDgsImV4cCI6MjEwMjczMTgwOH0.v7nY2Z7D1eOZEZ_Gvvf012-OtTnSAm5H7CLedxFhdq8';

const supabaseKey = (env.VITE_SUPABASE_ANON_KEY && env.VITE_SUPABASE_ANON_KEY.startsWith('eyJ')) 
  ? env.VITE_SUPABASE_ANON_KEY 
  : standardAnonKey;

export const supabase = createClient(supabaseUrl, supabaseKey);
