
import boto3
import json
import random as r

sqs = boto3.client('sqs')
for i in range(30):
    response = sqs.send_message(
        QueueUrl='https://sqs.eu-west-2.amazonaws.com/925465361057/EmailNotificationsQueue-test',
        MessageBody=json.dumps({
            'localFrom': f"no-reply-{i}",
            'addresses': ['theo@netscrape.co.uk'],
            'subject': f"big {i}",
            'bodyText': f"Email: {i}",
            'bodyHTML': f"HTML: {i}"            
        })
    )
    print(response)