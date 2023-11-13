import unittest
from unittest.mock import patch
from flask import Flask
import boto3

app = Flask(__name__)

with patch('boto3.client') as mock_boto3:
    from src.Coach.CoachSignUp import validate_user_data, extract_user_data, format_phone_number, coach_sign_up

class TestValidateUserData(unittest.TestCase):
    def test_validate_user_data_success(self):
        user_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'StrongPassword123!',
            'confirm_password': 'StrongPassword123!',
            'phone_number': '+441234567890',
            'email': 'john.doe@example.com'
        }
        # Should not raise any exception
        validate_user_data(user_data)

    def test_validate_user_data_short_name(self):
        user_data = {
            'first_name': 'J',
            'last_name': 'D',
            'password': 'StrongPassword123',
            'confirm_password': 'StrongPassword123',
            'phone_number': '+441234567890',
            'email': 'john.doe@example.com'
        }
        with self.assertRaises(ValueError) as context:
            validate_user_data(user_data)
            self.assertEqual(str(context.exception), 'First name and last name must be greater than 1 character')

    def test_validate_user_data_password_mismatch(self):
        user_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'StrongPassword123',
            'confirm_password': 'DifferentPassword123',
            'phone_number': '+441234567890',
            'email': 'john.doe@example.com'
        }
        with self.assertRaises(ValueError) as context:
            validate_user_data(user_data)
            self.assertEqual(str(context.exception), 'Passwords do not match')

    def test_validate_user_data_weak_password(self):
        user_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'weakpassword',
            'confirm_password': 'weakpassword',
            'phone_number': '+441234567890',
            'email': 'john.doe@example.com'
        }
        with self.assertRaises(ValueError) as context:
            validate_user_data(user_data)
            self.assertEqual(str(context.exception), 'Password not strong enough')

    def test_validate_user_data_invalid_phone_number(self):
        user_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'StrongPassword123',
            'confirm_password': 'StrongPassword123',
            'phone_number': '1234567890',
            'email': 'john.doe@example.com'
        }
        with self.assertRaises(ValueError) as context:
            validate_user_data(user_data)
            self.assertEqual(str(context.exception), 'Invalid UK phone number')

        user_data['phone_number'] = '+44739193062'
        with self.assertRaises(ValueError) as context:
            validate_user_data(user_data)
            self.assertEqual(str(context.exception), 'Invalid UK phone number')
    
    def test_validate_user_data_invalid_email(self):
        user_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'StrongPassword123',
            'confirm_password': 'StrongPassword123',
            'phone_number': '+441234567890',
            'email': 'email@example'
        }
        with self.assertRaises(ValueError) as context:
            validate_user_data(user_data)
            self.assertEqual(str(context.exception), 'Invalid Email')
            
        user_data['email'] = 'email.example.com'
        with self.assertRaises(ValueError) as context:
            validate_user_data(user_data)
            self.assertEqual(str(context.exception), 'Invalid Email')
            
        user_data['email'] = 'email@example.com.'
        with self.assertRaises(ValueError) as context:
            validate_user_data(user_data)
            self.assertEqual(str(context.exception), 'Invalid Email')
            
class TestExtractUserData(unittest.TestCase):
    def test_extract_user_data_success(self):
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'StrongPassword123',
            'confirm_password': 'StrongPassword123',
            'phone_number': '+441234567890',
            'email': 'john.doe@example.com',
            'extra_key': 'extra_value'
        }
        expected_result = {
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'StrongPassword123',
            'confirm_password': 'StrongPassword123',
            'phone_number': '+441234567890',
            'email': 'john.doe@example.com'
        }
        result = extract_user_data(data)
        self.assertEqual(result, expected_result)

    def test_extract_user_data_missing_key(self):
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'StrongPassword123',
            'confirm_password': 'StrongPassword123',
            'phone_number': '+441234567890',
            # 'email' key is missing
        }
        with self.assertRaises(KeyError) as context:
            extract_user_data(data)
        self.assertEqual(str(context.exception), "'email'")
        
class TestFormatPhoneNumber(unittest.TestCase):
    def test_format_phone_number_starts_with_zero(self):
        phone_number = '07123456789'
        expected_result = '+447123456789'
        result = format_phone_number(phone_number)
        self.assertEqual(result, expected_result)

    def test_format_phone_number_does_not_start_with_zero(self):
        phone_number = '+447123456789'
        expected_result = '+447123456789'
        result = format_phone_number(phone_number)
        self.assertEqual(result, expected_result)
        
from botocore.exceptions import ClientError

class TestCoachSignUp(unittest.TestCase):
    @patch('src.Coach.CoachSignUp.create_user')
    @patch('src.Coach.CoachSignUp.insert_into_table')
    def test_coach_sign_up_success(self, mock_insert_into_table, mock_create_user):
        test_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'StrongPassword123!',
            'confirm_password': 'StrongPassword123!',
            'phone_number': '+441234567890',
            'email': 'john.doe@example.com'
        }
        mock_create_user.return_value = 'user_id'
        with app.test_request_context('/auth/coach', method='POST', json=test_data ):    
            response = coach_sign_up()
        self.assertEqual(response[1], 200)
        mock_insert_into_table.assert_called_once_with('user_id', 'John', 'Doe', 'john.doe@example.com')

    def test_coach_sign_up_missing_key(self):
        test_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'StrongPassword123',
            'confirm_password': 'StrongPassword123',
            'phone_number': '+441234567890',
            # 'email' key is missing
        }
        with app.test_request_context('/auth/coach', method='POST', json=test_data ):    
            response = coach_sign_up()
        self.assertEqual(response[1], 400)
        
    @patch('src.Coach.CoachSignUp.create_user')
    def test_coach_sign_up_boto3_error(self, mock_create_user):
        test_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'StrongPassword123!',
            'confirm_password': 'StrongPassword123!',
            'phone_number': '+441234567890',
            'email': 'john.doe@example.com'
        }
        mock_create_user.side_effect = ClientError({"Error": {"Code": "UsernameExistsException", "Message": "User already exists"}}, "CreateUser")
        with app.test_request_context('/auth/coach', method='POST', json=test_data ):    
            response = coach_sign_up()
            
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json['message'], 'Email already exists')
        
        mock_create_user.side_effect = ClientError({"Error": {"Code": "InvalidPasswordException", "Message": "Password not strong enough"}}, "CreateUser")
        with app.test_request_context('/auth/coach', method='POST', json=test_data ):    
            response = coach_sign_up()
            
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json['message'], 'Password not strong enough')
        
with patch('boto3.client') as mock_boto3:
    from src.Coach.CoachSignUp import get_request_data, confirm_sign_up, confirm_coach_sign_up
        
class TestConfirmCoachSignUp(unittest.TestCase):
    @patch('src.Coach.CoachSignUp.get_request_data')
    @patch('src.Coach.CoachSignUp.confirm_sign_up')
    def test_confirm_coach_sign_up_success(self, mock_confirm_sign_up, mock_get_request_data):
        email = 'john.doe@example.com'
        confirmation_code = '123456'
        mock_get_request_data.return_value = (email, confirmation_code)
        mock_confirm_sign_up.return_value = 'success'
        with app.test_request_context('/auth/coach/confirm', method='POST'):
            response = confirm_coach_sign_up()
        self.assertEqual(response[1], 200)
        self.assertEqual(response[0].json, 'success')

    @patch('src.Coach.CoachSignUp.get_request_data')
    @patch('src.Coach.CoachSignUp.confirm_sign_up')
    def test_confirm_coach_sign_up_value_error(self, mock_confirm_sign_up, mock_get_request_data):
        email = 'john.doe@example.com'
        confirmation_code = '123456'
        mock_get_request_data.return_value = (email, confirmation_code)
        mock_confirm_sign_up.side_effect = ValueError('Invalid Confirmation Code')
        with app.test_request_context('/auth/coach/confirm', method='POST'):
            response = confirm_coach_sign_up()
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json['message'], 'Invalid Confirmation Code')

    @patch('src.Coach.CoachSignUp.get_request_data')
    @patch('src.Coach.CoachSignUp.confirm_sign_up')
    def test_confirm_coach_sign_up_client_error(self, mock_confirm_sign_up, mock_get_request_data):
        email = 'john.doe@example.com'
        confirmation_code = '123456'
        mock_get_request_data.return_value = (email, confirmation_code)
        mock_confirm_sign_up.side_effect = ClientError({"Error": {"Code": "CodeMismatchException", "Message": "Incorrect Confirmation Code"}}, "ConfirmSignUp")
        with app.test_request_context('/auth/coach/confirm', method='POST'):
            response = confirm_coach_sign_up()
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json['message'], 'Incorrect Confirmation Code')

    @patch('src.Coach.CoachSignUp.get_request_data')
    @patch('src.Coach.CoachSignUp.confirm_sign_up')
    def test_confirm_coach_sign_up_general_exception(self, mock_confirm_sign_up, mock_get_request_data):
        email = 'john.doe@example.com'
        confirmation_code = '123456'
        mock_get_request_data.return_value = (email, confirmation_code)
        mock_confirm_sign_up.side_effect = Exception('General Error')
        with app.test_request_context('/auth/coach/confirm', method='POST'):
            response = confirm_coach_sign_up()
        self.assertEqual(response[1], 500)
        self.assertEqual(response[0].json['message'], 'Error: General Error')