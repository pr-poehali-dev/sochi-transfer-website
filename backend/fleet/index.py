import json
import os
import base64
import boto3
import psycopg2

SCHEMA = 't_p8223105_sochi_transfer_websi'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, X-User-Id',
}

def resp(status, body):
    return {'statusCode': status, 'headers': {'Content-Type': 'application/json', **CORS},
            'body': json.dumps(body, default=str), 'isBase64Encoded': False}

def get_conn():
    return psycopg2.connect(os.environ.get('DATABASE_URL'))

def handler(event: dict, context) -> dict:
    '''API для управления автопарком'''
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters', {}) or {}

    try:
        conn = get_conn()
        cur = conn.cursor()

        if method == 'GET':
            active_only = params.get('active', 'false') == 'true'
            q = f"SELECT * FROM {SCHEMA}.fleet" + (" WHERE is_active=true" if active_only else "") + " ORDER BY id"
            cur.execute(q)
            cols = [d[0] for d in cur.description]
            fleet = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.close(); conn.close()
            return resp(200, {'fleet': fleet})

        elif method == 'POST':
            data = json.loads(event.get('body', '{}'))

            if data.get('action') == 'upload_photo':
                cur.close(); conn.close()
                try:
                    s3 = boto3.client('s3',
                        endpoint_url='https://bucket.poehali.dev',
                        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
                    )
                    import uuid
                    ext = data.get('filename', 'photo.jpg').rsplit('.', 1)[-1].lower()
                    key = f'fleet/{uuid.uuid4()}.{ext}'
                    img_data = base64.b64decode(data.get('data', ''))
                    s3.put_object(Bucket='files', Key=key, Body=img_data, ContentType=data.get('content_type', 'image/jpeg'))
                    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
                    return resp(200, {'url': cdn_url})
                except Exception as e:
                    return resp(500, {'error': str(e)})

            cur.execute(f'''
                INSERT INTO {SCHEMA}.fleet (name, type, capacity, luggage_capacity, features,
                                 image_url, image_emoji, is_active)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
            ''', (
                data.get('name'), data.get('type'), data.get('capacity'),
                data.get('luggage_capacity'), data.get('features', []),
                data.get('image_url'), data.get('image_emoji', '🚗'),
                data.get('is_active', True)
            ))
            fleet_id = cur.fetchone()[0]
            conn.commit(); cur.close(); conn.close()
            return resp(201, {'id': fleet_id, 'message': 'Автомобиль добавлен'})

        elif method == 'PUT':
            data = json.loads(event.get('body', '{}'))
            cur.execute(f'''
                UPDATE {SCHEMA}.fleet
                SET name=%s, type=%s, capacity=%s, luggage_capacity=%s,
                    features=%s, image_url=%s, image_emoji=%s, is_active=%s,
                    updated_at=CURRENT_TIMESTAMP
                WHERE id=%s
            ''', (
                data.get('name'), data.get('type'), data.get('capacity'),
                data.get('luggage_capacity'), data.get('features'),
                data.get('image_url'), data.get('image_emoji'),
                data.get('is_active'), data.get('id')
            ))
            conn.commit(); cur.close(); conn.close()
            return resp(200, {'message': 'Автомобиль обновлён'})

        elif method == 'DELETE':
            fid = params.get('id', '0')
            cur.execute(f"DELETE FROM {SCHEMA}.fleet WHERE id=%s", (int(fid),))
            conn.commit(); cur.close(); conn.close()
            return resp(200, {'message': 'Автомобиль удалён'})

        cur.close(); conn.close()
        return resp(405, {'error': 'Method not allowed'})

    except Exception as e:
        return resp(500, {'error': str(e)})
