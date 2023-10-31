import boto3
import json

client = boto3.client('sqs')

def send_email():
    response = client.send_message(
        QueueUrl='https://sqs.eu-west-2.amazonaws.com/925465361057/EmailNotificationsQueue-test',
        MessageBody=json.dumps({
            'localFrom': f"no-reply-{i}",
            'addresses': ['theo@netscrape.co.uk'],
            'subject': f"big {i}",
            'bodyText': f"Email: {i}",
            'bodyHTML': f"HTML: {i}"            
        })
    )
