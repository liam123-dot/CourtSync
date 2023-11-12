from src.GetInvoices import get_query_parameters
import unittest
from flask import Flask
app = Flask(__name__)

##
class TestGetQueryParameters(unittest.TestCase):
    def test_get_query_parameters(self):
        
        with app.test_request_context('/invoices?limit=10&offset=0'):
            response = get_query_parameters()
            
            self.assertEqual(response, ('daily', 10, 0, None, None))

    