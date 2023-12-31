#!/bin/bash

# Update system and install Python
sudo yum update -y
sudo yum install python3 -y

# Install docker
sudo yum install -y docker
sudo service docker start
sudo systemctl enable docker

sudo docker run -d --name redis -p 6379:6379 redis

# Setup Python environment
python3 -m venv myenv
source myenv/bin/activate

# Install pip
curl -O https://bootstrap.pypa.io/get-pip.py
python3 get-pip.py
export PATH=$PATH:~/.local/bin

# Install requirements
echo "Installing requirements"
pip3 install -r requirements.txt

# Install AWS CLI and dependencies
echo "Installing AWS CLI"
pip3 install --upgrade boto3 botocore s3transfer awscrt

# Retrieve and export environment variables from AWS Secrets Manager
echo "Getting Secrets"
SECRET_STRING=$(aws secretsmanager get-secret-value --secret-id YourSecretId --query SecretString --output text)
echo "Secrets retrieved"
echo $SECRET_STRING
if [ -n "$SECRET_STRING" ]; then
    export $(echo "$SECRET_STRING" | jq -r "to_entries|map(\"\(.key)=\(.value|tostring)\")|.[]" | xargs)
fi

# Start Celery Worker in the background
celery -A app.celery worker --loglevel=info --detach

# Start the server with Gunicorn
echo "Starting server"
gunicorn app:app -w 5 -b 0.0.0.0:8000
