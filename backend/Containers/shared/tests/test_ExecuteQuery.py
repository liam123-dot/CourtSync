import unittest
from unittest.mock import patch
from src.ExecuteQuery import execute_query

class TestExecuteQuery(unittest.TestCase):
    
    def test_invalid_args(self):
        # Arrange
        query = 'SELECT * FROM test_table'
        args = 'test'
        
        # Act
        try:
            execute_query(query, args)
        except Exception as e:
            # Assert
            assert str(e) == "args must be a list or tuple"
            
            
        args = ['test']
        
        try:
            execute_query(query, args)
        except Exception as e:
            # Assert
            assert str(e) == "args must have more than one element"
            
    @patch('src.ExecuteQuery.requests.post')
    def test_valid_args(self, mock_post):
        # Arrange
        query = 'SELECT * FROM test_table'
        args = ['test', 'test2']
        
        # Act
        result = execute_query(query, args)
        
        # Assert that the post request was called once with the correct params    
        mock_post.assert_called_once_with('http://db-service.default.svc.cluster.local:8000/query', json={
            "query": query,
            "args": args
        })
