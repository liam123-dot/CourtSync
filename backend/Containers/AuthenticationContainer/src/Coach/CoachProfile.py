from flask import Blueprint, request, jsonify
from botocore.exceptions import ClientError
import boto3
import time

from src.shared.CheckAuthorization import get_access_token_username
from src.shared.ExecuteQuery import execute_query

CoachProfile = Blueprint('CoachProfile', __name__)

client = boto3.client('cognito-idp')
s3_client = boto3.client('s3')

# ---------- GET COACH PROFILE URL ----------------

def get_coach_data(coach_id=None, slug=None):
    if coach_id:
        sql = "SELECT slug, profile_picture_url, profile_picture_url_expiry, public_profile_picture FROM Coaches WHERE coach_id=%s"
        params = (coach_id, )
    else:
        sql = "SELECT slug, profile_picture_url, profile_picture_url_expiry, public_profile_picture FROM Coaches WHERE slug=%s"
        params = (slug, )
    return execute_query(sql, params)[0]

def generate_presigned_url(slug):
    return s3_client.generate_presigned_url('get_object',
                                            Params={'Bucket': 'coach-profile-pictures',
                                                    'Key': slug},
                                            ExpiresIn=3600)

def update_coach_data(response, coach_id):
    sql = 'UPDATE Coaches SET profile_picture_url=%s, profile_picture_url_expiry=%s WHERE coach_id=%s'
    execute_query(sql, (response, time.time() + 3600, coach_id))

def get_coach_profile_url(coach_id=None, slug=None):
    if not coach_id and not slug:
        return None

    response = get_coach_data(coach_id, slug)
    slug = response[0]
    profile_picture_url = response[1]
    profile_picture_url_expiry = response[2]
    public_profile_picture = response[3]

    if public_profile_picture:
        if not profile_picture_url or time.time() > profile_picture_url_expiry:
            response = generate_presigned_url(slug)
            update_coach_data(response, coach_id)
            return response
        else:
            return profile_picture_url
    else:
        return None
    
# ---------- GET COACH PROFILE ----------------

def get_coach_attributes(token):
    response = client.get_user(AccessToken=token)
    coach_id = response['Username']
    profile_picture_url = get_coach_profile_url(coach_id=coach_id)
    attributes = {'profile_picture_url': profile_picture_url}
    for user_attribute in response['UserAttributes']:
        attributes[user_attribute['Name']] = user_attribute['Value']
    return attributes, coach_id

def get_coach_public_settings(coach_id):
    sql = "SELECT show_email_publicly, show_phone_number_publicly FROM Coaches WHERE coach_id=%s"
    results = execute_query(sql, (coach_id, ))
    if len(results) == 0:
        raise Exception('No results found for coach_id')
    result = results[0]
    return result[0], result[1]

@CoachProfile.route('/auth/coach/me', methods=['GET'])
def get_coach_details():
    token = request.headers.get('Authorization', None)
    if not token:
        return jsonify(message='Unauthorized, no access token provided'), 400

    try:
        attributes, coach_id = get_coach_attributes(token)
        show_email_publicly, show_phone_number_publicly = get_coach_public_settings(coach_id)
        attributes['show_email_publicly'] = show_email_publicly
        attributes['show_phone_number_publicly'] = show_phone_number_publicly
        return jsonify(attributes), 200
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NotAuthorizedException':
            return jsonify(message='Invalid Access Token'), 400
        return jsonify(message=e.response['Error']['Message']), 500
    except Exception as e:
        return jsonify(message='Internal Server Error', error=str(e)), 500
    
# ---------- UPDATE COACH PROFILE ----------------

def get_coach_id(token):
    response = client.get_user(AccessToken=token)
    return response['Username']

def update_coach_public_settings(coach_id, show_email_publicly, show_phone_number_publicly):
    sql = "UPDATE Coaches SET show_email_publicly=%s, show_phone_number_publicly=%s WHERE coach_id=%s"
    execute_query(sql, (show_email_publicly, show_phone_number_publicly, coach_id))

@CoachProfile.route('/auth/coach/me', methods=['POST'])
def update_coach_details():
    token = request.headers.get('Authorization', None)
    if not token:
        return jsonify(message='Missing Authentication Token'), 400

    try:
        coach_id = get_coach_id(token)
        data = request.json
        try:
            show_email_publicly = data['show_email_publicly']
            show_phone_number_publicly = data['show_phone_number_publicly']
        except KeyError as e:
            return jsonify(message=f"Invalid/Missing key: {e}"), 400
        update_coach_public_settings(coach_id, show_email_publicly, show_phone_number_publicly)
        return jsonify('Coach details successfully updated'), 200
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NotAuthorizedException':
            return jsonify(message='Invalid Access Token'), 400
        return jsonify(message=e.response['Error']['Message']), 500
    except Exception as e:
        return jsonify(message='Internal Server Error', error=str(e)), 500

# ---------- UPDATE COACH PROFILE PICTURE ----------------

def get_coach_slug(coach_id):
    sql = 'SELECT slug FROM Coaches where coach_id=%s'
    results = execute_query(sql, (coach_id, ))
    return results[0][0]

def generate_presigned_url(slug):
    return s3_client.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': 'coach-profile-pictures',
            'Key': slug
        },
        ExpiresIn=1800
    )

@CoachProfile.route('/auth/coach/profile-picture-upload-url', methods=['GET'])
def get_profile_picture_upload_url():
    token = request.headers.get('Authorization', None)
    if not token:
        return jsonify(message='No token provided'), 400

    valid, username = get_access_token_username(token)
    if not valid:
        return jsonify(message='Unauthorised'), 400

    try:
        slug = get_coach_slug(username)
        response = generate_presigned_url(slug)
        return jsonify(url=response), 200
    except Exception as e:
        return jsonify(message='Error', error=str(e)), 500
    

# ---------- GET COACH PROFILE PICTURE ----------------
@CoachProfile.route('/auth/coach/<slug>/profile-picture', methods=['GET'])
def get_profile_picture(slug):

    profile_url = get_coach_profile_url(slug=slug)

    if profile_url:
        return jsonify(url=profile_url), 200
    else:
        return jsonify(message='Coach does not have a public profile'), 400
    

# ---------- CHECK IF AUTHORISED ----------------
def get_coach_slug(coach_id):
    sql = 'SELECT slug FROM Coaches where coach_id=%s'
    results = execute_query(sql, (coach_id, ))
    return results[0][0] if results else None

@CoachProfile.route('/auth/coach/check', methods=['GET'])
def check_is_coach():
    token = request.headers.get('Authorization', None)
    if not token:
        return jsonify(message='No coach found', coach=False), 200

    valid, username = get_access_token_username(token)
    if not valid:
        return jsonify(message='No coach found', coach=False), 200

    slug = get_coach_slug(username)
    if slug is None:
        return jsonify(message='No coach found', coach=False), 200

    return jsonify(slug=slug, coach=True), 200