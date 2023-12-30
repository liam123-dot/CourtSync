import json
import logging
import boto3


# Initialize the SQS client
client = boto3.client('sqs')

response = client.send_message(
    QueueUrl='https://sqs.eu-west-2.amazonaws.com/925465361057/EmailNotificationsQueue-test',
    MessageBody=json.dumps({
        'localFrom': "Courtsync Bookings <bookings@courtsync.co.uk>",
        'addresses': ["liambuchanan358@yahoo.co.uk"],
        'subject': "New Booking",
        'bodyText': "New Booking",
        'bodyHTML': "<body>New Booking</body>"         
    })
)