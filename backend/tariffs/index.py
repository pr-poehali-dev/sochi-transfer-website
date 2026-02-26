import json
import os
import psycopg2
import base64
import boto3

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
}
SCHEMA = 't_p8223105_sochi_transfer_websi'

def get_conn():
    return psycopg2.connect(os.environ.get('DATABASE_URL'))

def resp(status, body):
    return {'statusCode': status, 'headers': {'Content-Type': 'application/json', **CORS},
            'body': json.dumps(body, default=str), 'isBase64Encoded': False}

def upload_s3(b64data, filename, folder='files'):
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


# ===== TARIFFS =====
def handle_tariffs(method, event, params):
    conn = get_conn(); cur = conn.cursor()
    if method == 'GET':
        active_only = params.get('active', 'false') == 'true'
        q = f"SELECT * FROM {SCHEMA}.tariffs" + (" WHERE is_active=true" if active_only else "") + " ORDER BY id"
        cur.execute(q)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return resp(200, {'tariffs': rows})
    elif method == 'POST':
        data = json.loads(event.get('body', '{}'))
        image_url = None
        if data.get('image_base64'):
            image_url = upload_s3(data['image_base64'], f"tariff_{os.urandom(6).hex()}.jpg", 'tariffs')
        cur.execute(f'''
            INSERT INTO {SCHEMA}.tariffs (city, price, distance, duration, image_emoji, image_url, is_active)
            VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id
        ''', (data.get('city'), data.get('price'), data.get('distance'), data.get('duration'),
              data.get('image_emoji','🚗'), image_url, data.get('is_active', True)))
        tid = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return resp(201, {'id': tid, 'message': 'Тариф создан'})
    elif method == 'PUT':
        data = json.loads(event.get('body', '{}'))
        image_url = data.get('image_url')
        if data.get('image_base64'):
            image_url = upload_s3(data['image_base64'], f"tariff_{os.urandom(6).hex()}.jpg", 'tariffs')
        cur.execute(f'''
            UPDATE {SCHEMA}.tariffs SET city=%s, price=%s, distance=%s, duration=%s,
            image_emoji=%s, is_active=%s, image_url=COALESCE(%s, image_url), updated_at=NOW()
            WHERE id=%s
        ''', (data.get('city'), data.get('price'), data.get('distance'), data.get('duration'),
              data.get('image_emoji'), data.get('is_active'), image_url, data.get('id')))
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Тариф обновлён'})
    elif method == 'DELETE':
        tid = params.get('id', '0')
        cur.execute(f"DELETE FROM {SCHEMA}.tariffs WHERE id=%s", (int(tid),))
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Тариф удалён'})
    return resp(405, {'error': 'Method not allowed'})


# ===== SETTINGS =====
def handle_settings(method, event, params):
    conn = get_conn(); cur = conn.cursor()
    if method == 'GET':
        keys = params.get('keys', '')
        if keys:
            ks = [k.strip() for k in keys.split(',') if k.strip()]
            ph = ','.join([f"'{k}'" for k in ks])
            cur.execute(f"SELECT key, value FROM {SCHEMA}.site_settings WHERE key IN ({ph})")
        else:
            cur.execute(f"SELECT key, value FROM {SCHEMA}.site_settings")
        rows = cur.fetchall()
        settings = {r[0]: r[1] for r in rows}
        cur.close(); conn.close()
        return resp(200, {'settings': settings})
    elif method == 'PUT':
        data = json.loads(event.get('body', '{}'))
        settings = data.get('settings', {})
        for key, value in settings.items():
            cur.execute(f'''
                INSERT INTO {SCHEMA}.site_settings (key, value, updated_at) VALUES (%s,%s,NOW())
                ON CONFLICT (key) DO UPDATE SET value=%s, updated_at=NOW()
            ''', (key, str(value) if value is not None else '', str(value) if value is not None else ''))
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Настройки сохранены'})
    return resp(405, {'error': 'Method not allowed'})


# ===== SERVICES =====
def handle_services(method, event, params):
    conn = get_conn(); cur = conn.cursor()
    if method == 'GET':
        admin = params.get('admin') == 'true'
        q = f"SELECT id,name,description,price,icon,is_active FROM {SCHEMA}.additional_services" + ("" if admin else " WHERE is_active=true") + " ORDER BY id"
        cur.execute(q)
        cols = [d[0] for d in cur.description]
        services = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return resp(200, {'services': services})
    elif method == 'POST':
        data = json.loads(event.get('body', '{}'))
        name = data.get('name','').strip()
        if not name:
            cur.close(); conn.close(); return resp(400, {'error': 'Название обязательно'})
        cur.execute(f'''
            INSERT INTO {SCHEMA}.additional_services (name, description, price, icon)
            VALUES (%s,%s,%s,%s) RETURNING id
        ''', (name, data.get('description',''), float(data.get('price',0)), data.get('icon','Star')))
        sid = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return resp(201, {'id': sid, 'message': 'Услуга добавлена'})
    elif method == 'PUT':
        data = json.loads(event.get('body', '{}'))
        cur.execute(f'''
            UPDATE {SCHEMA}.additional_services SET name=%s,description=%s,price=%s,icon=%s,is_active=%s WHERE id=%s
        ''', (data.get('name'), data.get('description',''), float(data.get('price',0)), data.get('icon','Star'), data.get('is_active',True), data.get('id')))
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Услуга обновлена'})
    elif method == 'DELETE':
        sid = params.get('id','0')
        cur.execute(f"DELETE FROM {SCHEMA}.additional_services WHERE id=%s", (int(sid),))
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Услуга удалена'})
    return resp(405, {'error': 'Method not allowed'})


# ===== NEWS =====
def handle_news(method, event, params):
    conn = get_conn(); cur = conn.cursor()
    if method == 'GET':
        news_id = params.get('id')
        admin = params.get('admin') == 'true'
        if news_id:
            cur.execute(f"SELECT id,title,content,image_url,is_published,published_at,created_at FROM {SCHEMA}.news WHERE id={int(news_id)}")
            row = cur.fetchone()
            if not row:
                cur.close(); conn.close(); return resp(404, {'error': 'Не найдено'})
            cols = ['id','title','content','image_url','is_published','published_at','created_at']
            cur.close(); conn.close()
            return resp(200, {'news': dict(zip(cols, row))})
        q = f"SELECT id,title,content,image_url,is_published,published_at,created_at FROM {SCHEMA}.news" + ("" if admin else " WHERE is_published=true") + " ORDER BY created_at DESC LIMIT 50"
        cur.execute(q)
        cols = [d[0] for d in cur.description]
        news = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return resp(200, {'news': news})
    elif method == 'POST':
        data = json.loads(event.get('body', '{}'))
        image_url = None
        # Поддержка обоих вариантов: image_base64 и image_b64
        img_b64 = data.get('image_base64') or data.get('image_b64')
        if img_b64:
            image_url = upload_s3(img_b64, f"news_{os.urandom(6).hex()}.jpg", 'news')
        cur.execute(f'''
            INSERT INTO {SCHEMA}.news (title,content,image_url,is_published,published_at)
            VALUES (%s,%s,%s,%s,CASE WHEN %s THEN NOW() ELSE NULL END) RETURNING id
        ''', (data.get('title'), data.get('content'), image_url, data.get('is_published',False), data.get('is_published',False)))
        nid = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return resp(201, {'id': nid, 'message': 'Новость создана'})
    elif method == 'PUT':
        data = json.loads(event.get('body', '{}'))
        image_url = data.get('image_url')
        img_b64 = data.get('image_base64') or data.get('image_b64')
        if img_b64:
            image_url = upload_s3(img_b64, f"news_{os.urandom(6).hex()}.jpg", 'news')
        cur.execute(f'''
            UPDATE {SCHEMA}.news SET title=%s,content=%s,is_published=%s,
            published_at=CASE WHEN %s AND published_at IS NULL THEN NOW() ELSE published_at END,
            image_url=COALESCE(%s,image_url), updated_at=NOW() WHERE id=%s
        ''', (data.get('title'), data.get('content'), data.get('is_published',False), data.get('is_published',False), image_url, data.get('id')))
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Новость обновлена'})
    elif method == 'DELETE':
        nid = params.get('id','0')
        cur.execute(f"DELETE FROM {SCHEMA}.news WHERE id=%s", (int(nid),))
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Новость удалена'})
    return resp(405, {'error': 'Method not allowed'})


# ===== REVIEWS =====
def handle_reviews(method, event, params):
    conn = get_conn(); cur = conn.cursor()
    if method == 'GET':
        admin = params.get('admin') == 'true'
        driver_id = params.get('driver_id')
        if driver_id:
            cur.execute(f"SELECT id,author_name,rating,text,created_at FROM {SCHEMA}.reviews WHERE driver_id={int(driver_id)} AND is_approved=true ORDER BY created_at DESC")
        elif admin:
            cur.execute(f"SELECT r.*,u.name as user_name,d.name as driver_name FROM {SCHEMA}.reviews r LEFT JOIN {SCHEMA}.users u ON r.user_id=u.id LEFT JOIN {SCHEMA}.drivers d ON r.driver_id=d.id ORDER BY r.created_at DESC")
        else:
            cur.execute(f"SELECT id,author_name,rating,text,type,source,yandex_url,created_at FROM {SCHEMA}.reviews WHERE is_approved=true ORDER BY created_at DESC LIMIT 50")
        cols = [d[0] for d in cur.description]
        reviews = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return resp(200, {'reviews': reviews})
    elif method == 'POST':
        data = json.loads(event.get('body', '{}'))
        text = data.get('text','').strip()
        rating = data.get('rating')
        if not text or not rating:
            cur.close(); conn.close(); return resp(400, {'error': 'Текст и оценка обязательны'})
        cur.execute(f'''
            INSERT INTO {SCHEMA}.reviews (user_id,driver_id,order_id,author_name,rating,text,type,source,yandex_url,status)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,'pending') RETURNING id
        ''', (data.get('user_id'), data.get('driver_id'), data.get('order_id'), data.get('author_name','Аноним'), int(rating), text, data.get('type','service'), data.get('source','site'), data.get('yandex_url')))
        rid = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return resp(201, {'id': rid, 'message': 'Отзыв отправлен на модерацию'})
    elif method == 'PUT':
        data = json.loads(event.get('body', '{}'))
        action = data.get('action','approve')
        rid = data.get('id')
        if action == 'approve':
            cur.execute(f"UPDATE {SCHEMA}.reviews SET is_approved=true,status='approved' WHERE id=%s", (int(rid),))
        elif action == 'reject':
            cur.execute(f"UPDATE {SCHEMA}.reviews SET is_approved=false,status='rejected' WHERE id=%s", (int(rid),))
        elif action == 'add_yandex':
            cur.execute(f'''
                INSERT INTO {SCHEMA}.reviews (author_name,rating,text,source,yandex_url,status,is_approved)
                VALUES (%s,%s,%s,'yandex',%s,'approved',true)
            ''', (data.get('author_name','Отзыв Яндекс'), int(data.get('rating',5)), data.get('text',''), data.get('yandex_url')))
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Готово'})
    elif method == 'DELETE':
        rid = params.get('id','0')
        cur.execute(f"DELETE FROM {SCHEMA}.reviews WHERE id=%s", (int(rid),))
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Отзыв удалён'})
    return resp(405, {'error': 'Method not allowed'})


# ===== TRANSFER TYPES =====
def handle_transfer_types(method, event, params):
    conn = get_conn(); cur = conn.cursor()
    if method == 'GET':
        active_only = params.get('active', 'false') == 'true'
        q = f"SELECT id,value,label,description,icon,is_active,sort_order FROM {SCHEMA}.transfer_types" + (" WHERE is_active=true" if active_only else "") + " ORDER BY sort_order,id"
        cur.execute(q)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return resp(200, {'transfer_types': rows})
    elif method == 'POST':
        data = json.loads(event.get('body', '{}'))
        cur.execute(f'''
            INSERT INTO {SCHEMA}.transfer_types (value,label,description,icon,is_active,sort_order)
            VALUES (%s,%s,%s,%s,%s,%s) RETURNING id
        ''', (data.get('value'), data.get('label'), data.get('description',''), data.get('icon','User'), data.get('is_active',True), data.get('sort_order',0)))
        tid = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return resp(201, {'id': tid, 'message': 'Тип создан'})
    elif method == 'PUT':
        data = json.loads(event.get('body', '{}'))
        cur.execute(f'''
            UPDATE {SCHEMA}.transfer_types SET label=%s,description=%s,icon=%s,is_active=%s,sort_order=%s WHERE id=%s
        ''', (data.get('label'), data.get('description',''), data.get('icon','User'), data.get('is_active',True), data.get('sort_order',0), data.get('id')))
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Тип обновлён'})
    elif method == 'DELETE':
        tid = params.get('id','0')
        cur.execute(f"DELETE FROM {SCHEMA}.transfer_types WHERE id=%s", (int(tid),))
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Тип удалён'})
    return resp(405, {'error': 'Method not allowed'})


# ===== CAR CLASSES =====
def handle_car_classes(method, event, params):
    conn = get_conn(); cur = conn.cursor()
    if method == 'GET':
        active_only = params.get('active', 'false') == 'true'
        q = f"SELECT id,value,label,description,icon,price_multiplier,is_active,sort_order FROM {SCHEMA}.car_classes" + (" WHERE is_active=true" if active_only else "") + " ORDER BY sort_order,id"
        cur.execute(q)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return resp(200, {'car_classes': rows})
    elif method == 'POST':
        data = json.loads(event.get('body', '{}'))
        cur.execute(f'''
            INSERT INTO {SCHEMA}.car_classes (value,label,description,icon,price_multiplier,is_active,sort_order)
            VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id
        ''', (data.get('value'), data.get('label'), data.get('description',''), data.get('icon','Car'), float(data.get('price_multiplier',1.0)), data.get('is_active',True), data.get('sort_order',0)))
        cid = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return resp(201, {'id': cid, 'message': 'Класс создан'})
    elif method == 'PUT':
        data = json.loads(event.get('body', '{}'))
        cur.execute(f'''
            UPDATE {SCHEMA}.car_classes SET label=%s,description=%s,icon=%s,price_multiplier=%s,is_active=%s,sort_order=%s WHERE id=%s
        ''', (data.get('label'), data.get('description',''), data.get('icon','Car'), float(data.get('price_multiplier',1.0)), data.get('is_active',True), data.get('sort_order',0), data.get('id')))
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Класс обновлён'})
    elif method == 'DELETE':
        cid = params.get('id','0')
        cur.execute(f"DELETE FROM {SCHEMA}.car_classes WHERE id=%s", (int(cid),))
        conn.commit(); cur.close(); conn.close()
        return resp(200, {'message': 'Класс удалён'})
    return resp(405, {'error': 'Method not allowed'})


def handler(event: dict, context) -> dict:
    '''Мультироутер: tariffs, settings, services, news, reviews, transfer_types, car_classes'''
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters', {}) or {}
    resource = params.get('resource', 'tariffs')

    try:
        if resource == 'settings':
            return handle_settings(method, event, params)
        elif resource == 'services':
            return handle_services(method, event, params)
        elif resource == 'news':
            return handle_news(method, event, params)
        elif resource == 'reviews':
            return handle_reviews(method, event, params)
        elif resource == 'transfer_types':
            return handle_transfer_types(method, event, params)
        elif resource == 'car_classes':
            return handle_car_classes(method, event, params)
        else:
            return handle_tariffs(method, event, params)
    except Exception as e:
        return resp(500, {'error': str(e)})
