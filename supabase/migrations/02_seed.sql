-- This file is for initial seeding only. The old user ID '00000000-0000-0000-0000-000000000001' is no longer used in production.
-- You may comment out the following lines if you wish to avoid confusion.

-- Insert a default user profile
INSERT INTO user_profiles (id, name, yearly_budget) VALUES ('00000000-0000-0000-0000-000000000001', 'Default User', 500)
ON CONFLICT (id) DO NOTHING;

-- Insert contacts
INSERT INTO contacts (id, name, email, phone, birthday, user_id, relationship, preferences, notes) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Alice Smith', 'alice@example.com', '1234567890', '1990-05-10', '00000000-0000-0000-0000-000000000001', 'Friend', 'Books, Music', 'Loves reading'),
  ('00000000-0000-0000-0000-000000000102', 'Bob Lee', 'bob@example.com', '0987654321', '1985-12-20', '00000000-0000-0000-0000-000000000001', 'Family', 'Tech, Gadgets', 'Enjoys hiking')
ON CONFLICT (id) DO NOTHING;

-- Insert occasions
INSERT INTO occasions (id, contact_id, occasion_type, date, notes, user_id) VALUES
  ('00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000000101', 'Birthday', '2024-07-10', 'Surprise party', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000001002', '00000000-0000-0000-0000-000000000102', 'Anniversary', '2024-08-15', 'Dinner reservation', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Insert gifts
INSERT INTO gifts (id, occasion_id, name, price, url, notes, purchased, user_id) VALUES
  ('00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000001001', 'Book: The Alchemist', 20, 'https://example.com/alchemist', 'Classic novel', false, '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000002002', '00000000-0000-0000-0000-000000001002', 'Smart Watch', 150, 'https://example.com/smartwatch', 'Latest model', false, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Insert purchases
INSERT INTO purchases (id, gift_id, price, purchase_date, notes, user_id) VALUES
  ('00000000-0000-0000-0000-000000003001', '00000000-0000-0000-0000-000000002001', 20, '2024-07-11', 'Bought at bookstore', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;