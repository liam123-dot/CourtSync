from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
from botocore.exceptions import ClientError

import os
import boto3

from src.Users.Auth.GetSecretHash import get_secret_hash

client = boto3.client('cognito-idp')

ConfirmForgotPasswordBlueprint = Blueprint('ConfirmForgotPassword', __name__)

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')

@ConfirmForgotPasswordBlueprint.route('/coach/forgot-password/confirm', methods=['POST'])
def confirm_forgot_password_endpoint():
    
    try:
        email = request.json['email']
        new_password = request.json['new_password']
        confirmation_code = request.json['confirmation_code']
    except KeyError as e:
        return jsonify(message=f"Missing key: {e}"), 400
    
    secret_hash = get_secret_hash(email, CLIENT_ID, CLIENT_SECRET)
    
    try:
        response = client.confirm_forgot_password(
            ClientId=CLIENT_ID,
            SecretHash=secret_hash,
            Username=email,
            ConfirmationCode=confirmation_code,
            Password=new_password,
        )
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'ExpiredCodeException':
            return jsonify(message='Confirmation code expired'), 400
        elif error_code == 'CodeMismatchException':
            return jsonify(message='Invalid confirmation code'), 400
        elif error_code == 'NotAuthorizedException':
            return jsonify(message='Invalid password'), 400
        elif error_code == 'UserNotFoundException':
            return jsonify(message='User not found'), 400
        elif error_code== 'InvalidPasswordException':
            return jsonify(message='Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, a number, and a special character'), 400
        else:
            return jsonify(message='Unknown error'), 400
        print('error in confirm forgot password: ', e)
    
    print(response)
    
    return response, 200
