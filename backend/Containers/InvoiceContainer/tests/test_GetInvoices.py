from src.GetInvoices import get_query_parameters, fetch_daily_invoices, process_daily_invoices, fetch_invoices, get_invoices
import unittest
from unittest.mock import patch, ANY
from flask import Flask
app = Flask(__name__)

####
class TestGetQueryParameters(unittest.TestCase):
    def test_get_query_parameters(self):
        
        with app.test_request_context('/invoices?limit=10&offset=0'):
            response = get_query_parameters()
            
            self.assertEqual(response, ('daily', 10, 0, None, None))

class TestFetchDailyInvoices(unittest.TestCase):
    @patch('src.GetInvoices.execute_query')
    def test_fetch_daily_invoices_success(self, mock_execute_query):
        mock_execute_query.return_value = [('booking_id', 'player_name', 'start_time', 'contact_name', 'cost', 'paid', 'extra_costs', 'duration')]
        actual = fetch_daily_invoices('username', 10, 0)
        expected = [('booking_id', 'player_name', 'start_time', 'contact_name', 'cost', 'paid', 'extra_costs', 'duration')]
        self.assertEqual(actual, expected)
        mock_execute_query.assert_called_once()

    @patch('src.GetInvoices.execute_query')
    def test_fetch_daily_invoices_no_results(self, mock_execute_query):
        mock_execute_query.return_value = []
        actual = fetch_daily_invoices('username', 10, 0)
        expected = []
        self.assertEqual(actual, expected)
        mock_execute_query.assert_called_once()
        
class TestProcessDailyInvoices(unittest.TestCase):
    
    def test_process_daily_invoices_empty(self):
        results = []
        expected = []
        actual = process_daily_invoices(results)
        self.assertEqual(actual, expected)
        
    def test_process_daily_invoice_single(self):
        results = [[1, 'John Doe', '2020-01-01', 'Jane Doe', 10, 0, 0, 1]]
        expected = [{
            'booking_id': 1,
            'player_name': 'John Doe',
            'start_time': '2020-01-01',
            'contact_name': 'Jane Doe',
            'cost': 10,
            'paid': 0,
            'extra_costs': 0,
            'duration': 1
        }]
        actual = process_daily_invoices(results)
        self.assertEqual(actual, expected)
        
    def test_process_daily_invoice_multiple(self):
        results = [[1, 'John Doe', '2020-01-01', 'Jane Doe', 10, 0, 0, 1], [2, 'John Boo', '2020-01-02', 'Jane Boo', 10, 0, 0, 1]]
        expected = [{
            'booking_id': 1,
            'player_name': 'John Doe',
            'start_time': '2020-01-01',
            'contact_name': 'Jane Doe',
            'cost': 10,
            'paid': 0,
            'extra_costs': 0,
            'duration': 1
        }, {
            'booking_id': 2,
            'player_name': 'John Boo',
            'start_time': '2020-01-02',
            'contact_name': 'Jane Boo',
            'cost': 10,
            'paid': 0,
            'extra_costs': 0,
            'duration': 1
        }]
        actual = process_daily_invoices(results)
        self.assertEqual(actual, expected)        

class TestFetchInvoices(unittest.TestCase):
    @patch('src.GetInvoices.execute_query')
    def test_fetch_invoices_weekly(self, mock_execute_query):
        mock_execute_query.return_value = [('1234567890', 2, 200, '202201')]
        actual = fetch_invoices('username', 10, 0, 'weekly')
        expected = [('1234567890', 2, 200, '202201')]
        self.assertEqual(actual, expected)
        mock_execute_query.assert_called_once_with(ANY, ('username', 10, 0))

    @patch('src.GetInvoices.execute_query')
    def test_fetch_invoices_monthly(self, mock_execute_query):
        mock_execute_query.return_value = [('1234567890', 2, 200, 2022, 1)]
        actual = fetch_invoices('username', 10, 0, 'monthly')
        expected = [('1234567890', 2, 200, 2022, 1)]
        self.assertEqual(actual, expected)
        mock_execute_query.assert_called_once_with(ANY, ('username', 10, 0))

    @patch('src.GetInvoices.execute_query')
    def test_fetch_invoices_no_results(self, mock_execute_query):
        mock_execute_query.return_value = []
        actual = fetch_invoices('username', 10, 0, 'weekly')
        expected = []
        self.assertEqual(actual, expected)
        mock_execute_query.assert_called_once_with(ANY, ('username', 10, 0))
        
class TestGetInvoices(unittest.TestCase):
    @patch('src.GetInvoices.get_access_token_username')
    @patch('src.GetInvoices.get_query_parameters')
    @patch('src.GetInvoices.get_daily_invoices')
    def test_get_invoices_daily(self, mock_get_daily_invoices, mock_get_query_parameters, mock_get_access_token_username):
        mock_get_query_parameters.return_value = ('daily', 10, 0, None, None)
        mock_get_access_token_username.return_value = (True, 'username')
        mock_get_daily_invoices.return_value = ['invoice1', 'invoice2']

        with app.test_request_context('/invoices?view=daily&limit=10&offset=0'):
            response = get_invoices()
            self.assertEqual(response[1], 200)
            self.assertEqual(response[0].json, {'data': ['invoice1', 'invoice2']})

    @patch('src.GetInvoices.get_access_token_username')
    @patch('src.GetInvoices.get_query_parameters')
    @patch('src.GetInvoices.get_weekly_or_monthly_invoices')
    def test_get_invoices_weekly(self, mock_get_weekly_or_monthly_invoices, mock_get_query_parameters, mock_get_access_token_username):
        mock_get_query_parameters.return_value = ('weekly', 10, 0, None, None)
        mock_get_access_token_username.return_value = (True, 'username')
        mock_get_weekly_or_monthly_invoices.return_value = ['invoice1', 'invoice2']

        with app.test_request_context('/invoices?view=weekly&limit=10&offset=0'):
            response = get_invoices()
            self.assertEqual(response[1], 200)
            self.assertEqual(response[0].json, {'data': ['invoice1', 'invoice2']})    

    @patch('src.GetInvoices.get_access_token_username')
    @patch('src.GetInvoices.get_query_parameters')
    def test_get_invoices_invalid_view(self, mock_get_query_parameters, mock_get_access_token_username):
        mock_get_query_parameters.return_value = ('invalid', 10, 0, None, None)
        mock_get_access_token_username.return_value = (True, 'username')

        with app.test_request_context('/invoices?view=invalid&limit=10&offset=0'):
            response = get_invoices()
            self.assertEqual(response[1], 400)
            self.assertEqual(response[0].json, {'message': 'Invalid view'})            

    @patch('src.GetInvoices.get_access_token_username')
    @patch('src.GetInvoices.get_query_parameters')
    def test_get_invoices_unauthorized(self, mock_get_query_parameters, mock_get_access_token_username):
        mock_get_query_parameters.return_value = ('daily', 10, 0, None, None)
        mock_get_access_token_username.return_value = (False, None)

        with app.test_request_context('/invoices?view=daily&limit=10&offset=0'):
            response = get_invoices()
            self.assertEqual(response[1], 401)
            self.assertEqual(response[0].json, {'message': 'Unauthorized'})            