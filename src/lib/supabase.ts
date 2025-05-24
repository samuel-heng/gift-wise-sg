console.log(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with your project URL and anon key
// These values should be stored in environment variables in a production app
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our database tables
export type Contact = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birthday?: string;
  relationship?: string;
  preferences?: string;
  notes?: string;
  created_at: string;
  user_id?: string;
};

export type Occasion = {
  id: string;
  contact_id: string;
  occasion_type: string;
  date: string;
  notes?: string;
  created_at: string;
};

export type Gift = {
  id: string;
  occasion_id: string | null;
  contact_id?: string | null;
  name: string;
  price: number;
  url?: string;
  notes?: string;
  purchased: boolean;
  created_at: string;
};

export type Purchase = {
  id: string;
  gift_id: string;
  price: number;
  purchase_date: string;
  notes?: string;
  created_at: string;
  contact_id?: string | null;
};

export type UserProfile = {
  id: string;
  name: string;
  yearly_budget: number;
}; 