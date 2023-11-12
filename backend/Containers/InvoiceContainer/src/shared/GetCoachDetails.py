
import boto3
import os
import logging
logging.basicConfig(level=logging.DEBUG)

def get_user_attributes(user_id):
    try:
        client = boto3.client('cognito-idp')
        response = client.admin_get_user(
            UserPoolId=os.getenv('USER_POOL_ID'),
            Username=user_id
        )
        attributes = {}
        for attribute in response['UserAttributes']:
            attributes[attribute['Name']] = attribute['Value']
        return attributes
    except Exception as e:
        logging.debug(f"Error getting user attributes: {e}")
        return None
