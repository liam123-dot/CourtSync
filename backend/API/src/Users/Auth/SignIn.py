from flask import Blueprint, request, jsonify
import os
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv('.env')

from src.Users.Auth.GetSecretHash import get_secret_hash
from src.Users.GetSelf.GetSelf import get_coach

CoachSignIn = Blueprint('CoachSignIn', __name__)

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')

client = boto3.client('cognito-idp')

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
        print(response)
        response['CoachSlug'] = get_coach(response['AuthenticationResult']['AccessToken'])['slug']
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
    # except Exception as e:
    #     return {'message': f"Error: {e}", 'consequence': 'ShowServerError'}, 500

@CoachSignIn.route('/coach/sign-in', methods=['POST'])
def coach_sign_in():
    data = request.json
    try:
        username = data['username']
        password = data['password']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing Key: {e}"), 400
    response, status_code = sign_in_coach(username, password)
    return jsonify(response), status_code