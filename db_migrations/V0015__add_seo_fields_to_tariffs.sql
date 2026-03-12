ALTER TABLE t_p8223105_sochi_transfer_websi.tariffs
  ADD COLUMN IF NOT EXISTS meta_title VARCHAR(200),
  ADD COLUMN IF NOT EXISTS meta_description VARCHAR(500),
  ADD COLUMN IF NOT EXISTS meta_keywords VARCHAR(300);