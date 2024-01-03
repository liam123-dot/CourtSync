from flask import request, jsonify, Blueprint

import time
import json

GetCoachEventBlueprint = Blueprint("GetCoachEvent", __name__)

from src.Bookings.GetBookings.GetBookings import calculate_expected_count, get_cron_execution_times
from src.Repeats.CreateRepeatCoachEvent import insert_coach_event
from src.Database.ExecuteQuery import execute_query
from src.Logs.WriteLog import write_log
from src.Users.GetSelf.GetSelf import get_coach

@GetCoachEventBlueprint.route("/coach-events", methods=["GET"])
def get_coach_event_route():
    
    token = request.headers.get("Authorization")
    
    if not token:
        return jsonify({"error": "No token provided"}), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({"error": "Invalid token"}), 400
    
    coach_id = coach["coach_id"]
    
    from_time = request.args.get("fromTime")
    to_time = request.args.get("toTime")
    
    from_time = int(from_time)
    to_time = int(to_time)
    
    coach_events = get_coach_events(coach_id, from_time, to_time)
    
    return jsonify(
        coach_events=coach_events
    ), 200

def get_coach_events(coach_id, from_time=None, to_time=None, include_cancelled=True):
    sql = """
    SELECT ce.*, rr.repeat_frequency as repeat_frequency, rr.repeat_until as repeat_until
    FROM CoachEvents ce
    LEFT JOIN RepeatRules rr ON ce.repeat_id = rr.repeat_id
    WHERE ce.coach_id = %s AND rr.repeat_id IS NULL
    """
        
    args = (coach_id,)
    
    if from_time and to_time:
        sql += " AND ce.start_time >= %s AND ce.start_time <= %s"
        args += (from_time, to_time)
        
    if not include_cancelled:
        sql += " AND ce.status != 'cancelled'"
    
    results = execute_query(sql, args=args, is_get_query=True)
    
    if from_time and to_time:
        
        from_time = int(from_time)
        to_time = int(to_time)
        
        repeating_events = get_repeating_coach_events(coach_id, from_time, to_time)
    
    results += repeating_events
    
    return results

def get_coach_event(coach_event_id):
    sql = """
    SELECT ce.*, rr.repeat_frequency as repeat_frequency, rr.repeat_until as repeat_until
    FROM CoachEvents ce
    LEFT JOIN RepeatRules rr ON ce.repeat_id = rr.repeat_id
    WHERE ce.event_id = %s
    """
    
    args = (coach_event_id,)
    
    results = execute_query(sql, args=args, is_get_query=True)
    
    return results[0]

def get_coach_event_by_hash(hash):
    
    sql = "SELECT * FROM CoachEvents WHERE hash = %s"
    response = execute_query(sql, args=(hash,), is_get_query=True)
    return response[0]
    

def get_repeating_coach_events(coach_id, initial_from_time, initial_to_time):
    sql = """
        SELECT 
            CoachEvents.*,            
            RepeatRules.repeat_id,
            RepeatRules.cron,
            RepeatRules.start_time as repeat_start_time,
            RepeatRules.repeat_until as repeat_until
        FROM RepeatRules
        INNER JOIN CoachEvents ON CoachEvents.repeat_id=RepeatRules.repeat_id
        WHERE RepeatRules.coach_id=%s
        AND RepeatRules.is_active=1
        AND NOT (RepeatRules.start_time > %s OR (RepeatRules.repeat_until IS NOT NULL AND RepeatRules.repeat_until < CoachEvents.start_time ))
    """
        
    results = execute_query(sql, args=(coach_id, initial_to_time), is_get_query=True)
    
    collect_by_cron = {}    
    
    for result in results:
        from_time = initial_from_time
        to_time = initial_to_time    
        
        if result['cron'] not in collect_by_cron.keys():
            repeat_start_time = result['repeat_start_time']
            if from_time < repeat_start_time:
                from_time = repeat_start_time
                        
            if result['repeat_until'] is not None and to_time > result['repeat_until']:
                write_log('bigger')
                to_time = int(result['repeat_until'])
                            
            collect_by_cron[result['cron']] = {
             
                'events': [],
                'from_time': from_time,
                'to_time': to_time,
                'repeat_until': result['repeat_until'],
                'template': result,
                'expected_count': calculate_expected_count(from_time, to_time, result['cron'])
                
            }
                 
        else:
            from_time = collect_by_cron[result['cron']]['from_time']
            to_time = collect_by_cron[result['cron']]['to_time']
            
        if result['start_time'] >= from_time and result['start_time'] <= to_time:
            collect_by_cron[result['cron']]['events'].append(result)
            
    write_log(f"collect_by_cron: {json.dumps(collect_by_cron, indent=4)}")
            
    for cron in collect_by_cron.keys():
        
        cron_data = collect_by_cron[cron]
        expected_count = cron_data['expected_count']
        actual_count = len(cron_data['events'])
        
        if expected_count != actual_count:
            cron_data['events'] = fill_in_blanks(cron, cron_data, initial_from_time, initial_to_time)
            
    to_be_added = []
    
    for cron in collect_by_cron.keys():
        for event in collect_by_cron[cron]['events']:
            to_be_added.append(event)            
    
    return to_be_added

def fill_in_blanks(cron, cron_data, from_time, to_time):
    cron_execution_times = get_cron_execution_times(from_time, to_time, cron)
    cron_dict = {int(time.timestamp()): None for time in cron_execution_times}
    
    for event in cron_data['events']:
        if event['start_time'] in cron_dict.keys():
            cron_dict[event['start_time']] = event
            
    for key in cron_dict.keys():
        if cron_dict[key] is None:
            
            hash = insert_coach_event(
                {
                    'coach_id': cron_data['template']['coach_id'],
                    },
                key,
                key + (cron_data['template']['duration'] * 60),
                cron_data['template']['title'],
                cron_data['template']['description'],
                cron_data['template']['repeat_id']
            )
            coach_event = get_coach_event_by_hash(hash)
            cron_dict[key] = coach_event
            
    return list(cron_dict.values())