from flask import request, jsonify, Blueprint
from src.shared.CheckAuthorization import get_access_token_username
from src.shared.ExecuteQuery import execute_query

UserGetSelfBlueprint = Blueprint('UserGetSelfBlueprint', __name__)

@UserGetSelfBlueprint.route('/user/me', methods=['GET'])
def get_self():
    
    token = request.headers.get('Authorization', None)
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400
    
    valid, username = get_access_token_username(token)
    
    if not valid:
        return jsonify({'error': 'Invalid token'}), 400
    
    return jsonify(get_attributes(username))

def get_attributes(coach_id):
    sql =  "SELECT * FROM Coaches WHERE coach_id = %s"    
        
    results = execute_query(sql, (coach_id,))
    
    if len(results) == 0:
        return None
    
    results = results[0]
    
    coach = {
        'coach_id': results[0],
        'name': results[1],
        'phone_number': results[2],
        'email': results[3],
        'slug': results[4],
        'profile_picture_url': results[5],
        'profile_picture_url_expiry': results[6],
        'public_profile_picture': results[7],
        'show_email_publicly': results[8],
        'show_phone_number_publicly': results[9],
        'invoices_initialised': results[10],
        'invoice_type': results[11],
        'stripe_account': results[12]
    }

    return coach