"""Создание платежа ЮKassa для существующего заказа трансфера."""
import json
import os
import re
import uuid
import base64
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError

import psycopg2

EMAIL_REGEX = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
MIN_AMOUNT = 1.00
MAX_AMOUNT = 1_000_000.00

YOOKASSA_API_URL = "https://api.yookassa.ru/v3/payments"

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Content-Type': 'application/json'
}


def get_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema():
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return f"{schema}." if schema else ""


def create_yookassa_payment(shop_id, secret_key, amount, description, return_url, customer_email, metadata=None):
    auth_string = f"{shop_id}:{secret_key}"
    auth_bytes = base64.b64encode(auth_string.encode()).decode()
    idempotence_key = str(uuid.uuid4())

    receipt_items = [{
        "description": description[:128],
        "quantity": "1.000",
        "amount": {"value": f"{amount:.2f}", "currency": "RUB"},
        "vat_code": 1,
        "payment_subject": "service",
        "payment_mode": "full_payment"
    }]

    payload = {
        "amount": {"value": f"{amount:.2f}", "currency": "RUB"},
        "capture": True,
        "confirmation": {"type": "redirect", "return_url": return_url},
        "description": description,
        "receipt": {"customer": {"email": customer_email}, "items": receipt_items}
    }
    if metadata:
        payload["metadata"] = metadata

    request = Request(
        YOOKASSA_API_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Basic {auth_bytes}',
            'Idempotence-Key': idempotence_key,
            'Content-Type': 'application/json'
        },
        method='POST'
    )

    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode())


def handler(event, context):
    """Создание платежа ЮKassa для заказа трансфера."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}

    body = event.get('body', '{}')
    if event.get('isBase64Encoded'):
        body = base64.b64decode(body).decode('utf-8')

    data = json.loads(body)

    order_id = data.get('order_id')
    return_url = data.get('return_url', '').strip()

    if not order_id:
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'order_id is required'})}

    if not return_url:
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'return_url is required'})}

    shop_id = os.environ.get('YOOKASSA_SHOP_ID', '')
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY', '')
    if not shop_id or not secret_key:
        return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': 'YooKassa credentials not configured'})}

    S = get_schema()
    conn = get_connection()

    try:
        cur = conn.cursor()

        cur.execute(f"""
            SELECT id, price, passenger_name, passenger_email, passenger_phone,
                   from_location, to_location, yookassa_payment_id
            FROM {S}orders WHERE id = %s
        """, (int(order_id),))
        row = cur.fetchone()

        if not row:
            return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'Order not found'})}

        oid, price, name, email, phone, from_loc, to_loc, existing_payment = row

        if existing_payment:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Payment already created', 'payment_id': existing_payment})}

        amount = float(price or 0)
        if amount < MIN_AMOUNT or amount > MAX_AMOUNT:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': f'Invalid amount: {amount}'})}

        customer_email = email or 'noreply@sochi-transfer.ru'
        description = f"Трансфер {from_loc} → {to_loc}"

        metadata = {"order_id": str(oid)}

        payment_response = create_yookassa_payment(
            shop_id=shop_id,
            secret_key=secret_key,
            amount=amount,
            description=description,
            return_url=return_url,
            customer_email=customer_email,
            metadata=metadata
        )

        payment_id = payment_response.get('id')
        confirmation_url = payment_response.get('confirmation', {}).get('confirmation_url', '')

        now = datetime.utcnow().isoformat()
        cur.execute(f"""
            UPDATE {S}orders
            SET yookassa_payment_id = %s, payment_url = %s, updated_at = %s
            WHERE id = %s
        """, (payment_id, confirmation_url, now, oid))
        conn.commit()

        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({
                'payment_url': confirmation_url,
                'payment_id': payment_id,
                'order_id': oid
            })
        }

    except HTTPError as e:
        error_body = e.read().decode() if hasattr(e, 'read') else str(e)
        return {'statusCode': 502, 'headers': HEADERS, 'body': json.dumps({'error': 'YooKassa API error', 'details': error_body})}
    except Exception as e:
        conn.rollback()
        return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': str(e)})}
    finally:
        conn.close()
