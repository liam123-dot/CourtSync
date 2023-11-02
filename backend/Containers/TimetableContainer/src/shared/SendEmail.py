import boto3
import json

client = boto3.client('sqs')

def send_email(localFrom, recipients, subject, bodyText, bodyHTML):

    if type(recipients) != list:
        return
    if type(subject) != str:
        return
    
    try:

        response = client.send_message(
            QueueUrl='https://sqs.eu-west-2.amazonaws.com/925465361057/EmailNotificationsQueue-test',
            MessageBody=json.dumps({
                'localFrom': localFrom,
                'addresses': recipients,
                'subject': subject,
                'bodyText': bodyText,
                'bodyHTML': bodyHTML            
            })
        )

    except Exception as e:
        pass
