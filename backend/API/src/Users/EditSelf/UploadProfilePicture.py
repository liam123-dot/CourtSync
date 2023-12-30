from flask import request, jsonify, Blueprint

from src.Users.GetSelf.GetSelf import get_coach
from src.Database.ExecuteQuery import execute_query

import boto3
client = boto3.client('s3')

UploadProfilePictureBlueprint = Blueprint('UploadProfilePictureBlueprint', __name__)

@UploadProfilePictureBlueprint.route('/user/me/post-profile-picture-url', methods=['GET'])
def get_profile_picture_upload_url():
    
    token = request.headers.get('Authorization', None)
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400

    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400
    
    url = get_upload_url(coach)
    
    delete_old_url(coach)
    
    return jsonify(url=url), 200
    

def get_upload_url(coach):
    return client.generate_presigned_url(
        'put_object', 
        Params={
            'Bucket': 'coach-profile-pictures',
            'Key': coach['slug']},
        ExpiresIn=3600
    )
    
def delete_old_url(coach):
    sql = "UPDATE Coaches SET profile_picture_url = NULL AND profile_picture_url_expiry WHERE coach_id = %s"
    execute_query(sql, (coach['coach_id'],) , is_get_query=False)