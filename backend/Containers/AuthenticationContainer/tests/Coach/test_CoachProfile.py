import unittest
import time

from unittest.mock import patch
from botocore.exceptions import ClientError

from flask import Flask
app = Flask(__name__)

with patch('boto3.client') as mock_boto3:
    from src.Coach.CoachProfile import get_coach_profile_url, get_coach_details, update_coach_details, get_profile_picture_upload_url, get_profile_picture, check_is_coach

# -------------- TEST GET PROFILE PICTURE URL -----------------------

class TestGetCoachProfileUrl(unittest.TestCase):
    @patch('src.Coach.CoachProfile.get_coach_data')
    def test_get_coach_profile_url_no_id_or_slug(self, mock_get_coach_data):
        response = get_coach_profile_url()
        self.assertIsNone(response)
        mock_get_coach_data.assert_not_called()

    @patch('src.Coach.CoachProfile.get_coach_data')
    @patch('src.Coach.CoachProfile.generate_presigned_url')
    @patch('src.Coach.CoachProfile.update_coach_data')
    def test_get_coach_profile_url_public_profile_picture_no_url(self, mock_update_coach_data, mock_generate_presigned_url, mock_get_coach_data):
        mock_get_coach_data.return_value = ('slug', None, None, True)
        mock_generate_presigned_url.return_value = 'new_url'
        response = get_coach_profile_url(coach_id=1)
        self.assertEqual(response, 'new_url')
        mock_get_coach_data.assert_called_once_with(1, None)
        mock_generate_presigned_url.assert_called_once_with('slug')
        mock_update_coach_data.assert_called_once_with('new_url', 1)

    @patch('src.Coach.CoachProfile.get_coach_data')
    @patch('src.Coach.CoachProfile.generate_presigned_url')
    @patch('src.Coach.CoachProfile.update_coach_data')
    def test_get_coach_profile_url_public_profile_picture_expired_url(self, mock_update_coach_data, mock_generate_presigned_url, mock_get_coach_data):
        mock_get_coach_data.return_value = ('slug', 'old_url', time.time() - 3600, True)
        mock_generate_presigned_url.return_value = 'new_url'
        response = get_coach_profile_url(coach_id=1)
        self.assertEqual(response, 'new_url')
        mock_get_coach_data.assert_called_once_with(1, None)
        mock_generate_presigned_url.assert_called_once_with('slug')
        mock_update_coach_data.assert_called_once_with('new_url', 1)

    @patch('src.Coach.CoachProfile.get_coach_data')
    def test_get_coach_profile_url_public_profile_picture_valid_url(self, mock_get_coach_data):
        mock_get_coach_data.return_value = ('slug', 'old_url', time.time() + 3600, True)
        response = get_coach_profile_url(coach_id=1)
        self.assertEqual(response, 'old_url')
        mock_get_coach_data.assert_called_once_with(1, None)

    @patch('src.Coach.CoachProfile.get_coach_data')
    def test_get_coach_profile_url_no_public_profile_picture(self, mock_get_coach_data):
        mock_get_coach_data.return_value = ('slug', 'old_url', time.time() + 3600, False)
        response = get_coach_profile_url(coach_id=1)
        self.assertIsNone(response)
        mock_get_coach_data.assert_called_once_with(1, None)
        
# -------------- TEST GET COACH DETAILS -----------------------        
        
class TestGetCoachDetails(unittest.TestCase):
    def test_get_coach_details_no_token(self):
        with app.test_request_context('/auth/coach', method='POST', headers={} ):    
            response = get_coach_details()
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {'message': 'Unauthorized, no access token provided'})

    @patch('src.Coach.CoachProfile.get_coach_attributes')
    @patch('src.Coach.CoachProfile.get_coach_public_settings')
    def test_get_coach_details_success(self, mock_get_coach_public_settings, mock_get_coach_attributes):
        mock_get_coach_attributes.return_value = ({'profile_picture_url': 'url'}, 'coach_id')
        mock_get_coach_public_settings.return_value = (True, True)
        with app.test_request_context('/auth/coach', method='POST', headers={'Authorization': '123'} ):    
            response = get_coach_details()
        self.assertEqual(response[1], 200)
        self.assertEqual(response[0].json, {'profile_picture_url': 'url', 'show_email_publicly': True, 'show_phone_number_publicly': True})

    @patch('src.Coach.CoachProfile.get_coach_attributes')
    def test_get_coach_details_client_error(self, mock_get_coach_attributes):
        mock_get_coach_attributes.side_effect = ClientError({'Error': {'Code': 'NotAuthorizedException'}}, 'get_user')
        with app.test_request_context('/auth/coach', method='POST', headers={'Authorization': '123'} ):    
            response = get_coach_details()
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {'message': 'Invalid Access Token'})

    @patch('src.Coach.CoachProfile.get_coach_attributes')
    def test_get_coach_details_general_exception(self, mock_get_coach_attributes):
        mock_get_coach_attributes.side_effect = Exception('Error')
        with app.test_request_context('/auth/coach', method='POST', headers={'Authorization': '123'} ):    
            response = get_coach_details()
        self.assertEqual(response[1], 500)
        self.assertEqual(response[0].json, {'message': 'Internal Server Error', 'error': 'Error'})
        
# -------------- TEST UPDATE COACH DETAILS -----------------------
        
class TestUpdateCoachDetails(unittest.TestCase):
    def test_update_coach_details_no_token(self):
        with app.test_request_context('/auth/coach/me', method='POST', headers={} ):    
            response = update_coach_details()
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {'message': 'Missing Authentication Token'})

    @patch('src.Coach.CoachProfile.get_coach_id')
    @patch('src.Coach.CoachProfile.update_coach_public_settings')
    def test_update_coach_details_success(self, mock_update_coach_public_settings, mock_get_coach_id):
        mock_get_coach_id.return_value = 'coach_id'
        with app.test_request_context('/auth/coach/me', method='POST', headers={'Authorization': '123'}, json={'show_email_publicly': True, 'show_phone_number_publicly': True} ):    
            response = update_coach_details()
        self.assertEqual(response[1], 200)
        self.assertEqual(response[0].json, 'Coach details successfully updated')
        mock_update_coach_public_settings.assert_called_once_with('coach_id', True, True)

    @patch('src.Coach.CoachProfile.get_coach_id')
    def test_update_coach_details_invalid_access_token(self, mock_get_coach_id):
        mock_get_coach_id.side_effect = ClientError({'Error': {'Code': 'NotAuthorizedException'}}, 'get_user')
        with app.test_request_context('/auth/coach/me', method='POST', headers={'Authorization': '123'}, json={'show_email_publicly': True, 'show_phone_number_publicly': True} ):    
            response = update_coach_details()
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {'message': 'Invalid Access Token'})

    @patch('src.Coach.CoachProfile.get_coach_id')
    def test_update_coach_details_general_exception(self, mock_get_coach_id):
        mock_get_coach_id.side_effect = Exception('Error')
        with app.test_request_context('/auth/coach/me', method='POST', headers={'Authorization': '123'}, json={'show_email_publicly': True, 'show_phone_number_publicly': True} ):    
            response = update_coach_details()
        self.assertEqual(response[1], 500)
        self.assertEqual(response[0].json, {'message': 'Internal Server Error', 'error': 'Error'})
        
# -------------- TEST GET PROFILE PICTURE UPLOAD URL -----------------------
        
class TestGetProfilePictureUploadUrl(unittest.TestCase):
    @patch('src.Coach.CoachProfile.get_access_token_username')
    @patch('src.Coach.CoachProfile.get_coach_slug')
    @patch('src.Coach.CoachProfile.generate_presigned_url')
    def test_get_profile_picture_upload_url_success(self, mock_generate_presigned_url, mock_get_coach_slug, mock_get_access_token_username):
        mock_get_access_token_username.return_value = (True, 'username')
        mock_get_coach_slug.return_value = 'slug'
        mock_generate_presigned_url.return_value = 'url'
        with app.test_request_context('/auth/coach/profile-picture-upload-url', method='GET', headers={'Authorization': '123'}):    
            response = get_profile_picture_upload_url()
            
            
        print(response)
        self.assertEqual(response[1], 200)
        self.assertEqual(response[0].json, {'url': 'url'})

    def test_get_profile_picture_upload_url_no_token(self):
        with app.test_request_context('/auth/coach/profile-picture-upload-url', method='GET', headers={}):    
            response = get_profile_picture_upload_url()
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {'message': 'No token provided'})

    @patch('src.Coach.CoachProfile.get_access_token_username')
    def test_get_profile_picture_upload_url_invalid_token(self, mock_get_access_token_username):
        mock_get_access_token_username.return_value = (False, None)
        with app.test_request_context('/auth/coach/profile-picture-upload-url', method='GET', headers={'Authorization': '123'}):    
            response = get_profile_picture_upload_url()
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {'message': 'Unauthorised'})

    @patch('src.Coach.CoachProfile.get_access_token_username')
    @patch('src.Coach.CoachProfile.get_coach_slug')
    @patch('src.Coach.CoachProfile.generate_presigned_url')
    def test_get_profile_picture_upload_url_exception(self, mock_generate_presigned_url, mock_get_coach_slug, mock_get_access_token_username):
        mock_get_access_token_username.return_value = (True, 'username')
        mock_get_coach_slug.return_value = 'slug'
        mock_generate_presigned_url.side_effect = Exception('Error')
        with app.test_request_context('/auth/coach/profile-picture-upload-url', method='GET', headers={'Authorization': '123'}):    
            response = get_profile_picture_upload_url()
        self.assertEqual(response[1], 500)
        self.assertEqual(response[0].json, {'message': 'Error', 'error': 'Error'})
        
# -------------- TEST GET PROFILE PICTURE ENDPOINT -----------------------

class TestGetProfilePicture(unittest.TestCase):
    @patch('src.Coach.CoachProfile.get_coach_profile_url')
    def test_get_profile_picture_success(self, mock_get_coach_profile_url):
        mock_get_coach_profile_url.return_value = 'url'
        with app.test_request_context('/auth/coach/slug/profile-picture', method='GET'):    
            response = get_profile_picture('slug')
        self.assertEqual(response[1], 200)
        self.assertEqual(response[0].json, {'url': 'url'})
        mock_get_coach_profile_url.assert_called_once_with(slug='slug')

    @patch('src.Coach.CoachProfile.get_coach_profile_url')
    def test_get_profile_picture_no_public_profile(self, mock_get_coach_profile_url):
        mock_get_coach_profile_url.return_value = None
        with app.test_request_context('/auth/coach/slug/profile-picture', method='GET'):    
            response = get_profile_picture('slug')
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {'message': 'Coach does not have a public profile'})
        mock_get_coach_profile_url.assert_called_once_with(slug='slug')
        
# -------------- TEST CHECK IF AUTHORISED ENDPOINT -----------------------

class TestCheckIsCoach(unittest.TestCase):
    @patch('src.Coach.CoachProfile.get_access_token_username')
    @patch('src.Coach.CoachProfile.get_coach_slug')
    def test_check_is_coach_success(self, mock_get_coach_slug, mock_get_access_token_username):
        mock_get_access_token_username.return_value = (True, 'username')
        mock_get_coach_slug.return_value = 'slug'
        with app.test_request_context('/auth/coach/check', method='GET', headers={'Authorization': '123'}):    
            response = check_is_coach()
        self.assertEqual(response[1], 200)
        self.assertEqual(response[0].json, {'slug': 'slug', 'coach': True})

    def test_check_is_coach_no_token(self):
        with app.test_request_context('/auth/coach/check', method='GET', headers={}):    
            response = check_is_coach()
        self.assertEqual(response[1], 200)
        self.assertEqual(response[0].json, {'message': 'No coach found', 'coach': False})

    @patch('src.Coach.CoachProfile.get_access_token_username')
    def test_check_is_coach_invalid_token(self, mock_get_access_token_username):
        mock_get_access_token_username.return_value = (False, None)
        with app.test_request_context('/auth/coach/check', method='GET', headers={'Authorization': '123'}):    
            response = check_is_coach()
        self.assertEqual(response[1], 200)
        self.assertEqual(response[0].json, {'message': 'No coach found', 'coach': False})

    @patch('src.Coach.CoachProfile.get_access_token_username')
    @patch('src.Coach.CoachProfile.get_coach_slug')
    def test_check_is_coach_no_slug(self, mock_get_coach_slug, mock_get_access_token_username):
        mock_get_access_token_username.return_value = (True, 'username')
        mock_get_coach_slug.return_value = None
        with app.test_request_context('/auth/coach/check', method='GET', headers={'Authorization': '123'}):    
            response = check_is_coach()
        self.assertEqual(response[1], 200)
        self.assertEqual(response[0].json, {'message': 'No coach found', 'coach': False})