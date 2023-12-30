import boto3
import time
import os

from src.Database.ExecuteQuery import execute_query

client = boto3.client('s3')

coach_profile_pictures_bucket = os.environ['COACH_PROFILE_PICTURES_BUCKET']

def get_profile_picture_url(coach):
    if coach['profile_picture_url'] is None or coach['profile_picture_url_expiry'] < time.time():
        return get_new_get_profile_url(coach)
    else:
        return coach['profile_picture_url']
    
    
def get_new_get_profile_url(coach):
    
    expiry_time = 3600
    url = client.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': coach_profile_pictures_bucket,
            'Key': coach['slug']
        },
        ExpiresIn=expiry_time
    )
    
    current_time = time.time()
    sql = "UPDATE Coaches SET profile_picture_url=%s, profile_picture_url_expiry=%s WHERE coach_id=%s"
    
    execute_query(sql, (url, int(current_time + expiry_time), coach['coach_id']), is_get_query=False)
    
    return url