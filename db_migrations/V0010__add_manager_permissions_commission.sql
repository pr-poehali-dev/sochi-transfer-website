-- Добавляем поля для менеджеров в таблицу admins
ALTER TABLE t_p8223105_sochi_transfer_websi.admins
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"orders":true,"drivers":true,"tariffs":true,"fleet":true,"reviews":true,"news":true,"statuses":false,"payment":false,"finance":false,"users":false,"settings":false}'::jsonb;

-- Добавляем поле комиссии по умолчанию в site_settings
INSERT INTO t_p8223105_sochi_transfer_websi.site_settings (key, value)
VALUES ('default_driver_commission', '15')
ON CONFLICT (key) DO NOTHING;

-- Добавляем поле назначенного водителя статус
INSERT INTO t_p8223105_sochi_transfer_websi.site_settings (key, value)
VALUES ('auto_assign_driver', 'false')
ON CONFLICT (key) DO NOTHING;
