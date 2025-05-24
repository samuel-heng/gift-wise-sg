-- Make gifts.occasion_id nullable
ALTER TABLE gifts ALTER COLUMN occasion_id DROP NOT NULL; 