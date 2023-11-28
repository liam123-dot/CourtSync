from flask import request, jsonify, Blueprint

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach

import boto3
import logging

logging.basicConfig(level=logging.DEBUG)

client = boto3.client('cognito-idp')

UserEditSelfBlueprint = Blueprint('UserEditSelfBlueprint', __name__)

@UserEditSelfBlueprint.route('/user/me', methods=['PUT'])
def edit_self():
    
    token = request.headers.get('Authorization', None)
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400
    
    body = request.json
    
    if not body:
        return jsonify({'error': 'No body provided'}), 400
    
    valid, message = edit_self_from_json(coach, body, token)
    
    if not valid:
        return jsonify({'error': 'Invalid attribute: ' + message}), 400
    
    return jsonify({'success': True}), 200

editable_attributes = ['bio', 'slug', 'show_email_publicly', 'invoice_type', 'bio', 'booking_scope']
boto3_attributes = ['name', 'first_name', 'last_name', 'phone_number']

@UserEditSelfBlueprint.route('/user/me/<attribute>', methods=['PUT'])
def edit_self_attribute(attribute):
    token = request.headers.get('Authorization', None)
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400
    
    if attribute not in editable_attributes and attribute not in boto3_attributes:
        return jsonify({'error': 'Invalid attribute'}), 400
    
    body = request.json
    
    if not body:
        return jsonify({'error': 'No body provided'}), 400
    
    value = body['value']
    
    edit_self_from_json(coach, {attribute: value}, token)
    
    return jsonify(success= True), 200
        

def edit_self_from_json(coach, data, token):
    
    boto3_editable = {}
    
    for key in data.keys():
        if key not in editable_attributes and key not in boto3_attributes:
            return False, key
        
        if key in boto3_attributes:
            boto3_editable[key] = data[key]
            
    try:

        valid, message = make_boto3_edit(boto3_editable, token)
        
        if not valid:
            return False, message

        # construct an update sql query using provided attributes
        
        sql = "UPDATE Coaches SET "
        for key in data.keys():
            sql += key + "=%s, "
        sql = sql[:-2]
        sql += " WHERE coach_id=%s"
        
        execute_query(sql, tuple(data.values()) + (coach['coach_id'],), is_get_query=False) 
    
        return True, None
    
    except Exception as e:
        logging.debug(e)
        return False, 'error'

def make_boto3_edit(data, access_token):
    
    user_attributes = []
    
    for key, value in data.items():
        if key == 'name':
            user_attributes.append({'Name': 'given_name', 'Value': value.split(' ')[0]})
            user_attributes.append({'Name': 'family_name', 'Value': value.split(' ')[1]})
        elif key == 'first_name':
            user_attributes.append({'Name': 'given_name', 'Value': value})
        elif key == 'last_name':
            user_attributes.append({'Name': 'family_name', 'Value': value})
        elif key == 'phone_number':
            phone_number = format_phone_number(value)
            if phone_number:
                user_attributes.append({'Name': 'phone_number', 'Value': phone_number})
            else:
                return False, 'Invalid phone number'
        else:
            user_attributes.append({'Name': key, 'Value': value})
            
    response = client.update_user_attributes(
        UserAttributes=user_attributes,
        AccessToken=access_token
    )
    
    logging.debug(response)
    
    return True, None
    
def format_phone_number(phone_number):
    # Remove all non-digit characters
    digits_only = ''.join(filter(str.isdigit, phone_number))

    # Check if the phone number is 11 digits long
    if len(digits_only) == 11:
        return '+44' + digits_only[1:]

    # Check if the phone number is 13 digits long and starts with '+44'
    elif len(digits_only) == 13 and phone_number.startswith('+44'):
        return phone_number

    else:
        return None