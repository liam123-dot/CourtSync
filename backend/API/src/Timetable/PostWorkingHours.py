from flask import Blueprint, request, jsonify
import time
from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach

from datetime import datetime

PostWorkingHoursBlueprint = Blueprint('PostWorkingHoursBlueprint', __name__)

@PostWorkingHoursBlueprint.route('/timetable/working-hours', methods=['POST'])
def update_working_hours():
    data = request.json
    working_hours = data.get('working_hours')
    if not working_hours:
        return jsonify(message="Invalid/Missing key: working_hours"), 400

    token = request.headers.get('Authorization', None)
    if not token:
        return jsonify(message='Unauthorised'), 400

    coach = get_coach(token)
    if not coach:
        return jsonify(message='Unauthorised'), 400
    
    username = coach['coach_id']

    if not check_working_hours_valid(working_hours, username):
        return jsonify(message='Proposed working hours overlap with future booking'), 400

    update_or_insert_working_hours(working_hours, username)
    return jsonify(message='Success'), 200
    
def update_or_insert_working_hours(working_hours, username):
    # working hours is in the format:
    # {
    #     '0': {
    #         'start_time': 0,
    #         'end_time': 720,
    #         'working_hour_id': 1
    #     },
    #   '5': {
    #         'start_time': 0,
    #         'end_time': 720,
    #         'working_hour_id': 2
    #    }
    # if a working hour id is present, then it is an update, otherwise it is an insert
    
    
    sql_check = "SELECT start_time, end_time, day_of_week, working_hour_id FROM WorkingHours WHERE coach_id=%s AND is_default=1"
    sql_update = "UPDATE WorkingHours SET start_time=%s, end_time=%s WHERE working_hour_id=%s AND coach_id=%s"
    sql_insert = "INSERT INTO WorkingHours(day_of_week, start_time, end_time, coach_id) VALUES (%s, %s, %s, %s)"
    
    results = execute_query(sql_check, (username, ))
    
    for new_working_hour_day, new_working_hour_data in working_hours.items():
        working_hour_id = check_for_update(new_working_hour_data.get('working_hour_id', None), results)
        if working_hour_id:
            execute_query(sql_update, (new_working_hour_data['start_time'], new_working_hour_data['end_time'], working_hour_id, username))
        else:
            execute_query(sql_insert, (int(new_working_hour_day), new_working_hour_data['start_time'], new_working_hour_data['end_time'], username))
    return True

def check_for_update(working_hour_id, existing_working_hours):
    if not working_hour_id:
        return False
    for working_hour in existing_working_hours:
        if working_hour[3] == working_hour_id:
            return working_hour_id
    return False
 
def check_working_hours_valid(working_hours, coach_id):
    current_time = time.time()
    sql = "SELECT start_time, duration FROM Bookings WHERE coach_id=%s and start_time>%s"
    results = execute_query(sql, (coach_id, int(current_time)))

    for booking in results:
        if not check_booking_valid(minutes_into_day(booking[0]), booking[1], working_hours[str(get_day_of_week_from_epoch(booking[0]))]):
            return False
    return True

def get_day_of_week_from_epoch(epoch_time):
    # Convert the epoch time to a datetime object
    dt = datetime.utcfromtimestamp(epoch_time)
    # Calculate the day of the week (with Monday as 0 and Sunday as 6)
    return dt.weekday()

def minutes_into_day(epoch_time):
    # Convert the epoch time to a datetime object
    dt = datetime.utcfromtimestamp(epoch_time)
    # Calculate the minutes into the day
    minutes_past_midnight = dt.hour * 60 + dt.minute
    return minutes_past_midnight

def check_booking_valid(start_time, duration, working_hours):
    booking_end_time = start_time + duration
    return start_time >= working_hours['start_time'] and booking_end_time <= working_hours['end_time']
