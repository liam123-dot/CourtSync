# test_app.py
import json
import unittest
from Containers.DatabaseContainer.app import app

class FlaskTestCase(unittest.TestCase):

    # executed prior to each test
    def setUp(self):
        self.app = app.test_client()

    def test_index(self):
        response = self.app.post('/query')
        # assert that the status code of the response is 200
        self.assertEqual(response.status_code, 415)

        data = {

        }
        response = self.app.post('query', data=json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, 400)

        data = {
            "query": "example query"
        }
        response = self.app.post('query', data=json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        data = {
            "query": "example",
            "args": ""
        }
        response = self.app.post('query', data=json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, 400)

        data = {
            "query": "example",
            "args": []
        }
        response = self.app.post('query', data=json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, 200)
