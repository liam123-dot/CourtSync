from flask import request, jsonify, Blueprint
from datetime import datetime

from src.Timetable.GetTimetable.GetTimetable import get_pricing_rules
from src.Users.GetSelf.GetSelf import get_coach_from_slug

CalculateLessonCostBlueprint = Blueprint('CalculateLessonCostBlueprint', __name__)

def epoch_to_date(epoch_time):
    # Convert the epoch time to a datetime object
    dt = datetime.fromtimestamp(epoch_time)
    
    # Format the datetime object to a string in the desired format
    return dt.strftime('%d-%m-%Y')

@CalculateLessonCostBlueprint.route('/timetable/<slug>/lesson-cost', methods=['GET'])
def calculate_lesson_cost(slug):
    
    start_time = request.args.get('startTime', None)
    duration = request.args.get('duration', None)

    if not start_time or not duration:
        return jsonify({'error': 'No start time or duration provided'}), 400
    
    # both inputs should be integers
    try:
        start_time = int(start_time)
        duration = int(duration)
    except:
        return jsonify({'error': 'Invalid start time or duration provided'}), 400
    
    coach = get_coach_from_slug(slug)
    
    if not coach:
        return jsonify({'error': 'No coach found'}), 400
    
    pricing_rules = get_pricing_rules(coach['coach_id'])
    
    if not pricing_rules:
        return jsonify({'error': 'No pricing rules found'}), 400
    
    if len(pricing_rules) > 1:
        
        current_date = epoch_to_date(int(start_time))
        if current_date in pricing_rules.keys90:
            for rule in pricing_rules[current_date]:
                # check if the start time or start time + duration * 60 (end time) is within the rule
                # only one needs to be within for the rule to apply
                if rule['start_time'] <= int(start_time) <= rule['end_time'] or rule['start_time'] <= int(start_time) + int(duration) * 60 <= rule['end_time']:
                    cost = int(rule['hourly_rate'] * (duration / 60.0))
                    
                    return jsonify({'cost': cost, 'ruleID': rule['rule_id']}), 200
            
    rule = pricing_rules['default']
    cost = int(rule['hourly_rate'] * (duration / 60.0))
    
    return jsonify({'cost': cost, 'ruleID': rule['rule_id']}), 200
        