-- Add reminder fields to occasions
ALTER TABLE occasions
ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER NOT NULL DEFAULT 14,
ADD COLUMN IF NOT EXISTS reminder_sent_date DATE,
ADD COLUMN IF NOT EXISTS nudge_sent_date DATE;

-- Add email field to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';

-- Optionally, enforce unique emails
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_email_unique'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);
  END IF;
END $$; 