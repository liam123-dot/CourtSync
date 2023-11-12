import unittest
import json
from unittest.mock import patch
#
with patch('boto3.client') as mock_boto3:
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
        
    @patch('src.SendEmail.client.send_message')
    def test_valid_inputs(self, mock_send_message):
        # Arrange
        localFrom = 'test_from'
        recipients = ['test_recipient@gmail.com']
        subject = 'test_subject'
        bodyText = 'test_bodyText'
        bodyHTML = '<html><body>Test</body></html>'
        
        response = send_email(localFrom, recipients, subject, bodyText, bodyHTML)
        
        # check that client.send_message was called with the correct parameters
        mock_send_message.assert_called_with(
            QueueUrl='https://sqs.eu-west-2.amazonaws.com/925465361057/EmailNotificationsQueue-test',
            MessageBody=json.dumps({
                'localFrom': localFrom,
                'addresses': recipients,
                'subject': subject,
                'bodyText': bodyText,
                'bodyHTML': bodyHTML            
            })
        )

if __name__ == '__main__':
    unittest.main()