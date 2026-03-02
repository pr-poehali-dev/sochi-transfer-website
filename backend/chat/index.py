import json, os, psycopg2, urllib.request

SCHEMA = 't_p8223105_sochi_transfer_websi'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Driver-Id, X-Auth-Token',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def resp(status, body):
    return {'statusCode': status, 'headers': {'Content-Type': 'application/json', **CORS},
            'body': json.dumps(body, default=str)}

def handler(event: dict, context) -> dict:
    """Чат водитель ↔ пассажир и ИИ-помощник для трансфера"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    resource = params.get('resource', 'chat')
    headers = event.get('headers') or {}
    body_str = event.get('body') or '{}'
    data = json.loads(body_str) if body_str else {}

    user_id = headers.get('X-User-Id') or params.get('user_id')
    driver_id = headers.get('X-Driver-Id') or params.get('driver_id')

    if resource == 'ai':
        return handle_ai(data)

    # ── CHAT resource ──
    order_id = params.get('order_id') or data.get('order_id')
    if not order_id:
        return resp(400, {'error': 'order_id обязателен'})
    oid = int(order_id)

    conn = get_conn()
    cur = conn.cursor()

    if method == 'GET':
        cur.execute(
            f"SELECT id, sender_type, sender_id, message, is_read, created_at "
            f"FROM {SCHEMA}.chat_messages WHERE order_id=%s ORDER BY created_at ASC",
            (oid,)
        )
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]

        # Помечаем прочитанными сообщения собеседника
        if user_id:
            cur.execute(
                f"UPDATE {SCHEMA}.chat_messages SET is_read=TRUE "
                f"WHERE order_id=%s AND sender_type='driver' AND is_read=FALSE",
                (oid,)
            )
        elif driver_id:
            cur.execute(
                f"UPDATE {SCHEMA}.chat_messages SET is_read=TRUE "
                f"WHERE order_id=%s AND sender_type='user' AND is_read=FALSE",
                (oid,)
            )
        conn.commit()
        cur.close(); conn.close()
        return resp(200, {'messages': rows})

    elif method == 'POST':
        message = (data.get('message') or '').strip()
        if not message:
            cur.close(); conn.close()
            return resp(400, {'error': 'Сообщение не может быть пустым'})

        sender_type = 'driver' if driver_id else 'user'
        sender_id = int(driver_id) if driver_id else (int(user_id) if user_id else None)

        cur.execute(
            f"INSERT INTO {SCHEMA}.chat_messages (order_id, sender_type, sender_id, message) "
            f"VALUES (%s, %s, %s, %s) RETURNING id, created_at",
            (oid, sender_type, sender_id, message)
        )
        row = cur.fetchone()
        conn.commit()
        cur.close(); conn.close()
        return resp(201, {'id': row[0], 'created_at': str(row[1]), 'message': 'Отправлено'})

    cur.close(); conn.close()
    return resp(405, {'error': 'Method not allowed'})


def handle_ai(data: dict) -> dict:
    """ИИ-помощник: отвечает на вопросы о трансферах"""
    api_key = os.environ.get('OPENAI_API_KEY', '')
    if not api_key:
        return resp(503, {'error': 'ИИ-помощник временно недоступен'})

    user_message = (data.get('message') or '').strip()
    if not user_message:
        return resp(400, {'error': 'Введите вопрос'})

    system_prompt = """Ты — вежливый ИИ-помощник сервиса трансферов ПоехалиПро (Сочи).
Помогаешь клиентам с вопросами о трансферах: цены, маршруты, классы авто, условия, как заказать.
Отвечай кратко и дружелюбно на русском языке. Не придумывай конкретные цены если не знаешь — предлагай смотреть тарифы на сайте или позвонить.
Основные направления: Сочи, Адлер, Абхазия, Краснодар, Ростов, Москва.
Классы авто: Эконом, Комфорт, Бизнес, Минивэн."""

    payload = json.dumps({
        'model': 'gpt-4o-mini',
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_message}
        ],
        'max_tokens': 400,
        'temperature': 0.7,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=payload,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        result = json.loads(r.read().decode('utf-8'))

    answer = result['choices'][0]['message']['content']
    return resp(200, {'answer': answer})
