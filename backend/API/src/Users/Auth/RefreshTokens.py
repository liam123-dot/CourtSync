import boto3
import os

from botocore.exceptions import ClientError
from flask import Blueprint, request, jsonify, current_app

from src.Users.Auth.GetSecretHash import get_secret_hash

client = boto3.client('cognito-idp')

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')

RefreshTokensBlueprint = Blueprint('RefreshTokens', __name__)

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

@RefreshTokensBlueprint.route('/coach/refresh', methods=['POST'])
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
    connection = current_app.config['db_connection'].connection
    sql = "SELECT coach_id FROM Coaches WHERE email=%s"
    with connection.cursor() as cursor:
        cursor.execute(sql, (coach_email, ))
        response = cursor.fetchone()

    try:
        coach_id = response[0]
        return coach_id
    except Exception as e:
        return None
