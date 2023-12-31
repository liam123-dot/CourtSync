from flask import request, jsonify, Blueprint
from datetime import datetime
import json

import logging

logging.basicConfig(level=logging.DEBUG)

from src.PricingRules.GetPricingRules import get_pricing_rules
from src.Users.GetSelf.GetSelf import get_coach_from_slug
from src.Users.GetSelf.GetSelf import get_coach

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
    
    pricing_rules = get_pricing_rules(coach['coach_id'], include_default=True)
    
    if not pricing_rules:
        return jsonify({'error': 'No pricing rules found'}), 400
    
    # The rest of the code is the same as the calculate_lesson_cost function
    
    cost, rules = calculate_lesson_cost(start_time, duration, coach['coach_id'])
    
    return jsonify(
        cost=cost,
        duration=duration,
        rules=rules
    ), 200
    
        
@CalculateLessonCostBlueprint.route('/timetable/lesson-cost', methods=['GET'])
def calculate_lesson_cost_from_token():
    
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
    
    # Get the access token from the Authorization header
    access_token = request.headers.get('Authorization')
    if not access_token:
        return jsonify({'error': 'No access token provided'}), 400

    coach = get_coach(access_token)
    
    if not coach:
        return jsonify({'error': 'No coach found'}), 400
    
    pricing_rules = get_pricing_rules(coach['coach_id'], include_default=True)
    
    if not pricing_rules:
        return jsonify({'error': 'No pricing rules found'}), 400
    
    # The rest of the code is the same as the calculate_lesson_cost function
    
    cost, rules = calculate_lesson_cost(start_time, duration, coach['coach_id'])
    
    return jsonify(
        cost=cost,
        rules=rules
    ), 200
    
    # return jsonify({'cost': cost, 'ruleID': rule['rule_id']}), 200

    # ...
    
def calculate_lesson_cost(start_time, duration, coach_id):
    # returns lesson cost in pennies.
    
    cost = 0
    
    rules = {
        'hourly': None,
        'extra': []
    }
    
    # Get the pricing rules for the coach
    pricing_rules = get_pricing_rules(coach_id, include_default=True)
    
    # If there are no pricing rules, return None
    if not pricing_rules:
        return None
    print(f"pricing_rules: {json.dumps(pricing_rules, indent=4)}")
    
    pricing_rules = get_rules_for_date(start_time, pricing_rules)
    
    print(f"pricing_rules: {json.dumps(pricing_rules, indent=4)}")
    
    if len(pricing_rules['recurring']) > 0:
        # check if the start time is within any of the recurring rules
        rule = check_recurring_rules(start_time, pricing_rules['recurring'])
        if rule:
            cost += int(rule['rate'] * (duration / 60))
            rules['hourly'] = rule
    else:
        rules['hourly'] = pricing_rules['default']
        cost += int(pricing_rules['default']['rate'] * (duration / 60))
        
    if len(pricing_rules['extra_costs']) > 0:
        for rule in pricing_rules['extra_costs']:
            logging.debug(rule)
            rule_start_time = rule['start_time']
            rule_end_time = rule['end_time']
            if not rule_start_time:
                rule_start_time = 0
            if not rule_end_time:
                rule_end_time = 1440
            if rule['all_day'] or rule_start_time <= convert_epoch_to_minutes(start_time) <= rule_end_time:
                cost += int(rule['rate'])
                rules['extra'].append(rule) 
    
    return cost, rules

def check_recurring_rules(start_time, recurring_rules):
    
    for rule in recurring_rules:
        rule_start_time = rule['start_time']
        rule_end_time = rule['end_time']
        if not rule_start_time:
            rule_start_time = 0
        if not rule_end_time:
            rule_end_time = 1440
        if rule['all_day'] or rule_start_time <= convert_epoch_to_minutes(start_time) <= rule_end_time:
            return rule

def get_rules_for_date(start_time, pricing_rules):
    
    applicable_rules = {
        'default': None,
        'extra_costs': [],
        'recurring': []
    }
    
    # get the day of the week for the provided start time, 0 = Monday, 6 = Sunday
    start_day = datetime.fromtimestamp(start_time).weekday()
    
    # convert from index to name of day
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    start_day = days[start_day].lower()
    
    for pricing_rule in pricing_rules:
        if pricing_rule['is_default']:
            applicable_rules['default'] = pricing_rule
        if pricing_rule['period'] == 'one-time':
            # pricing_rule['start_time'] will be in epoch, check if it is same date as passed start_time
            
            # get the date of the pricing rule
            rule_date = datetime.fromtimestamp(pricing_rule['start_time'])
            
            # get the date of the start time
            start_date = datetime.fromtimestamp(start_time)
            
            # if the dates are the same, add the rule to the applicable rules

            if rule_date.date() == start_date.date():
                if pricing_rule['start_time']:
                    pricing_rule['start_time'] = convert_epoch_to_minutes(pricing_rule['start_time'])
                if pricing_rule['end_time']:
                    pricing_rule['end_time'] = convert_epoch_to_minutes(pricing_rule['end_time'])
                if pricing_rule['type'] == 'extra':
                    applicable_rules['extra_costs'].append(pricing_rule)
                else:
                    applicable_rules['recurring'].append(pricing_rule)
            
        if pricing_rule['period'] == 'recurring':
            # since recurring, it will have a list of days. get the day of the passed start time,
            # 0 being Monday, 6 being Sunday. Then get the day of the week for each day in the list
            # and check if they match
            
            # if the start day is in the list of days for the pricing rule, add the rule to the applicable rules
            if start_day in pricing_rule['days']:
                if pricing_rule['type'] == 'extra':
                    applicable_rules['extra_costs'].append(pricing_rule)
                else:
                    applicable_rules['recurring'].append(pricing_rule)
                
    return applicable_rules

def convert_epoch_to_minutes(epoch_time):
    
    # takes an input of epoch seconds and returns how many minutes into the day it is
    
    # convert the epoch time to a datetime object
    
    dt = datetime.fromtimestamp(epoch_time)
    
    # get the hour and minute from the datetime object
    
    hour = dt.hour
    minute = dt.minute
    
    # convert the hour and minute to minutes
    
    time = hour * 60 + minute
    
    return time
    
    
    