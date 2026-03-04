
ALTER TABLE t_p8223105_sochi_transfer_websi.drivers
ADD COLUMN IF NOT EXISTS callsign VARCHAR(20) NULL;

INSERT INTO t_p8223105_sochi_transfer_websi.order_statuses (name, color)
SELECT 'Прибыл', '#3B82F6'
WHERE NOT EXISTS (SELECT 1 FROM t_p8223105_sochi_transfer_websi.order_statuses WHERE name = 'Прибыл');

ALTER TABLE t_p8223105_sochi_transfer_websi.orders
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NULL DEFAULT 'pending';
