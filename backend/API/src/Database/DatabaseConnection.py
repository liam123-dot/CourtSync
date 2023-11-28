import os
import pymysql
from dotenv import load_dotenv

load_dotenv('.env.testing')

class DatabaseConnection():
    
    def __init__(self):
        self.DATABASE_HOST = os.environ.get('DATABASE_HOST')
        self.DATABASE_USERNAME = os.environ.get('DATABASE_USERNAME')
        self.DATABASE_PASSWORD = os.environ.get('DATABASE_PASSWORD')
        self.DATABASE = os.environ.get('DATABASE')
        self.connection = self.get_db_connection()
        
    def get_db_connection(self):

        return pymysql.connect(
            host=self.DATABASE_HOST,
            user=self.DATABASE_USERNAME,
            password=self.DATABASE_PASSWORD,
            database=self.DATABASE,
            ssl_ca='src/Database/cert.pem',
            autocommit=True
        )
        
