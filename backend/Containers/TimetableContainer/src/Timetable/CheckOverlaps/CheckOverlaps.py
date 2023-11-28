from flask import request, jsonify, Blueprint
from src.shared.UserGetSelf import get_self
from src.shared.ExecuteQuery import execute_query

CheckOverlapsBlueprint = Blueprint('CheckOverlapsBlueprint', __name__)

def get_bookings(coach_id, from_time, to_time):
    # check if any booking exists that is in the confirmed status in this time
    sql = "SELECT player_name, start_time FROM Bookings WHERE coach_id = %s AND status = 'confirmed' AND ((start_time >= %s AND start_time <= %s) OR (start_time + duration*60 >= %s AND start_time + duration*60 <= %s))"
    params = (coach_id, from_time, to_time, from_time, to_time)
    result = execute_query(sql, params)
    result = sorted(result, key=lambda x: x[1])    
    
    return [{'player_name': row[0], 'start_time': row[1]} for row in result]

    
def get_coach_events(coach_id, from_time, to_time):

    sql = "SELECT title, start_time FROM CoachEvents WHERE coach_id=%s AND status='confirmed' AND ((start_time >= %s AND start_time <= %s) OR (start_time + duration*60 >= %s AND start_time + duration*60 <= %s))"
    params = (coach_id, from_time, to_time, from_time, to_time)
    result = execute_query(sql, params)
    # order results by start time ascending
    result = sorted(result, key=lambda x: x[1])    
    
    return [{'title': row[0], 'start_time': row[1]} for row in result]


@CheckOverlapsBlueprint.route('/timetable/check-overlaps', methods=['GET'])
def check_overlaps():
    
    # should be authorised and contain a from time and to time as query parameters in epoch seconds
    
    # return 400 if no token or invalid querys
    
    token = request.headers.get('Authorization')
    
    if token is None:
        return {'message': 'No token provided'}, 400
    
    from_time = request.args.get('from')
    to_time = request.args.get('to')
    
    if from_time is None or to_time is None:
        return {'message': 'from or to not provided'}, 400
    
    coach = get_self(token)
    
    if coach is None:
        return {'message': 'Invalid token'}, 400
    
    overlap = False
    
    bookings = get_bookings(coach['coach_id'], from_time, to_time)
    
    if len(bookings) > 0:
        overlap=True
    
    events = get_coach_events(coach['coach_id'], from_time, to_time)
    
    if len(events) > 0:
        overlap=True
        
    if overlap:
        return jsonify(overlaps=True, bookings=bookings, events=events), 200
    
    return jsonify(message='No overlaps', overlaps=False), 200