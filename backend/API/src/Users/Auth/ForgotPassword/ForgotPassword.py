from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

import os
import boto3

from src.Users.Auth.GetSecretHash import get_secret_hash

load_dotenv('.env')

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')

client = boto3.client('cognito-idp')

ForgotPasswordBlueprint = Blueprint('ForgotPassword', __name__)

@ForgotPasswordBlueprint.route('/coach/forgot-password', methods=['POST'])
def forgot_password_endpoint():
    
    try:
        email = request.json['email']
    except KeyError:
        return jsonify(message='No email provided'), 400
    
    
    get_secret_hash(email, CLIENT_ID, CLIENT_SECRET)

    try:

        response = client.forgot_password(
            ClientId=CLIENT_ID,
            SecretHash=get_secret_hash(email, CLIENT_ID, CLIENT_SECRET),
            Username=email,
        )
    except Exception as e:
        print('error in forgot password: ', e)
    
    print(response)
    
    return response, 200
