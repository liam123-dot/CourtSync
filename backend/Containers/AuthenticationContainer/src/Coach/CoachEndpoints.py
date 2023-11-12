import os

import boto3
import time
from flask import Blueprint, request, jsonify
import logging
logging.basicConfig(level=logging.DEBUG)

from src.Coach.AttributeVerification import is_password_valid, is_phone_number_valid, is_email_valid
from src.Coach.CreateSlug import insert_into_table
from src.Coach.GetSecretHash import get_secret_hash
from src.shared.ExecuteQuery import execute_query
from src.shared.CheckAuthorization import get_access_token_username

coach = Blueprint('main', __name__)

client = boto3.client('cognito-idp')
s3_client = boto3.client('s3')

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')

@coach.route('/auth/coach', methods=['POST'])
def coach_sign_up():
    
    data = request.json
    
    try:
        first_name = data['first_name']
        last_name = data['last_name']
        email = data['email']
        phone_number = data['phone_number']
        password = data['password']
        confirm_password = data['confirm_password']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing Key: {e}"), 400

    # -------------- attribute verification -----------------------
    if len(first_name) < 2 or len(last_name) < 2:
        return jsonify(message='First name and last name must be greater than 1 character'), 400

    if password != confirm_password:
        return jsonify(message='Passwords do not match'), 400

    if not is_password_valid(password):
        return jsonify(message='Password not strong enough'), 400

    if not is_phone_number_valid(phone_number):
        return jsonify(message='Invalid UK phone number'), 400

    if phone_number.startswith('0'):
        phone_number = '+44' + phone_number[1:]

    if not is_email_valid(email):
        return jsonify(message='Invalid Email'), 400

    secret_hash = get_secret_hash(username=email, client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
    attributes = [
        {'Name': 'email', 'Value': email},
        {'Name': 'given_name', 'Value': first_name},
        {'Name': 'family_name', 'Value': last_name},
        {'Name': 'phone_number', 'Value': phone_number}
    ]
    try:
        response = client.sign_up(
            ClientId=CLIENT_ID,
            SecretHash=secret_hash,
            Username=email,
            Password=password,
            UserAttributes=attributes
        )

        user_id = response['UserSub']
        insert_into_table(user_id, first_name, last_name, email)
        return jsonify(message='Success'), 200

    except client.exceptions.UsernameExistsException:
        return jsonify(message='User with provided email already exists'), 400
    except client.exceptions.InvalidPasswordException:
        return jsonify(message='Password does not satisfy strength restraints'), 400
    except client.exceptions.TooManyRequestsException:
        return jsonify(message='Please try again later'), 400
    except Exception as e:    
        return jsonify(message='Internal Server Error', error=str(e)), 500
    

def resend_confirmation_code(email):
    secret_hash = get_secret_hash(username=email, client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
    
    response = client.resend_confirmation_code(
        ClientId=CLIENT_ID,
        SecretHash=secret_hash,
        Username=email
    )
    return response



@coach.route('/auth/coach/confirm/resend', methods=['POST'])
def resend_coach_confirmation_code():
    
    data = request.json

    try:
        email = data['email']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing Key: {e}")
    
    response = resend_confirmation_code(email)

    return jsonify(response), 200


@coach.route('/auth/coach/confirm', methods=['POST'])
def confirm_coach_sign_up():

    data = request.json

    try:
        email = data['email']
        confirmation_code = data['confirmation_code']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing Key: {e}")
    
    secret_hash = get_secret_hash(username=email, client_id=CLIENT_ID, client_secret=CLIENT_SECRET)

    try:
        response = client.confirm_sign_up(
            ClientId=CLIENT_ID,
            SecretHash=secret_hash,
            Username=email,
            ConfirmationCode=confirmation_code
        )
        return jsonify(response), 200
    except client.exceptions.CodeMismatchException:
        return jsonify(message='Incorrect Confirmation Code'), 400
    except client.exceptions.UserNotFoundException:
        return jsonify(message='User not found'), 400
    except client.exceptions.ExpiredCodeException:
        return jsonify(message='The verification code has expired, please check your inbox for a new one'), 400
    except Exception as e:
        return jsonify(message=f"Error: {str(e)}"), 500
    

def get_coach_slug_helper(access_token):

    valid, username = get_access_token_username(access_token)

    if not valid:
        return None
    
    sql = "SELECT slug FROM Coaches WHERE coach_id=%s"
    response = execute_query(sql, (username, ))
    try:
        return response[0][0]
    except IndexError:
        return None


@coach.route('/auth/coach/sign-in', methods=['POST'])
def coach_sign_in():

    data = request.json

    try:
        username = data['username']
        password = data['password']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing Key: {e}"), 400

    secret_hash = get_secret_hash(username=username, client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
    
    try:
        response = client.initiate_auth(
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': username,
                'PASSWORD': password,
                'SECRET_HASH': secret_hash
            },
            ClientId=CLIENT_ID
        )

        response['CoachSlug'] = get_coach_slug_helper(response['AuthenticationResult']['AccessToken'])
        return jsonify(response), 200
    except client.exceptions.NotAuthorizedException as e:
        return jsonify(message='Incorrect username or password', consequence='ShowMessage', error=str(e)), 400
    except client.exceptions.UserNotFoundException:
        return jsonify(message='User Not Found', consequence='ShowMessage'), 400
    except client.exceptions.UserNotConfirmedException:
        return jsonify(message='User not yet confirmed', consequence='UserNotConfirmed'), 400

    except Exception as e:
        return jsonify(message=f"Error: {e}", consequence='ShowServerError'), 500
    

@coach.route('/auth/coach/refresh', methods=['POST'])
def refresh_coach_tokens():

    data = request.json

    try:
        refresh_token = data['refreshToken']
        email = data['email']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing Key: {e}")
    
    coach_id = get_coach_id(email)
    
    if not coach_id:
        return jsonify(message='Invalid Email'), 400

    secret_hash = get_secret_hash(username=coach_id, client_id=CLIENT_ID, client_secret=CLIENT_SECRET)

    try:
        response = client.initiate_auth(
            AuthFlow='REFRESH_TOKEN',
            AuthParameters={
                'SECRET_HASH': secret_hash,
                'REFRESH_TOKEN': refresh_token
            },
            ClientId=CLIENT_ID,
        )
        return jsonify(response), 200
    except client.exceptions.NotAuthorizedException as e:
        return jsonify(message='Invalid Refresh Token', error=str(e)), 400
    except Exception as e:
        return jsonify(message=f"Error: {e}"), 500
    

def get_coach_id(coach_email):
    sql = "SELECT coach_id FROM Coaches WHERE username=%s"
    response = execute_query(sql, (coach_email, ))

    try:
        coach_id = response[0][0]
        return coach_id
    except Exception as e:
        return None
    

@coach.route('/auth/coach/slug', methods=['GET'])
def get_coach_slug():
    
    token = request.headers.get('Authorization', None)

    if token:
        valid, username = get_access_token_username(token)

    if valid:

        sql = "SELECT slug FROM Coaches WHERE coach_id=%s"
        results = execute_query(sql, (username, ))

        return jsonify(slug=results[0][0]), 200


    else:
        return jsonify(message='Unauthorized'), 400


def get_coach_profile_url(coach_id=None, slug=None):

    if not coach_id and not slug:
        return None
    
    if coach_id:

        sql = "SELECT slug, profile_picture_url, profile_picture_url_expiry, public_profile_picture FROM Coaches WHERE coach_id=%s"
        response = execute_query(sql, (coach_id, ))[0]

    else:
        sql = "SELECT slug, profile_picture_url, profile_picture_url_expiry, public_profile_picture FROM Coaches WHERE slug=%s"
        response = execute_query(sql, (slug, ))[0]

    slug = response[0]
    profile_picture_url = response[1]
    profile_picture_url_expiry = response[2]
    public_profile_picture = response[3]

    if public_profile_picture:

        if not profile_picture_url or time.time() > profile_picture_url_expiry:
            response = s3_client.generate_presigned_url('get_object',
                                                        Params={'Bucket': 'coach-profile-pictures',
                                                                'Key': slug},
                                                        ExpiresIn=3600)
            
            sql = 'UPDATE Coaches SET profile_picture_url=%s, profile_picture_url_expiry=%s WHERE coach_id=%s'
            execute_query(sql, (response, time.time() + 3600, coach_id))
            return response

        else:
            return profile_picture_url
    else:
        return None


@coach.route('/auth/coach/me', methods=['GET'])
def get_coach_details():
    token = request.headers.get('Authorization', None)

    if token:

        try:

            response = client.get_user(
                AccessToken=token
            )

            coach_id = response['Username']

            profile_picture_url = get_coach_profile_url(coach_id=coach_id)

            attributes = {
                'profile_picture_url': profile_picture_url
            }

            for user_attribute in response['UserAttributes']:
                attributes[user_attribute['Name']] = user_attribute['Value']

            sql = "SELECT show_email_publicly, show_phone_number_publicly FROM Coaches WHERE coach_id=%s"
            results = execute_query(sql, (coach_id, ))
            if len(results) == 0:
                return jsonify(message='Internal Server Error'), 500
            result = results[0]

            attributes['show_email_publicly'] = result[0]
            attributes['show_phone_number_publicly'] = result[1]
            
            return jsonify(attributes), 200

        except client.exceptions.NotAuthorizedException as e:
            return jsonify(message='Invalid Access Token'), 400
        except Exception as e:
            return jsonify(message='Internal Server Error', error=str(e)), 500

    else:
        return jsonify(message='Unauthorized, no access token provided'), 400
    

@coach.route('/auth/coach/me', methods=['POST'])
def update_coach_details():
    token = request.headers.get('Authorization', None)

    if token:
        try:
            response = client.get_user(
                    AccessToken=token
                )

            coach_id = response['Username']

            try:
                data = request.json
                show_email_publicly = data['show_email_publicly']
                show_phone_number_publicly = data['show_phone_number_publicly']
            
            except KeyError as e:
                return jsonify(message=f"Invalid/Missing key: {e}")
            
            sql = "UPDATE Coaches SET show_email_publicly=%s, show_phone_number_publicly=%s WHERE coach_id=%s"
            execute_query(sql, (show_email_publicly, show_phone_number_publicly, coach_id))

            return jsonify('Coach details successfully updated'), 200

        except client.exceptions.NotAuthorizedException as e:
            return jsonify(message='Invalid Access Token'), 400
        except Exception as e:
            return jsonify(message='Internal Server Error', error=str(e)), 500
    else:
        return jsonify(message='Missing Authentication Token'), 400

@coach.route('/auth/coach/profile-picture-upload-url', methods=['GET'])
def get_profile_picture_upload_url():

    token = request.headers.get('Authorization', None)

    if token:
        valid, username = get_access_token_username(token)
    else:
        return jsonify(message='No token provided'), 400
    
    if valid:
        
        sql = 'SELECT slug FROM Coaches where coach_id=%s'
        results = execute_query(sql, (username, ))

        slug = results[0][0]

        try:
            response = s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': 'coach-profile-pictures',
                    'Key': slug
                },
                ExpiresIn=1800
            )
            return jsonify(url=response)
        except Exception as e:
            return jsonify(message='Error', error=str(e)), 500

    else:
        return jsonify(message='Unauthorised'), 400
    

@coach.route('/auth/coach/<slug>/profile-picture', methods=['GET'])
def get_profile_picture(slug):

    profile_url = get_coach_profile_url(slug=slug)

    if profile_url:
        return jsonify(url=profile_url), 200
    else:
        return jsonify(message='Coach does not have a public profile'), 400
    

@coach.route('/auth/coach/check', methods=['GET'])
def check_is_coach():

    token = request.headers.get('Authorization', None)

    if token:
        valid, username = get_access_token_username(token)
    else:
        return jsonify(message='No coach found', coach=False), 200
    
    if valid:
        
        sql = 'SELECT slug FROM Coaches where coach_id=%s'
        results = execute_query(sql, (username, ))

        slug = results[0][0]

        return jsonify(slug=slug, coach=True), 200
    
    return jsonify(message='No coach found', coach=False), 200
