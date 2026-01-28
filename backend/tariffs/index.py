import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    '''API для управления тарифами трансфера'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        if method == 'GET':
            active_only = event.get('queryStringParameters', {}).get('active', 'false') == 'true'
            
            if active_only:
                cur.execute('SELECT * FROM tariffs WHERE is_active = true ORDER BY city')
            else:
                cur.execute('SELECT * FROM tariffs ORDER BY city')
            
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            tariffs = [dict(zip(columns, row)) for row in rows]
            
            for tariff in tariffs:
                if tariff.get('created_at'):
                    tariff['created_at'] = tariff['created_at'].isoformat()
                if tariff.get('updated_at'):
                    tariff['updated_at'] = tariff['updated_at'].isoformat()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'tariffs': tariffs}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            data = json.loads(event.get('body', '{}'))
            
            cur.execute('''
                INSERT INTO tariffs (city, price, distance, duration, image_emoji, is_active)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            ''', (
                data.get('city'),
                data.get('price'),
                data.get('distance'),
                data.get('duration'),
                data.get('image_emoji', '🚗'),
                data.get('is_active', True)
            ))
            
            tariff_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': tariff_id, 'message': 'Тариф создан'}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            data = json.loads(event.get('body', '{}'))
            tariff_id = data.get('id')
            
            cur.execute('''
                UPDATE tariffs 
                SET city = %s, price = %s, distance = %s, duration = %s, 
                    image_emoji = %s, is_active = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            ''', (
                data.get('city'),
                data.get('price'),
                data.get('distance'),
                data.get('duration'),
                data.get('image_emoji'),
                data.get('is_active'),
                tariff_id
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Тариф обновлен'}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            tariff_id = event.get('queryStringParameters', {}).get('id')
            
            cur.execute('DELETE FROM tariffs WHERE id = %s', (tariff_id,))
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Тариф удален'}),
                'isBase64Encoded': False
            }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
