from flask import request, jsonify, Blueprint
import logging
import time

logging.basicConfig(level=logging.DEBUG)

from src.Bookings.GetBooking import get_booking
from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach

def get_pricing_rules(coach_id):
    """
    Retrieves enabled pricing rules for the given coach_id. Automatically includes default rules, 
    excludes past one-time events, and ensures that the rules are enabled.
    """
    # Base SQL query
    sql = """
    SELECT * FROM PricingRules 
    WHERE 
        coach_id = %s AND 
        enabled = 1 AND 
        (is_default = 1 OR
        NOT (period = 'one-time' AND end_time < UNIX_TIMESTAMP()))
    """
    values = (coach_id,)

    # Execute the query
    return execute_query(sql, values)



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
            