import os

import boto3
from flask import Blueprint, request, jsonify

from src.utils.GetSecretHash import get_secret_hash
from src.Coach.AttributeVerification import is_password_valid, is_phone_number_valid, is_email_valid
from src.Coach.CreateSlug import insert_into_table
from src.utils.ExecuteQuery import execute_query

coach = Blueprint('main', __name__)

client = boto3.client('cognito-idp')

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')

@coach.route('/auth/coach', methods=['POST'])
def coach_sign_up():
    
    data = request.json
    
    try:
        first_name = data['first_name']
        last_name = data['last_name']
        email = data['email']
        phone_number = data['phone_number']
        password = data['password']
        confirm_password = data['confirm_password']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing Key: {e}"), 400

    # -------------- attribute verification -----------------------
    if len(first_name) < 2 or len(last_name) < 2:
        return jsonify(message='First name and last name must be greater than 1 character'), 400

    if password != confirm_password:
        return jsonify(message='Passwords do not match'), 400

    if not is_password_valid(password):
        return jsonify(message='Password not strong enough'), 400

    if not is_phone_number_valid(phone_number):
        return jsonify(message='Invalid UK phone number'), 400

    if phone_number.startswith('0'):
        phone_number = '+44' + phone_number[1:]

    if not is_email_valid(email):
        return jsonify(message='Invalid Email'), 400

    secret_hash = get_secret_hash(username=email, client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
    attributes = [
        {'Name': 'email', 'Value': email},
        {'Name': 'given_name', 'Value': first_name},
        {'Name': 'family_name', 'Value': last_name},
        {'Name': 'phone_number', 'Value': phone_number}
    ]
    try:
        response = client.sign_up(
            ClientId=CLIENT_ID,
            SecretHash=secret_hash,
            Username=email,
            Password=password,
            UserAttributes=attributes
        )

        user_id = response['UserSub']
        insert_into_table(user_id, first_name, last_name, email)
        return jsonify(message='Success'), 200

    except client.exceptions.UsernameExistsException:
        return jsonify(message='User with provided email already exists'), 400
    except client.exceptions.InvalidPasswordException:
        return jsonify(message='Password does not satisfy strength restraints'), 400
    except client.exceptions.TooManyRequestsException:
        return jsonify(message='Please try again later'), 400
    except Exception as e:    
        return jsonify(message='Internal Server Error', error=str(e)), 500
    

@coach.route('/auth/coach/confirm', methods=['POST'])
def confirm_coach_sign_up():

    data = request.json

    try:
        email = data['email']
        confirmation_code = data['confirmation_code']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing Key: {e}")
    
    secret_hash = get_secret_hash(username=email, client_id=CLIENT_ID, client_secret=CLIENT_SECRET)

    try:
        response = client.confirm_sign_up(
            ClientId=CLIENT_ID,
            SecretHash=secret_hash,
            Username=email,
            ConfirmationCode=confirmation_code
        )
        return jsonify(response), 200
    except client.exceptions.CodeMismatchException:
        return jsonify(message='Incorrect Confirmation Code'), 400
    except client.exceptions.UserNotFoundException:
        return jsonify(message='User not found'), 400
    except Exception as e:
        return jsonify(message=f"Error: {str(e)}"), 500


@coach.route('/auth/coach/sign-in', methods=['POST'])
def coach_sign_in():

    data = request.json

    try:
        username = data['username']
        password = data['password']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing Key: {e}"), 400

    secret_hash = get_secret_hash(username=username, client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
    
    try:
        response = client.initiate_auth(
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': username,
                'PASSWORD': password,
                'SECRET_HASH': secret_hash
            },
            ClientId=CLIENT_ID
        )
        return jsonify(response), 200
    except client.exceptions.NotAuthorizedException:
        return jsonify(message='Incorrect Password'), 400
    except client.exceptions.UserNotFoundException:
        return jsonify(message='User Not Found'), 400

    except Exception as e:
        return jsonify(message=f"Error: {e}"), 500

import logging
logging.basicConfig(level=logging.DEBUG)

@coach.route('/auth/coach/refresh', methods=['POST'])
def refresh_coach_tokens():

    data = request.json

    try:
        refresh_token = data['refreshToken']
        email = data['email']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing Key: {e}")
    
    coach_id = get_coach_id(email)
    
    if not coach_id:
        return jsonify(message='Invalid Email'), 400

    secret_hash = get_secret_hash(username=coach_id, client_id=CLIENT_ID, client_secret=CLIENT_SECRET)

    try:
        response = client.initiate_auth(
            AuthFlow='REFRESH_TOKEN',
            AuthParameters={
                'SECRET_HASH': secret_hash,
                'REFRESH_TOKEN': refresh_token
            },
            ClientId=CLIENT_ID,
        )
        return jsonify(response), 200
    except client.exceptions.NotAuthorizedException as e:
        return jsonify(message='Invalid Refresh Token', error=str(e)), 400
    except Exception as e:
        return jsonify(message=f"Error: {e}"), 500
    

def get_coach_id(coach_email):
    sql = "SELECT coach_id FROM Coaches WHERE username=%s"
    response = execute_query(sql, (coach_email, ))

    try:
        coach_id = response[0][0]
        return coach_id
    except Exception as e:
        return None
                 

