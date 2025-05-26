console.log("GiftIdeasService loaded");
import axios from "axios";

function getApiUrl() {
  // Vite
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // CRA
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  console.warn("[GiftIdeas] API URL is not set. Set VITE_API_URL or REACT_APP_API_URL in your .env file.");
  return "";
}

/**
 * Fetches gift ideas from the backend AI service.
 * @param {Object} params
 * @param {string} params.recipient - The recipient's name.
 * @param {string} params.relationship - The recipient's relationship to the user.
 * @param {string} params.contactNotes - Notes about the recipient.
 * @param {string} params.occasion - The occasion (e.g., "birthday").
 * @param {string} params.occasionNotes - Notes about the occasion.
 * @param {string} params.preferences - Comma-separated preferences/interests.
 * @param {Array<string>} params.pastPurchases - List of past purchases.
 * @returns {Promise<Array<{name: string, reason: string}>>}
 */
export async function fetchGiftIdeas({ recipient, relationship, contactNotes, occasion, occasionNotes, preferences, pastPurchases }) {
  const apiUrl = getApiUrl();
  const requestUrl = `${apiUrl}/api/gift-ideas`;
  try {
    const response = await axios.post(requestUrl, {
      recipient,
      relationship,
      contactNotes,
      occasion,
      occasionNotes,
      preferences,
      pastPurchases,
    });
    return response.data;
  } catch (error) {
    console.error("[GiftIdeas] Error fetching gift ideas:", error);
    if (error.response) {
      console.error("[GiftIdeas] error.response:", error.response);
    }
    if (error.message) {
      console.error("[GiftIdeas] error.message:", error.message);
    }
    if (error.stack) {
      console.error("[GiftIdeas] error.stack:", error.stack);
    }
    // Pass error message up for UI display
    throw error.response?.data?.error || error.message || "Unknown error";
  }
}
