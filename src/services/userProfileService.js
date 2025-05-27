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
  const response = await axios.put(`${apiUrl}/api/user-profile`, {
    id,
    name,
    email,
    password,
  });
  return response.data;
} 