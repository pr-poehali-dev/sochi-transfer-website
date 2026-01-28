-- Таблица статусов заявок
CREATE TABLE IF NOT EXISTS order_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20) DEFAULT '#8B5CF6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица тарифов
CREATE TABLE IF NOT EXISTS tariffs (
    id SERIAL PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL,
    distance VARCHAR(50),
    duration VARCHAR(50),
    image_emoji VARCHAR(10) DEFAULT '🚗',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица автопарка
CREATE TABLE IF NOT EXISTS fleet (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL,
    luggage_capacity INTEGER NOT NULL,
    features TEXT[],
    image_url TEXT,
    image_emoji VARCHAR(10) DEFAULT '🚗',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица заявок
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    from_location VARCHAR(200) NOT NULL,
    to_location VARCHAR(200) NOT NULL,
    pickup_datetime TIMESTAMP NOT NULL,
    flight_number VARCHAR(50),
    passenger_name VARCHAR(200),
    passenger_phone VARCHAR(50),
    passenger_email VARCHAR(200),
    passengers_count INTEGER DEFAULT 1,
    luggage_count INTEGER DEFAULT 0,
    tariff_id INTEGER REFERENCES tariffs(id),
    fleet_id INTEGER REFERENCES fleet(id),
    status_id INTEGER REFERENCES order_statuses(id) DEFAULT 1,
    price INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица администраторов
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Таблица настроек уведомлений
CREATE TABLE IF NOT EXISTS notification_settings (
    id SERIAL PRIMARY KEY,
    whatsapp_enabled BOOLEAN DEFAULT false,
    whatsapp_phone VARCHAR(50),
    telegram_enabled BOOLEAN DEFAULT false,
    telegram_bot_token VARCHAR(255),
    telegram_chat_id VARCHAR(100),
    email_enabled BOOLEAN DEFAULT false,
    email_from VARCHAR(200),
    email_to VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставляем начальные статусы
INSERT INTO order_statuses (name, color) VALUES 
    ('Новая заявка', '#8B5CF6'),
    ('Подтверждена', '#0EA5E9'),
    ('В пути', '#F97316'),
    ('Завершена', '#10B981'),
    ('Отменена', '#EF4444')
ON CONFLICT (name) DO NOTHING;

-- Вставляем начальные тарифы
INSERT INTO tariffs (city, price, distance, duration, image_emoji) VALUES 
    ('Гагра', 3500, '25 км', '35 мин', '🏖️'),
    ('Пицунда', 4200, '35 км', '50 мин', '🌊'),
    ('Сухум', 5500, '85 км', '1 ч 30 мин', '🏛️'),
    ('Новый Афон', 4800, '60 км', '1 ч 10 мин', '⛪')
ON CONFLICT DO NOTHING;

-- Вставляем начальный автопарк
INSERT INTO fleet (name, type, capacity, luggage_capacity, features, image_emoji) VALUES 
    ('Mercedes-Benz E-Class', 'Бизнес', 3, 3, ARRAY['Кондиционер', 'Wi-Fi', 'USB зарядка'], '🚗'),
    ('Mercedes-Benz V-Class', 'Минивэн', 6, 6, ARRAY['Панорамная крыша', 'Климат-контроль', 'Детские кресла'], '🚙'),
    ('Toyota Camry', 'Комфорт', 3, 2, ARRAY['Кондиционер', 'Аудиосистема', 'Подогрев сидений'], '🚘')
ON CONFLICT DO NOTHING;

-- Вставляем админа с паролем 131999davidmy (хеш bcrypt)
INSERT INTO admins (email, password_hash, name) VALUES 
    ('mydavidmy@mail.ru', '$2b$10$8Z3qN9X5Y6lQ2wR4tP7vXu9K5J4M3N2P1Q6R7S8T9U0V1W2X3Y4Z5a', 'Администратор')
ON CONFLICT (email) DO NOTHING;

-- Вставляем начальные настройки уведомлений
INSERT INTO notification_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tariffs_active ON tariffs(is_active);
CREATE INDEX IF NOT EXISTS idx_fleet_active ON fleet(is_active);