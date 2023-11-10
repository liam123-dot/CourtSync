import unittest
from unittest.mock import patch, MagicMock
from src.Timetable.GetTimetable.GetTimetable import get_coach_events
import unittest
from unittest.mock import patch, MagicMock
from src.Timetable.GetTimetable.GetTimetable import get_coach_events

class TestGetCoachEvents(unittest.TestCase):
    @patch('src.Timetable.GetTimetable.GetTimetable.execute_query')


    class TestGetCoachEvents(unittest.TestCase):
        @patch('src.Timetable.GetTimetable.GetTimetable.execute_query')
        def test_get_coach_events(self, mock_execute_query):
            """
            Test case for the get_coach_events function.

            This test case checks if the function returns the correct events for a given coach within a specified time range.

            Args:
                mock_execute_query: A mock object for the execute_query function.

            Returns:
                None
            """
            # Arrange
            mock_execute_query.return_value = [
                (1, 1641052800, 60, 'title1', 'description1'),  # 01/01/2022 @ 12:00am (UTC)
                (2, 1641056400, 60, 'title2', 'description2'),  # 01/01/2022 @ 1:00am (UTC)
            ]
            coach_id = 1
            from_time = 1640995200  # 01/01/2022 @ 12:00am (UTC)
            to_time = 1641599999  # 01/01/2022 @ 1:00am (UTC)
            authorised = True

            # Act
            result = get_coach_events(coach_id, from_time, to_time, authorised)
            print(result)

            # Assert
            self.assertEqual(len(result), 1)
            self.assertEqual(len(result['2022-01-01']), 2)
            self.assertEqual(result['2022-01-01'][0]['event_id'], 1)
            self.assertEqual(result['2022-01-01'][0]['start_time'], 1641052800)
            self.assertEqual(result['2022-01-01'][0]['duration'], 60)
            self.assertEqual(result['2022-01-01'][0]['title'], 'title1')
            self.assertEqual(result['2022-01-01'][0]['description'], 'description1')
            self.assertEqual(result['2022-01-01'][1]['event_id'], 2)
            self.assertEqual(result['2022-01-01'][1]['start_time'], 1641056400)
            self.assertEqual(result['2022-01-01'][1]['duration'], 60)
            self.assertEqual(result['2022-01-01'][1]['title'], 'title2')
            self.assertEqual(result['2022-01-01'][1]['description'], 'description2')


    if __name__ == '__main__':
        unittest.main()
