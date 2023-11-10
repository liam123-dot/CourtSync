import json
import logging
import boto3
import re

logging.basicConfig(level=logging.DEBUG)

# Initialize the SQS client
client = boto3.client('sqs')


def validate_email_address(email):
    # takes an email address and returns wether or not it is valid using regex
    email_regex = re.compile(r"[^@]+@[^@]+\.[^@]+")
    return email_regex.match(email) is not None # returns true if the email matches the regex
        


def validate_parameters(localFrom, recipients, subject, bodyText, bodyHTML):
    
    # make sure local from is a string and non empty
    if type(localFrom) != str or len(localFrom) == 0:
        return False, "localFrom must be a string and non empty"
    
    # make sure recipients is a list of strings, all of which are valid email addresses
    if type(recipients) != list:
        return False, "recipients must be a list"
    for recipient in recipients:
        if type(recipient) != str:
            return False, "recipients must be a list of strings"
        if not validate_email_address(recipient):
            return False, "recipients must be a list of valid email addresses"
        
    # make sure the subject is a string and non empty
    if type(subject) != str or len(subject) == 0:
        return False, "subject must be a string and non empty"
    
    # make sure the bodyText is a string and non empty
    if type(bodyText) != str or len(bodyText) == 0:
        return False, "bodyText must be a string and non empty"
    
    # make sure the bodyHTML is a string, non empty and is valid html
    if type(bodyHTML) != str or len(bodyHTML) == 0:
        return False, "bodyHTML must be a string and non empty"
    if 'body' not in bodyHTML:
        return False, "bodyHTML must have a body tag"

    return True, None


def send_email(localFrom, recipients, subject, bodyText, bodyHTML):
    # Check if recipients is a list
    if type(recipients) != list:
        return
    # Check if subject is a string
    if type(subject) != str:
        return
    
    
    # parameters will be validated before being sent to the queue
    valid, error_message = validate_parameters(localFrom, recipients, subject, bodyText, bodyHTML)
    if not valid:
        raise Exception(f"Invalid parameter: {error_message}")
    
    try:
        print('sending email')
        # Send the message to the SQS queue
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
        print(response)

    except Exception as e:
        # Log any errors
        logging.debug(f"Error sending email: {e}, response: {response}")