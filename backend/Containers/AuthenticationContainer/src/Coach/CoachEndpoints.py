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

# -------------- COACH SIGN UP -----------------------

@coach.route('/auth/coach', methods=['POST'])
def coach_sign_up():
    data = request.json
    try:
        user_data = extract_user_data(data)
        validate_user_data(user_data)
        user_data['phone_number'] = format_phone_number(user_data['phone_number'])
        user_id = create_user(user_data)
        insert_into_table(user_id, user_data['first_name'], user_data['last_name'], user_data['email'])
        return jsonify(message='Success'), 200
    except (KeyError, ValueError) as e:
        return jsonify(message=str(e)), 400
    except client.exceptions.Boto3Error as e:
        error_messages = {
            'UsernameExistsException': 'User with provided email already exists',
            'InvalidPasswordException': 'Password does not satisfy strength restraints',
            'TooManyRequestsException': 'Please try again later',
        }
        return jsonify(message=error_messages.get(e.__class__.__name__, 'Internal Server Error'), error=str(e)), 500

def extract_user_data(data):
    required_keys = ['first_name', 'last_name', 'email', 'phone_number', 'password', 'confirm_password']
    return {key: data[key] for key in required_keys}

def validate_user_data(user_data):
    if len(user_data['first_name']) < 2 or len(user_data['last_name']) < 2:
        raise ValueError('First name and last name must be greater than 1 character')
    if user_data['password'] != user_data['confirm_password']:
        raise ValueError('Passwords do not match')
    if not is_password_valid(user_data['password']):
        raise ValueError('Password not strong enough')
    if not is_phone_number_valid(user_data['phone_number']):
        raise ValueError('Invalid UK phone number')
    if not is_email_valid(user_data['email']):
        raise ValueError('Invalid Email')

def format_phone_number(phone_number):
    if phone_number.startswith('0'):
        return '+44' + phone_number[1:]
    return phone_number

def create_user(user_data):
    secret_hash = get_secret_hash(username=user_data['email'], client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
    attributes = [
        {'Name': 'email', 'Value': user_data['email']},
        {'Name': 'given_name', 'Value': user_data['first_name']},
        {'Name': 'family_name', 'Value': user_data['last_name']},
        {'Name': 'phone_number', 'Value': user_data['phone_number']}
    ]
    response = client.sign_up(
        ClientId=CLIENT_ID,
        SecretHash=secret_hash,
        Username=user_data['email'],
        Password=user_data['password'],
        UserAttributes=attributes
    )
    return response['UserSub']

# -------------- RESEND CONFIRMATION CODE -----------------------

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

# -------------- CONFIRM SIGN UP -----------------------

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

# -------------- COACH SIGN IN -----------------------

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
   
# -------------- REFRESH TOKEN ----------------------- 

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
    
# ---------- GET COACH SLUG ----------------

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


# ---------- GET COACH PROFILE ----------------

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
    
# ---------- UPDATE COACH PROFILE ----------------

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

# ---------- UPDATE COACH PROFILE PICTURE ----------------

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
    

# ---------- GET COACH PROFILE PICTURE ----------------
@coach.route('/auth/coach/<slug>/profile-picture', methods=['GET'])
def get_profile_picture(slug):

    profile_url = get_coach_profile_url(slug=slug)

    if profile_url:
        return jsonify(url=profile_url), 200
    else:
        return jsonify(message='Coach does not have a public profile'), 400
    

# ---------- CHECK IF AUTHORISED ----------------
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
