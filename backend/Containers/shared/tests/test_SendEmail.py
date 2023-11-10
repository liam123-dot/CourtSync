import unittest
from unittest.mock import patch

with patch('src.SendEmail.boto3') as mock_boto3:
    from src.SendEmail import send_email, validate_parameters

class TestValidateParameters(unittest.TestCase):
    
    def test_validate_parameters_valid(self):
        # Arrange
        localFrom = 'test_from'
        recipients = ['test_recipient@gmail.com']
        subject = 'test_subject'
        bodyText = 'test_bodyText'
        bodyHTML = '<html><body>Test</body></html>'

        # Act
        result, error_message = validate_parameters(localFrom, recipients, subject, bodyText, bodyHTML)

        # Assert
        self.assertTrue(result)
        self.assertIsNone(error_message)

    def test_validate_parameters_invalid_subject(self):
        # Arrange
        localFrom = 'test_from'
        recipients = ['test_recipient@gmail.com']
        subject = ''
        bodyText = 'test_bodyText'
        bodyHTML = '<html><body>Test</body></html>'

        # Act
        result, error_message = validate_parameters(localFrom, recipients, subject, bodyText, bodyHTML)

        # Assert
        self.assertFalse(result)
        self.assertEqual(error_message, 'subject must be a string and non empty')

    def test_validate_parameters_invalid_html(self):
        # Arrange
        localFrom = 'test_from'
        recipients = ['test_recipient@gmail.com']
        subject = 'test_subject'
        bodyText = 'test_bodyText'
        bodyHTML = '<html>Test'

        # Act
        result, error_message = validate_parameters(localFrom, recipients, subject, bodyText, bodyHTML)

        # Assert
        self.assertFalse(result)
        self.assertTrue('bodyHTML must have a body tag' in error_message)

if __name__ == '__main__':
    unittest.main()