console.log('TOP OF SERVER.JS REACHED');
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
if (process.env.SUPABASE_SERVICE_KEY) {
  console.log('Using SUPABASE_SERVICE_KEY for backend jobs.');
} else {
  console.warn('WARNING: SUPABASE_SERVICE_KEY not set. Falling back to anon key. Backend jobs will NOT be able to bypass RLS.');
}
console.log('Supabase key in use (first 8 chars):', supabaseKey ? supabaseKey.slice(0, 8) : 'undefined');
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { sendEmail } = require('./emailService.js');
const cron = require('node-cron');
const { makeUserProfileService, makeOccasionService, makePurchaseService } = require('./src/lib/db.js');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory cache for gift ideas (keyed by JSON.stringify of input, expires in 1 hour)
const giftIdeasCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

app.post("/api/gift-ideas", async (req, res) => {
  const { recipient, relationship, contactNotes, occasion, occasionNotes, preferences, pastPurchases } = req.body;
  const cacheKey = JSON.stringify({ recipient, relationship, contactNotes, occasion, occasionNotes, preferences, pastPurchases });
  const now = Date.now();
  // Check cache
  if (giftIdeasCache.has(cacheKey)) {
    const { data, timestamp } = giftIdeasCache.get(cacheKey);
    if (now - timestamp < CACHE_TTL_MS) {
      return res.json(data);
    } else {
      giftIdeasCache.delete(cacheKey);
    }
  }

  // Sharpened system prompt
  const systemPrompt = `
You are a helpful gift recommendation assistant. Given the recipient's relationship to the user, any notes about the recipient, the occasion (which may be \"None\"), any notes about the occasion, the recipient's preferences, and a list of their past purchases, suggest 3 realistic, thoughtful gift ideas. Avoid suggesting gifts similar to recent purchases. For each, provide a short name and a 1-2 sentence reason. Only suggest gifts that are likely to be available for purchase online.
`;

  const userPrompt = `
Relationship: ${relationship}
Recipient Notes: ${contactNotes}
Occasion: ${occasion}
Occasion Notes: ${occasionNotes}
Preferences: ${preferences}
Past Purchases: ${Array.isArray(pastPurchases) && pastPurchases.length > 0 ? pastPurchases.join(", ") : "None"}

Return as JSON: [{ "name": "...", "reason": "..." }]
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
    });
    const text = completion.choices[0].message.content;
    const ideas = JSON.parse(text);
    // Store in cache
    giftIdeasCache.set(cacheKey, { data: ideas, timestamp: now });
    res.json(ideas);
  } catch (err) {
    console.error("Gift ideas error:", err);
    res.status(500).json({ error: "Failed to generate gift ideas", details: err.message });
  }
});

// --- Reminder/Nudge Logic ---
async function sendRemindersAndNudges() {
  console.log('sendRemindersAndNudges: function called');
  // Instantiate services with supabase client
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (process.env.SUPABASE_SERVICE_KEY) {
    console.log('Using SUPABASE_SERVICE_KEY for backend jobs.');
  } else {
    console.warn('WARNING: SUPABASE_SERVICE_KEY not set. Falling back to anon key. Backend jobs will NOT be able to bypass RLS.');
  }
  console.log('Supabase key in use (first 8 chars):', supabaseKey ? supabaseKey.slice(0, 8) : 'undefined');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    supabaseKey
  );
  const userProfileService = makeUserProfileService(supabase);
  const occasionSvc = makeOccasionService(supabase);
  const purchaseSvc = makePurchaseService(supabase);

  // 1. Fetch all users
  const users = await userProfileService.getAll();

  // Log the Supabase key in use at startup
  console.log('Supabase key in use:', (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY).slice(0, 8));

  for (const user of users) {
    if (!user.email) continue;

    // 2. Get all occasions for the user
    const occasions = await occasionSvc.getAll(user.id);
    // 3. Get all purchases for the user
    const purchases = await purchaseSvc.getAll(user.id);

    // Log loaded data
    console.log('Processing user:', { userId: user.id, email: user.email });
    console.log('Loaded occasions:', occasions);
    console.log('Loaded purchases:', purchases);

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    const reminders = [];
    const nudges = [];

    for (const occasion of occasions) {
      if (!occasion.date) continue;
      const occasionDate = new Date(occasion.date);
      const daysLeft = Math.ceil((occasionDate - today) / (1000 * 60 * 60 * 24));
      const reminderDays = occasion.reminder_days_before ?? 14;

      // --- Reminder: X days before ---
      if (
        daysLeft === reminderDays &&
        occasion.reminder_sent_date !== todayStr // Only send if not already sent today
      ) {
        reminders.push(occasion);
      }

      // --- Nudge: 1 day after, no purchase ---
      const isOneDayAfter = daysLeft === -1;
      const hasPurchase = purchases.some(
        p => p.gifts && p.gifts.occasions && p.gifts.occasions.id === occasion.id
      );
      if (
        isOneDayAfter &&
        !hasPurchase &&
        occasion.nudge_sent_date !== todayStr // Only send if not already sent today
      ) {
        nudges.push(occasion);
      }
    }

    // Log calculated reminders and nudges
    console.log('Calculated reminders:', reminders);
    console.log('Calculated nudges:', nudges);

    // --- Send Reminder Emails ---
    for (const occasion of reminders) {
      try {
        await sendEmail({
          to: user.email,
          subject: `Upcoming Occasion: ${occasion.contacts.name}'s ${occasion.occasion_type}`,
          html: `<h2>Don't forget!</h2>
            <p>${occasion.contacts.name}'s ${occasion.occasion_type} is coming up on <b>${occasion.date}</b>.</p>
            <p>Notes: ${occasion.notes || 'None'}</p>
            <p>
              <a href="https://giftwisesg.com/" style="color:#2563eb;text-decoration:underline;" target="_blank">
                Log in to GiftWise for gift ideas!
              </a>
            </p>`
        });
        // Log DB role before update
        const { data: whoami } = await supabase.rpc('get_my_role');
        console.log('Current DB role before reminder update:', whoami);
        // Log before update
        console.log('About to update reminder_sent_date', { occasionId: occasion.id, update: { reminder_sent_date: todayStr }, fullOccasion: occasion });
        // Update reminder_sent_date
        const updateResult = await occasionSvc.update(occasion.id, { reminder_sent_date: todayStr });
        if (!updateResult) {
          console.warn('No rows updated for reminder_sent_date', { occasionId: occasion.id, userId: user.id });
        }
        console.log('Updated reminder_sent_date', { occasionId: occasion.id, userId: user.id, updateResult });
      } catch (err) {
        console.error('Reminder email/send error:', err, { user, occasion });
      }
    }

    // --- Send Nudge Emails ---
    for (const occasion of nudges) {
      try {
        await sendEmail({
          to: user.email,
          subject: `Did you buy a gift for ${occasion.contacts.name}'s ${occasion.occasion_type}?`,
          html: `<h2>How did it go?</h2>
            <p>Did you buy a gift for ${occasion.contacts.name}'s ${occasion.occasion_type} on ${occasion.date}?</p>
            <p>
              <a href="https://giftwisesg.com/" style="color:#2563eb;text-decoration:underline;" target="_blank">
                Please update your purchase history in GiftWise!
              </a>
            </p>`
        });
        // Log DB role before update
        const { data: whoami } = await supabase.rpc('get_my_role');
        console.log('Current DB role before nudge update:', whoami);
        // Log before update
        console.log('About to update nudge_sent_date', { occasionId: occasion.id, update: { nudge_sent_date: todayStr }, fullOccasion: occasion });
        // Update nudge_sent_date
        const updateResult = await occasionSvc.update(occasion.id, { nudge_sent_date: todayStr });
        if (!updateResult) {
          console.warn('No rows updated for nudge_sent_date', { occasionId: occasion.id, userId: user.id });
        }
        console.log('Updated nudge_sent_date', { occasionId: occasion.id, userId: user.id, updateResult });
      } catch (err) {
        console.error('Nudge email/send error:', err, { user, occasion });
      }
    }
  }
}

// --- Cron Job: runs every 5 minutes for demo (change to '0 8 * * *' for daily at 8am) ---
cron.schedule('*/5 * * * *', async () => {
  console.log('CRON: About to call sendRemindersAndNudges');
  await sendRemindersAndNudges();
});

// --- Manual Trigger Endpoint for Demo ---
app.post('/api/trigger-reminders', async (req, res) => {
  console.log('API: /api/trigger-reminders called');
  try {
    await sendRemindersAndNudges();
    res.json({ success: true, message: "Reminders/nudges triggered." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getSupabaseClientForUser(jwt) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } }
  });
}

// Update user profile endpoint
app.put('/api/user-profile', async (req, res) => {
  const { id, name, email, password } = req.body;
  const jwt = req.headers.authorization?.split(' ')[1];
  if (!id || !jwt) {
    return res.status(400).json({ error: 'User profile id and Authorization token are required.' });
  }
  const supabase = getSupabaseClientForUser(jwt);
  const userProfileService = makeUserProfileService(supabase);
  try {
    const updated = await userProfileService.updateProfile(id, { name, email, password });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user-profile', async (req, res) => {
  const { id, name, email } = req.body;
  const jwt = req.headers.authorization?.split(' ')[1];
  if (!id || !name || !email || !jwt) {
    console.error('User profile creation error: missing required fields or Authorization token', req.body);
    return res.status(400).json({ error: 'id, name, email, and Authorization token are required.' });
  }
  const supabase = getSupabaseClientForUser(jwt);
  const userProfileService = makeUserProfileService(supabase);
  try {
    // Try to create, but if user already exists, return existing profile
    const data = await userProfileService.create({ id, name, email });
    res.json(data);
  } catch (err) {
    // If duplicate key error, fetch and return existing profile
    if (err.code === '23505' || (err.message && err.message.includes('duplicate key'))) {
      try {
        const existing = await userProfileService.getDefaultProfile(id);
        return res.json(existing);
      } catch (fetchErr) {
        return res.status(500).json({ error: fetchErr.message });
      }
    }
    console.error('User profile creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add a root endpoint for diagnostics
app.get('/', (req, res) => {
  console.log('Root endpoint called');
  res.send('Backend is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Backend started and listening');
});
