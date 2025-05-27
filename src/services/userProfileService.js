import axios from "axios";

/**
 * Updates the user profile (name, email, password) via the backend API.
 * @param {Object} params
 * @param {string} params.id - The user profile id.
 * @param {string} [params.name] - The new name.
 * @param {string} [params.email] - The new email.
 * @param {string} [params.password] - The new password.
 * @returns {Promise<Object>} The updated user profile.
 */
export async function updateUserProfile({ id, name, email, password }) {
  const apiUrl = import.meta.env.VITE_API_URL || "";
  const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
  if (!session?.access_token) {
    console.error('No Supabase JWT found. User not authenticated.');
    throw new Error('User is not authenticated.');
  }
  const headers = { Authorization: `Bearer ${session.access_token}`, Accept: 'application/json' };
  console.log('updateUserProfile: JWT:', session.access_token);
  console.log('updateUserProfile: payload:', { id, name, email, password });
  const response = await axios.put(`${apiUrl}/api/user-profile`, {
    id,
    name,
    email,
    password,
  }, { headers });
  return response.data;
}

// Add a createUserProfile function for POST requests
export async function createUserProfile({ id, name, email }) {
  const apiUrl = import.meta.env.VITE_API_URL || "";
  const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
  if (!session?.access_token) {
    console.error('No Supabase JWT found. User not authenticated.');
    throw new Error('User is not authenticated.');
  }
  const headers = { Authorization: `Bearer ${session.access_token}`, Accept: 'application/json' };
  console.log('createUserProfile: JWT:', session.access_token);
  console.log('createUserProfile: payload:', { id, name, email });
  const response = await axios.post(`${apiUrl}/api/user-profile`, {
    id,
    name,
    email,
  }, { headers });
  return response.data;
} 