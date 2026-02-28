-- Add driver_type to drivers (transfer or rideshare)
ALTER TABLE t_p8223105_sochi_transfer_websi.drivers
  ADD COLUMN IF NOT EXISTS driver_type character varying(20) DEFAULT 'transfer',
  ADD COLUMN IF NOT EXISTS identity_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS identity_doc_url text NULL,
  ADD COLUMN IF NOT EXISTS questionnaire jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS car_category character varying(20) DEFAULT 'sedan';

-- Add expires_at to rideshares for auto-closing
ALTER TABLE t_p8223105_sochi_transfer_websi.rideshares
  ADD COLUMN IF NOT EXISTS expires_at timestamp without time zone NULL,
  ADD COLUMN IF NOT EXISTS created_by_user_id integer NULL,
  ADD COLUMN IF NOT EXISTS rideshare_driver_id integer NULL;

-- Site settings for password reset, telegram group, tariff types
INSERT INTO t_p8223105_sochi_transfer_websi.site_settings (key, value) VALUES
  ('telegram_group_url', ''),
  ('telegram_group_title', 'Наша группа в Telegram'),
  ('password_reset_enabled', 'true'),
  ('password_reset_method', 'phone'),
  ('tariff_transfer_title', 'Трансферы'),
  ('tariff_rideshare_title', 'Попутчики'),
  ('rideshare_default_expires_hours', '48')
ON CONFLICT (key) DO NOTHING;
