import unittest
from datetime import datetime, timedelta
from src.Timetable.GetTimetable.GetTimetable2 import does_datetime_satisfy_cron, calculate_expected_count

class TestCalculateExpectedCount(unittest.TestCase):
    
    def test_does_datetime_satisfy_cron(self):
        # Define a cron job that runs every Tuesday at 8am
        cron_job = "0 8 * * 1"

        # Define a datetime that is a Tuesday at 8am
        datetime_to_check = datetime(2024, 5, 14, 8, 0, 0)
        
        # Call the function and assert that the returned value is True
        self.assertTrue(does_datetime_satisfy_cron(datetime_to_check, cron_job))
        
        
        cron_job = "0 8 * * *"
        
        datetime_to_check = datetime(2024, 5, 14, 8, 0, 0)
        datetime_to_check = datetime(2024, 5, 15, 8, 0, 0)
        datetime_to_check = datetime(2024, 5, 21, 8, 0, 0)        
    
    def test_calculate_expected_count(self):
        # Define a cron job that runs every 
        cron_job = "0 8 * * 2"

        # Define a time range of 1 week
        from_time = 1704672000
        to_time = 1705276800        
        
        # Since the cron job runs every Tuesday, we expect it to run once
        expected_count = 1

        # Call the function and assert that the returned count is as expected
        self.assertEqual(calculate_expected_count(from_time, to_time, cron_job), expected_count)

        cron_job = "0 8 * * *"

        # Define a time range of 1 week
        from_time = 1704672000
        to_time = 1705276800        
        
        # Since the cron job runs every Tuesday, we expect it to run once
        expected_count = 7
        
        self.assertEqual(calculate_expected_count(from_time, to_time, cron_job), expected_count)
        
        cron_job = "0 8 * * 2"

        # Define a time range of 1 week
        from_time = 1705276800
        to_time = 1705881600        
        
        # Since the cron job runs every Tuesday, we expect it to run once
        expected_count = 1
        
        self.assertEqual(calculate_expected_count(from_time, to_time, cron_job), expected_count)
        
        from_time = 1705485600
        to_time = 1705881600
        
        expected_count = 1
        
        self.assertEqual(calculate_expected_count(from_time, to_time, cron_job), expected_count)
        
if __name__ == '__main__':
    unittest.main()