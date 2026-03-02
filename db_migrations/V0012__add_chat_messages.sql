-- Чат: сообщения между водителем и пассажиром по заказу
CREATE TABLE IF NOT EXISTS t_p8223105_sochi_transfer_websi.chat_messages (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('driver', 'user', 'ai')),
  sender_id INTEGER,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_order_id ON t_p8223105_sochi_transfer_websi.chat_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON t_p8223105_sochi_transfer_websi.chat_messages(created_at);