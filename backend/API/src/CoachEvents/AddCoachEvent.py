from flask import request, jsonify, Blueprint
import time

from src.Bookings.AddBooking.InsertBooking import hash_booking
from src.Timetable.CheckOverlaps import check_overlaps_repeats
from src.Database.ExecuteQuery import execute_query
from src.Logs.WriteLog import write_log
from src.Repeats.CreateRepeatCoachEvent import create_repeating_coach_event
from src.Timetable.CheckOverlaps import check_overlaps
from src.Users.GetSelf.GetSelf import get_coach

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
    
    repeats = data.get('repeats')
    if repeats:
        repeat_indefinitely = data.get('repeatIndefinitely', True) == 'true'
        repeats_frequency = data['repeatFrequency']
        if not repeat_indefinitely:                
            repeats_until = data.get('repeatUntil', None)
        else:
            repeats_until = None
    else:
        repeats_until = None
        repeats_frequency = None
    
    if not start_time or not end_time or not title:
        return jsonify(message='Missing required data'), 400
    
    if start_time > end_time:
        return jsonify(message='Start time must be before end time'), 400
    
    # overlaps, bookings, events = check_overlaps(coach['coach_id'], start_time, end_time)
    
    # if overlaps:
    #     return jsonify(message='Event overlaps with existing booking or event'), 400
        
    if repeats:
        write_log('repeats')
        create_repeating_coach_event(
            [coach, start_time, end_time, title, description], 
            start_time, 
            end_time, 
            repeats_until, 
            repeats_frequency,
            coach
        )
    else:
        insert_coach_event(coach, start_time, end_time, title, description)
    
    return jsonify(message='Event added successfully'), 200


def insert_coach_event(coach, start_time, end_time, title, description, coach_id=None):
    
    hash = hash_booking(start_time, end_time, time.time())
    
    sql = "INSERT INTO CoachEvents (coach_id, start_time, duration, title, description, status, hash) VALUES (%s, %s, %s, %s, %s, 'confirmed', %s)"
    
    if coach_id is None:
        params = (coach['coach_id'], start_time, (end_time - start_time)/60, title, description, hash)
    else:
        params = (coach_id, start_time, (end_time - start_time)/60, title, description, hash)
    
    execute_query(sql, params, is_get_query=False)
    
    return hash 
