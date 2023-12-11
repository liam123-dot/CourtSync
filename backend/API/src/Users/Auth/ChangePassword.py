from flask import request, jsonify, Blueprint
from botocore.exceptions import ClientError
import boto3
import logging

logging.basicConfig(level=logging.INFO)

from src.Users.GetSelf.GetSelf import get_coach

client = boto3.client('cognito-idp')

ChangePasswordBlueprint = Blueprint('ChangePasswordBlueprint', __name__)

@ChangePasswordBlueprint.route('/coach/change-password', methods=['PUT'])
def change_password():
    
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify(message='Unauthorised'), 400
    
    data = request.json

    try:    
        previous_password = data['previousPassword']
        proposed_password = data['proposedPassword']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing key: {e}"), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify(message='Unauthorised'), 400
    
    try:
        response = client.change_password(
            PreviousPassword=previous_password,
            ProposedPassword=proposed_password,
            AccessToken=token   
        )
        
        return jsonify(message='Success'), 200
    except ClientError as e:
        
        error_code = e.response['Error']['Code']
        logging.debug(f"Error: {e.response['Error']}")
        
        if error_code == 'NotAuthorizedException':
            return jsonify(message='Old password incorrect'), 400
        elif error_code == 'InvalidPasswordException':
            return jsonify(message='Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character'), 400
        elif error_code == 'LimitExceededException':
            return jsonify(message='Attempt limit exceeded, please try again later'), 400
        
        return jsonify(message=error_code), 400
