from flask import request, jsonify, Blueprint

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach

from src.Timetable.CheckOverlaps import check_overlaps

AddCoachEventBlueprint = Blueprint('AddCoachEventBlueprint', __name__)

@AddCoachEventBlueprint.route('/coach-event', methods=['POST'])
def add_coach_event_blueprint():
    
    token = request.headers.get('Authorization')
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify(message='Unauthorised'), 400
    
    
    data = request.json
    
    # needs a start time, end time, title and description, description can be null
    
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    title = data.get('title')
    description = data.get('description')
    
    if not start_time or not end_time or not title:
        return jsonify(message='Missing required data'), 400
    
    if start_time > end_time:
        return jsonify(message='Start time must be before end time'), 400
    
    overlaps, bookings, events = check_overlaps(coach['coach_id'], start_time, end_time)
    
    if overlaps:
        return jsonify(message='Event overlaps with existing booking or event'), 400
    
    sql = "INSERT INTO CoachEvents (coach_id, start_time, duration, title, description, status) VALUES (%s, %s, %s, %s, %s, 'confirmed')"
    
    params = (coach['coach_id'], start_time, (end_time - start_time)/60, title, description)
    
    execute_query(sql, params, is_get_query=False)
    
    return jsonify(message='Event added successfully'), 200   