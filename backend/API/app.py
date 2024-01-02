from create_app import create_app

from flask import request
import boto3
import time
import json
import os

client = boto3.client('sqs')
s3_client = boto3.client('s3')

QUEUE_URL = os.environ.get('LOGGING_QUEUE_URL')

from celery import Celery

def make_celery(app):
    # Initialize Celery
    celery = Celery(
        app.import_name,
        backend=app.config['result_backend'],
        broker=app.config['CELERY_BROKER_URL']
    )
    celery.conf.update(app.config)

    # Run tasks in the application context
    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery

# Configure your Flask app and Celery
app, db_connection = create_app()
app.config.update(
    CELERY_BROKER_URL='redis://localhost:6379/0',
    result_backend='redis://localhost:6379/0'
)

celery = make_celery(app)

@celery.task
def upload_log(message_body, request_id):
    try:
        response = client.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps(message_body)
        )
        print(f"Log uploaded successfully: {response}")
        s3_client.upload_file(f"logs/{request_id}.log", "logging-data-test", f"logs/{request_id}.log")
        os.remove(f"logs/{request_id}.log")
    except Exception as e:
        print(f"Error uploading log: {e}")


@app.route('/')
def health_check():
    return 'OK', 200

@app.before_request
def start_timer():
    # Record the start time of the request
    request.start = time.time()

    # Generate a unique ID for the request based on time and route
    request_id = f"{request.start}-{request.endpoint}"
    print(f"Request ID: {request_id}")
    request.request_id = request_id


@app.after_request
def log_request(response):
    now = time.time()
    duration = now - request.start
    
    if 'User-Agent' in request.headers.keys():
        if request.headers['User-Agent'] == 'ELB-HealthChecker/2.0':
            return response
    
    # Prepare the message body
    message_body = {
        'request': {
            'remote_addr': request.remote_addr,
            'method': request.method,
            'scheme': request.scheme,
            'full_path': request.full_path,
            'headers': {k: v for k, v in request.headers.items()},
            'data': request.get_data(as_text=True) if request.method != 'GET' else '{}',
            'args': request.args.to_dict(),
            'request_time': int(request.start)
        },
        'response': {
            'status': response.status,
            'status_code': response.status_code,
            'headers': {k: v for k, v in response.headers.items()},
            'data': response.get_data(as_text=True)
        },
        'duration': duration,
        'log_id': request.request_id
    }

    # Filtering sensitive headers or data if necessary
    # Example: Remove authorization headers
    # Send message to SQS queue
    st = time.time()
    upload_log.delay(message_body, request.request_id)
    et = time.time()
    print(f"Time taken to upload log: {et - st}")
    
    # print(f"Message sent to SQS queue: {send_message_response}")

    return response

if __name__ == '__main__':
    app.run(debug=True)