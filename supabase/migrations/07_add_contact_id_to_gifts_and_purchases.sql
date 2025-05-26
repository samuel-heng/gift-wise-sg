-- Add contact_id to gifts table
ALTER TABLE gifts
ADD COLUMN IF NOT EXISTS contact_id UUID;
 
-- Add contact_id to purchases table
ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS contact_id UUID; 