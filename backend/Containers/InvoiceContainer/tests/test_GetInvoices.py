import unittest
from unittest.mock import patch, ANY
from flask import Flask
app = Flask(__name__)
from src.GetInvoices import fetch_contact_names, get_weekly_or_monthly_invoices, get_daily_invoices, get_invoices, get_invoices_endpoint, get_query_parameters

class TestFetchContactNames(unittest.TestCase):
    
    @patch('src.GetInvoices.execute_query')
    def test_fetch_contact_names_non_empty_input(self, mock_execute_query):
        mock_execute_query.return_value = [('1234567890', 'John Doe'), ('0987654321', 'Jane Doe')]
        actual = fetch_contact_names(['1234567890', '0987654321'])
        expected = [('1234567890', 'John Doe'), ('0987654321', 'Jane Doe')]
        self.assertEqual(actual, expected)
        mock_execute_query.assert_called_once_with(ANY, ['1234567890', '0987654321'])

    @patch('src.GetInvoices.execute_query')
    def test_fetch_contact_names_single_input(self, mock_execute_query):
        mock_execute_query.return_value = [('1234567890', 'John Doe')]
        actual = fetch_contact_names(['1234567890'])
        expected = [('1234567890', 'John Doe')]
        self.assertEqual(actual, expected)
        mock_execute_query.assert_called_once_with(ANY, ['1234567890'])

    @patch('src.GetInvoices.execute_query')
    def test_fetch_contact_names_no_results(self, mock_execute_query):
        mock_execute_query.return_value = []
        actual = fetch_contact_names(['1234567890'])
        expected = []
        self.assertEqual(actual, expected)
        mock_execute_query.assert_called_once_with(ANY, ['1234567890'])
        
class TestGetWeeklyOrMonthlyInvoices(unittest.TestCase):
    @patch('src.GetInvoices.execute_query')
    @patch('src.GetInvoices.fetch_contact_names')
    def test_get_invoices_with_contact_phone_number(self, mock_fetch_contact_names, mock_execute_query):
        mock_execute_query.return_value = [('1234567890', 2, 100, '202201')]
        mock_fetch_contact_names.return_value = [('1234567890', 'John Doe')]
        request_data = {'contact_phone_number': '1234567890', 'status_view': 'pending', 'limit': 10, 'offset': 0}
        actual = get_weekly_or_monthly_invoices('username', request_data)
        expected = [{'contact_phone_number': '1234567890', 'bookings_count': 2, 'total_cost': 100, 'year_week': '202201', 'contact_name': 'John Doe'}]
        self.assertEqual(actual, expected)

    @patch('src.GetInvoices.execute_query')
    @patch('src.GetInvoices.fetch_contact_names')
    def test_get_invoices_without_contact_phone_number(self, mock_fetch_contact_names, mock_execute_query):
        mock_execute_query.return_value = [('1234567890', 2, 100, '202201'), ('0987654321', 1, 50, '202201')]
        mock_fetch_contact_names.return_value = [('1234567890', 'John Doe'), ('0987654321', 'Jane Doe')]
        request_data = {'contact_phone_number': None, 'status_view': 'pending', 'limit': 10, 'offset': 0}
        actual = get_weekly_or_monthly_invoices('username', request_data)
        expected = [{'contact_phone_number': '1234567890', 'bookings_count': 2, 'total_cost': 100, 'year_week': '202201', 'contact_name': 'John Doe'},
                    {'contact_phone_number': '0987654321', 'bookings_count': 1, 'total_cost': 50, 'year_week': '202201', 'contact_name': 'Jane Doe'}]
        self.assertEqual(actual, expected)

    @patch('src.GetInvoices.execute_query')
    @patch('src.GetInvoices.fetch_contact_names')
    def test_get_invoices_no_results(self, mock_fetch_contact_names, mock_execute_query):
        mock_execute_query.return_value = []
        mock_fetch_contact_names.return_value = []
        request_data = {'contact_phone_number': None, 'status_view': 'pending', 'limit': 10, 'offset': 0}
        actual = get_weekly_or_monthly_invoices('username', request_data)
        expected = []
        self.assertEqual(actual, expected)
        
class TestGetDailyInvoices(unittest.TestCase):
    @patch('src.GetInvoices.execute_query')
    def test_get_daily_invoices_with_contact_phone_number(self, mock_execute_query):
        mock_execute_query.return_value = [(1, 'John Doe', '2022-01-01 10:00:00', 'Jane Doe', 100, True, 10, 60, '1234567890')]
        request_data = {'contact_phone_number': '1234567890', 'status_view': 'pending', 'limit': 10, 'offset': 0}
        actual = get_daily_invoices('username', request_data)
        expected = [{'booking_id': 1, 'player_name': 'John Doe', 'start_time': '2022-01-01 10:00:00', 'contact_name': 'Jane Doe', 'cost': 100, 'paid': True, 'extra_costs': 10, 'duration': 60, 'contact_phone_number': '1234567890'}]
        self.assertEqual(actual, expected)

    @patch('src.GetInvoices.execute_query')
    def test_get_daily_invoices_without_contact_phone_number(self, mock_execute_query):
        mock_execute_query.return_value = [(1, 'John Doe', '2022-01-01 10:00:00', 'Jane Doe', 100, True, 10, 60, '1234567890'), (2, 'Jane Doe', '2022-01-01 11:00:00', 'John Doe', 50, False, 5, 30, '0987654321')]
        request_data = {'contact_phone_number': None, 'status_view': 'pending', 'limit': 10, 'offset': 0}
        actual = get_daily_invoices('username', request_data)
        expected = [{'booking_id': 1, 'player_name': 'John Doe', 'start_time': '2022-01-01 10:00:00', 'contact_name': 'Jane Doe', 'cost': 100, 'paid': True, 'extra_costs': 10, 'duration': 60, 'contact_phone_number': '1234567890'},
                    {'booking_id': 2, 'player_name': 'Jane Doe', 'start_time': '2022-01-01 11:00:00', 'contact_name': 'John Doe', 'cost': 50, 'paid': False, 'extra_costs': 5, 'duration': 30, 'contact_phone_number': '0987654321'}]
        self.assertEqual(actual, expected)

    @patch('src.GetInvoices.execute_query')
    def test_get_daily_invoices_no_results(self, mock_execute_query):
        mock_execute_query.return_value = []
        request_data = {'contact_phone_number': None, 'status_view': 'pending', 'limit': 10, 'offset': 0}
        actual = get_daily_invoices('username', request_data)
        expected = []
        self.assertEqual(actual, expected)
        
class TestGetInvoices(unittest.TestCase):
    @patch('src.GetInvoices.get_daily_invoices')
    def test_get_invoices_daily_view(self, mock_get_daily_invoices):
        mock_get_daily_invoices.return_value = [{'booking_id': 1, 'player_name': 'John Doe', 'start_time': '2022-01-01 10:00:00', 'contact_name': 'Jane Doe', 'cost': 100, 'paid': True, 'extra_costs': 10, 'duration': 60, 'contact_phone_number': '1234567890'}]
        request_data = {'view': 'daily', 'contact_phone_number': '1234567890', 'status_view': 'pending', 'limit': 10, 'offset': 0}
        actual = get_invoices('username', request_data)
        expected = [{'booking_id': 1, 'player_name': 'John Doe', 'start_time': '2022-01-01 10:00:00', 'contact_name': 'Jane Doe', 'cost': 100, 'paid': True, 'extra_costs': 10, 'duration': 60, 'contact_phone_number': '1234567890'}]
        self.assertEqual(actual, expected)

    @patch('src.GetInvoices.get_weekly_or_monthly_invoices')
    def test_get_invoices_weekly_or_monthly_view(self, mock_get_weekly_or_monthly_invoices):
        mock_get_weekly_or_monthly_invoices.return_value = [{'contact_phone_number': '1234567890', 'bookings_count': 2, 'total_cost': 100, 'year_week': '202201', 'contact_name': 'John Doe'}]
        request_data = {'view': 'weekly', 'contact_phone_number': '1234567890', 'status_view': 'pending', 'limit': 10, 'offset': 0}
        actual = get_invoices('username', request_data)
        expected = [{'contact_phone_number': '1234567890', 'bookings_count': 2, 'total_cost': 100, 'year_week': '202201', 'contact_name': 'John Doe'}]
        self.assertEqual(actual, expected)
        
class TestGetInvoicesEndpoint(unittest.TestCase):
    @patch('src.GetInvoices.get_query_parameters')
    def test_get_invoices_endpoint_query_parameters_error(self, mock_get_query_parameters):
        mock_get_query_parameters.return_value = (None, "Error message", 400)
        with app.test_request_context('/invoices', method='GET'):
            response, status = get_invoices_endpoint()
            self.assertEqual(status, 400)
            self.assertEqual(response, "Error message")

    @patch('src.GetInvoices.get_access_token_username')
    @patch('src.GetInvoices.get_query_parameters')
    def test_get_invoices_endpoint_no_authorization_token(self, mock_get_query_parameters, mock_get_access_token_username):
        mock_get_query_parameters.return_value = ({'view': 'daily'}, None, 200)
        with app.test_request_context('/invoices', method='GET'):
            response, status = get_invoices_endpoint()
            self.assertEqual(status, 401)
            self.assertEqual(response.json, {"message": "Unauthorized"})

    @patch('src.GetInvoices.get_access_token_username')
    @patch('src.GetInvoices.get_query_parameters')
    def test_get_invoices_endpoint_invalid_authorization_token(self, mock_get_query_parameters, mock_get_access_token_username):
        mock_get_query_parameters.return_value = ({'view': 'daily'}, None, 200)
        mock_get_access_token_username.return_value = (False, None)
        with app.test_request_context('/invoices', method='GET', headers={'Authorization': 'Invalid token'}):
            response, status = get_invoices_endpoint()
            self.assertEqual(status, 401)
            self.assertEqual(response.json, {"message": "Unauthorized"})
            
            
    @patch('src.GetInvoices.get_invoices')
    @patch('src.GetInvoices.get_coach_invoice_preferences')
    @patch('src.GetInvoices.get_access_token_username')
    @patch('src.GetInvoices.get_query_parameters')
    def test_get_invoices_endpoint_valid_request(self, mock_get_query_parameters, mock_get_access_token_username, mock_get_coach_invoice_preferences, mock_get_invoices):
        mock_get_query_parameters.return_value = ({'view': 'daily'}, None, 200)
        mock_get_access_token_username.return_value = (True, 'username')
        mock_get_coach_invoice_preferences.return_value = (True, {'invoice_type': 'type'})
        mock_get_invoices.return_value = [{'invoice': 'data'}]
        with app.test_request_context('/invoices', method='GET', headers={'Authorization': 'Valid token'}):
            response, status = get_invoices_endpoint()
            self.assertEqual(status, 200)
            self.assertEqual(response.json, {"data": [{'invoice': 'data'}], "invoices_initialised": True, "invoice_type": 'type'})
            
            
class TestGetQueryParameters(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()

    def test_get_query_parameters_valid_input(self):
        with app.test_request_context('/invoices?view=weekly&statusView=paid&contactPhoneNumber=1234567890&limit=20&offset=10', method='GET'):
            actual = get_query_parameters()
        expected = {
            'view': 'weekly',
            'status_view': 'paid',
            'contact_phone_number': '1234567890',
            'limit': 20,
            'offset': 10
        }, None, None
        self.assertEqual(actual, expected)

    def test_get_query_parameters_missing_input(self):
    
        with app.test_request_context('/invoices?view=weekly&statusView=paid', method='GET'):
            actual = get_query_parameters()
        expected = {
            'view': 'weekly',
            'status_view': 'paid',
            'contact_phone_number': None,
            'limit': 10,
            'offset': 0
        }, None, None
        self.assertEqual(actual, expected)

    def test_get_query_parameters_invalid_input(self):
        
        with app.test_request_context('/invoices?limit=abc&offset=xyz', method='GET'):
            actual = get_query_parameters()
        self.assertIsInstance(actual[1], ValueError)
        self.assertEqual(actual[2].json, {"message": "Invalid query string parameter: invalid literal for int() with base 10: 'abc'"})
        self.assertEqual(actual[3], 400)