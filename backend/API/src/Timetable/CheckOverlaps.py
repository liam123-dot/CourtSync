from flask import request, jsonify, Blueprint, current_app
from datetime import datetime, timedelta

from src.Users.GetSelf.GetSelf import get_coach
from src.Database.ExecuteQuery import execute_query

CheckOverlapsBlueprint = Blueprint('CheckOverlapsBlueprint', __name__)

def get_bookings(coach_id, from_time, to_time):
    
    sql = """
        SELECT Players.name as player_name, Bookings.start_time 
        FROM Bookings 
        INNER JOIN Players ON Bookings.player_id = Players.player_id
        WHERE Bookings.coach_id = %s 
        AND Bookings.status = 'confirmed' 
        AND ((Bookings.start_time >= %s AND Bookings.start_time <= %s) 
        OR (Bookings.start_time + Bookings.duration*60 >= %s AND Bookings.start_time + Bookings.duration*60 <= %s))
    """
    
    params = (coach_id, from_time, to_time, from_time, to_time)
    
    result = execute_query(sql, params)
        
    result = sorted(result, key=lambda x: x['start_time'])    
    return result

def get_coach_events(coach_id, from_time, to_time):
    connection = current_app.config['db_connection'].connection
    sql = "SELECT title, start_time FROM CoachEvents WHERE coach_id=%s AND status='confirmed' AND ((start_time >= %s AND start_time <= %s) OR (start_time + duration*60 >= %s AND start_time + duration*60 <= %s))"
    params = (coach_id, from_time, to_time, from_time, to_time)
    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        result = cursor.fetchall()
    result = sorted(result, key=lambda x: x[1])    
    return [{'title': row[0], 'start_time': row[1]} for row in result]


@CheckOverlapsBlueprint.route('/timetable/check-overlaps', methods=['GET'])
def check_overlaps_endpoint():
    
    # should be authorised and contain a from time and to time as query parameters in epoch seconds
    
    # return 400 if no token or invalid querys
    
    token = request.headers.get('Authorization')
    
    if token is None:
        return {'message': 'No token provided'}, 400
    
    from_time = int(request.args.get('from'))
    to_time = int(request.args.get('to'))
    
    if from_time is None or to_time is None:
        return {'message': 'from or to not provided'}, 400
    
    repeats = request.args.get('repeats')
    
    if repeats is not None:
        repeats = True if repeats == 'true' else False
        try:
            repeat_until = int(request.args['repeat_until'])
            repeat_frequency = request.args['repeat_frequency']
        except KeyError as e:
            return jsonify(message=f"Missing key: {e}"), 400
    
    coach = get_coach(token)
    
    if coach is None:
        return {'message': 'Invalid token'}, 400
    
    if not repeats:
        
        overlap, bookings, events = check_overlaps(coach['coach_id'], from_time, to_time)
            
        if overlap:
            return jsonify(overlaps=True, bookings=bookings, events=events), 200
        
        return jsonify(message='No overlaps', overlaps=False), 200
    
    else:
        
        overlap, all_bookings, all_events = check_overlaps_repeats(coach['coach_id'], from_time, to_time, repeat_until, repeat_frequency)
        
        if overlap:
            return jsonify(overlaps=True, bookings=all_bookings, events=all_events), 200
        return jsonify(message='No overlaps', overlaps=False), 200
            
def check_overlaps(coach_id, from_time, to_time):
    overlap = False
    bookings = get_bookings(coach_id, from_time, to_time)
    
    if len(bookings) > 0:
        overlap=True
    
    events = get_coach_events(coach_id, from_time, to_time)
    
    if len(events) > 0:
        overlap=True
        
    return overlap, bookings, events

def check_overlaps_repeats(coach_id, from_time, to_time, repeat_until, repeat_frequency):
    overlap = False
    all_bookings = []
    all_events = []
    
    start_date = datetime.fromtimestamp(from_time)
    end_date = datetime.fromtimestamp(to_time)
    
    while start_date.timestamp() < repeat_until:
        overlap, bookings, events = check_overlaps(coach_id, start_date.timestamp(), end_date.timestamp())

        all_bookings.extend(bookings)
        all_events.extend(events)
                            
        if repeat_frequency == 'daily':
            start_date = start_date + timedelta(days=1)
            end_date = end_date + timedelta(days=1)
        elif repeat_frequency == 'weekly':
            start_date = start_date + timedelta(weeks=1)
            end_date = end_date + timedelta(weeks=1)
        elif repeat_frequency == 'fortnightly':
            start_date = start_date + timedelta(weeks=2)
            end_date = end_date + timedelta(weeks=2)
        elif repeat_frequency == 'monthly':
            start_date = start_date + timedelta(weeks=4)
            end_date = end_date + timedelta(weeks=4)
            
    if len(all_bookings) > 0 or len(all_events) > 0:
        overlap=True
        
    return overlap, all_bookings, all_events