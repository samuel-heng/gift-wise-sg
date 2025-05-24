-- Add 'category' and 'occasion_id' columns to purchases
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS occasion_id uuid REFERENCES occasions(id); 