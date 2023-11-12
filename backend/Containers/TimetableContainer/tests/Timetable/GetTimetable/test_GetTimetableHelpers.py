from datetime import datetime, timedelta
from src.Timetable.GetTimetable.GetTimetableHelpers import calculate_indexes_to_dates

def test_calculate_indexes_to_dates():
    start_date = '01-01-2022'
    end_date = '07-01-2022'
    expected_result = {
        5: '01-01-2022',
        6: '02-01-2022',
        0: '03-01-2022',
        1: '04-01-2022',
        2: '05-01-2022',
        3: '06-01-2022',
        4: '07-01-2022'
    }
    result = calculate_indexes_to_dates(start_date, end_date)
    assert result == expected_result