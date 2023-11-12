import datetime
import unittest
from unittest.mock import patch, MagicMock
from src.Timetable.TimetableEndpoints import check_booking_valid, minutes_into_day, get_day_of_week_from_epoch
from flask import jsonify, Flask

app = Flask(__name__)

class TestUpdateWorkingHours(unittest.TestCase):
    
    # helper function for checkint that all bookings fit in proposed working hours
    def test_check_booking_valid(self):
        working_hours = {
            'start_time': 0,
            'end_time': 1440
        }
        self.assertTrue(check_booking_valid(0, 30, working_hours))
        self.assertTrue(check_booking_valid(0, 1440, working_hours))
        self.assertTrue(check_booking_valid(720, 720, working_hours))
        self.assertFalse(check_booking_valid(0, 1441, working_hours))
        self.assertFalse(check_booking_valid(0, 1440, {'start_time': 0, 'end_time': 1439}))
        self.assertFalse(check_booking_valid(0, 1440, {'start_time': 1, 'end_time': 1440}))
        self.assertFalse(check_booking_valid(0, 1440, {'start_time': 1, 'end_time': 1439}))
        self.assertFalse(check_booking_valid(1, 1440, {'start_time': 0, 'end_time': 1440}))
        self.assertTrue(check_booking_valid(0, 1440, {'start_time': 0, 'end_time': 1440}))        
        
        
class TestMinutesIntoDay(unittest.TestCase):
    def test_midnight(self):
        # Arrange
        dt = datetime.datetime(2022, 1, 1, 0, 0)
        epoch_time = dt.timestamp()

        # Act
        result = minutes_into_day(epoch_time)

        # Assert
        self.assertEqual(result, 0)

    def test_noon(self):
        # Arrange
        dt = datetime.datetime(2022, 1, 1, 12, 0)
        epoch_time = dt.timestamp()

        # Act
        result = minutes_into_day(epoch_time)

        # Assert
        self.assertEqual(result, 720)

    def test_random_time(self):
        # Arrange
        dt = datetime.datetime(2022, 1, 1, 13, 37)
        epoch_time = dt.timestamp()

        # Act
        result = minutes_into_day(epoch_time)

        # Assert
        self.assertEqual(result, 817)
        
class TestGetDayOfWeekFromEpoch(unittest.TestCase):
    def test_monday(self):
        # Arrange
        dt = datetime.datetime(2022, 1, 3)  # This is a Monday
        epoch_time = dt.timestamp()

        # Act
        result = get_day_of_week_from_epoch(epoch_time)

        # Assert
        self.assertEqual(result, 0)

    def test_wednesday(self):
        # Arrange
        dt = datetime.datetime(2022, 1, 5)  # This is a Wednesday
        epoch_time = dt.timestamp()

        # Act
        result = get_day_of_week_from_epoch(epoch_time)

        # Assert
        self.assertEqual(result, 2)

    def test_sunday(self):
        # Arrange
        dt = datetime.datetime(2022, 1, 9)  # This is a Sunday
        epoch_time = dt.timestamp()

        # Act
        result = get_day_of_week_from_epoch(epoch_time)

        # Assert
        self.assertEqual(result, 6)
        
from unittest.mock import call
from src.Timetable.TimetableEndpoints import check_working_hours_valid
import time
class TestCheckWorkingHoursValid(unittest.TestCase):
    @patch('src.Timetable.TimetableEndpoints.execute_query')
    @patch('src.Timetable.TimetableEndpoints.check_booking_valid')
    @patch('src.Timetable.TimetableEndpoints.minutes_into_day')
    @patch('src.Timetable.TimetableEndpoints.get_day_of_week_from_epoch')
    def test_check_working_hours_valid(self, mock_get_day, mock_minutes, mock_check_booking, mock_execute_query):
        # Arrange
        mock_execute_query.return_value = [(1609459200, 60), (1609462800, 60)]  # Two bookings at 2021-01-01 00:00 and 01:00
        mock_get_day.return_value = 4  # Friday
        mock_minutes.return_value = 0  # Midnight
        mock_check_booking.return_value = True
        working_hours = {
            '4': {
                'start_time': 0,
                'end_time': 1440
            }
        }

        # Act
        result = check_working_hours_valid(working_hours, 'test_coach_id')

        # Assert
        self.assertTrue(result)
        mock_execute_query.assert_called_once_with("SELECT start_time, duration FROM Bookings WHERE coach_id=%s and start_time>%s", ('test_coach_id', int(time.time())))
        mock_get_day.assert_has_calls([call(1609459200), call(1609462800)])
        mock_minutes.assert_has_calls([call(1609459200), call(1609462800)])
        mock_check_booking.assert_has_calls([call(0, 60, working_hours['4']), call(0, 60, working_hours['4'])])
        
from src.Timetable.TimetableEndpoints import update_or_insert_working_hours
class TestUpdateOrInsertWorkingHours(unittest.TestCase):
    @patch('src.Timetable.TimetableEndpoints.execute_query')
    def test_update_or_insert_working_hours(self, mock_execute_query):
        # Arrange
        mock_execute_query.side_effect = [
            [(0, 0, 0, 1), (720, 720, 1, 2)],  # Existing working hours
            None,  # Result of first update
            None,  # Result of second update
            None,  # Result of first insert
            None  # Result of second insert
        ]
        working_hours = {
            '0': {
                'start_time': 0,
                'end_time': 720,
                'working_hour_id': 2
            },
            '1': {
                'start_time': 720,
                'end_time': 1440,
                'working_hour_id': 1
            },
            '2': {
                'start_time': 0,
                'end_time': 720
            },
            '3': {
                'start_time': 720,
                'end_time': 1440
            }
        }
        username = 'test_coach_id'

        # Act
        result = update_or_insert_working_hours(working_hours, username)

        # Assert
        self.assertTrue(result)
        mock_execute_query.assert_has_calls([
            call("SELECT start_time, end_time, day_of_week, working_hour_id FROM WorkingHours WHERE coach_id=%s AND is_default=1", (username, )),
            call("UPDATE WorkingHours SET start_time=%s, end_time=%s WHERE working_hour_id=%s AND coach_id=%s", (0, 720, 2, username)),
            call("UPDATE WorkingHours SET start_time=%s, end_time=%s WHERE working_hour_id=%s AND coach_id=%s", (720, 1440, 1, username)),
            call("INSERT INTO WorkingHours(day_of_week, start_time, end_time, coach_id) VALUES (%s, %s, %s, %s)", (2, 0, 720, username)),
            call("INSERT INTO WorkingHours(day_of_week, start_time, end_time, coach_id) VALUES (%s, %s, %s, %s)", (3, 720, 1440, username))
        ])
        
        
from src.Timetable.TimetableEndpoints import check_for_update
class TestCheckForUpdate(unittest.TestCase):
    def test_no_working_hour_id(self):
        # Arrange
        working_hour_id = None
        existing_working_hours = [(0, 0, 0, 1), (720, 720, 1, 2)]

        # Act
        result = check_for_update(working_hour_id, existing_working_hours)

        # Assert
        self.assertFalse(result)

    def test_working_hour_id_not_in_existing(self):
        # Arrange
        working_hour_id = 3
        existing_working_hours = [(0, 0, 0, 1), (720, 720, 1, 2)]

        # Act
        result = check_for_update(working_hour_id, existing_working_hours)

        # Assert
        self.assertFalse(result)

    def test_working_hour_id_in_existing(self):
        # Arrange
        working_hour_id = 2
        existing_working_hours = [(0, 0, 0, 1), (720, 720, 1, 2)]

        # Act
        result = check_for_update(working_hour_id, existing_working_hours)

        # Assert
        self.assertEqual(result, working_hour_id)
        
    def test_no_existing_working_hous(self):
        # Arrange
        working_hour_id = 2
        existing_working_hours = []

        # Act
        result = check_for_update(working_hour_id, existing_working_hours)

        # Assert
        self.assertFalse(result)    
        
from src.Timetable.TimetableEndpoints import check_authorisation

class TestCheckAuthorisation(unittest.TestCase):
    @patch('src.Timetable.TimetableEndpoints.get_access_token_username')
    @patch('src.Timetable.TimetableEndpoints.execute_query')
    def test_check_authorisation_no_token(self, mock_execute_query, mock_get_access_token_username):
        # Arrange
        slug = 'test_slug'

        with app.test_request_context(f"/timetable/{slug}/check-authorisation", method='GET', headers={}):
            result = check_authorisation(slug)

        # Assert
        self.assertEqual(result[1], 200)
        self.assertEqual(result[0].json,  {'authorised': False})
        
        with app.test_request_context(f"/timetable/{slug}/check-authorisation", method='GET'):
            result = check_authorisation(slug)
            
        self.assertEqual(result[1], 200)
        self.assertEqual(result[0].json,  {'authorised': False})
        

    @patch('src.Timetable.TimetableEndpoints.get_access_token_username')
    @patch('src.Timetable.TimetableEndpoints.execute_query')
    def test_check_authorisation_invalid_token(self, mock_execute_query, mock_get_access_token_username):
        # Arrange
        mock_get_access_token_username.return_value = (False, None)
        slug = 'test_slug'

        with app.test_request_context(f"/timetable/{slug}/check-authorisation", method='GET', headers={'Authorization': '123'}):
            result = check_authorisation(slug)

        # Assert
        self.assertEqual(result[1], 200)
        self.assertEqual(result[0].json,  {'authorised': False})

    @patch('src.Timetable.TimetableEndpoints.get_access_token_username')
    @patch('src.Timetable.TimetableEndpoints.execute_query')
    def test_check_authorisation_coach_does_not_exist(self, mock_execute_query, mock_get_access_token_username):
        # Arrange
        mock_get_access_token_username.return_value = (True, 'test_username')
        mock_execute_query.side_effect = IndexError
        slug = 'test_slug'

        # Act
        with app.test_request_context(f"/timetable/{slug}/check-authorisation", method='GET', headers={'Authorization': '123'}):
            result = check_authorisation(slug)

        # Assert
        self.assertEqual(result[1], 400)
        self.assertEqual(result[0].json,  {'message': 'Coach with passed slug does not exist'})

    @patch('src.Timetable.TimetableEndpoints.get_access_token_username')
    @patch('src.Timetable.TimetableEndpoints.execute_query')
    def test_check_authorisation_coach_is_user(self, mock_execute_query, mock_get_access_token_username):
        # Arrange
        mock_get_access_token_username.return_value = (True, 'test_username')
        mock_execute_query.return_value = [('test_username',)]
        slug = 'test_slug'

        # Act
        with app.test_request_context(f"/timetable/{slug}/check-authorisation", method='GET', headers={'Authorization': '123'}):
            result = check_authorisation(slug)

        # Assert
        self.assertEqual(result[1],  200)
        self.assertEqual(result[0].json,  {'authorised': True})
