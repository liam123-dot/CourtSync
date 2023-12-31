from flask import Blueprint, request, jsonify

from src.Database.ExecuteQuery import execute_query
import time

VerifyHashBlueprint = Blueprint('VerifyHash', __name__)

@VerifyHashBlueprint.route('/sales/verify-hash/<hash>', methods=['GET'])
def get_hash(hash):
    
    info = get_hash_from_db(hash)
    
    if not info:
        return jsonify({'error': 'Hash does not exist'}), 400
    
    if info['expiry'] < time.time():
        return jsonify({'error': 'Hash expired'}), 400
    
    if info['used']:
        return jsonify({'error': 'Code already used'}), 400
    
    user_info = get_user_details(info['email'])
    
    return jsonify(user_info), 200


def get_user_details(email):
    sql = "SELECT * FROM SalesRequests WHERE email = %s"
    
    result = execute_query(sql, (email,))[0]
    
    return result


def get_hash_from_db(hash):
    sql = "SELECT * FROM SignUpCodes WHERE hash = %s"
    
    result = execute_query(sql, (hash,))
    
    if len (result) == 0:
        return False
    
    return result[0]
