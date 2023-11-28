from flask import request, jsonify, Blueprint
from src.shared.UserGetSelf import get_self
from src.shared.ExecuteQuery import execute_query

from datetime import datetime

CreateCoachEventBlueprint = Blueprint('CreateCoachEventBlueprint', __name__)

def create_coach_event(coach_id, start_time, duration, title, description):
    sql = "INSERT INTO CoachEvents (coach_id, start_time, duration, title, description) VALUES (%s, %s, %s, %s, %s)"
    params = (coach_id, start_time, duration, title, description)
    result = execute_query(sql, params)
    return result


@CreateCoachEventBlueprint.route('/timetable/coach-events', methods=['POST'])
def create_coach_event_route():
    
    token = request.headers.get('Authorization')    
    
    if token is None:
        return {'message': 'No token provided'}, 400
    
    data = request.json
    valid_parameters = validate_parameters(data)
    
    if not valid_parameters:
        return {'message': 'Invalid parameters'}, 400
    
    coach = get_self(token)
    
    if not coach:
        return {'message': 'Invalid token'}, 400
    
    start_time, duration = convert_to_start_time_and_duration(data['start_time'], data['end_time'])
    
    create_coach_event(coach['coach_id'], start_time, duration, data['title'], data['description'])
    
    return jsonify(message='Coach event created successfully'), 200
    

def validate_parameters(data):
    # check if all parameters are present and valid
    if 'start_time' not in data or 'end_time' not in data or 'title' not in data or 'description' not in data:
        return False
    
    if not isinstance(data['start_time'], int) or not isinstance(data['end_time'], int) or not isinstance(data['title'], str):
        return False
    
    if data['start_time'] < 0 or data['end_time'] < 0 or data['title'] == '':
        return False
    
    return validate_start_time_end_time(data['start_time'], data['end_time'])
    

def validate_start_time_end_time(start_time, end_time):
    
    # make sure start and end time are on the same day
    
    start_time = datetime.fromtimestamp(start_time)
    end_time = datetime.fromtimestamp(end_time)
    
    if start_time.day != end_time.day or start_time.month != end_time.month or start_time.year != end_time.year:
        return False
    
    return True    
    
    

def convert_to_start_time_and_duration(start_time, end_time):
    
    return start_time, int((end_time - start_time) / 60)