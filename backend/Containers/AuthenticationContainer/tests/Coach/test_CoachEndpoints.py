import unittest
from unittest.mock import patch

with patch('boto3.client') as mock_boto3:
    from src.Coach.CoachEndpoints import validate_user_data

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
            
