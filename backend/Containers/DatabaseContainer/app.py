import json

from flask import Flask, request, jsonify
import pymysql
from pymysql import MySQLError
import queue

import logging

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)

# In-memory data structures for simplicity
queries = {}
results = {}
execution_times = {}
query_queue = queue.Queue()  # Queue to hold queries

import os

# Remove the while loop asking for input
env_choice = os.environ.get('ENV_CHOICE', 'backend-sync').lower()

if env_choice == 'backend-sync':
    env_file = 'env_testing.json'
elif env_choice == 'backend-test':
    env_file = 'env_staging.json'
elif env_choice == 'backend-prod':
    env_file = 'env_production.json'
else:
    raise ValueError(f"Invalid environment choice: {env_choice}")

with open(env_file, "r") as reader:
    data = json.loads(reader.read())
    DATABASE_HOST = data['DATABASE_HOST']
    DATABASE_USERNAME = data['DATABASE_USERNAME']
    DATABASE_PASSWORD = data['DATABASE_PASSWORD']
    DATABASE = data['DATABASE']


def get_db_connection():
    return pymysql.connect(
        host=DATABASE_HOST,
        user=DATABASE_USERNAME,
        password=DATABASE_PASSWORD,
        database=DATABASE,
        ssl_ca='cert.pem',
        autocommit=True
    )

def convert_bit_to_bool(row, cursor):
    """Converts bit fields in a row to boolean."""
    new_row = list(row)
    for idx, desc in enumerate(cursor.description):
        if desc[1] == pymysql.constants.FIELD_TYPE.BIT:
            new_row[idx] = row[idx] == b'\x01'
    return tuple(new_row)

connection = get_db_connection()

def execute_query(query, args=None, retry=False):
    global connection
    logging.debug(f"Received query: {query}, with args: {args}")

    try:
        with connection.cursor() as cursor:
            cursor.execute(query, args)
            # Convert the bits to boolean in the response
            response = [convert_bit_to_bool(row, cursor) for row in cursor.fetchall()]
            logging.debug(f"Response: {response}")
            return True, response
    except MySQLError as e:
        if not retry:
            connection = get_db_connection()
            return execute_query(query, args, True)
        logging.debug(f"Error: {e}")
        return False, str(e)



@app.route('/query', methods=['POST'])
def perform_query():
    query = request.json.get('query', None)
    if not query:
        return jsonify(message="No query provided", provided=request.json), 400

    # args do not have to be passed. When passed they have to be a tuple
    args = request.json.get('args', None)
    if args is not None and type(args) != tuple and type(args) != list:
        return jsonify(message="args must be passed as a tuple or a list"), 400

    success, response = execute_query(query, args)

    if success:
        return jsonify(response=response), 200
    return jsonify(message=response, attempted_query=query, args=args), 400


if __name__ == '__main__':
    app.run()
