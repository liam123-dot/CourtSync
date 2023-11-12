import unittest
from src.Coach.AttributeVerification import is_password_valid

class TestPasswordValidation(unittest.TestCase):
    def test_valid_password(self):
        password = 'Valid$123'
        self.assertTrue(is_password_valid(password))

    def test_password_too_short(self):
        password = 'V$1a'
        self.assertFalse(is_password_valid(password))

    def test_password_missing_lowercase(self):
        password = 'VALID$123'
        self.assertFalse(is_password_valid(password))

    def test_password_missing_uppercase(self):
        password = 'valid$123'
        self.assertFalse(is_password_valid(password))

    def test_password_missing_digit(self):
        password = 'Valid$Password'
        self.assertFalse(is_password_valid(password))

    def test_password_missing_special_character(self):
        password = 'ValidPassword123'
        self.assertFalse(is_password_valid(password))

if __name__ == '__main__':
    unittest.main()