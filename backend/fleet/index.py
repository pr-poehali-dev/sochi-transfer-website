import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    '''API для управления автопарком'''
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
                cur.execute('SELECT * FROM fleet WHERE is_active = true ORDER BY name')
            else:
                cur.execute('SELECT * FROM fleet ORDER BY name')
            
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            fleet = [dict(zip(columns, row)) for row in rows]
            
            for car in fleet:
                if car.get('created_at'):
                    car['created_at'] = car['created_at'].isoformat()
                if car.get('updated_at'):
                    car['updated_at'] = car['updated_at'].isoformat()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'fleet': fleet}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            data = json.loads(event.get('body', '{}'))
            
            cur.execute('''
                INSERT INTO fleet (name, type, capacity, luggage_capacity, features, 
                                 image_url, image_emoji, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            ''', (
                data.get('name'),
                data.get('type'),
                data.get('capacity'),
                data.get('luggage_capacity'),
                data.get('features', []),
                data.get('image_url'),
                data.get('image_emoji', '🚗'),
                data.get('is_active', True)
            ))
            
            fleet_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': fleet_id, 'message': 'Автомобиль добавлен'}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            data = json.loads(event.get('body', '{}'))
            fleet_id = data.get('id')
            
            cur.execute('''
                UPDATE fleet 
                SET name = %s, type = %s, capacity = %s, luggage_capacity = %s,
                    features = %s, image_url = %s, image_emoji = %s, is_active = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            ''', (
                data.get('name'),
                data.get('type'),
                data.get('capacity'),
                data.get('luggage_capacity'),
                data.get('features'),
                data.get('image_url'),
                data.get('image_emoji'),
                data.get('is_active'),
                fleet_id
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Автомобиль обновлен'}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            fleet_id = event.get('queryStringParameters', {}).get('id')
            
            cur.execute('DELETE FROM fleet WHERE id = %s', (fleet_id,))
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Автомобиль удален'}),
                'isBase64Encoded': False
            }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
