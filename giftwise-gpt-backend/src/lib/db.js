const { supabase } = require('./supabase');

// Contact operations
const contactService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    if (error) throw error;
    return data;
  },
  async getById(id) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  async create(contact) {
    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id, contact) {
    const { data, error } = await supabase
      .from('contacts')
      .update(contact)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id) {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Occasion operations
const occasionService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from('occasions')
      .select('*, contacts(name)')
      .eq('user_id', userId)
      .order('date');
    if (error) throw error;
    return data;
  },
  async getByContactId(contactId) {
    const { data, error } = await supabase
      .from('occasions')
      .select('*')
      .eq('contact_id', contactId)
      .order('date');
    if (error) throw error;
    return data;
  },
  async create(occasion, userId) {
    const { data, error } = await supabase
      .from('occasions')
      .insert({ ...occasion, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id, occasion) {
    const { data, error } = await supabase
      .from('occasions')
      .update(occasion)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id) {
    const { error } = await supabase
      .from('occasions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Gift operations
const giftService = {
  async getByOccasionId(occasionId, userId) {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('occasion_id', occasionId)
      .eq('user_id', userId)
      .order('created_at');
    if (error) throw error;
    return data;
  },
  async create(gift, userId) {
    const { data, error } = await supabase
      .from('gifts')
      .insert({ ...gift, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id, gift) {
    const { data, error } = await supabase
      .from('gifts')
      .update(gift)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Purchase operations
const purchaseService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from('purchases')
      .select('*, gifts(id, name, occasion_id, contact_id, occasions:occasion_id(id, occasion_type, contact_id, contacts:contact_id(name)))')
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false });
    if (error) throw error;
    return data;
  },
  async create(purchase, userId) {
    const { data, error } = await supabase
      .from('purchases')
      .insert({ ...purchase, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id, purchase) {
    const { data, error } = await supabase
      .from('purchases')
      .update(purchase)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id) {
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// User Profile operations
const userProfileService = {
  async getDefaultProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },
  async create({ id, name, email }) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({ id, name, email })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async updateBudget(id, yearly_budget) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ yearly_budget })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async getAll() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*');
    if (error) throw error;
    return data;
  },
  async updateProfile(id, { name, email, password }) {
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email;
    if (password !== undefined) updateFields.password = password;
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

module.exports = {
  contactService,
  occasionService,
  giftService,
  purchaseService,
  userProfileService,
}; 