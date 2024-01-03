import pymysql
import boto3
import time
import json
import os

# Initialize AWS clients
secrets_client = boto3.client('secretsmanager')
cognito_client = boto3.client('cognito-idp')

# Fetch database credentials and S3 bucket name from AWS Secrets Manager
secret_name = os.environ['SECRET_NAME']
response = secrets_client.get_secret_value(SecretId=secret_name)
secret_string = json.loads(response['SecretString'])

S3_BUCKET = secret_string['LOGGING_BUCKET']

# Database connection parameters
DB_NAME = secret_string['DATABASE']
DATABASE_HOST = secret_string['DATABASE_HOST']
DATABASE_USERNAME = secret_string['DATABASE_USERNAME']
DATABASE_PASSWORD = secret_string['DATABASE_PASSWORD']

USER_POOL_ID = secret_string['USER_POOL_ID']
CLIENT_ID = secret_string['CLIENT_ID']
CLIENT_SECRET = secret_string['CLIENT_SECRET']

def get_db_connection():
    return pymysql.connect(
        host=DATABASE_HOST,
        user=DATABASE_USERNAME,
        password=DATABASE_PASSWORD,
        database=DB_NAME,
        ssl_ca='/etc/pki/tls/certs/ca-bundle.crt',
        autocommit=True
    )

def lambda_handler(event, context):
    print(event)
    connection = get_db_connection()
    
    for record in event['Records']:
        payload = json.loads(record["body"])                
        
        method = payload['method']
        path = payload['path']
        status_code = payload['status_code']
        duration = payload['duration']
        authorization = payload['authorization']
        requst_time = payload['request_time']
        log_id = payload['log_id']
    
        if method == 'OPTIONS':
            return {'statusCode': 200}

        with connection.cursor() as cursor:
            # Insert log entry into the database
                        
            if authorization is None:
                requester = {
                    'type': 'Anonymous',
                    'id': 'Anonymous'
                }
            else:
                requester = get_user(cursor, authorization)
            log_id = payload['log_id']
            
            if requester['type'] == 'Coach':
                                    
                sql = "INSERT INTO Logs(method, endpoint, status_code, duration, type, coach_id, request_time, log_id) VALUES (%s, %s, %s, %s, 'Coach', %s, %s, %s)"
                cursor.execute(sql, (method, path, status_code, duration, requester['id'], requst_time, log_id))
                inserted_id = cursor.lastrowid  # Get the ID of the inserted row
                connection.commit()
                
            else:
                
                sql = "INSERT INTO Logs(method, endpoint, status_code, duration, type, request_time, log_id) VALUES (%s, %s, %s, %s, 'Anonymous', %s, %s)"
                cursor.execute(sql, (method, path, status_code, duration, requst_time, log_id))
                inserted_id = cursor.lastrowid
                                    
        connection.commit()
        connection.close()
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Log processed', 'insertedId': inserted_id})
    }


def get_user(cursor, token):
    try:
        response = cognito_client.get_user(AccessToken=token)
        user_id = response['Username']
        
        sql = "SELECT name, email FROM Coaches WHERE coach_id = %s"
        
        cursor.execute(sql, (user_id))
        
        result = cursor.fetchone()
        
        return {
            'type': 'Coach',
            'id': user_id
        }
        
    except cognito_client.exceptions.NotAuthorizedException:
        return {
            'type': 'Anonymous',
            'id': 'Anonymous'
        }
