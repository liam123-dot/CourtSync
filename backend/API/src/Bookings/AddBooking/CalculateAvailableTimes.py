from flask import request, jsonify, Blueprint, current_app

from datetime import datetime
import logging

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach_from_slug

logging.basicConfig(level=logging.DEBUG)

CalculateAvailableTimesBlueprint = Blueprint('CalculateAvailableTimes', __name__)

def get_durations(coach_id):
    sql = "SELECT duration FROM Durations WHERE coach_id = %s"

    results = execute_query(sql, (coach_id,), is_get_query=True)
    
    durations = [result['duration'] for result in results]

    return durations

def get_bookings(coach_id, epoch_time):
    sql = "SELECT start_time, duration FROM Bookings WHERE coach_id = %s AND status='confirmed' AND %s < start_time AND %s > start_time"
    current_day_start = datetime.fromtimestamp(epoch_time).replace(hour=0, minute=0, second=0).timestamp()
    current_day_end = datetime.fromtimestamp(epoch_time).replace(hour=23, minute=59, second=59).timestamp()
    
    results = execute_query(sql, (coach_id, current_day_start, current_day_end), is_get_query=True)
    
    new_array = []
    
    for result in results:
        new_array.append([result['start_time'], result['duration']])
        
    return new_array

def get_coach_events(coach_id, epoch_time):
    sql = "SELECT start_time, duration FROM CoachEvents WHERE coach_id = %s AND %s < start_time AND %s > start_time"
    current_day_start = datetime.fromtimestamp(epoch_time).replace(hour=0, minute=0, second=0).timestamp()
    current_day_end = datetime.fromtimestamp(epoch_time).replace(hour=23, minute=59, second=59).timestamp()
    
    results = execute_query(sql, (coach_id, current_day_start, current_day_end))
    
    new_array = []
    
    for result in results:
        new_array.append([result['start_time'], result['duration']])
    
    return new_array

def get_working_hours(coach_id, epoch_time):
    current_day = datetime.fromtimestamp(epoch_time).weekday() 
    sql = 'SELECT start_time, end_time FROM WorkingHours WHERE coach_id = %s AND day_of_week = %s'
    
    result = execute_query(sql, (coach_id, current_day), is_get_query=True)[0]
        
    day_start = datetime.fromtimestamp(epoch_time).replace(hour=0, minute=0, second=0).timestamp()
    
    start_time = result['start_time']
    end_time = result['end_time']
    
    if start_time == None or end_time == None:
        return [[0, 1440]]
    result_1 = [day_start, start_time]
    result_2 = [day_start + end_time * 60, 1440 - end_time]
    return [result_1, result_2]
        

def get_and_format_other_events(coach_id, epoch_time):
    
    bookings = get_bookings(coach_id, epoch_time)
    coach_events = get_coach_events(coach_id, epoch_time)
    working_hours = get_working_hours(coach_id, epoch_time)
    
    # all 3 are now in form [start_time, duration] where start time is epoch seconds and duration is in minutes
    # merge the lists
    all_events = bookings + coach_events + working_hours
    
    return all_events


@CalculateAvailableTimesBlueprint.route('/timetable/<slug>/booking-availability', methods=['GET'])
def calculate_booking_availability(slug):
    
    coach = get_coach_from_slug(slug)
    
    if not coach:
        return jsonify({'error': 'No coach found'}), 400
    coach_id = coach['coach_id']
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
        return jsonify({'error': 'No durations found'}), 400
    
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