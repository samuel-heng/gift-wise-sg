const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { sendEmail } = require('./emailService.js');
const cron = require('node-cron');
const { userProfileService, occasionService, purchaseService } = require('./src/lib/db.js'); // adjust path if needed

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/gift-ideas", async (req, res) => {
  const { recipient, occasion, preferences, pastPurchases } = req.body;

  // Improved system prompt
  const systemPrompt = `
You are a helpful gift recommendation assistant. Given a recipient's name, their preferences, the occasion (which may be "None"), and a list of their past purchases, suggest 3 realistic, thoughtful gift ideas. Avoid suggesting gifts similar to recent purchases. For each, provide a short name and a 1-2 sentence reason. Only suggest gifts that are likely to be available for purchase online.
`;

  const userPrompt = `
Recipient: ${recipient}
Occasion: ${occasion}
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
    res.json(ideas);
  } catch (err) {
    console.error("Gift ideas error:", err);
    res.status(500).json({ error: "Failed to generate gift ideas", details: err.message });
  }
});

// --- Reminder/Nudge Logic ---
async function sendRemindersAndNudges() {
  // 1. Fetch all users
  const users = await userProfileService.getAll();

  for (const user of users) {
    if (!user.email) continue;

    // 2. Get all occasions for the user
    const occasions = await occasionService.getAll(user.id);

    // 3. Get all purchases for the user
    const purchases = await purchaseService.getAll(user.id);

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

    // --- Send Reminder Emails ---
    for (const occasion of reminders) {
      await sendEmail({
        to: user.email,
        subject: `Upcoming Occasion: ${occasion.contacts.name}'s ${occasion.occasion_type}`,
        html: `<h2>Don't forget!</h2>
          <p>${occasion.contacts.name}'s ${occasion.occasion_type} is coming up on <b>${occasion.date}</b>.</p>
          <p>Notes: ${occasion.notes || 'None'}</p>
          <p>Log in to GiftWise for gift ideas!</p>`
      });
      // Update reminder_sent_date
      await occasionService.update(occasion.id, { reminder_sent_date: todayStr });
    }

    // --- Send Nudge Emails ---
    for (const occasion of nudges) {
      await sendEmail({
        to: user.email,
        subject: `Did you buy a gift for ${occasion.contacts.name}'s ${occasion.occasion_type}?`,
        html: `<h2>How did it go?</h2>
          <p>Did you buy a gift for ${occasion.contacts.name}'s ${occasion.occasion_type} on ${occasion.date}?</p>
          <p>Please update your purchase history in GiftWise!</p>`
      });
      // Update nudge_sent_date
      await occasionService.update(occasion.id, { nudge_sent_date: todayStr });
    }
  }
}

// --- Cron Job: runs every 5 minutes for demo (change to '0 8 * * *' for daily at 8am) ---
cron.schedule('*/5 * * * *', async () => {
  await sendRemindersAndNudges();
});

// --- Manual Trigger Endpoint for Demo ---
app.post('/api/trigger-reminders', async (req, res) => {
  try {
    await sendRemindersAndNudges();
    res.json({ success: true, message: "Reminders/nudges triggered." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile endpoint
app.put('/api/user-profile', async (req, res) => {
  const { id, name, email, password } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'User profile id is required.' });
  }
  try {
    const updated = await userProfileService.updateProfile(id, { name, email, password });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
