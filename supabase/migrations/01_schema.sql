-- Create contacts table
CREATE TABLE contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    birthday DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create occasions table
CREATE TABLE occasions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    occasion_type TEXT NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create gifts table
CREATE TABLE gifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    occasion_id UUID NOT NULL REFERENCES occasions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    url TEXT,
    notes TEXT,
    purchased BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create purchases table
CREATE TABLE purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    purchase_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_occasions_contact_id ON occasions(contact_id);
CREATE INDEX idx_gifts_occasion_id ON gifts(occasion_id);
CREATE INDEX idx_purchases_gift_id ON purchases(gift_id);
CREATE INDEX idx_contacts_name ON contacts(name);
CREATE INDEX idx_occasions_date ON occasions(date);
CREATE INDEX idx_purchases_date ON purchases(purchase_date);

-- Enable Row Level Security (RLS)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE occasions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON contacts
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable write access for authenticated users" ON contacts
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON occasions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable write access for authenticated users" ON occasions
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON gifts
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable write access for authenticated users" ON gifts
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON purchases
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable write access for authenticated users" ON purchases
    FOR ALL TO authenticated USING (true); 