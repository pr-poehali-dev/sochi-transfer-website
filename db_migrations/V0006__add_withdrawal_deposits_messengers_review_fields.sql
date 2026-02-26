
-- Add messengers and social networks to site_settings (will be inserted if not exists)
-- Add withdrawal requests table
CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.withdrawal_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p8223105_sochi_transfer_websi.users(id),
    driver_id INTEGER REFERENCES t_p8223105_sochi_transfer_websi.drivers(id),
    amount NUMERIC(12,2) NOT NULL,
    requisites TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add driver review separately from service review
ALTER TABLE t_p8223105_sochi_transfer_websi.reviews ADD COLUMN IF NOT EXISTS reply TEXT;
ALTER TABLE t_p8223105_sochi_transfer_websi.reviews ADD COLUMN IF NOT EXISTS admin_reply TEXT;

-- Add deposit requests (пополнение баланса)
CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.deposit_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p8223105_sochi_transfer_websi.users(id),
    driver_id INTEGER REFERENCES t_p8223105_sochi_transfer_websi.drivers(id),
    amount NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default messenger/social settings if not exist
INSERT INTO t_p8223105_sochi_transfer_websi.site_settings (key, value)
SELECT k, v FROM (VALUES
    ('whatsapp', ''),
    ('telegram', ''),
    ('viber', ''),
    ('instagram', ''),
    ('vk', ''),
    ('youtube', ''),
    ('facebook', ''),
    ('tiktok', ''),
    ('messenger_max', '')
) AS t(k, v)
WHERE NOT EXISTS (
    SELECT 1 FROM t_p8223105_sochi_transfer_websi.site_settings WHERE key = t.k
);
