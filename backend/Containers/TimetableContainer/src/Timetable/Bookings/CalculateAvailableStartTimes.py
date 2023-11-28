from flask import request, jsonify, Blueprint
from src.shared.CheckAuthorization import get_access_token_username
from src.shared.ExecuteQuery import execute_query
from datetime import datetime
import logging

logging.basicConfig(level=logging.DEBUG)

CalculateAvailableStartTimesBlueprint = Blueprint('CalculateAvailableStartTimes', __name__)

def get_durations(coach_id):
    sql = "SELECT duration FROM Durations WHERE coach_id = %s"
    results = execute_query(sql, (coach_id,))
    
    if len(results) == 0:
        return None
    
    return results

def get_bookings(coach_id, epoch_time):
    
    sql = "SELECT start_time, duration FROM Bookings WHERE coach_id = %s AND status='confirmed' AND %s < start_time AND %s > start_time"
    
    # get epoch time of current day at 00:00:00 and at 23:59:59
    current_day_start = datetime.fromtimestamp(epoch_time).replace(hour=0, minute=0, second=0).timestamp()
    current_day_end = datetime.fromtimestamp(epoch_time).replace(hour=23, minute=59, second=59).timestamp()
    
    results = execute_query(sql, (coach_id, current_day_start, current_day_end))
    
    return results
    

def get_coach_events(coach_id, epoch_time):
    
    sql = "SELECT start_time, duration FROM CoachEvents WHERE coach_id = %s AND %s < start_time AND %s > start_time"
    
    # get epoch time of current day at 00:00:00 and at 23:59:59
    current_day_start = datetime.fromtimestamp(epoch_time).replace(hour=0, minute=0, second=0).timestamp()
    current_day_end = datetime.fromtimestamp(epoch_time).replace(hour=23, minute=59, second=59).timestamp()
    
    results = execute_query(sql, (coach_id, current_day_start, current_day_end))
    
    return results
    
def get_working_hours(coach_id, epoch_time):
    
    # get the day of the week of the current day. 0 = Monday, 6 = Sunday
    
    current_day = datetime.fromtimestamp(epoch_time).weekday() 
    
    sql = 'SELECT start_time, end_time FROM WorkingHours WHERE coach_id = %s AND day_of_week = %s'
    
    result = execute_query(sql, (coach_id, current_day))[0]

    # change into 2 results. One with start_time at the epoch being the start of that date and the duration being the start_time
    # and the other being the end_time converted to epoch and the time until the end of the day     
    
    # first get epoch time of start of the current_day
    day_start = datetime.fromtimestamp(epoch_time).replace(hour=0, minute=0, second=0).timestamp()
    
    if result[0] == None or result[1] == None:
        return [[0, 1440]]
    
    result_1 = [day_start, result[0]]
    result_2 = [day_start + result[1] * 60, 1440 - result[1]]

    return [result_1, result_2]
        

def get_and_format_other_events(coach_id, epoch_time):
    
    bookings = get_bookings(coach_id, epoch_time)
    coach_events = get_coach_events(coach_id, epoch_time)
    working_hours = get_working_hours(coach_id, epoch_time)
    
    # all 3 are now in form [start_time, duration] where start time is epoch seconds and duration is in minutes
    # merge the lists
    all_events = bookings + coach_events + working_hours
    
    return all_events
    
    
def get_coach_id(slug):
    sql = "SELECT coach_id FROM Coaches WHERE slug=%s"
    
    results = execute_query(sql, (slug,))
    
    if len(results) == 0:
        return None
    
    return results[0][0]


@CalculateAvailableStartTimesBlueprint.route('/timetable/<slug>/booking-availability', methods=['GET'])
def calculate_booking_availability(slug):
    
    coach_id = get_coach_id(slug)
    
    if not coach_id:
        return jsonify({'error': 'No coach found'}), 404
    
    # get epoch start time from request query string, return error if not provided
    epoch_start_time = request.args.get('startTime', None)
    
    try:
        epoch_start_time = int(epoch_start_time)
    except:
        return jsonify({'error': 'Invalid start time provided'}), 400

    if not epoch_start_time:
        return jsonify({'error': 'No start time provided'}), 400
    
    # using the start time, loop through the coaches duration and check which start times are available

    coach_durations = get_durations(coach_id)
    
    if not coach_durations:
        return jsonify({'error': 'No durations found'}), 404
    
    events = get_and_format_other_events(coach_id, epoch_start_time)
    
    valid_start_times = get_start_times(epoch_start_time, coach_durations, events)

    return jsonify(valid_start_times), 200
        

def get_start_times(epoch_start_time, coach_durations, events):
    # loop each possible start time, check if it is possible for each of the durations
    # return a list of start_times where at least one duration is valid as well as
    # a list of durations which are valid for each start_time
    # should do this for each 15 minute interval of the day
    
    # Calculate the start and end times of the day in epoch time

    day_start = datetime.fromtimestamp(epoch_start_time).replace(hour=0, minute=0, second=0).timestamp()
    day_end = datetime.fromtimestamp(epoch_start_time).replace(hour=23, minute=59, second=59).timestamp()

    # Initialize an empty dictionary to hold the valid start times
    valid_start_times = {}
    
    # Loop over each 15-minute interval of the day
    for start_time in range(int(day_start), int(day_end), 15 * 60):
        # For each interval, check if it's a valid start time for each of the coach's durations
        for duration in coach_durations:
            duration = duration[0]
            # Check if the duration is valid for the event
            valid = True
            for event in events:
                event_start_time = event[0]
                event_end_time = event[0] + event[1] * 60
                if event_start_time <= start_time <= event_end_time:
                    valid = False
                elif event_start_time <= start_time + duration * 60 <= event_end_time:
                    valid = False
                elif start_time <= event_start_time <= start_time + duration * 60:
                    valid = False
                elif start_time <= event_end_time <= start_time + duration * 60:
                    valid = False                

            if valid:
                if start_time not in valid_start_times:
                    valid_start_times[start_time] = []
                valid_start_times[start_time].append(duration)
                    
    return valid_start_times