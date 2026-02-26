CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.transfer_types (
    id SERIAL PRIMARY KEY,
    value VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    description VARCHAR(200),
    icon VARCHAR(50) DEFAULT 'User',
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.car_classes (
    id SERIAL PRIMARY KEY,
    value VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    description VARCHAR(200),
    icon VARCHAR(50) DEFAULT 'Car',
    price_multiplier DECIMAL(4,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO t_p8223105_sochi_transfer_websi.transfer_types (value, label, description, icon, sort_order)
VALUES 
    ('individual', 'Индивидуальный', 'Только ваша группа в автомобиле', 'User', 1),
    ('group', 'Групповой', 'Совместная поездка с другими пассажирами', 'Users', 2)
ON CONFLICT (value) DO NOTHING;

INSERT INTO t_p8223105_sochi_transfer_websi.car_classes (value, label, description, icon, price_multiplier, sort_order)
VALUES 
    ('economy', 'Эконом', 'Комфортный автомобиль эконом-класса', 'Car', 1.00, 1),
    ('comfort', 'Комфорт', 'Автомобиль комфорт-класса', 'Car', 1.20, 2),
    ('business', 'Бизнес', 'Автомобиль бизнес-класса', 'Briefcase', 1.50, 3),
    ('minivan', 'Минивэн', 'Просторный минивэн для группы', 'Bus', 1.40, 4)
ON CONFLICT (value) DO NOTHING;

ALTER TABLE t_p8223105_sochi_transfer_websi.orders ADD COLUMN IF NOT EXISTS payment_from_balance BOOLEAN DEFAULT false;
