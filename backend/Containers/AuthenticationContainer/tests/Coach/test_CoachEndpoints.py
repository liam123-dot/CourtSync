import unittest
import time

from unittest.mock import patch
from botocore.exceptions import ClientError

from flask import Flask
app = Flask(__name__)

with patch('boto3.client') as mock_boto3:
    from src.Coach.CoachEndpoints import resend_coach_confirmation_code, refresh_coach_tokens, get_coach_slug

# -------------- TEST RESEND COACH CONFIRMATION CODE -----------------------

class TestResendCoachConfirmationCode(unittest.TestCase):
    @patch('src.Coach.CoachEndpoints.resend_confirmation_code')
    def test_resend_coach_confirmation_code_success(self, mock_resend_confirmation_code):
        mock_resend_confirmation_code.return_value = {'message': 'Confirmation code resent'}
        with app.test_request_context('/auth/coach/confirm/resend', method='POST', json={'email': 'test@example.com'}):    
            response = resend_coach_confirmation_code()
        self.assertEqual(response[1], 200)
        self.assertEqual(response[0].json, {'message': 'Confirmation code resent'})
        mock_resend_confirmation_code.assert_called_once_with('test@example.com')

    def test_resend_coach_confirmation_code_no_email(self):
        with app.test_request_context('/auth/coach/confirm/resend', method='POST', json={}):    
            response = resend_coach_confirmation_code()
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {"message": "Invalid/Missing Key: 'email'"})
        
# -------------- TEST REFRESH COACH TOKENS -----------------------

class TestRefreshCoachTokens(unittest.TestCase):
    @patch('src.Coach.CoachEndpoints.refresh_tokens')
    def test_refresh_coach_tokens_success(self, mock_refresh_tokens):
        mock_refresh_tokens.return_value = {'message': 'Tokens refreshed'}
        with app.test_request_context('/auth/coach/refresh', method='POST', json={'email': 'test@example.com', 'refreshToken': '123'}):    
            response = refresh_coach_tokens()
        self.assertEqual(response[1], 200)
        self.assertEqual(response[0].json, {'message': 'Tokens refreshed'})
        mock_refresh_tokens.assert_called_once_with('test@example.com', '123')

    def test_refresh_coach_tokens_no_email(self):
        with app.test_request_context('/auth/coach/refresh', method='POST', json={'refreshToken': '123'}):    
            response = refresh_coach_tokens()
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {"message": "Invalid/Missing Key: 'email'"})

    def test_refresh_coach_tokens_no_refresh_token(self):
        with app.test_request_context('/auth/coach/refresh', method='POST', json={'email': 'test@example.com'}):    
            response = refresh_coach_tokens()
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {"message": "Invalid/Missing Key: 'refreshToken'"})

    @patch('src.Coach.CoachEndpoints.refresh_tokens')
    def test_refresh_coach_tokens_invalid_refresh_token(self, mock_refresh_tokens):
        mock_refresh_tokens.side_effect = ClientError({'Error': {'Code': 'NotAuthorizedException', 'Message': 'Invalid Refresh Token'}}, 'operation_name')
        with app.test_request_context('/auth/coach/refresh', method='POST', json={'email': 'test@example.com', 'refreshToken': '123'}):    
            response = refresh_coach_tokens()
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {"message": "Invalid Refresh Token"})
        
# -------------- TEST GET COACH SLUG -----------------------

class TestGetCoachSlug(unittest.TestCase):
    @patch('src.Coach.CoachEndpoints.get_access_token_username')
    @patch('src.Coach.CoachEndpoints.execute_query')
    def test_get_coach_slug_success(self, mock_execute_query, mock_get_access_token_username):
        mock_get_access_token_username.return_value = (True, 'username')
        mock_execute_query.return_value = [('slug',)]
        with app.test_request_context('/auth/coach/slug', method='GET', headers={'Authorization': '123'}):    
            response = get_coach_slug()
        self.assertEqual(response[1], 200)
        self.assertEqual(response[0].json, {'slug': 'slug'})

    def test_get_coach_slug_no_token(self):
        with app.test_request_context('/auth/coach/slug', method='GET', headers={}):    
            response = get_coach_slug()
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {'message': 'Unauthorized'})

    @patch('src.Coach.CoachEndpoints.get_access_token_username')
    def test_get_coach_slug_invalid_token(self, mock_get_access_token_username):
        mock_get_access_token_username.return_value = (False, None)
        with app.test_request_context('/auth/coach/slug', method='GET', headers={'Authorization': '123'}):    
            response = get_coach_slug()
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {'message': 'Unauthorized'})