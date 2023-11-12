import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime
from src.Timetable.Bookings.BookingsCancelling import coach_cancel_lesson
from flask import Flask

app = Flask(__name__)

class TestBookingsCancelling(unittest.TestCase):

    @patch('src.Timetable.Bookings.BookingsCancelling.get_access_token_username')
    @patch('src.Timetable.Bookings.BookingsCancelling.get_booking_by_id')
    @patch('src.Timetable.Bookings.BookingsCancelling.cancel_booking')
    @patch('src.Timetable.Bookings.BookingsCancelling.send_player_cancellation_by_coach_confirmation_email')
    def test_coach_cancel_lesson_success(self, mock_send_email, mock_cancel_booking, mock_get_booking_by_id, mock_get_access_token_username):
        # Arrange
        mock_get_access_token_username.return_value = (True, 'test_user')
        mock_get_booking_by_id.return_value = ('test_email@test.com', datetime(2022, 2, 10, 12, 0, 0))
        mock_cancel_booking.return_value = True

        # Act
        # mock the requests.headers.get function to return a token
        with app.test_request_context('/timetable/booking/test_booking_id/cancel', method='POST', headers={'Authorization': '123'}, json={'message_to_player': 'test_message'}  ):
            response = coach_cancel_lesson('test_booking_id')
        
        print(response)
        print(response[0].json)
        # Assert
        self.assertEqual(response[1], 200)
        self.assertEqual(response[0].json, {'message': 'Booking successfully cancelled'})
        mock_send_email.assert_called_once_with('test_email@test.com', datetime(2022, 2, 10, 12, 0, 0), 'test_message')

    def test_coach_cancel_lesson_no_token(self, ):
        # Arrange

        # Act
        with app.test_request_context('/timetable/booking/test_booking_id/cancel', method='POST', headers={}, json={'message_to_player': 'test_message'}  ):
            response = coach_cancel_lesson('test_booking_id')

        # Assert
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {'message': 'No token provided'})

    @patch('src.Timetable.Bookings.BookingsCancelling.get_access_token_username')
    def test_coach_cancel_lesson_unauthorized(self, mock_get_access_token_username):
        # Arrange
        mock_get_access_token_username.return_value = (False, None)

        with app.test_request_context('/timetable/booking/test_booking_id/cancel', method='POST', headers={'Authorization': '123'}, json={'message_to_player': 'test_message'}  ):
            response = coach_cancel_lesson('test_booking_id')

        # Assert
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {'message': 'Unauthorised'})

    @patch('src.Timetable.Bookings.BookingsCancelling.get_access_token_username')
    @patch('src.Timetable.Bookings.BookingsCancelling.get_booking_by_id')
    def test_coach_cancel_lesson_invalid_booking_id(self, mock_get_booking_by_id, mock_get_access_token_username):
        # Arrange
        mock_get_access_token_username.return_value = (True, 'test_user')
        mock_get_booking_by_id.return_value = None

        with app.test_request_context('/timetable/booking/test_booking_id/cancel', method='POST', headers={'Authorization': '123'}, json={'message_to_player': 'test_message'}  ):
            response = coach_cancel_lesson('test_booking_id')

        # Assert
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {'message': 'Invalid booking id'})

    @patch('src.Timetable.Bookings.BookingsCancelling.get_access_token_username')
    @patch('src.Timetable.Bookings.BookingsCancelling.get_booking_by_id')
    def test_coach_cancel_lesson_missing_message(self, mock_get_booking_by_id, mock_get_access_token_username):
        # Arrange
        mock_get_access_token_username.return_value = (True, 'test_user')
        mock_get_booking_by_id.return_value = ('test_email@test.com', datetime(2022, 2, 10, 12, 0, 0))

        with app.test_request_context('/timetable/booking/test_booking_id/cancel', method='POST', headers={'Authorization': '123'}, json={}  ):
            response = coach_cancel_lesson('test_booking_id')

        # Assert
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {"message": "Missing/Invalid key: 'message_to_player'"})
        

from src.Timetable.Bookings.BookingsCancelling import get_booking_by_hash_endpoint

class TestGetBookingByHash(unittest.TestCase):

    @patch('src.Timetable.Bookings.BookingsCancelling.execute_query')
    def test_get_booking_by_hash_success(self, mock_execute_query):
        # Arrange
        mock_execute_query.return_value = [('player1', 'contact1', 60, '2022-01-01 10:00:00', 100, 'booked')]

        # Act
        with app.test_request_context('/timetable/player-bookings/test_hash', method='GET'):
            response = get_booking_by_hash_endpoint('test_hash')

        # Assert
        self.assertEqual(response[1], 200)
        self.assertEqual(response[0].json, {
            'player_name': 'player1',
            'contact_name': 'contact1',
            'duration': 60,
            'start_time': '2022-01-01 10:00:00',
            'cost': 100,
            'status': 'booked'
        })

    @patch('src.Timetable.Bookings.BookingsCancelling.execute_query')
    def test_get_booking_by_hash_no_booking(self, mock_execute_query):
        # Arrange
        mock_execute_query.return_value = []

        # Act
        with app.test_request_context('/timetable/player-bookings/test_hash', method='GET'):
            response = get_booking_by_hash_endpoint('test_hash')

        # Assert
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {'message': 'Invalid link, no booking exists'})

    @patch('src.Timetable.Bookings.BookingsCancelling.execute_query')
    def test_get_booking_by_hash_already_cancelled(self, mock_execute_query):
        # Arrange
        mock_execute_query.return_value = [('player1', 'contact1', 60, '2022-01-01 10:00:00', 100, 'cancelled')]

        # Act
        with app.test_request_context('/timetable/player-bookings/test_hash', method='GET'):
            response = get_booking_by_hash_endpoint('test_hash')

        # Assert
        self.assertEqual(response[1], 400)
        self.assertEqual(response[0].json, {'message': 'This lesson has already been cancelled'})
        

from src.Timetable.Bookings.BookingsCancelling import get_booking_by_hash, get_coach_email_by_id, update_booking_status, player_cancel_booking_by_hash

class TestPlayerCancelBookingByHash(unittest.TestCase):
    
    @patch('src.Timetable.Bookings.BookingsCancelling.execute_query')
    def test_get_booking_by_hash_success(self, mock_execute_query):
        # Arrange
        mock_execute_query.return_value = [(1, '2022-01-01 10:00:00', 'player1', 'booked', 60, 'contact1@test.com', '1234567890')]

        # Act
        booking = get_booking_by_hash('test_hash')

        # Assert
        self.assertEqual(booking, {
            'coach_id': 1,
            'start_time': '2022-01-01 10:00:00',
            'player_name': 'player1',
            'status': 'booked',
            'duration': 60,
            'contact_email': 'contact1@test.com',
            'contact_phone_number': '1234567890'
        })

    @patch('src.Timetable.Bookings.BookingsCancelling.execute_query')
    def test_get_booking_by_hash_no_booking(self, mock_execute_query):
        # Arrange
        mock_execute_query.return_value = []

        # Act
        booking = get_booking_by_hash('test_hash')

        # Assert
        self.assertIsNone(booking)

    @patch('src.Timetable.Bookings.BookingsCancelling.execute_query')
    def test_get_coach_email_by_id_success(self, mock_execute_query):
        # Arrange
        mock_execute_query.return_value = [('coach1@test.com', )]

        # Act
        email = get_coach_email_by_id(1)

        # Assert
        self.assertEqual(email, 'coach1@test.com')

    @patch('src.Timetable.Bookings.BookingsCancelling.execute_query')
    def test_get_coach_email_by_id_no_coach(self, mock_execute_query):
        # Arrange
        mock_execute_query.return_value = []

        # Act
        email = get_coach_email_by_id(1)

        # Assert
        self.assertIsNone(email)

    @patch('src.Timetable.Bookings.BookingsCancelling.execute_query')
    def test_update_booking_status(self, mock_execute_query):
        # Arrange
        mock_execute_query.return_value = None

        # Act
        update_booking_status('test_hash', 'cancelled', 'test_message')

        # Assert
        mock_execute_query.assert_called_once_with("UPDATE Bookings SET status=%s, message_from_player=%s WHERE hash=%s", ('cancelled', 'test_message', 'test_hash'))