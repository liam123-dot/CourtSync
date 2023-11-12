import json
from unittest.mock import patch, MagicMock
import unittest
from flask import Flask
##
app = Flask(__name__)

with patch('boto3.client') as mock_boto3:
    from src.Timetable.Bookings.AddBooking import add_booking, validate_inputs

class TestAddBooking(unittest.TestCase):
    
    # initialise some common variables
    def setUp(self):
        self.valid_inputs = {
            'startTime': 1699432200,
            'duration': 60,
            'playerName': 'Test Player',
            'contactName': 'Test Contact',
            'isSameAsPlayerName': True,
            'email': 'test@example.com',
            'phoneNumber': '1234567890',
            'cost': 50,
            'ruleId': 1
        }

    @patch('src.Timetable.Bookings.AddBooking.validate_inputs')
    @patch('src.Timetable.Bookings.AddBooking.fetch_coach')
    @patch('src.Timetable.Bookings.AddBooking.check_for_overlap')
    @patch('src.Timetable.Bookings.AddBooking.insert_booking')
    @patch('src.Timetable.Bookings.AddBooking.send_confirmation_emails')
    @patch('src.Timetable.Bookings.AddBooking.time.time')
    def test_add_booking_success(
        self,
        mock_booking_time,
        mock_send_confirmation_emails,
        mock_insert_booking,
        mock_check_for_overlap,
        mock_fetch_coach,
        mock_validate_inputs
    ):
        mock_validate_inputs.return_value = True, ''
        mock_fetch_coach.return_value = 1, 'test@example.com', True, True
        mock_check_for_overlap.return_value = False
        mock_insert_booking.return_value = 'abc123'
        mock_booking_time.return_value = 1699432200

        
        with app.test_request_context('/timetable/test-coach/booking', method='POST', json=self.valid_inputs):
            response = add_booking('test-coach')

        assert response[1] == 200
        assert response[0].json == {'message': 'Booking successfully created'}

        mock_validate_inputs.assert_called_once_with(
            1699432200, 60, 'Test Player', 'Test Contact', True, 'test@example.com', '1234567890', 50, 1
        )
        mock_fetch_coach.assert_called_once_with('test-coach')
        mock_check_for_overlap.assert_called_once_with(1699432200, 60, 1)
        mock_insert_booking.assert_called_once_with(
            'Test Player', 'Test Contact', 'test@example.com', '1234567890', 1699432200, 50, 1, 60, 1, 1699432200
        )
        mock_send_confirmation_emails.assert_called_once_with(
            'test@example.com', 1699432200, 60, 50, 'abc123', 'Test Player', True, True, 1
        )

    @patch('src.Timetable.Bookings.AddBooking.validate_inputs')
    @patch('src.Timetable.Bookings.AddBooking.fetch_coach')
    def test_coach_not_found(self, mock_fetch_coach, mock_validate_inputs):
        mock_validate_inputs.return_value = True, None
        mock_fetch_coach.return_value = None, None, None, None
        
        with app.test_request_context('/timetable/test-coach/booking', method='POST', json=self.valid_inputs):
            response = add_booking('test-coach')

        assert response[1] == 404
        assert response[0].json == {'message': 'Coach not found'}
    
    # test that message is shown when validate inputs returns false
    @patch('src.Timetable.Bookings.AddBooking.validate_inputs')
    def test_invalid_inputs(self, mock_validate_inputs):
        mock_validate_inputs.return_value = False, 'test message'
        
        with app.test_request_context('/timetable/test-coach/booking', method='POST', json=self.valid_inputs):
            response = add_booking('test-coach')

        assert response[1] == 400
        assert response[0].json == {'message': 'test message'}
        
    # test that validate inpus correctly makes sure that none of the inputs are None/empty
    # makes sure that start time is in the future, that integers are positive that should be (cost/duration)
    # that playername and contactname are strings
    # emails and phone numbers are valid
    
    @patch('src.Timetable.Bookings.AddBooking.time.time')
    def test_validate_inputs(self, mock_time):
        mock_time.return_value = 1699440000
        start_time = 1699532200
        duration = 60
        player_name = 'Test Player'
        contact_name = 'Test Contact'
        is_same_as_player_name = True
        contact_email = 'test@test.com'
        contact_phone_number = '07921637582'
        cost = 50
        rule_id = 1
        
        assert validate_inputs(start_time, duration, player_name, contact_name, is_same_as_player_name, contact_email, contact_phone_number, cost, rule_id) == (True, None)
        
        
        contact_phone_number = '+447391930628'
        
        assert validate_inputs(start_time, duration, player_name, contact_name, is_same_as_player_name, contact_email, contact_phone_number, cost, rule_id) == (True, None)
        
        start_time = 1699432200
        assert validate_inputs(start_time, duration, player_name, contact_name, is_same_as_player_name, contact_email, contact_phone_number, cost, rule_id) == (False, 'Start time must be in the future')
        
        start_time = 1699532200
        duration = 0
        assert validate_inputs(start_time, duration, player_name, contact_name, is_same_as_player_name, contact_email, contact_phone_number, cost, rule_id) == (False, 'Duration must be a positive integer')
        
        duration = 'hello'
        assert validate_inputs(start_time, duration, player_name, contact_name, is_same_as_player_name, contact_email, contact_phone_number, cost, rule_id) == (False, 'Duration must be a positive integer')
        
        duration = 60
        
        player_name = 'h'
        assert validate_inputs(start_time, duration, player_name, contact_name, is_same_as_player_name, contact_email, contact_phone_number, cost, rule_id) == (False, 'Player name must be a string longer than 1 character')
        
        player_name = 'test player'
        email = 'test@test'
        assert validate_inputs(start_time, duration, player_name, contact_name, is_same_as_player_name, email, contact_phone_number, cost, rule_id) == (False, 'email is not valid')
        
        email = 'test@test.com'
        
        cost = 0
        assert validate_inputs(start_time, duration, player_name, contact_name, is_same_as_player_name, email, contact_phone_number, cost, rule_id) == (False, 'cost is not a positive integer')
        
        cost = "24"
        assert validate_inputs(start_time, duration, player_name, contact_name, is_same_as_player_name, email, contact_phone_number, cost, rule_id) == (False, 'cost is not a positive integer')