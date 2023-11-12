import unittest
from unittest.mock import patch, MagicMock


from src.Timetable.GetTimetable.GetTimetable import construct_sql_query_bookings, construct_new_booking, process_results_bookings, get_coach_events, get_bookings

class GetBookings(unittest.TestCase):
    def test_construct_sql_query_bookings(self):
        authorised = True
        expected = "SELECT booking_id, player_name, contact_name, contact_email, contact_phone_number, start_time, status, duration, cost, paid FROM Bookings WHERE coach_id=%s AND %s < start_time AND start_time < %s"
        self.assertEqual(construct_sql_query_bookings(authorised), expected)

        authorised = False
        expected = "SELECT booking_id, player_name, contact_name, contact_email, contact_phone_number, start_time, status, duration, cost, paid FROM Bookings WHERE coach_id=%s AND %s < start_time AND start_time < %s AND status!=\"cancelled\""
        self.assertEqual(construct_sql_query_bookings(authorised), expected)

    def test_process_results_bookings(self):
        results = [(1, 'player', 'contact', 'email@example.com', '1234567890', 1000000, 'confirmed', 60, 100, True)]
        authorised = True
        expected = {
            '12-01-1970': [
                {
                    'booking_id': 1,
                    'player_name': 'player',
                    'contact_name': 'contact',
                    'contact_email': 'email@example.com',
                    'contact_phone_number': '1234567890',
                    'start_time': 1000000,
                    'status': 'confirmed',
                    'duration': 60,
                    'cost': 100,
                    'paid': True
                }
            ]
        }
        self.assertEqual(process_results_bookings(results, authorised), expected)
        
        results = []
        authorised = True
        expected = {}
        self.assertEqual(process_results_bookings(results, authorised), expected)
        
    def test_construct_new_booking_authorised(self):
        booking = (1, 'player', 'contact', 'email@example.com', '1234567890', 1000000, 'confirmed', 60, 100, True)
        authorised = True
        expected = {
            'booking_id': 1,
            'player_name': 'player',
            'contact_name': 'contact',
            'contact_email': 'email@example.com',
            'contact_phone_number': '1234567890',
            'start_time': 1000000,
            'status': 'confirmed',
            'duration': 60,
            'cost': 100,
            'paid': True
        }
        self.assertEqual(construct_new_booking(booking, authorised), expected)

    def test_construct_new_booking_unauthorised(self):
        booking = (1, 'player', 'contact', 'email@example.com', '1234567890', 1000000, 'confirmed', 60, 100, True)
        authorised = False
        expected = {
            'start_time': 1000000,
            'status': 'confirmed',
            'duration': 60,
            'booking_id': True
        }
        self.assertEqual(construct_new_booking(booking, authorised), expected)
        
    @patch('src.Timetable.GetTimetable.GetTimetable.execute_query')
    def test_get_bookings_exception(self, mock_execute_query):
        mock_execute_query.side_effect = Exception('test')
        
        result = get_bookings('123', '123', '123', True)
        self.assertEqual(result, None)
       
        
from src.Timetable.GetTimetable.GetTimetable import construct_sql_coach_events, construct_new_coach_event, process_results_coach_events
class TestGetCoachEvents(unittest.TestCase):
    def test_construct_sql_coach_events(self):
        authorised = True
        expected = "SELECT event_id, start_time, duration, title, description FROM CoachEvents WHERE coach_id=%s AND %s < start_time AND start_time < %s"
        self.assertEqual(construct_sql_coach_events(authorised), expected)

        authorised = False
        expected = "SELECT start_time, duration FROM CoachEvents WHERE coach_id=%s AND %s < start_time AND start_time < %s "
        self.assertEqual(construct_sql_coach_events(authorised), expected)

    def test_construct_new_coach_event(self):
        coach_event = (1, 1000000, 60, 'title', 'description')
        authorised = True
        expected = {
            'event_id': 1,
            'start_time': 1000000,
            'duration': 60,
            'title': 'title',
            'description': 'description'
        }
        self.assertEqual(construct_new_coach_event(coach_event, authorised), expected)

        authorised = False
        coach_event = (1000000, 60)
        expected = {
            'start_time': 1000000,
            'duration': 60
        }
        self.assertEqual(construct_new_coach_event(coach_event, authorised), expected)

    def test_process_results_coach_events(self):
        results = [(1, 1000000, 60, 'title', 'description')]
        authorised = True
        expected = {
            '12-01-1970': [
                {
                    'event_id': 1,
                    'start_time': 1000000,
                    'duration': 60,
                    'title': 'title',
                    'description': 'description'
                }
            ]
        }
        self.assertEqual(process_results_coach_events(results, authorised), expected)
        
        results = []
        authorised = True
        expected = {}
        
        self.assertEqual(process_results_coach_events(results, authorised), expected)
        
    @patch('src.Timetable.GetTimetable.GetTimetable.execute_query')
    def test_get_coach_events_exception(self, mock_execute_query):
        mock_execute_query.side_effect = Exception('test')
        
        result = get_coach_events('123', '123', '123', True)
        self.assertEqual(result, None)
        
    
from src.Timetable.GetTimetable.GetTimetable import process_default_working_hours_results, get_default_working_hours
class TestGetDefaultWorkingHours(unittest.TestCase):
    
    def test_process_default_working_hours(self):
        results = [(1, 0, 240, 600), (2, 1, 240, 600)]
        expected = {
            0: {
                'working_hour_id': 1,
                'start_time': 240,
                'end_time': 600
            },
            1: {
                'working_hour_id': 2,
                'start_time': 240,
                'end_time': 600
            }
        }
        
        self.assertEqual(process_default_working_hours_results(results), expected)
        
    @patch('src.Timetable.GetTimetable.GetTimetable.execute_default_working_hours_query')
    def test_get_default_working_hours_exception(self, mock_execute_default_working_hours_query):
        mock_execute_default_working_hours_query.side_effect = Exception('test')
        
        result = get_default_working_hours('123')
        self.assertEqual(result, None)
        

from src.Timetable.GetTimetable.GetTimetable import process_pricing_rules_results, get_pricing_rules

class TestGetPricingRules(unittest.TestCase):

    def test_process_pricing_rules_results(self):
        results = [(1, 100, True, 1000000, 2000000)]
        expected = {
            '12-01-1970': [
                {
                    'rule_id': 1,
                    'hourly_rate': 100,
                    'is_default': True,
                    'start_time': 1000000,
                    'end_time': 2000000
                }
            ]
        }
        self.assertEqual(process_pricing_rules_results(results), expected)
        
        results = []
        expected = {}
        self.assertEqual(process_pricing_rules_results(results), expected)
        
    @patch('src.Timetable.GetTimetable.GetTimetable.execute_pricing_rules_query')
    def test_get_pricing_rules_exception(self, mock_execute_pricing_rules_query):
        mock_execute_pricing_rules_query.side_effect = Exception('test')
        
        result = get_pricing_rules('123')
        self.assertEqual(result, None)
    
from src.Timetable.GetTimetable.GetTimetable import get_durations    
class TestGetDurations(unittest.TestCase):
    
    @patch('src.Timetable.GetTimetable.GetTimetable.execute_query')
    def test_get_durations_exception(self, mock_execute_query):
        mock_execute_query.side_effect = Exception('test')
        
        result = get_durations('coach_id')
        self.assertEqual(result, None)