import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    '''API для управления статусами заявок'''
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
            cur.execute('SELECT * FROM order_statuses ORDER BY id')
            
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            statuses = [dict(zip(columns, row)) for row in rows]
            
            for status in statuses:
                if status.get('created_at'):
                    status['created_at'] = status['created_at'].isoformat()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'statuses': statuses}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            data = json.loads(event.get('body', '{}'))
            
            cur.execute('''
                INSERT INTO order_statuses (name, color)
                VALUES (%s, %s)
                RETURNING id
            ''', (
                data.get('name'),
                data.get('color', '#8B5CF6')
            ))
            
            status_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': status_id, 'message': 'Статус создан'}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            data = json.loads(event.get('body', '{}'))
            status_id = data.get('id')
            
            cur.execute('''
                UPDATE order_statuses 
                SET name = %s, color = %s
                WHERE id = %s
            ''', (
                data.get('name'),
                data.get('color'),
                status_id
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Статус обновлен'}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            status_id = event.get('queryStringParameters', {}).get('id')
            
            cur.execute('DELETE FROM order_statuses WHERE id = %s', (status_id,))
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Статус удален'}),
                'isBase64Encoded': False
            }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
