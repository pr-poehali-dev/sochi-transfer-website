"""Обработка уведомлений (webhook) от ЮKassa для заказов трансфера."""
import json
import os
import base64
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError

import psycopg2

HEADERS = {'Content-Type': 'application/json'}
YOOKASSA_API_URL = "https://api.yookassa.ru/v3/payments"


def verify_payment_via_api(payment_id, shop_id, secret_key):
    auth_string = f"{shop_id}:{secret_key}"
    auth_bytes = base64.b64encode(auth_string.encode()).decode()
    request = Request(
        f"{YOOKASSA_API_URL}/{payment_id}",
        headers={'Authorization': f'Basic {auth_bytes}', 'Content-Type': 'application/json'},
        method='GET'
    )
    try:
        with urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode())
    except (HTTPError, Exception):
        return None


def get_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema():
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return f"{schema}." if schema else ""


def handler(event, context):
    """Обработка webhook от ЮKassa — обновление статуса заказа трансфера."""
    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}

    body = event.get('body', '{}')
    if event.get('isBase64Encoded'):
        body = base64.b64decode(body).decode('utf-8')

    data = json.loads(body)

    payment_object = data.get('object', {})
    payment_id = payment_object.get('id', '')
    metadata = payment_object.get('metadata', {})

    if not payment_id:
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Missing payment id'})}

    shop_id = os.environ.get('YOOKASSA_SHOP_ID', '')
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY', '')

    if shop_id and secret_key:
        verified = verify_payment_via_api(payment_id, shop_id, secret_key)
        if not verified:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Payment verification failed'})}
        payment_status = verified.get('status', '')
    else:
        payment_status = payment_object.get('status', '')

    S = get_schema()
    conn = get_connection()

    try:
        cur = conn.cursor()
        now = datetime.utcnow().isoformat()

        cur.execute(f"SELECT id, status_id FROM {S}orders WHERE yookassa_payment_id = %s", (payment_id,))
        row = cur.fetchone()

        if not row:
            order_id_meta = metadata.get('order_id')
            if order_id_meta:
                cur.execute(f"SELECT id, status_id FROM {S}orders WHERE id = %s", (int(order_id_meta),))
                row = cur.fetchone()

        if not row:
            return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'Order not found'})}

        order_id, current_status_id = row

        if payment_status == 'succeeded':
            cur.execute(f"""
                UPDATE {S}orders
                SET status_id = 2, paid_at = %s, updated_at = %s
                WHERE id = %s AND status_id = 1
            """, (now, now, order_id))
            conn.commit()

        elif payment_status == 'canceled':
            cur.execute(f"""
                UPDATE {S}orders
                SET status_id = 5, updated_at = %s
                WHERE id = %s AND status_id = 1
            """, (now, order_id))
            conn.commit()

        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'status': 'ok'})}

    except Exception:
        conn.rollback()
        return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': 'Internal error'})}
    finally:
        conn.close()
