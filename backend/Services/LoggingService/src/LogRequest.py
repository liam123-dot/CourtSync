import pymysql
import boto3
import json
import os

# Initialize AWS clients
secrets_client = boto3.client('secretsmanager')
s3_client = boto3.client('s3')
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
    connection = get_db_connection()
    
    for record in event['Records']:
        payload = json.loads(record["body"])
        request = payload['request']
        response = payload['response']
        
        method = request['method']
        path = request['full_path'].split('?')[0]
        status_code = response['status_code']
        duration = payload['duration']
    
        if method == 'OPTIONS':
            return {'statusCode': 200}

        with connection.cursor() as cursor:
            # Insert log entry into the database
            sql = "INSERT INTO Logs(method, endpoint, status_code, duration) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (method, path, status_code, duration))
            inserted_id = cursor.lastrowid  # Get the ID of the inserted row
            connection.commit()
                        
            payload['request']['data'] = json.loads(payload['request']['data'])
            payload['response']['data'] = json.loads(payload['response']['data'])
            
            if 'Authorization' in payload['request']['headers']:
                token = payload['request']['headers']['Authorization']
                try:
                    response = cognito_client.get_user(AccessToken=token)
                    user_id = response['Username']
                    
                    payload['request']['Requester'] = {
                        'type': 'User',
                        'id': user_id
                    }
                    
                except cognito_client.exceptions.NotAuthorizedException:
                    payload['request']['Requester'] = {
                        'type': 'Unauthorized',
                        'id': 'Unauthorized'
                    }
            else:
                payload['request']['Requester'] = {
                    'type': 'Anonymous',
                    'id': 'Anonymous'
                }
                    
            
            # Upload the request and response to S3
            s3_key = f'{inserted_id}.json'
            s3_client.put_object(Bucket=S3_BUCKET, Key=s3_key, Body=json.dumps(payload))
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Log processed', 'insertedId': inserted_id})
    }
