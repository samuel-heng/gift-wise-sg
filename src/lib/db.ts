import { supabase } from './supabase';
import type { Contact, Occasion, Gift, Purchase, UserProfile } from './supabase';

// Contact operations
export const contactService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    
    if (error) throw error;
    return data as Contact[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Contact;
  },

  async create(contact: Omit<Contact, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single();
    
    if (error) throw error;
    return data as Contact;
  },

  async update(id: string, contact: Partial<Contact>) {
    const { data, error } = await supabase
      .from('contacts')
      .update(contact)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Contact;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Occasion operations
export const occasionService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('occasions')
      .select('*, contacts(name)')
      .eq('user_id', userId)
      .order('date');
    if (error) throw error;
    return data as (Occasion & { contacts: { name: string } })[];
  },

  async getByContactId(contactId: string) {
    const { data, error } = await supabase
      .from('occasions')
      .select('*')
      .eq('contact_id', contactId)
      .order('date');
    if (error) throw error;
    return data as Occasion[];
  },

  async create(occasion: Omit<Occasion, 'id' | 'created_at'>, userId: string) {
    const { data, error } = await supabase
      .from('occasions')
      .insert({ ...occasion, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as Occasion;
  },

  async update(id: string, occasion: Partial<Occasion>) {
    const { data, error } = await supabase
      .from('occasions')
      .update(occasion)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Occasion;
  }
};

// Gift operations
export const giftService = {
  async getByOccasionId(occasionId: string, userId: string) {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('occasion_id', occasionId)
      .eq('user_id', userId)
      .order('created_at');
    if (error) throw error;
    return data as Gift[];
  },

  async create(gift: Omit<Gift, 'id' | 'created_at'>, userId: string) {
    const { data, error } = await supabase
      .from('gifts')
      .insert({ ...gift, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as Gift;
  },

  async update(id: string, gift: Partial<Gift>) {
    const { data, error } = await supabase
      .from('gifts')
      .update(gift)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Gift;
  }
};

// Purchase operations
export const purchaseService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('purchases')
      .select('*, gifts(name)')
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false });
    if (error) throw error;
    return data as (Purchase & { gifts: { name: string } })[];
  },

  async create(purchase: Omit<Purchase, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('purchases')
      .insert(purchase)
      .select()
      .single();
    
    if (error) throw error;
    return data as Purchase;
  }
};

// User Profile operations
export const userProfileService = {
  async getDefaultProfile() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('name', 'Default User')
      .single();
    if (error) throw error;
    return data as UserProfile;
  },
  async updateBudget(id: string, yearly_budget: number) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ yearly_budget })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as UserProfile;
  }
}; 