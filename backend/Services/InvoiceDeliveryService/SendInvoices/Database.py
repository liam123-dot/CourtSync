import os
import pymysql
import boto3
import json

class DBConfig:
    def __init__(self) -> None:
        secrets = self.get_secrets()
        self.DATABASE_HOST = secrets['host']
        self.DATABASE_USERNAME = secrets['username']
        self.DATABASE_PASSWORD = secrets['password']
        self.DATABASE = secrets['dbname']
        self.connection = self.get_db_connection()
        
    def get_secrets(self):
        session = boto3.session.Session()
        client = session.client(
            service_name='secretsmanager',
            region_name=os.environ['AWS_REGION']
        )
        get_secret_value_response = client.get_secret_value(
            SecretId=os.environ['DATABASE_SECRET_NAME']
        )
        return json.loads(get_secret_value_response['SecretString'])

    def get_db_connection(self):
        return pymysql.connect(
            host=self.DATABASE_HOST,
            user=self.DATABASE_USERNAME,
            password=self.DATABASE_PASSWORD,
            database=self.DATABASE,
            ssl_ca='/etc/pki/tls/certs/ca-bundle.crt',
            autocommit=True
        )