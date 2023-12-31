import boto3, json

client = boto3.client('ses')

def send_email(localFrom, toAddresses, subject, bodyText, bodyHTMl):

    response = client.send_email(
        Source=f"Courtsync <{localFrom}@courtsync.co.uk>",
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
    for record in event['Records']:
        body = json.loads(record['body'])
        
        localFrom = body['localFrom']
        toAddress = body['addresses']
        subject = body['subject']
        bodyText = body['bodyText']
        bodyHTML = body['bodyHTML']

        try:
            response = send_email(localFrom, toAddress, subject, bodyText, bodyHTML)
            print(f"Email sent! Message ID: {response['MessageId']}")
        except client.exceptions.ClientError as e:
            print(e.response['Error']['Message'])
        except client.exceptions.InvalidParameterValue as e:
            print(e.response['Error']['Message'])
        except Exception as e:
            print(e)
