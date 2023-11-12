import pytest
from unittest.mock import patch, MagicMock
from pymysql import MySQLError
from app import app, execute_query

@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

def test_perform_query_no_query(client):
    response = client.post('/query', json={})
    assert response.status_code == 400
    assert response.get_json() == {'message': 'No query provided', 'provided': {}}

def test_perform_query_invalid_args(client):
    response = client.post('/query', json={'query': 'SELECT * FROM table', 'args': 'invalid'})
    assert response.status_code == 400
    assert response.get_json() == {'message': 'args must be passed as a tuple or a list'}

@patch('app.execute_query', return_value=(True, [{'id': 1, 'name': 'test'}]))
def test_perform_query_success(mock_execute_query, client):
    response = client.post('/query', json={'query': 'SELECT * FROM table'})
    assert response.status_code == 200
    assert response.get_json() == {'response': [{'id': 1, 'name': 'test'}]}
    mock_execute_query.assert_called_once_with('SELECT * FROM table', None)

@patch('app.execute_query', return_value=(False, 'Error message'))
def test_perform_query_failure(mock_execute_query, client):
    response = client.post('/query', json={'query': 'SELECT * FROM table'})
    assert response.status_code == 400
    assert response.get_json() == {'message': 'Error message', 'attempted_query': 'SELECT * FROM table', 'args': None}
    mock_execute_query.assert_called_once_with('SELECT * FROM table', None)

@patch('app.get_db_connection')
def test_execute_query_success(mock_get_db_connection):
    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = [(1,)]
    mock_get_db_connection.return_value.cursor.return_value.__enter__.return_value = mock_cursor
    success, response = execute_query('SELECT * FROM table')
    assert success == True
    assert response == [(1,)]