CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON t_p8223105_sochi_transfer_websi.push_subscriptions(user_id);
