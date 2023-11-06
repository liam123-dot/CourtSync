from flask import Blueprint, request, jsonify
from datetime import datetime
import hashlib
import logging
import time
import re

from src.utils.CheckAuthorization import get_access_token_username
from src.utils.ExecuteQuery import execute_query
import logging

logging.basicConfig(level=logging.DEBUG)

timetable = Blueprint('timetable', __name__)

@timetable.route('/timetable')
def get_timetable_no_slug():
    return "Provide a coach slug as a path paratmeter", 400

@timetable.route('/timetable/<slug>/check-authorisation', methods=['GET'])
def check_authorisation(slug):
    token = request.headers.get('Authorization', None)
    
    username = None
    if token:
        valid, username = get_access_token_username(token)

    sql = "SELECT coach_id FROM Coaches WHERE slug=%s"
    try:
        coach_id = execute_query(sql, (slug, ))[0][0]
    except IndexError:
        return jsonify(message='Coach with passed slug does not exist'), 400


    if username:
        if coach_id == username:
            return jsonify(authorised=True), 200
        
    return jsonify(authorised=False), 200


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
    # Extract start and end times from the working hours
    work_start_time = working_hours['start_time']
    work_end_time = working_hours['end_time']
    
    # Calculate the end time of the booking
    booking_end_time = start_time + duration

    # Check if the booking starts and ends within the working hours
    if start_time >= work_start_time and booking_end_time <= work_end_time:
        return True  # The booking is within the working hours
    else:
        return False  # The booking is outside the working hours
            
def check_working_hours_valid(working_hours, coach_id):
    current_time = time.time()
    sql = "SELECT start_time, duration FROM Bookings WHERE coach_id=%s and start_time>%s"
    results = execute_query(sql, (coach_id, int(current_time)))

    for booking in results:
        logging.debug(booking)
        start_time = minutes_into_day(booking[0])
        duration = booking[1]
        day_of_week = get_day_of_week_from_epoch(booking[0])
        logging.debug(f"day_of_week: {day_of_week}")
        if not check_booking_valid(start_time, duration, working_hours[str(day_of_week)]):
            return False
        
    return True


@timetable.route('/timetable/working-hours', methods=['POST'])
def update_working_hours():
    
    data = request.json

    try:
        working_hours = data['working_hours']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing key: {e}"), 400
    
    token = request.headers.get('Authorization', None)

    if not token:
        return jsonify(message='Unauthorised'), 400
    
    
    valid, username = get_access_token_username(token)

    if not valid:
        return jsonify(message='Unauthorised'), 400
    
    try:

        valid = check_working_hours_valid(working_hours, username)

        if not valid:
            return jsonify(message='Proposed working hours overlap with future booking'), 400
        
        sql_check = "SELECT start_time, end_time, day_of_week FROM WorkingHours WHERE coach_id=%s"
        sql_update = "UPDATE WorkingHours SET start_time=%s, end_time=%s WHERE day_of_week=%s AND coach_id=%s"
        sql_insert = "INSERT INTO WorkingHours(day_of_week, start_time, end_time, coach_id) VALUES (%s, %s, %s, %s)"

        results = execute_query(sql_check, (username, ))
        if len(results) > 0:
            for result in results:
                start_time = result[0]
                end_time = result[1]
                day_of_week = str(result[2])

                wh_start_time = working_hours[day_of_week]['start_time']
                wh_end_time = working_hours[day_of_week]['end_time']

                if start_time != wh_start_time or \
                    end_time != wh_end_time:
                    execute_query(sql_update, (wh_start_time, wh_end_time, int(day_of_week), username))
        else:
            for day, times in working_hours.items():
                execute_query(sql_insert, (int(day), times['start_time'], times['end_time'], username))
        
        return jsonify(message='Success'), 200

    except Exception as e:

        return jsonify(message='An unexpected error as occured', error=e)


def get_existing_working_hours(coach_id):    
    sql = "SELECT working_hour_id, day_of_week, start_time, end_time FROM WorkingHours WHERE coach_id=%s"
    results = execute_query(sql, (coach_id, ))

    working_hours_existing = {}

    for result in results:
        working_hours_existing[result[1]] = {
            'id': result[0],
            'start_time': result[2],
            'end_time': result[3]
        }

    return working_hours_existing

@timetable.route('/timetable/features', methods=['POST'])
# TODO Need to verify that the incoming price inputs are in pennies.
def update_features():
    token = request.headers.get('Authorization', None)

    if not token:
        return jsonify(message='Unauthorised'), 400
    
    valid, username = get_access_token_username(token)

    if not valid:
        return jsonify(message='Unauthorised'), 400
    
    data = request.json

    try:
        durations = data['durations']
        default_lesson_cost = data['default_lesson_cost']
        is_update = data['is_update']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing Key: {e}")
    
    if is_update:
        sql = "UPDATE PricingRules SET hourly_rate=%s WHERE coach_id=%s AND is_default=1"
        execute_query(sql, (default_lesson_cost, username))
    else:
        sql = "INSERT INTO PricingRules(rule_name, hourly_rate, coach_id, is_default) VALUES(%s, %s, %s, %s)"
        execute_query(sql, ('Default Pricing', default_lesson_cost, username, 1))

    delete_sql = "DELETE FROM Durations WHERE coach_id=%s"
    execute_query(delete_sql, (username, ))

    sql = """
        INSERT INTO Durations (duration, coach_id) VALUES (%s, %s)
    """

    for duration in durations:
        execute_query(sql, (duration, username))

    return jsonify(message="Features updated successfully"), 200

@timetable.route('/timetable/features', methods=['GET'])
def get_features():
    token = request.headers.get('Authorization', None)
    if not token:
        return jsonify(message='Unauthorised'), 400
    
    try:
        valid, username = get_access_token_username(token)
    except Exception as e:
        return jsonify(message='Unautorised', error=str(e)), 400

    if not valid:
        return jsonify(message='Unauthorised'), 400

    sql = "SELECT hourly_rate FROM PricingRules WHERE coach_id=%s AND is_default=1"
    results = execute_query(sql, (username, ))
    
    if len(results) > 0:
        default_pricing = results[0][0]
    else:
        default_pricing = None

    sql = "SELECT duration FROM Durations WHERE coach_id=%s"
    results = execute_query(sql, (username, ))

    durations = sorted([result[0] for result in results])
    
    return jsonify(
        default_pricing=default_pricing,
        durations=durations
    ), 200
