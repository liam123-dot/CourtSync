from flask import request, jsonify, Blueprint
import logging
import time

logging.basicConfig(level=logging.DEBUG)

from src.Bookings.GetBooking import get_booking
from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach

def get_pricing_rules(coach_id, start_time=None, end_time=None, include_default=True, include_disabled=False, include_passed=False):
    """
    Retrieves pricing rules based on provided parameters.
    """
    # Base SQL query
    sql = "SELECT * FROM PricingRules WHERE coach_id = %s"

    values = (coach_id,)

    # Additional conditions for time
    time_conditions = []

    if start_time is not None and end_time is not None:
        time_conditions.append("(start_time <= %s AND end_time >= %s)")
        values += (start_time, end_time)
    elif start_time is not None:
        time_conditions.append("start_time <= %s")
        values += (start_time,)
    elif end_time is not None:
        time_conditions.append("end_time >= %s")
        values += (end_time,)

    # Constructing the time conditions part of the query
    if time_conditions:
        sql += " AND (" + " OR ".join(time_conditions)

        if include_default:
            sql += " OR is_default = 1"
        
        sql += ")"
    elif include_default:
        # Include default only if there are no time conditions
        # sql += " AND is_default = 1"
        pass
    elif not include_default:
        sql += " AND is_default = 0"

    # Exclude disabled rules unless include_disabled is True
    if not include_disabled:
        sql += " AND enabled != 0"
        
    if not include_passed:
        sql += " AND NOT (period='one-time' AND end_time < UNIX_TIMESTAMP())"

    # Execute the query
    return execute_query(sql, values, True)

GetPricingRulesEndpoint = Blueprint('GetPricingRulesEndpoint', __name__)

@GetPricingRulesEndpoint.route('/pricing-rules', methods=['GET'])
def get_pricing_rules_endpoint():
    
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'No coach found'}), 400
    
    include_default = request.args.get('include_default', 'True').lower() == 'true'
    
    pricing_rules = get_pricing_rules(coach['coach_id'], include_default=include_default)
    
    if pricing_rules is None:
        return jsonify({'error': 'No pricing rules found'}), 400
    
    for pricing_rule in pricing_rules:
        if pricing_rule['days']:
            pricing_rule['days'] = pricing_rule['days'].split(',')
    
    return jsonify(pricing_rules), 200


@GetPricingRulesEndpoint.route('/pricing-rules/<booking_id>', methods=['GET'])
def get_rules_endpoint(booking_id):
        
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'unauthorized'}), 400

    booking = get_booking(booking_id)
    
    if not booking:
        return jsonify({'error': 'No booking found'}), 400

    rules = get_rules_from_booking_id(booking_id)
    
    if rules is None:
        return jsonify({'error': 'No pricing rules found'}), 400
    
    rules, cost = format_rules_data(rules, booking['duration'])

    return jsonify(rules=rules, cost=cost), 200

def get_rules_from_booking_id(booking_id):
    sql = """
    SELECT PricingRules.*
    FROM BookingsPricingJoinTable
    JOIN PricingRules ON BookingsPricingJoinTable.rule_id = PricingRules.rule_id
    WHERE BookingsPricingJoinTable.booking_id = %s
    """
    results = execute_query(sql, (booking_id,), True)
    return results

def format_rules_data (rules, duration):
    cost = 0
    new_rules = {
        'extra': []
    }
    for rule in rules:
        if rule['is_default'] or rule['type'] == 'hourly':
            new_rules['hourly'] = rule
            cost += rule['rate'] * (duration / 60)
        else:
            new_rules['extra'].append(rule)
            cost += rule['rate']
            
    return new_rules, cost
            