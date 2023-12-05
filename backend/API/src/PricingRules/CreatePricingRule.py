from flask import request, jsonify, Blueprint
from datetime import datetime
import logging

logging.basicConfig(level=logging.DEBUG)

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach

def convert_HH_MM_to_minutes(time):
    """
    Converts a time string in the format HH:MM to minutes.
    """
    hours, minutes = time.split(':')
    return int(hours) * 60 + int(minutes)

def create_pricing_rule(
        coach_id,
        is_default,
        rate,
        label=None,
        start_time=None,
        end_time=None,
        all_day=None,
        type=None,
        period=None,
        days=None,
        date=None,
    ):
    
    if is_default:
        
        if not coach_id or not rate:
            return jsonify(message="Missing required fields, default pricing must have the coach id and hourly rate"), 400    
        
    else:
        
        if period == 'recurring':
            
            # for recurring, the start and end time represent the start and end time of the rule in seconds into THAT day
            
            # must also havec coach_id, rate and a label
            # must specify some days, start time or end time or both if all_day is false and a type. the type can be extra or hourly
            if not days or not type or not coach_id or not rate or not label:
                return jsonify(message="Missing required fields, recurring pricing must have a label, coach id, rate, type and days"), 400
            
            if not all_day:
                if not start_time and not end_time:
                    return jsonify(message="Missing required fields, recurring pricing must have at least one start time or end time"), 400
                if len(start_time) == 0:
                    start_time = None
                if len(end_time) == 0:
                    end_time = None
            else:
                start_time = None
                end_time = None        
                    
                 
            days = ','.join(days)
            days = days.lower()
            
            if start_time:
                start_time = convert_HH_MM_to_minutes(start_time)
            if end_time:
                end_time = convert_HH_MM_to_minutes(end_time)
                 
            insert_recurring_pricing_rule(
                coach_id,
                rate,
                label,
                start_time,
                end_time,
                all_day,
                type,
                period,
                days,
            )
                
        elif period == 'one-time':
            
            # must have a coach_id, rate, label, start_time and end_time
            # for one time pricing the start_time and end_time are in epoch seconds and must be on the same day
            # if all_day is provided as true, a date must be provided then start_time and end_time are calculated as the start and end of the day
            # in epoch seconds
            
            if not coach_id or not rate or not label:
                return jsonify(message="Missing required fields, one-time pricing must have a label, coach id and rate"), 400
                
            if not all_day:
                if not start_time and not end_time:
                    return jsonify(message="Missing required fields, one-time pricing must have a start time and end time"), 400
                if len(start_time) == 0:
                    start_time = None
                if len(end_time) == 0:
                    end_time = None
            else:
                if not date:
                    return jsonify(message="Missing required fields, one-time pricing must have a date if all day is true"), 400
                
            if start_time:
                start_time = convert_HH_MM_to_minutes(start_time)
            if end_time:
                end_time = convert_HH_MM_to_minutes(end_time)
                
            insert_one_time_pricing_rule(
                coach_id,
                rate,
                label,
                start_time,
                end_time,
                all_day,
                type,
                period,
                date
            )
                
        else:
            return jsonify(message="Invalid period provided, period must be one-time or recurring"), 400    


def insert_recurring_pricing_rule(
        coach_id,
        rate,
        label,
        start_time,
        end_time,
        all_day,
        type,
        period,
        days
    ):
    
    sql = "INSERT INTO PricingRules (coach_id, rate, label, start_time, end_time, all_day, type, period, days) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"
    execute_query(sql, (coach_id, rate, label, start_time, end_time, all_day, type, period, days), is_get_query=False)
    
    
def insert_one_time_pricing_rule(
        coach_id,
        rate,
        label,
        start_time,
        end_time,
        all_day,
        type,
        period,
        date
    ):
    
    if all_day:
        start_time = date_to_epoch(date)
        end_time = start_time + 86399
    else:
        if start_time:
            start_time = date_to_epoch(date) + start_time * 60
        if end_time:
            end_time = date_to_epoch(date) + end_time * 60
        
    sql = "INSERT INTO PricingRules (coach_id, rate, label, start_time, end_time, all_day, type, period, days) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"
    execute_query(sql, (coach_id, rate, label, start_time, end_time, all_day, type, period, None), is_get_query=False)
    
def date_to_epoch(date):
    return int(datetime.strptime(date, '%Y-%m-%d').timestamp())


CreatePricingRuleBlueprint = Blueprint('CreatePricingRuleBlueprint', __name__)

@CreatePricingRuleBlueprint.route('/pricing-rules', methods=['POST'])
def create_pricing_rule_endpoint():
    
    token = request.headers.get('Authorization', None)
    
    if not token:
        return jsonify(message='Unauthorised'), 400

    coach = get_coach(token)
    
    if not coach:
        return jsonify(message='Unauthorised'), 400
    
    coach_id = coach['coach_id']
    
    data = request.json
    
    try:
        is_default = data['is_default']
        rate = data['rate']
        label = data['label']
        start_time = data['start_time']
        end_time = data['end_time']
        all_day = data['all_day']
        type = data['type']
        period = data['period']
        days = data['days']
        date = data['date']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing Key: {e}"), 400
    
    logging.debug(f"Create pricing rule request received with data: {data}")
    
    result = create_pricing_rule(
        coach_id,
        is_default,
        rate,
        label=label,
        start_time=start_time,
        end_time=end_time,
        all_day=all_day,
        type=type,
        period=period,
        days=days,
        date=date
    )
    
    if result is not None:
        return result
    
    return jsonify(message="Pricing rule created successfully"), 200