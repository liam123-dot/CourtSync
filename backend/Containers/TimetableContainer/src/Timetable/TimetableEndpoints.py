from flask import Blueprint, request, jsonify
from src.utils.CheckAuthorization import get_access_token_username
from src.utils.ExecuteQuery import execute_query

timetable = Blueprint('main', __name__)

@timetable.route('/timetable')
def get_timetable_no_slug():
    return "Provide a coach slug as a path paratmeter", 400

@timetable.route('/timetable/<slug>', methods=['GET'])
def get_timetable(slug):
    
    try:
        from_time = request.args['from_time']
        to_time = request.args['to_time']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing query string parameter: {e}")
        
    token = request.headers.get('Authorization', None)
    
    username = None
    if token:
        valid, username = get_access_token_username(token)

    sql = "SELECT coach_id FROM Coaches WHERE slug=%s"
    try:
        coach_id = execute_query(sql, (slug, ))[0][0]
    except IndexError:
        return jsonify(message='Coach with passed slug does not exist'), 400

    try:

        authorised = False
        if username:
            if coach_id == username:
                authorised = True

        sql = "SELECT working_hour_id, day_of_week, start_time, end_time FROM WorkingHours WHERE coach_id=%s"
        results = execute_query(sql, (coach_id, ))

        working_hours = {}
        for working_hour in results:
            working_hour_id = working_hour[0]
            day_of_week = working_hour[1]
            start_time = working_hour[2]
            end_time = working_hour[3]
            working_hours[day_of_week] = {
                'working_hour_id': working_hour_id,
                'start_time': start_time,
                'end_time': end_time
            }

        sql = "SELECT booking_id, player_name, contact_email, contact_phone_number, lesson_type_id, start_time, status FROM Bookings WHERE coach_id=%s AND %s < start_time AND %s > start_time"

        results = execute_query(sql, (coach_id, from_time, to_time));

        bookings = {}
        for booking in results:
            if authorised:
                bookings[booking[0]] = {
                    'player_name': booking[1],
                    'contact_email': booking[2],
                    'contact_phone_number': booking[3],
                    'lesson_type_id': booking[4],
                    'start_time': booking[5],
                    'status': booking[6]
                }
            else:
                bookings[booking[0]] = {
                    'lesson_type_id': booking[4],
                    'start_time': booking[5],
                    'status': booking[6]
                }

        lesson_types = {}

        sql = "SELECT lesson_type_id, duration, cost, label FROM LessonTypes WHERE coach_id=%s"
        results = execute_query(sql, (coach_id, ))

        
        # Populate the lesson_types dictionary.
        for lesson_type in results:
            lesson_types[lesson_type[0]] = {
                'duration': lesson_type[1],
                'cost': lesson_type[2],
                'label': lesson_type[3]
            }

        return jsonify(
            working_hours=working_hours,
            lesson_types=lesson_types,
            bookings=bookings,
            authorised=authorised
        ), 200
    except Exception as e:
        return jsonify(message="Internal Server Error", error=str(e)), 500

@timetable.route('/timetable/<slug>/booking', methods=['POST'])
def add_booking(slug):
    token = request.headers.get('Authorization', None)

    body = request.json

    try:
        start_time = body['start_time']
        lesson_type_id = body['lesson_type_id']
        player_name = body['player_name']
        contact_email = body['contact_email']
        contact_phone_number = body['contact_phone_number']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing parameter: {e}")
    
    username = None
    if token:
        valid, username = get_access_token_username(token)

    sql = "SELECT coach_id FROM Coaches WHERE slug=%s"
    try:
        coach_id = execute_query(sql, (slug, ))[0][0]
    except IndexError:
        return jsonify(message='Coach with passed slug does not exist'), 400

    authorised = False
    if username:
        if coach_id == username:
            authorised = True

    sql = "INSERT INTO Bookings(player_name, contact_email, contact_phone_number, lesson_type_id, start_time) VALUES (%s, %s, %s, %s, %s)"

    response, ok = execute_query(sql, (player_name, contact_email, contact_phone_number, lesson_type_id, start_time))

    if ok:
        return jsonify(message='Success'), 200
    else:
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
        working_hours_existing = get_existing_working_hours(username)
        for day in working_hours.keys():
            if day not in working_hours_existing.keys():
                working_hours_existing[day] = {}

            day_data = working_hours[day]
            if day_data['start_time'] and day_data['end_time']:
                if ((type(day_data['start_time']) == int or len(day_data['start_time']) > 0)
                        and type(day_data['end_time']) == int or len(day_data['end_time']) > 0):
                    working_hours_existing[day]['start_time'] = day_data['start_time']
                    working_hours_existing[day]['end_time'] = day_data['end_time']
            else:
                working_hours_existing[day]['start_time'] = None
                working_hours_existing[day]['end_time'] = None

        for day in working_hours_existing.keys():
            start_time = working_hours_existing[day]['start_time']
            end_time = working_hours_existing[day]['end_time']
            if 'id' in working_hours_existing[day].keys():
                working_hour_id = working_hours_existing[day]['id']
                sql = "UPDATE WorkingHours SET start_time=%s, end_time=%s WHERE working_hour_id=%s"
                execute_query(sql, (start_time, end_time, working_hour_id))
            else:
                sql = "INSERT INTO WorkingHours(coach_id, day_of_week, start_time, end_time) VALUES (%s, %s, %s, %s)"
                execute_query(sql, (username, day, start_time, end_time))
        
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