import boto3, json

client = boto3.client('ses')

def send_email(localFrom, toAddresses, subject, bodyText, bodyHTMl):

    response = client.send_email(
        Source=f"{localFrom}@courtsync.co.uk",
        Destination={
            'ToAddresses': toAddresses
        },
        Message={
            'Subject': {
                'Data': subject
            },
            'Body': {
                'Text': {
                    'Data': bodyText
                },
                'Html': {
                    'Data': bodyHTMl
                }
            }
        }
    )
    return response


def lambda_handler(event, context):
    print(event)
    for record in event['Records']:
        body = json.loads(record['body'])
        
        localFrom = body['localFrom']
        toAddress = body['addresses']
        subject = body['subject']
        bodyText = body['bodyText']
        bodyHTML = body['bodyHTML']

        response = send_email(localFrom, toAddress, subject, bodyText, bodyHTML)
        print(response)
