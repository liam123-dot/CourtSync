from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
import time
import re


from src.utils.CheckAuthorization import get_access_token_username
from src.utils.ExecuteQuery import execute_query
from src.shared.SendEmail import send_email

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

    sql = "SELECT coach_id, username FROM Coaches WHERE slug=%s"
    try:
        result = execute_query(sql, (slug, ))[0]
        coach_id = result[0]
        coach_email = result[1]
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
        
        # nned to send confirmation emails to both the coach and the contact email.

        return jsonify(message='Success'), 200
    except Exception:
        return jsonify(message='Internal Server Error'), 500


@timetable.route('/timetable/booking/<booking_id>/cancel', methods=['POST'])
def coach_cancel_lesson(booking_id):
    token = request.headers.get('Authorization', None)
    
    username = None
    if token:
        valid, username = get_access_token_username(token)
    else:
        return jsonify(message='No token provided'), 400
    
    if not valid:
        return jsonify(message='Unauthorised'), 400
    
    data = request.json
    try:
        message = data['message_to_player']
    except Exception as e:
        return jsonify(message=f"Missing/Invalid key: {message}"), 400

    sql = "SELECT contact_email, start_time FROM Bookings WHERE booking_id=%s"
    response = execute_query(sql, (booking_id, ))
    if len(response) > 0:
        contact_email, start_time_epoch = response[0]
        start_time = datetime.fromtimestamp(start_time_epoch)
    else:
        return jsonify(message='Invalid booking id'), 400

    sql = "UPDATE Bookings SET status=\"cancelled\", message=%s WHERE booking_id=%s"
    execute_query(sql, (message, booking_id))

    date_str = start_time.strftime('%A, %B %d, %Y')
    time_str = start_time.strftime('%I:%M %p')

    email_body = f"""
    <html>
        <body>
            <p>Unfortunately, your lesson on {date_str} at {time_str} has been cancelled.</p>
            <p>Message from Coach:</p>
            <p>{message}</p>
        </body>
    </html>
    """

    send_email(
        'cancellations',
        [contact_email],
        "Lesson Cancellation",
        f"Unfortunately you lesson on {date_str} at {time_str} has been cancelled, message from coach: {message}",
        email_body
    )

    return jsonify(message='Booking successfully cancelled'), 200


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

    logging.debug(f"work_start_time: {work_start_time}")
    logging.debug(f"work_end_time: {work_end_time}")
    logging.debug(f"booking_start_time: {start_time}")
    logging.debug(f"booking_end_time: {booking_end_time}")
    logging.debug('/n')
    
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
