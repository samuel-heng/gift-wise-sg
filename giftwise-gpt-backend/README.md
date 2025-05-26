# GiftWise GPT Backend

A minimal Node.js/Express backend for generating gift ideas using OpenAI's GPT-4.1-nano.

## Setup

1. Clone this repo or copy the files into a new folder.
2. Run `npm install`.
3. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-...your_openai_key_here...
   PORT=5000
   ```
4. Start the server:
   ```
   npm start
   ```

## Usage

POST to `/api/gift-ideas` with JSON:
```json
{
  "recipient": "Sarah Tan",
  "occasion": "birthday",
  "preferences": "books, cooking, travel"
}
```

Response:
```json
[
  { "name": "Best-selling Novel Set", "reason": "Sarah loves reading, so a set of popular novels will delight her and provide hours of enjoyment." },
  { "name": "Professional Knife Set", "reason": "As an avid cook, Sarah will appreciate high-quality knives to enhance her culinary adventures." },
  { "name": "Travel Journal", "reason": "A beautiful journal will let Sarah document her travel experiences and memories." }
]
```

---

## **Step 5: Start the Server**

```bash
npm start
```

You should see:
