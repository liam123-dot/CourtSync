import boto3
import json
import os

def env_to_json(env_file_path):
    """ Convert .env file to JSON """
    with open(env_file_path, 'r') as file:
        lines = file.readlines()
    env_dict = {}
    for line in lines:
        key, value = line.strip().split('=', 1)
        env_dict[key] = value
    return json.dumps(env_dict)

def upload_to_secrets_manager(secret_name, secret_value):
    """ Upload JSON to AWS Secrets Manager """
    client = boto3.client('secretsmanager')
    try:
        response = client.create_secret(Name=secret_name, SecretString=secret_value)
        return response
    except client.exceptions.ResourceExistsException:
        response = client.update_secret(SecretId=secret_name, SecretString=secret_value)
        return response

# Path to your .env file
env_file_path = '.env'

# The name of the secret in AWS Secrets Manager
secret_name = 'env-testing'

# Convert .env to JSON
env_json = env_to_json(env_file_path)

# Upload to AWS Secrets Manager
response = upload_to_secrets_manager(secret_name, env_json)
print("Secret uploaded successfully:", response)
