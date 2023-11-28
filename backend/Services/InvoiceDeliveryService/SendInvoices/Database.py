import os
import pymysql

class DBConfig:
    def __init__(self) -> None:
        self.DATABASE_HOST = os.environ['DATABASE_HOST']
        self.DATABASE_USERNAME = os.environ['DATABASE_USERNAME']
        self.DATABASE_PASSWORD = os.environ['DATABASE_PASSWORD']
        self.DATABASE = os.environ['DATABASE']
        self.connection = self.get_db_connection()
        
    def get_db_connection(self):

        return pymysql.connect(
            host=self.DATABASE_HOST,
            user=self.DATABASE_USERNAME,
            password=self.DATABASE_PASSWORD,
            database=self.DATABASE,
            ssl_ca='/etc/pki/tls/certs/ca-bundle.crt',
            autocommit=True
        )
