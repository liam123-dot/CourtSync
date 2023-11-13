import unittest
from unittest.mock import patch
from flask import Flask
from botocore.exceptions import ClientError

app = Flask(__name__)

with patch('boto3.client') as mock_boto3:
    from src.Coach.CoachSignIn import coach_sign_in, sign_in_coach

class TestSignInCoach(unittest.TestCase):
    @patch('src.Coach.CoachSignIn.client.initiate_auth')
    @patch('src.Coach.CoachSignIn.get_secret_hash')
    @patch('src.Coach.CoachSignIn.get_coach_slug_helper')
    def test_sign_in_coach_success(self, mock_get_coach_slug_helper, mock_get_secret_hash, mock_initiate_auth):
        username = 'john.doe@example.com'
        password = 'password'
        mock_get_secret_hash.return_value = 'secret_hash'
        mock_initiate_auth.return_value = {'AuthenticationResult': {'AccessToken': 'access_token'}}
        mock_get_coach_slug_helper.return_value = 'coach_slug'
        response, status_code = sign_in_coach(username, password)
        self.assertEqual(status_code, 200)
        self.assertEqual(response['CoachSlug'], 'coach_slug')

    @patch('src.Coach.CoachSignIn.client.initiate_auth')
    @patch('src.Coach.CoachSignIn.get_secret_hash')
    def test_sign_in_coach_not_authorized_exception(self, mock_get_secret_hash, mock_initiate_auth):
        username = 'john.doe@example.com'
        password = 'password'
        mock_get_secret_hash.return_value = 'secret_hash'
        mock_initiate_auth.side_effect = ClientError({"Error": {"Code": "NotAuthorizedException", "Message": "Incorrect username or password"}}, "InitiateAuth")
        response, status_code = sign_in_coach(username, password)
        self.assertEqual(status_code, 400)
        self.assertEqual(response['message'], 'Incorrect username or password')

    @patch('src.Coach.CoachSignIn.client.initiate_auth')
    @patch('src.Coach.CoachSignIn.get_secret_hash')
    def test_sign_in_coach_user_not_found_exception(self, mock_get_secret_hash, mock_initiate_auth):
        username = 'john.doe@example.com'
        password = 'password'
        mock_get_secret_hash.return_value = 'secret_hash'
        mock_initiate_auth.side_effect = ClientError({"Error": {"Code": "UserNotFoundException", "Message": "User Not Found"}}, "InitiateAuth")
        response, status_code = sign_in_coach(username, password)
        self.assertEqual(status_code, 400)
        self.assertEqual(response['message'], 'User Not Found')

    @patch('src.Coach.CoachSignIn.client.initiate_auth')
    @patch('src.Coach.CoachSignIn.get_secret_hash')
    def test_sign_in_coach_user_not_confirmed_exception(self, mock_get_secret_hash, mock_initiate_auth):
        username = 'john.doe@example.com'
        password = 'password'
        mock_get_secret_hash.return_value = 'secret_hash'
        mock_initiate_auth.side_effect = ClientError({"Error": {"Code": "UserNotConfirmedException", "Message": "User not yet confirmed"}}, "InitiateAuth")
        response, status_code = sign_in_coach(username, password)
        self.assertEqual(status_code, 400)
        self.assertEqual(response['message'], 'User not yet confirmed')

    @patch('src.Coach.CoachSignIn.client.initiate_auth')
    @patch('src.Coach.CoachSignIn.get_secret_hash')
    def test_sign_in_coach_general_exception(self, mock_get_secret_hash, mock_initiate_auth):
        username = 'john.doe@example.com'
        password = 'password'
        mock_get_secret_hash.return_value = 'secret_hash'
        mock_initiate_auth.side_effect = ClientError({"Error": {"Code": "UnknownException", "Message": "Unknown Exception"}}, "InitiateAuth")
        response = sign_in_coach(username, password)
        self.assertEqual(response[0]['message'], 'Error: Unknown Exception')
        self.assertEqual(response[1], 500)
