from flask import Blueprint, request, jsonify
from src.utils.CheckAuthorization import get_access_token_username
from src.utils.ExecuteQuery import execute_query
import re

import logging

logging.basicConfig(level=logging.DEBUG)

timetable = Blueprint('timetable', __name__)

@timetable.route('/timetable')
def get_timetable_no_slug():
    return "Provide a coach slug as a path paratmeter", 400

@timetable.route('/timetable/<slug>/booking', methods=['POST'])
def add_booking(slug):

    body = request.json

    try:
        start_time = body['startTime']
        duration = body['duration']
        player_name = body['playerName']
        contact_name = body['contactName']
        is_same_as_player = body['isSameAsPlayerName']
        contact_email = body['email']
        contact_phone_number = body['phoneNumber']
        cost = body['cost']
        rule_id = body['ruleId']

        if start_time is None or duration is None or player_name is None or \
        (contact_name is None and not is_same_as_player) or contact_email is None \
        or contact_phone_number is None or cost is None or rule_id is None:
            return jsonify(message='Some invalid data was sent'), 400

    except KeyError as e:
        return jsonify(message=f"Invalid/Missing parameter: {e}")
    
    # Additional validation checks
    if len(player_name) < 2:
        return jsonify(message="Player name must be longer than 2 characters"), 400
    
    # Validate email format
    if not re.match(r"[^@]+@[^@]+\.[^@]+", contact_email):
        return jsonify(message="Invalid email"), 400

    # Validate phone number format (example format: +12345678900)
    if not re.match(r"^\+\d{11,15}$", contact_phone_number):
        return jsonify(message="Invalid phone number"), 400

    # Validate cost as a positive number
    try:
        cost = float(cost)
        if cost <= 0:
            raise ValueError
    except ValueError:
        return jsonify(message="Cost must be a positive number"), 400

    # Validate duration as a positive integer
    try:
        duration = int(duration)
        if duration <= 0:
            raise ValueError
    except ValueError:
        return jsonify(message="Duration must be a positive integer"), 400

    sql = "SELECT coach_id FROM Coaches WHERE slug=%s"
    try:
        coach_id = execute_query(sql, (slug, ))[0][0]
    except IndexError:
        return jsonify(message='Coach with passed slug does not exist'), 400
    
    # check for overlap

    end_time = start_time + duration*60
    sql = """SELECT EXISTS (
        SELECT 1
        FROM Bookings
        WHERE coach_id=%s
        AND start_time<%s
        AND (start_time + duration * 60) > %s
    )"""
    results = execute_query(sql, (coach_id, end_time, start_time))
    if results[0][0]:
        return jsonify(message='Cannot book lesson as it overlaps with an existing one'), 400

    sql = "INSERT INTO Bookings(player_name, contact_name, contact_email, contact_phone_number, start_time, cost, rule_id, duration, coach_id) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"

    try:
        execute_query(sql, (player_name, contact_name, contact_email, contact_phone_number, start_time, cost, rule_id, duration, coach_id))

        return jsonify(message='Success'), 200
    except Exception:
        return jsonify(message='Internal Server Error'), 500


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
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing Key: {e}")
    
    sql = "INSERT INTO PricingRules(rule_name, hourly_rate, coach_id, is_default) VALUES(%s, %s, %s, %s)"
    execute_query(sql, ('Default Pricing', default_lesson_cost, username, 1))

    sql = """
    INSERT INTO Durations (duration, coach_id)
    SELECT %s, %s
    WHERE NOT EXISTS (
        SELECT 1 FROM Durations
        WHERE duration = %s AND coach_id = %s
    );
    """

    for duration in durations:
        execute_query(sql, (duration, username, duration, username))

    return jsonify(message="Features updated successfully"), 200
