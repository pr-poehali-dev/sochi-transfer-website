import json
import os
import psycopg2
import secrets
import urllib.request
import hashlib
import smtplib
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, X-User-Id, X-Driver-Id, X-Auth-Token, X-Session-Id'
}
SCHEMA = 't_p8223105_sochi_transfer_websi'

def get_conn():
    return psycopg2.connect(os.environ.get('DATABASE_URL'))

def resp(status, body):
    return {'statusCode': status, 'headers': {'Content-Type': 'application/json', **CORS},
            'body': json.dumps(body, default=str), 'isBase64Encoded': False}

def get_site_settings():
    try:
        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"SELECT key, value FROM {SCHEMA}.site_settings")
        s = {r[0]: r[1] for r in cur.fetchall()}
        cur.close(); conn.close()
        return s
    except Exception:
        return {}

def send_telegram_notification(data: dict, order_id: int):
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
    if not token or not chat_id:
        return
    transfer_type_labels = {'individual': 'Индивидуальный', 'group': 'Групповой'}
    car_class_labels = {'economy': 'Эконом', 'comfort': 'Комфорт', 'business': 'Бизнес', 'minivan': 'Минивэн'}
    payment_labels = {'full': 'Полная оплата', 'prepay': 'Предоплата 30%', 'cash': 'Наличные'}
    text = (
        f"🚗 *Новая заявка #{order_id}*\n\n"
        f"📍 {data.get('from_location')} → {data.get('to_location')}\n"
        f"📅 {data.get('pickup_datetime', '').replace('T', ' ')}\n"
        f"👤 {data.get('passenger_name')}\n"
        f"📞 {data.get('passenger_phone')}\n"
        f"👥 {data.get('passengers_count', 1)} пасс.\n"
        f"🚘 {transfer_type_labels.get(data.get('transfer_type','individual'), 'Индивидуальный')} · {car_class_labels.get(data.get('car_class','comfort'), 'Комфорт')}\n"
        f"💳 {payment_labels.get(data.get('payment_type','cash'), 'Наличные')}\n"
        f"💰 *{data.get('price', 0)} ₽*"
    )
    payload = json.dumps({'chat_id': chat_id, 'text': text, 'parse_mode': 'Markdown'}).encode()
    req = urllib.request.Request(
        f'https://api.telegram.org/bot{token}/sendMessage',
        data=payload,
        headers={'Content-Type': 'application/json'}
    )
    try:
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass

def send_email_notification(data: dict, order_id: int, settings: dict):
    smtp_host = settings.get('smtp_host', '')
    smtp_user = settings.get('smtp_user', '')
    smtp_from = settings.get('smtp_from') or smtp_user
    notify_to = settings.get('email_notify_to', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    if not smtp_host or not smtp_user or not smtp_password or not notify_to:
        return
    if settings.get('email_notify_new_order', 'true') != 'true':
        return
    try:
        smtp_port = int(settings.get('smtp_port', '587') or '587')
        transfer_type_labels = {'individual': 'Индивидуальный', 'group': 'Групповой'}
        car_class_labels = {'economy': 'Эконом', 'comfort': 'Комфорт', 'business': 'Бизнес', 'minivan': 'Минивэн'}
        payment_labels = {'full': 'Полная оплата', 'prepay': 'Предоплата', 'cash': 'Наличные'}
        html = f"""
        <html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f59e0b; padding: 20px; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0;">🚗 Новая заявка #{order_id}</h2>
        </div>
        <div style="background: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; color: #6b7280;">Маршрут:</td><td style="padding: 8px; font-weight: bold;">{data.get('from_location')} → {data.get('to_location')}</td></tr>
                <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6b7280;">Дата и время:</td><td style="padding: 8px;">{str(data.get('pickup_datetime', '')).replace('T', ' ')}</td></tr>
                <tr><td style="padding: 8px; color: #6b7280;">Пассажир:</td><td style="padding: 8px;">{data.get('passenger_name')}</td></tr>
                <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6b7280;">Телефон:</td><td style="padding: 8px;">{data.get('passenger_phone')}</td></tr>
                <tr><td style="padding: 8px; color: #6b7280;">Пассажиров:</td><td style="padding: 8px;">{data.get('passengers_count', 1)}</td></tr>
                <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6b7280;">Тип трансфера:</td><td style="padding: 8px;">{transfer_type_labels.get(data.get('transfer_type','individual'), 'Индивидуальный')}</td></tr>
                <tr><td style="padding: 8px; color: #6b7280;">Класс авто:</td><td style="padding: 8px;">{car_class_labels.get(data.get('car_class','comfort'), 'Комфорт')}</td></tr>
                <tr style="background: #f9fafb;"><td style="padding: 8px; color: #6b7280;">Оплата:</td><td style="padding: 8px;">{payment_labels.get(data.get('payment_type','cash'), 'Наличные')}</td></tr>
                <tr><td style="padding: 8px; color: #6b7280;">Сумма:</td><td style="padding: 8px; font-weight: bold; font-size: 18px; color: #f59e0b;">{data.get('price', 0)} ₽</td></tr>
            </table>
        </div>
        </body></html>
        """
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'Новая заявка #{order_id} — {data.get("from_location")} → {data.get("to_location")}'
        msg['From'] = f'{smtp_from} <{smtp_user}>'
        msg['To'] = notify_to
        msg.attach(MIMEText(html, 'html', 'utf-8'))
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, notify_to, msg.as_string())
    except Exception:
        pass

def send_push_to_user(user_id: int, title: str, body: str, url: str = '/profile'):
    """Отправляет Web Push уведомление пользователю через все его подписки"""
    try:
        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"SELECT endpoint, p256dh, auth FROM {SCHEMA}.push_subscriptions WHERE user_id=%s", (user_id,))
        subscriptions = cur.fetchall()
        cur.close(); conn.close()
        for endpoint, p256dh, auth_key in subscriptions:
            try:
                payload = json.dumps({'title': title, 'body': body, 'url': url, 'tag': 'order-update'}).encode()
                req = urllib.request.Request(
                    endpoint,
                    data=payload,
                    headers={
                        'Content-Type': 'application/json',
                        'TTL': '86400',
                    },
                    method='POST'
                )
                urllib.request.urlopen(req, timeout=5)
            except Exception:
                pass
    except Exception:
        pass


def generate_yookassa_payment(order_id: int, amount: float, description: str, return_url: str, settings: dict) -> dict:
    shop_id = settings.get('yookassa_shop_id', '')
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY', '')
    if not shop_id or not secret_key:
        return {'error': 'ЮКасса не настроена'}
    try:
        idempotence_key = secrets.token_urlsafe(16)
        payload = json.dumps({
            'amount': {'value': f'{amount:.2f}', 'currency': 'RUB'},
            'capture': True,
            'confirmation': {'type': 'redirect', 'return_url': return_url},
            'description': description,
            'metadata': {'order_id': order_id},
        }).encode()
        import base64
        credentials = base64.b64encode(f'{shop_id}:{secret_key}'.encode()).decode()
        req = urllib.request.Request(
            'https://api.yookassa.ru/v3/payments',
            data=payload,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Basic {credentials}',
                'Idempotence-Key': idempotence_key,
            }
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read())
            return {
                'payment_id': result.get('id'),
                'payment_url': result.get('confirmation', {}).get('confirmation_url'),
                'status': result.get('status'),
            }
    except Exception as e:
        return {'error': str(e)}

def generate_robokassa_payment(order_id: int, amount: float, description: str, settings: dict) -> dict:
    login = settings.get('robokassa_login', '')
    password1 = os.environ.get('ROBOKASSA_PASSWORD1', '')
    test_mode = settings.get('robokassa_test_mode', 'true') == 'true'
    if not login or not password1:
        return {'error': 'Робокасса не настроена'}
    try:
        inv_id = order_id
        out_sum = f'{amount:.2f}'
        sign_str = f'{login}:{out_sum}:{inv_id}:{password1}'
        signature = hashlib.md5(sign_str.encode()).hexdigest()
        test_param = '&IsTest=1' if test_mode else ''
        desc_enc = urllib.request.quote(description)
        payment_url = (
            f'https://auth.robokassa.ru/Merchant/Index.aspx'
            f'?MerchantLogin={login}&OutSum={out_sum}&InvId={inv_id}'
            f'&Description={desc_enc}&SignatureValue={signature}{test_param}'
        )
        return {'payment_url': payment_url, 'inv_id': inv_id}
    except Exception as e:
        return {'error': str(e)}


def handle_orders(method, event):
    conn = get_conn()
    cur = conn.cursor()
    params = event.get('queryStringParameters', {}) or {}

    if method == 'GET':
        order_id = params.get('id')
        if order_id:
            cur.execute(f'''
                SELECT o.*, t.city, s.name as status_name, s.color as status_color
                FROM {SCHEMA}.orders o
                LEFT JOIN {SCHEMA}.tariffs t ON o.tariff_id = t.id
                LEFT JOIN {SCHEMA}.order_statuses s ON o.status_id = s.id
                WHERE o.id = {int(order_id)}
            ''')
        else:
            cur.execute(f'''
                SELECT o.id, o.from_location, o.to_location, o.pickup_datetime,
                       o.passenger_name, o.passenger_phone, o.price, o.created_at,
                       o.transfer_type, o.car_class, o.payment_type, o.prepay_amount,
                       o.passengers_count, o.flight_number, o.passenger_email, o.status_id,
                       o.notes,
                       s.name as status_name, s.color as status_color,
                       t.city as tariff_city
                FROM {SCHEMA}.orders o
                LEFT JOIN {SCHEMA}.order_statuses s ON o.status_id = s.id
                LEFT JOIN {SCHEMA}.tariffs t ON o.tariff_id = t.id
                ORDER BY o.created_at DESC
            ''')
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return resp(200, {'orders': rows if not order_id else (rows[0] if rows else None)})

    elif method == 'POST':
        data = json.loads(event.get('body', '{}'))
        headers = event.get('headers', {}) or {}
        user_id = (headers.get('X-User-Id') or headers.get('x-user-id') or
                   data.get('user_id'))

        if not user_id:
            cur.close(); conn.close()
            return resp(401, {'error': 'Для оформления заказа необходимо войти в аккаунт'})

        if not data.get('from_location') or not data.get('to_location'):
            cur.close(); conn.close()
            return resp(400, {'error': 'Укажите откуда и куда'})
        if not data.get('passenger_name') or not data.get('passenger_phone'):
            cur.close(); conn.close()
            return resp(400, {'error': 'Укажите имя и телефон пассажира'})
        if not data.get('pickup_datetime'):
            cur.close(); conn.close()
            return resp(400, {'error': 'Укажите дату и время поездки'})

        tariff_id = data.get('tariff_id')
        try:
            tariff_id = int(tariff_id) if tariff_id else None
        except (ValueError, TypeError):
            tariff_id = None

        price = float(data.get('price', 0) or 0)
        prepay_amount = round(price * 0.3) if data.get('payment_type') == 'prepay' else 0
        payment_from_balance = data.get('payment_from_balance', False)
        payment_type = data.get('payment_type', 'cash')

        if payment_from_balance:
            if price <= 0:
                cur.close(); conn.close()
                return resp(400, {'error': 'Некорректная сумма'})
            cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id=%s", (int(user_id),))
            bal_row = cur.fetchone()
            if not bal_row or float(bal_row[0]) < price:
                cur.close(); conn.close()
                return resp(400, {'error': 'Недостаточно средств на балансе'})
            cur.execute(f"UPDATE {SCHEMA}.users SET balance=balance-%s WHERE id=%s", (price, int(user_id)))

        cur.execute(f'''
            INSERT INTO {SCHEMA}.orders (
                from_location, to_location, pickup_datetime, flight_number,
                passenger_name, passenger_phone, passenger_email,
                passengers_count, luggage_count, tariff_id, fleet_id,
                status_id, price, notes, transfer_type, car_class, payment_type, prepay_amount, user_id, payment_from_balance
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
        ''', (
            data.get('from_location'), data.get('to_location'), data.get('pickup_datetime'),
            data.get('flight_number'), data.get('passenger_name'), data.get('passenger_phone'),
            data.get('passenger_email'), int(data.get('passengers_count', 1) or 1), int(data.get('luggage_count', 0) or 0),
            tariff_id, data.get('fleet_id'), int(data.get('status_id', 1) or 1),
            price, data.get('notes'),
            data.get('transfer_type', 'individual'), data.get('car_class', 'comfort'),
            payment_type, prepay_amount,
            int(user_id), payment_from_balance
        ))
        oid = cur.fetchone()[0]

        if payment_from_balance:
            cur.execute(f"INSERT INTO {SCHEMA}.balance_transactions (user_id,amount,type,description,status) VALUES (%s,%s,'payment','Оплата заказа #%s','completed')",
                        (int(user_id), -price, oid))

        conn.commit(); cur.close(); conn.close()

        site_settings = get_site_settings()
        send_telegram_notification(data, oid)
        send_email_notification(data, oid, site_settings)

        # Генерируем ссылку на оплату если выбран онлайн-провайдер
        payment_info = {}
        provider = site_settings.get('payment_provider', 'none')
        if data.get('payment_type') in ('full', 'prepay') and provider != 'none':
            pay_amount = float(data.get('price', 0))
            if data.get('payment_type') == 'prepay':
                prepay_pct = int(site_settings.get('prepay_percent', '30') or 30)
                pay_amount = round(pay_amount * prepay_pct / 100, 2)
            description = f'Трансфер {data.get("from_location")} → {data.get("to_location")}'
            if provider == 'yookassa':
                return_url = site_settings.get('site_url', 'https://transfer-abkhazia.ru') + '/profile'
                payment_info = generate_yookassa_payment(oid, pay_amount, description, return_url, site_settings)
            elif provider == 'robokassa':
                payment_info = generate_robokassa_payment(oid, pay_amount, description, site_settings)

        return resp(201, {'id': oid, 'message': 'Заявка создана', **payment_info})

    elif method == 'PUT':
        data = json.loads(event.get('body', '{}'))
        order_id = data.get('id')
        new_status_id = data.get('status_id')
        # Получаем user_id и текущий статус до обновления
        user_id_for_push = None
        status_name_for_push = None
        if order_id and new_status_id:
            cur.execute(f"SELECT user_id FROM {SCHEMA}.orders WHERE id=%s", (int(order_id),))
            row = cur.fetchone()
            if row:
                user_id_for_push = row[0]
            cur.execute(f"SELECT name FROM {SCHEMA}.order_statuses WHERE id=%s", (int(new_status_id),))
            srow = cur.fetchone()
            if srow:
                status_name_for_push = srow[0]
        cur.execute(f'''
            UPDATE {SCHEMA}.orders SET status_id=%s, price=%s, notes=%s, updated_at=CURRENT_TIMESTAMP
            WHERE id=%s
        ''', (new_status_id, data.get('price'), data.get('notes'), order_id))
        conn.commit(); cur.close(); conn.close()
        # Отправляем push пользователю о смене статуса
        if user_id_for_push and status_name_for_push:
            send_push_to_user(
                user_id_for_push,
                f'Статус заявки #{order_id} изменён',
                f'Новый статус: {status_name_for_push}',
                '/profile'
            )
        return resp(200, {'message': 'Заявка обновлена'})

    elif method == 'DELETE':
        oid = int((params.get('id') or '0'))
        cur.execute(f"UPDATE {SCHEMA}.orders SET status_id=5, updated_at=CURRENT_TIMESTAMP WHERE id={oid}")
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Заявка отменена'})

    return resp(405, {'error': 'Method not allowed'})


def handle_rideshares(method, event):
    conn = get_conn()
    cur = conn.cursor()
    params = event.get('queryStringParameters', {}) or {}

    if method == 'GET':
        cancel_token = params.get('cancel_token')
        if cancel_token:
            token = cancel_token.replace("'", "")
            cur.execute(f"UPDATE {SCHEMA}.rideshare_bookings SET status='cancelled' WHERE cancel_token='{token}' AND status='confirmed' RETURNING rideshare_id, seats_count")
            row = cur.fetchone()
            if row:
                cur.execute(f"UPDATE {SCHEMA}.rideshares SET seats_available=seats_available+{row[1]}, updated_at=CURRENT_TIMESTAMP WHERE id={row[0]}")
            conn.commit(); cur.close(); conn.close()
            return resp(200, {'cancelled': bool(row), 'message': 'Запись отменена' if row else 'Токен не найден'})

        action = params.get('action')
        if action == 'my_bookings':
            user_id = params.get('user_id')
            if not user_id:
                cur.close(); conn.close()
                return resp(400, {'error': 'user_id обязателен'})
            cur.execute(f'''
                SELECT rb.id, rb.rideshare_id, rb.passenger_name, rb.passenger_phone,
                       rb.seats_count, rb.status, rb.cancel_token, rb.created_at,
                       rs.route_from, rs.route_to, rs.departure_datetime, rs.price_per_seat
                FROM {SCHEMA}.rideshare_bookings rb
                LEFT JOIN {SCHEMA}.rideshares rs ON rb.rideshare_id = rs.id
                WHERE rb.user_id = {int(user_id)}
                ORDER BY rb.created_at DESC
            ''')
            cols = [d[0] for d in cur.description]
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.close(); conn.close()
            return resp(200, {'bookings': rows})

        ride_id = params.get('id')
        if ride_id:
            cur.execute(f'''
                SELECT id, route_from, route_to, departure_datetime, seats_total, seats_available,
                       price_per_seat, car_class, driver_name, driver_phone, driver_telegram, notes, status, created_by_name, created_at
                FROM {SCHEMA}.rideshares WHERE id={int(ride_id)}
            ''')
        else:
            cur.execute(f'''
                SELECT id, route_from, route_to, departure_datetime, seats_total, seats_available,
                       price_per_seat, car_class, driver_name, notes, status, created_by_name, created_at
                FROM {SCHEMA}.rideshares
                WHERE status='active' AND departure_datetime > NOW()
                ORDER BY departure_datetime ASC
            ''')
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return resp(200, {'rideshares': rows if not ride_id else (rows[0] if rows else None)})

    elif method == 'POST':
        data = json.loads(event.get('body', '{}'))
        action = data.get('action', 'create')

        if action == 'book':
            rid = int(data.get('rideshare_id', 0))
            seats = int(data.get('seats_count', 1))
            cur.execute(f"SELECT seats_available FROM {SCHEMA}.rideshares WHERE id={rid} AND status='active'")
            row = cur.fetchone()
            if not row:
                cur.close(); conn.close(); return resp(404, {'error': 'Поездка не найдена'})
            if row[0] < seats:
                cur.close(); conn.close(); return resp(400, {'error': 'Недостаточно мест'})
            token = secrets.token_urlsafe(16)
            booking_user_id = int(data.get('user_id')) if data.get('user_id') else None
            cur.execute(f'''
                INSERT INTO {SCHEMA}.rideshare_bookings (rideshare_id, passenger_name, passenger_phone, passenger_email, seats_count, status, cancel_token, user_id)
                VALUES (%s,%s,%s,%s,%s,'confirmed',%s,%s) RETURNING id
            ''', (rid, data.get('passenger_name'), data.get('passenger_phone'), data.get('passenger_email',''), seats, token, booking_user_id))
            bid = cur.fetchone()[0]
            cur.execute(f"UPDATE {SCHEMA}.rideshares SET seats_available=seats_available-{seats}, updated_at=CURRENT_TIMESTAMP WHERE id={rid}")
            conn.commit(); cur.close(); conn.close()
            return resp(201, {'id': bid, 'cancel_token': token, 'message': 'Вы записаны!'})

        else:
            seats_total = int(data.get('seats_total', 4))
            cur.execute(f'''
                INSERT INTO {SCHEMA}.rideshares (route_from, route_to, departure_datetime, seats_total, seats_available,
                  price_per_seat, car_class, driver_name, driver_phone, driver_telegram, notes, status, created_by_name, created_by_phone)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'active',%s,%s) RETURNING id
            ''', (
                data.get('route_from'), data.get('route_to'), data.get('departure_datetime'),
                seats_total, seats_total, data.get('price_per_seat'),
                data.get('car_class','comfort'), data.get('driver_name',''),
                data.get('driver_phone',''), data.get('driver_telegram',''),
                data.get('notes',''), data.get('created_by_name'), data.get('created_by_phone')
            ))
            rid = cur.fetchone()[0]
            conn.commit(); cur.close(); conn.close()
            return resp(201, {'id': rid, 'message': 'Поездка создана'})

    elif method == 'PUT':
        data = json.loads(event.get('body', '{}'))
        rid = int(data.get('id', 0))
        status = data.get('status', 'active').replace("'","")
        cur.execute(f"UPDATE {SCHEMA}.rideshares SET status='{status}', updated_at=CURRENT_TIMESTAMP WHERE id={rid}")
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Поездка обновлена'})

    return resp(405, {'error': 'Method not allowed'})


def handle_payment_settings(method, event):
    conn = get_conn()
    cur = conn.cursor()

    if method == 'GET':
        cur.execute(f'SELECT id, allow_prepay, prepay_percent, allow_full_payment, payment_provider, provider_public_key FROM {SCHEMA}.payment_settings LIMIT 1')
        row = cur.fetchone()
        cols = [d[0] for d in cur.description]
        data = dict(zip(cols, row)) if row else {'allow_prepay': True, 'prepay_percent': 30, 'allow_full_payment': True, 'payment_provider': 'none'}
        cur.close(); conn.close()
        return resp(200, {'settings': data})

    elif method == 'PUT':
        data = json.loads(event.get('body', '{}'))
        cur.execute(f'''
            UPDATE {SCHEMA}.payment_settings SET
              allow_prepay=%s, prepay_percent=%s, allow_full_payment=%s,
              payment_provider=%s, provider_public_key=%s, updated_at=CURRENT_TIMESTAMP
            WHERE id=1
        ''', (
            data.get('allow_prepay', True), data.get('prepay_percent', 30),
            data.get('allow_full_payment', True), data.get('payment_provider','none'),
            data.get('provider_public_key','')
        ))
        if cur.rowcount == 0:
            cur.execute(f'''
                INSERT INTO {SCHEMA}.payment_settings (allow_prepay, prepay_percent, allow_full_payment, payment_provider, provider_public_key)
                VALUES (%s,%s,%s,%s,%s)
            ''', (data.get('allow_prepay',True), data.get('prepay_percent',30),
                  data.get('allow_full_payment',True), data.get('payment_provider','none'), data.get('provider_public_key','')))
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Настройки сохранены'})

    return resp(405, {'error': 'Method not allowed'})


def handle_news(method, event):
    conn = get_conn()
    cur = conn.cursor()
    params = event.get('queryStringParameters', {}) or {}
    data = {}
    if event.get('body'):
        try:
            data = json.loads(event.get('body', '{}'))
        except Exception:
            pass

    if method == 'GET':
        published_only = params.get('published', 'false') == 'true'
        if published_only:
            cur.execute(f"SELECT id,title,summary,content,image_url,published_at,created_at FROM {SCHEMA}.news WHERE is_published=true ORDER BY published_at DESC LIMIT 20")
        else:
            cur.execute(f"SELECT id,title,summary,content,image_url,is_published,published_at,created_at FROM {SCHEMA}.news ORDER BY created_at DESC")
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return resp(200, {'news': rows})

    elif method == 'POST':
        import base64, boto3, os as _os
        title = data.get('title', '').strip()
        if not title:
            cur.close(); conn.close()
            return resp(400, {'error': 'Заголовок обязателен'})
        image_url = ''
        if data.get('image_b64'):
            b64 = data['image_b64']
            if ',' in b64:
                b64 = b64.split(',', 1)[1]
            img_data = base64.b64decode(b64)
            s3 = boto3.client('s3', endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=_os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=_os.environ['AWS_SECRET_ACCESS_KEY'])
            key = f"news/{secrets.token_hex(8)}.jpg"
            s3.put_object(Bucket='files', Key=key, Body=img_data, ContentType='image/jpeg')
            image_url = f"https://cdn.poehali.dev/projects/{_os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        pub_at = 'NOW()' if data.get('is_published') else None
        if pub_at:
            cur.execute(f'''
                INSERT INTO {SCHEMA}.news (title, content, image_url, is_published, published_at)
                VALUES (%s, %s, %s, %s, NOW()) RETURNING id
            ''', (title, data.get('content',''), image_url, True))
        else:
            cur.execute(f'''
                INSERT INTO {SCHEMA}.news (title, content, image_url, is_published)
                VALUES (%s, %s, %s, %s) RETURNING id
            ''', (title, data.get('content',''), image_url, False))
        nid = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return resp(201, {'id': nid, 'message': 'Новость создана'})

    elif method == 'PUT':
        import base64, boto3, os as _os
        nid = data.get('id')
        image_url = data.get('image_url', '')
        if data.get('image_b64'):
            b64 = data['image_b64']
            if ',' in b64:
                b64 = b64.split(',', 1)[1]
            img_data = base64.b64decode(b64)
            s3 = boto3.client('s3', endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=_os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=_os.environ['AWS_SECRET_ACCESS_KEY'])
            key = f"news/{secrets.token_hex(8)}.jpg"
            s3.put_object(Bucket='files', Key=key, Body=img_data, ContentType='image/jpeg')
            image_url = f"https://cdn.poehali.dev/projects/{_os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        is_pub = data.get('is_published', False)
        cur.execute(f'''
            UPDATE {SCHEMA}.news SET title=%s, content=%s, image_url=%s,
            is_published=%s, published_at=CASE WHEN %s THEN NOW() ELSE published_at END
            WHERE id=%s
        ''', (data.get('title'), data.get('content',''),
              image_url, is_pub, is_pub, int(nid)))
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Новость обновлена'})

    elif method == 'DELETE':
        nid = params.get('id') or data.get('id')
        if nid:
            cur.execute(f"DELETE FROM {SCHEMA}.news WHERE id={int(nid)}")
            conn.commit()
        cur.close(); conn.close()
        return resp(200, {'message': 'Удалено'})

    cur.close(); conn.close()
    return resp(405, {'error': 'Method not allowed'})


def handler(event: dict, context) -> dict:
    '''Мультироутер API: orders, rideshares, payment_settings, news — по параметру ?resource='''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': '', 'isBase64Encoded': False}

    try:
        params = event.get('queryStringParameters', {}) or {}
        resource = params.get('resource', 'orders')

        if resource == 'rideshares':
            return handle_rideshares(method, event)
        elif resource == 'payment_settings':
            return handle_payment_settings(method, event)
        elif resource == 'news':
            return handle_news(method, event)
        else:
            return handle_orders(method, event)

    except Exception as e:
        return resp(500, {'error': str(e)})