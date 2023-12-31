from flask import request, jsonify, Blueprint, current_app

from datetime import datetime
import logging
import time

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach_from_slug, get_coach

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
    sql = "SELECT start_time, duration FROM CoachEvents WHERE coach_id = %s AND %s < start_time AND %s > start_time AND status!='cancelled'"
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
    
    if working_hours == [[0, 1440]]:
        return None
    
    all_events = bookings + coach_events + working_hours
    
    return all_events


@CalculateAvailableTimesBlueprint.route('/timetable/<slug>/booking-availability', methods=['GET'])
def calculate_booking_availability(slug):
    coach = get_coach_from_slug(slug)
    if not coach:
        return jsonify({'error': 'No coach found'}), 400
    coach_id = coach['coach_id']

    epoch_start_time = request.args.get('startTime', None)
    duration = request.args.get('duration', None)

    if not duration:
        return jsonify({'error': 'No duration provided'}), 400
    try:
        epoch_start_time = int(epoch_start_time)
        duration = int(duration)
    except ValueError:
        return jsonify({'error': 'Invalid start time or duration provided'}), 400

    if not epoch_start_time:
        return jsonify({'error': 'No start time provided'}), 400

    events = get_and_format_other_events(coach_id, epoch_start_time)
    if events is None:
        return jsonify([]), 200

    valid_start_times = get_start_times(epoch_start_time, duration, events)
    return jsonify(valid_start_times), 200

@CalculateAvailableTimesBlueprint.route('/timetable/booking-availability', methods=['GET'])
def calculate_booking_availability_token():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Missing token'}), 400
    
    coach = get_coach(token)
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400
    
    coach_id = coach['coach_id']
    
    epoch_start_time = request.args.get('startTime', None)
    duration = request.args.get('duration', None)
    
    if not duration:
        return jsonify({'error': 'No duration provided'}), 400
    try:
        epoch_start_time = int(epoch_start_time)
        duration = int(duration)
    except ValueError:
        return jsonify({'error': 'Invalid start time or duration provided'}), 400
    
    if not epoch_start_time:
        return jsonify({'error': 'No start time provided'}), 400
    
    events = get_and_format_other_events(coach_id, epoch_start_time)
    if events is None:
        return jsonify([]), 200
    
    valid_start_times = get_start_times(epoch_start_time, duration, events)
    return jsonify(valid_start_times), 200

def get_start_times(epoch_start_time, duration, events):
    day_start = datetime.fromtimestamp(epoch_start_time).replace(hour=0, minute=0, second=0).timestamp()
    day_end = datetime.fromtimestamp(epoch_start_time).replace(hour=23, minute=59, second=59).timestamp()
    
    print('day start and end')
    print(day_start, day_end)

    # TODO coach can have minimum short notice time
    
    if day_start < time.time():
        # round up to the next 30 minute interval
        remainder = time.time() % (30 * 60)
        day_start = time.time() + (30 * 60 - remainder if remainder > 0 else 0)

    events.sort(key=lambda x: x[0])
    valid_start_times = []

    for start_time in range(int(day_start), int(day_end), 30 * 60):
        if is_time_slot_available(start_time, duration, events):
            if check_start_time_leaves_space(start_time, events, duration, [duration]):
                valid_start_times.append(start_time)

    return valid_start_times

def is_time_slot_available(start_time, duration, events):
    end_time = start_time + duration * 60
    
    for event in events:
        event_start, event_duration = event
        event_end = event_start + event_duration * 60        
        
        if not (end_time <= event_start or start_time >= event_end):            
            return False
        
    return True

def check_start_time_leaves_space(start_time, events, duration, durations):
    # Convert the events list to the desired format
    events = [[start_time, start_time + (duration * 60)] for start_time, duration in events]
    before, after = find_nears(start_time, events)
    
    before_valid = False
    after_valid = False
    
    if before == start_time:
        before_valid = True
    else:
        if start_time - before >= min(durations) * 60:
            before_valid = True
            
    if start_time + duration * 60 == after:
        after_valid = True
    else:
        if after - (start_time + duration * 60) >= min(durations) * 60:
            after_valid = True
            
    return_value = after_valid and before_valid
    
    return return_value


def find_nears(start_time, events):
    # given an epoch start time and a list of [epoch start time, epoch end time], need to fine the next event before and after if applicable

    nearest = [None, None]
    for event in events:
        if event[0] < start_time:
            nearest[0] = event
        elif event[0] > start_time:
            nearest[1] = event
            break
        
    earlier_event_end = nearest[0][1]
    later_event_start = nearest[1][0]

    return earlier_event_end, later_event_start

def convert_epoch_to_hh_mm(epoch_seconds):
    # Convert epoch seconds to datetime object
    dt = datetime.fromtimestamp(epoch_seconds)
    
    # Format datetime object as hh:mm
    hh_mm = dt.strftime('%H:%M')
    
    return hh_mm
