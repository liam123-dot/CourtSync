from flask import request, jsonify, Blueprint

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach, get_coach_from_slug

GetSettingsBlueprint = Blueprint('GetSettingsBlueprint', __name__)

def check_durations(coach_id):
    durations = execute_query('SELECT * FROM Durations WHERE coach_id = %s', (coach_id,))
    
    if len(durations) > 0:
        return True
    return False


def check_pricing_rules(coach_id):
    pricing_rules = execute_query('SELECT * FROM PricingRules WHERE coach_id = %s', (coach_id,))
    
    if len(pricing_rules) > 0:
        return True
    return False


def check_working_hours(coach_id):
    working_hours = execute_query('SELECT * FROM WorkingHours WHERE coach_id = %s', (coach_id,))
    
    if len(working_hours) > 0:
        for working_hour in working_hours:
            if working_hour['start_time'] and working_hour['end_time']:
                return True

    return False
    

@GetSettingsBlueprint.route('/user/me/settings', methods=['GET'])
def check_settings():
    
    token = request.headers.get('Authorization')
    if not token:
        return jsonify(message='Missing token'), 401
    
    coach = get_coach(token)
    if not coach:
        return jsonify(message='Invalid token'), 401
    
    durations = check_durations(coach['coach_id'])
    pricing_rules = check_pricing_rules(coach['coach_id'])
    working_hours = check_working_hours(coach['coach_id'])    
    invoicing_ready = coach['stripe_account_set_up']
    
    return jsonify(
        durations=durations,
        pricing_rules=pricing_rules,
        working_hours=working_hours,
        invoices=invoicing_ready,
        any=durations and pricing_rules and working_hours and invoicing_ready
    ), 200
    
@GetSettingsBlueprint.route('/coach/<slug>/ready', methods=['GET'])
def check_settings_unauthorised(slug):
    
    coach = get_coach_from_slug(slug)
    
    if not coach:
        return jsonify(message='Invalid slug'), 401
    
    durations = check_durations(coach['coach_id'])
    pricing_rules = check_pricing_rules(coach['coach_id'])
    working_hours = check_working_hours(coach['coach_id'])
    
    return jsonify(
        durations and pricing_rules and working_hours
    ), 200
    