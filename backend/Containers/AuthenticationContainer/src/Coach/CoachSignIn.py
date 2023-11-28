from flask import Blueprint, request, jsonify
import os
import boto3
from botocore.exceptions import ClientError

from src.shared.CheckAuthorization import get_access_token_username
from src.shared.ExecuteQuery import execute_query
from backend.API.src.Users.Auth.GetSecretHash import get_secret_hash

CoachSignIn = Blueprint('CoachSignIn', __name__)

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')

client = boto3.client('cognito-idp')

def get_coach_slug_helper(access_token):

    valid, username = get_access_token_username(access_token)

    if not valid:
        return None
    
    sql = "SELECT slug FROM Coaches WHERE coach_id=%s"
    response = execute_query(sql, (username, ))
    try:
        return response[0][0]
    except IndexError:
        return None

def sign_in_coach(username, password):
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
        response['CoachSlug'] = get_coach_slug_helper(response['AuthenticationResult']['AccessToken'])
        return response, 200
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NotAuthorizedException':
            return {'message': 'Incorrect username or password', 'consequence': 'ShowMessage', 'error': str(e)}, 400
        elif error_code == 'UserNotFoundException':
            return {'message': 'User Not Found', 'consequence': 'ShowMessage'}, 400
        elif error_code == 'UserNotConfirmedException':
            return {'message': 'User not yet confirmed', 'consequence': 'UserNotConfirmed'}, 400
        
        return {'message': f"Error: {e.response['Error']['Message']}", 'consequence': 'ShowServerError'}, 500
    except Exception as e:
        return {'message': f"Error: {e}", 'consequence': 'ShowServerError'}, 500

@CoachSignIn.route('/auth/coach/sign-in', methods=['POST'])
def coach_sign_in():
    data = request.json
    try:
        username = data['username']
        password = data['password']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing Key: {e}"), 400
    response, status_code = sign_in_coach(username, password)
    return jsonify(response), status_code