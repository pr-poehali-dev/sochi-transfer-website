-- Пользователи (клиенты)
CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Водители
CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.drivers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    car_brand VARCHAR(255),
    car_model VARCHAR(255),
    car_color VARCHAR(100),
    car_number VARCHAR(20),
    car_number_country VARCHAR(10) DEFAULT 'RUS',
    passport_photo_url TEXT,
    license_front_url TEXT,
    license_back_url TEXT,
    car_tech_passport_front_url TEXT,
    car_tech_passport_back_url TEXT,
    car_photos_urls JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'pending',
    is_active BOOLEAN DEFAULT false,
    is_online BOOLEAN DEFAULT false,
    balance DECIMAL(12,2) DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 15.00,
    rating DECIMAL(3,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Назначение водителей к заказам
CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.order_drivers (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES t_p8223105_sochi_transfer_websi.orders(id),
    driver_id INTEGER REFERENCES t_p8223105_sochi_transfer_websi.drivers(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'assigned'
);

-- Отзывы
CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p8223105_sochi_transfer_websi.users(id),
    driver_id INTEGER REFERENCES t_p8223105_sochi_transfer_websi.drivers(id),
    order_id INTEGER REFERENCES t_p8223105_sochi_transfer_websi.orders(id),
    author_name VARCHAR(255),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    text TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'service',
    source VARCHAR(50) DEFAULT 'site',
    yandex_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Новости
CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Дополнительные услуги
CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.additional_services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Услуги в заказе
CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.order_services (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES t_p8223105_sochi_transfer_websi.orders(id),
    service_id INTEGER REFERENCES t_p8223105_sochi_transfer_websi.additional_services(id),
    price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Настройки сайта (SEO, мессенджеры, Яндекс метрика, правила, контакты)
CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.site_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Чат поддержки
CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.support_messages (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES t_p8223105_sochi_transfer_websi.users(id),
    user_name VARCHAR(255),
    user_phone VARCHAR(20),
    message TEXT NOT NULL,
    is_from_user BOOLEAN DEFAULT true,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Баланс пользователей (транзакции)
CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.balance_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p8223105_sochi_transfer_websi.users(id),
    driver_id INTEGER REFERENCES t_p8223105_sochi_transfer_websi.drivers(id),
    amount DECIMAL(12,2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Добавляем поля к orders
ALTER TABLE t_p8223105_sochi_transfer_websi.orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES t_p8223105_sochi_transfer_websi.users(id);
ALTER TABLE t_p8223105_sochi_transfer_websi.orders ADD COLUMN IF NOT EXISTS driver_id INTEGER REFERENCES t_p8223105_sochi_transfer_websi.drivers(id);
ALTER TABLE t_p8223105_sochi_transfer_websi.orders ADD COLUMN IF NOT EXISTS services_total DECIMAL(10,2) DEFAULT 0;
ALTER TABLE t_p8223105_sochi_transfer_websi.orders ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE t_p8223105_sochi_transfer_websi.orders ADD COLUMN IF NOT EXISTS driver_amount DECIMAL(10,2) DEFAULT 0;

-- Пользовательский баланс
ALTER TABLE t_p8223105_sochi_transfer_websi.users ADD COLUMN IF NOT EXISTS balance DECIMAL(12,2) DEFAULT 0;

-- Базовые настройки сайта
INSERT INTO t_p8223105_sochi_transfer_websi.site_settings (key, value) VALUES
    ('site_title', 'ПоехалиПро — Трансфер Абхазия-Россия'),
    ('site_description', 'Надёжные трансферы из аэропорта Сочи в Абхазию и обратно. Комфортные автомобили, опытные водители.'),
    ('site_keywords', 'трансфер сочи, такси сочи абхазия, трансфер аэропорт сочи, поездка в абхазию'),
    ('site_year', '2012'),
    ('whatsapp_number', ''),
    ('telegram_username', ''),
    ('max_username', ''),
    ('yandex_metrika_id', ''),
    ('company_phone', '+7 (912) 345-67-89'),
    ('company_email', 'info@poehali.pro'),
    ('company_address', 'г. Сочи, Аэропорт'),
    ('privacy_policy', 'Политика конфиденциальности...'),
    ('terms_of_service', 'Правила сервиса...'),
    ('group_transfer_price_per_person', '1500'),
    ('chat_enabled', 'true'),
    ('footer_brand', 'ПоехалиПро'),
    ('footer_slogan', 'Трансфер Абхазия-Россия'),
    ('hero_badge_text', 'Надежные трансферы с 2012 года'),
    ('hero_description', 'Комфортные поездки из аэропорта, вокзала и любой точки города.')
ON CONFLICT (key) DO NOTHING;

-- Базовые дополнительные услуги
INSERT INTO t_p8223105_sochi_transfer_websi.additional_services (name, description, price, icon) VALUES
    ('Детское кресло', 'Автокресло для ребёнка до 12 лет', 300, 'Baby'),
    ('Встреча с табличкой', 'Водитель встретит вас с именной табличкой', 200, 'UserCheck'),
    ('Помощь с багажом', 'Водитель поможет с погрузкой багажа', 150, 'Luggage')
ON CONFLICT DO NOTHING;
