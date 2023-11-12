from src.Coach.CreateSlug import find_valid_slug
from unittest.mock import patch
import unittest

class TestCreateSlug(unittest.TestCase):
    @patch('src.Coach.CreateSlug.check_slug_valid')
    def test_find_valid_slug_without_counter(self, mock_check_slug_valid):
        mock_check_slug_valid.return_value = True
        slug = find_valid_slug('John', 'Doe')
        self.assertEqual(slug, 'John-Doe')
        mock_check_slug_valid.assert_called_once_with('John-Doe')

    @patch('src.Coach.CreateSlug.check_slug_valid')
    def test_find_valid_slug_with_counter(self, mock_check_slug_valid):
        mock_check_slug_valid.side_effect = [False, True]
        slug = find_valid_slug('John', 'Doe')
        self.assertEqual(slug, 'John-Doe-1')
        mock_check_slug_valid.assert_called_with('John-Doe-1')

    @patch('src.Coach.CreateSlug.check_slug_valid')
    def test_find_valid_slug_with_multiple_counters(self, mock_check_slug_valid):
        mock_check_slug_valid.side_effect = [False, False, True]
        slug = find_valid_slug('John', 'Doe')
        self.assertEqual(slug, 'John-Doe-2')
        mock_check_slug_valid.assert_called_with('John-Doe-2')