import pytest
from datetime import datetime, timedelta
from src.Timetable.Bookings.CalculateAvailableStartTimes import get_start_times

def test_get_start_times():
    # Define the inputs
    epoch_start_time = 1640995201
    coach_durations = [(30,), (60,), (90,)]
    events = [[1640995200, 1000], [1640995300, 340]]

    # Call the function with the inputs
    result = get_start_times(epoch_start_time, coach_durations, events)

    # Define the expected result
    expected_result = {

        # ... more expected results ...
    }

    # Assert that the result matches the expected result
    assert result == expected_result

def test_get_start_times_no_valid_times():
    # Define the inputs
    epoch_start_time = datetime(2022, 1, 1).timestamp()
    coach_durations = [(30,), (60,), (90,)]
    events = [(datetime(2022, 1, 1, 0).timestamp(), 1440)]  # Event lasts all day

    # Call the function with the inputs
    result = get_start_times(epoch_start_time, coach_durations, events)

    # Define the expected result (empty dictionary because no start times are valid)
    expected_result = {}

    # Assert that the result matches the expected result
    assert result == expected_result