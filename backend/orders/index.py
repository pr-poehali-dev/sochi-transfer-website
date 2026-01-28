import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для управления заявками на трансфер'''
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
            order_id = event.get('queryStringParameters', {}).get('id')
            
            if order_id:
                cur.execute('''
                    SELECT o.*, t.city, t.price as tariff_price, f.name as fleet_name, 
                           s.name as status_name, s.color as status_color
                    FROM orders o
                    LEFT JOIN tariffs t ON o.tariff_id = t.id
                    LEFT JOIN fleet f ON o.fleet_id = f.id
                    LEFT JOIN order_statuses s ON o.status_id = s.id
                    WHERE o.id = %s
                ''', (order_id,))
            else:
                cur.execute('''
                    SELECT o.id, o.from_location, o.to_location, o.pickup_datetime,
                           o.passenger_name, o.passenger_phone, o.price, o.created_at,
                           s.name as status_name, s.color as status_color,
                           t.city as tariff_city
                    FROM orders o
                    LEFT JOIN order_statuses s ON o.status_id = s.id
                    LEFT JOIN tariffs t ON o.tariff_id = t.id
                    ORDER BY o.created_at DESC
                ''')
            
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            orders = [dict(zip(columns, row)) for row in rows]
            
            for order in orders:
                if order.get('pickup_datetime'):
                    order['pickup_datetime'] = order['pickup_datetime'].isoformat()
                if order.get('created_at'):
                    order['created_at'] = order['created_at'].isoformat()
                if order.get('updated_at'):
                    order['updated_at'] = order['updated_at'].isoformat()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'orders': orders if not order_id else orders[0] if orders else None}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            data = json.loads(event.get('body', '{}'))
            
            cur.execute('''
                INSERT INTO orders (
                    from_location, to_location, pickup_datetime, flight_number,
                    passenger_name, passenger_phone, passenger_email,
                    passengers_count, luggage_count, tariff_id, fleet_id, 
                    status_id, price, notes
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            ''', (
                data.get('from_location'),
                data.get('to_location'),
                data.get('pickup_datetime'),
                data.get('flight_number'),
                data.get('passenger_name'),
                data.get('passenger_phone'),
                data.get('passenger_email'),
                data.get('passengers_count', 1),
                data.get('luggage_count', 0),
                data.get('tariff_id'),
                data.get('fleet_id'),
                data.get('status_id', 1),
                data.get('price'),
                data.get('notes')
            ))
            
            order_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': order_id, 'message': 'Заявка создана'}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            data = json.loads(event.get('body', '{}'))
            order_id = data.get('id')
            
            cur.execute('''
                UPDATE orders 
                SET status_id = %s, price = %s, notes = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            ''', (
                data.get('status_id'),
                data.get('price'),
                data.get('notes'),
                order_id
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Заявка обновлена'}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            order_id = event.get('queryStringParameters', {}).get('id')
            
            cur.execute('DELETE FROM orders WHERE id = %s', (order_id,))
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Заявка удалена'}),
                'isBase64Encoded': False
            }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
