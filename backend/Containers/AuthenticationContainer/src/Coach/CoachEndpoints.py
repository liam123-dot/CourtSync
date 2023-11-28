import os

import boto3
import time
from flask import Blueprint, request, jsonify
import logging
logging.basicConfig(level=logging.DEBUG)

from botocore.exceptions import ClientError

from src.Coach.GetSecretHash import get_secret_hash
from src.shared.ExecuteQuery import execute_query
from src.shared.CheckAuthorization import get_access_token_username

coach = Blueprint('main', __name__)

client = boto3.client('cognito-idp')

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')

# -------------- RESEND CONFIRMATION CODE -----------------------

def resend_confirmation_code(email):
    secret_hash = get_secret_hash(username=email, client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
    
    response = client.resend_confirmation_code(
        ClientId=CLIENT_ID,
        SecretHash=secret_hash,
        Username=email
    )
    return response

@coach.route('/auth/coach/confirm/resend', methods=['POST'])
def resend_coach_confirmation_code():
    
    data = request.json

    try:
        email = data['email']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing Key: {e}"), 400
    
    response = resend_confirmation_code(email)

    return jsonify(response), 200
    
   
# -------------- REFRESH TOKEN ----------------------- 

def refresh_tokens(coach_email, refresh_token):
    coach_id = get_coach_id(coach_email)
    
    if not coach_id:
        raise ValueError('Invalid Email')

    secret_hash = get_secret_hash(username=coach_id, client_id=CLIENT_ID, client_secret=CLIENT_SECRET)

    response = client.initiate_auth(
        AuthFlow='REFRESH_TOKEN',
        AuthParameters={
            'SECRET_HASH': secret_hash,
            'REFRESH_TOKEN': refresh_token
        },
        ClientId=CLIENT_ID,
    )
    return response

@coach.route('/coach/refresh', methods=['POST'])
def refresh_coach_tokens():
    data = request.json

    try:
        refresh_token = data['refreshToken']
        email = data['email']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing Key: {e}"), 400

    try:
        response = refresh_tokens(email, refresh_token)
        return jsonify(response), 200
    except ValueError as e:
        return jsonify(message=str(e)), 400
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NotAuthorizedException':
            return jsonify(message='Invalid Refresh Token'), 400
        
        return jsonify(message='Error refreshing tokens', error=str(e)), 500
        
    except Exception as e:
        return jsonify(message=f"Error: {e}"), 500

def get_coach_id(coach_email):
    sql = "SELECT coach_id FROM Coaches WHERE email=%s"
    response = execute_query(sql, (coach_email, ))

    try:
        coach_id = response[0][0]
        return coach_id
    except Exception as e:
        return None
    
# ---------- GET COACH SLUG ----------------

@coach.route('/auth/coach/slug', methods=['GET'])
def get_coach_slug():
    
    token = request.headers.get('Authorization', None)

    if token:
        valid, username = get_access_token_username(token)
    else:
        valid = False

    if valid:

        sql = "SELECT slug FROM Coaches WHERE coach_id=%s"
        results = execute_query(sql, (username, ))

        return jsonify(slug=results[0][0]), 200


    else:
        return jsonify(message='Unauthorized'), 400


