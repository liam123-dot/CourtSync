import os

import boto3
import time
from flask import Blueprint, request, jsonify
import logging
logging.basicConfig(level=logging.DEBUG)

from src.Users.Auth.GetSecretHash import get_secret_hash

ResendConfirmationCodeBlueprint = Blueprint('ResendConfirmationCode', __name__)

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

@ResendConfirmationCodeBlueprint.route('/coach/confirm/resend', methods=['POST'])
def resend_coach_confirmation_code():
    
    data = request.json

    try:
        email = data['email']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing Key: {e}"), 400
    
    response = resend_confirmation_code(email)

    return jsonify(response), 200