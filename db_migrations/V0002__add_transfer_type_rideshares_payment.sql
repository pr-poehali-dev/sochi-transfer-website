ALTER TABLE t_p8223105_sochi_transfer_websi.orders
  ADD COLUMN IF NOT EXISTS transfer_type VARCHAR(20) DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS car_class VARCHAR(20) DEFAULT 'comfort',
  ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS prepay_amount INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.rideshares (
  id SERIAL PRIMARY KEY,
  route_from VARCHAR(200) NOT NULL,
  route_to VARCHAR(200) NOT NULL,
  departure_datetime TIMESTAMP NOT NULL,
  seats_total INTEGER NOT NULL DEFAULT 4,
  seats_available INTEGER NOT NULL DEFAULT 4,
  price_per_seat INTEGER NOT NULL,
  car_class VARCHAR(20) DEFAULT 'comfort',
  driver_name VARCHAR(200),
  driver_phone VARCHAR(50),
  driver_telegram VARCHAR(100),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_by_name VARCHAR(200),
  created_by_phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.rideshare_bookings (
  id SERIAL PRIMARY KEY,
  rideshare_id INTEGER REFERENCES t_p8223105_sochi_transfer_websi.rideshares(id),
  passenger_name VARCHAR(200) NOT NULL,
  passenger_phone VARCHAR(50) NOT NULL,
  passenger_email VARCHAR(200),
  seats_count INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'confirmed',
  cancel_token VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.payment_settings (
  id SERIAL PRIMARY KEY,
  allow_prepay BOOLEAN DEFAULT true,
  prepay_percent INTEGER DEFAULT 30,
  allow_full_payment BOOLEAN DEFAULT true,
  payment_provider VARCHAR(50) DEFAULT 'none',
  provider_public_key TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO t_p8223105_sochi_transfer_websi.payment_settings (allow_prepay, prepay_percent, allow_full_payment, payment_provider)
SELECT true, 30, true, 'none'
WHERE NOT EXISTS (SELECT 1 FROM t_p8223105_sochi_transfer_websi.payment_settings LIMIT 1);
