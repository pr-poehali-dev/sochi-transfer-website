ALTER TABLE t_p8223105_sochi_transfer_websi.admins ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin';
ALTER TABLE t_p8223105_sochi_transfer_websi.tariffs ADD COLUMN IF NOT EXISTS image_url TEXT;
