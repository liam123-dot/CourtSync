from flask import Blueprint, request, jsonify
import boto3
import os
import logging
from botocore.exceptions import ClientError
import time

from src.Database.ExecuteQuery import execute_query
from src.Sales.VerifyHash import get_hash_from_db

logging.basicConfig(level=logging.INFO)

from src.Users.Auth.CreateSlug import insert_into_table
from src.Users.Auth.AttributeVerification import is_phone_number_valid, is_email_valid
from src.Users.Auth.GetSecretHash import get_secret_hash

CoachSignUp = Blueprint('CoachSignUp', __name__)

client = boto3.client('cognito-idp')

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')

@CoachSignUp.route('/coach/sign-up', methods=['POST'])
def coach_sign_up():
    data = request.json
    try:
        user_data = extract_user_data(data)
        
        hash = get_hash_from_db(user_data['hash'])
        
        if not hash:
            return jsonify(message='Invalid hash'), 400
        
        if hash['expiry'] < time.time():
            return jsonify(message='Hash expired'), 400
        
        if hash['used']:
            return jsonify(message='Hash already used'), 400        
        
        validate_user_data(user_data)
        user_data['phone_number'] = format_phone_number(user_data['phone_number'])
        user_id = create_user(user_data)
        insert_into_table(user_id, user_data['first_name'], user_data['last_name'], user_data['email'], user_data['phone_number'])
        mark_code_used(user_data['hash'])
        return jsonify(message='Success'), 200
    except (KeyError, ValueError) as e:
        return jsonify(message=str(e)), 400
    except ClientError as e:
        
        error_code = e.response['Error']['Code']
        
        if error_code == 'UsernameExistsException':
            return jsonify(message='Email already exists'), 400
        elif error_code == 'InvalidPasswordException':
            return jsonify(message='Password not strong enough'), 400
        elif error_code == 'InvalidParameterException':
            return jsonify(message='Invalid email'), 400
        
    except Exception as e:
        logging.error(e)
        return jsonify(message='Internal Server Error', error=str(e)), 500

def extract_user_data(data):
    required_keys = ['first_name', 'last_name', 'email', 'phone_number', 'password', 'confirm_password', 'hash']
    return {key: data[key] for key in required_keys}

def validate_user_data(user_data):
    if len(user_data['first_name']) < 2 or len(user_data['last_name']) < 2:
        raise ValueError('First name and last name must be greater than 1 character')
    if user_data['password'] != user_data['confirm_password']:
        raise ValueError('Passwords do not match')
    if not is_phone_number_valid(user_data['phone_number']):
        raise ValueError('Invalid UK phone number')
    if not is_email_valid(user_data['email']):
        raise ValueError('Invalid Email')

def format_phone_number(phone_number):
    if phone_number.startswith('0'):
        return '+44' + phone_number[1:]
    return phone_number

def create_user(user_data):
    secret_hash = get_secret_hash(username=user_data['email'], client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
    attributes = [
        {'Name': 'email', 'Value': user_data['email']},
        {'Name': 'given_name', 'Value': user_data['first_name']},
        {'Name': 'family_name', 'Value': user_data['last_name']},
        {'Name': 'phone_number', 'Value': user_data['phone_number']}
    ]
    response = client.sign_up(
        ClientId=CLIENT_ID,
        SecretHash=secret_hash,
        Username=user_data['email'],
        Password=user_data['password'],
        UserAttributes=attributes
    )
    return response['UserSub']

# ----------------- Confirm Sign Up -----------------

def get_request_data():
    data = request.json
    try:
        email = data['email']
        confirmation_code = data['confirmation_code']
    except KeyError as e:
        raise ValueError(f"Invalid/Missing Key: {e}")
    return email, confirmation_code

def confirm_sign_up(email, confirmation_code):
    secret_hash = get_secret_hash(username=email, client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
    
    response = client.confirm_sign_up(
        ClientId=CLIENT_ID,
        SecretHash=secret_hash,
        Username=email,
        ConfirmationCode=confirmation_code
    )
    return response

@CoachSignUp.route('/coach/confirm', methods=['POST'])
def confirm_coach_sign_up():
    try:
        email, confirmation_code = get_request_data()
        response = confirm_sign_up(email, confirmation_code)
        mark_as_verified(email)
        return jsonify(response), 200
    except ValueError as e:
        return jsonify(message=str(e)), 400
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'CodeMismatchException':
            return jsonify(message='Incorrect Confirmation Code'), 400
        elif error_code == 'UserNotFoundException':
            return jsonify(message='User not found'), 400
        elif error_code == 'ExpiredCodeException':
            return jsonify(message='The verification code has expired, please check your inbox for a new one'), 400
    except Exception as e:
        return jsonify(message=f"Error: {str(e)}"), 500
    
def mark_as_verified(email):
    sql = "UPDATE Coaches SET email_verified=1 WHERE email=%s"
    execute_query(sql, (email,), is_get_query=False)
    
    
def mark_code_used(hash):
    sql = "UPDATE SignUpCodes SET used=1 WHERE hash=%s"
    execute_query(sql, (hash,), is_get_query=False)