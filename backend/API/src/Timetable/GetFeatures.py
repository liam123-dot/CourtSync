from flask import request, jsonify, Blueprint

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach

GetFeaturesBlueprint = Blueprint('GetFeaturesBlueprint', __name__)

@GetFeaturesBlueprint.route('/features', methods=['GET'])
def get_features():
    
    token = request.headers.get('Authorization', None)
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400

    coach_id = coach['coach_id']
    
    hourly_rate = get_hourly_rate(coach_id)
        
    durations = get_durations(coach_id)
    
    return jsonify(
        hourly_rate=hourly_rate,
        durations=durations
    ), 200
    
@GetFeaturesBlueprint.route('/features/hourly-rate', methods=['GET'])
def get_hourly_rate():
    
    token = request.headers.get('Authorization', None)
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400

    coach_id = coach['coach_id']
    
    hourly_rate = get_hourly_rate(coach_id)
    
    return jsonify(hourly_rate=hourly_rate), 200

@GetFeaturesBlueprint.route('/features/durations', methods=['GET'])
def get_durations():
    
    token = request.headers.get('Authorization', None)
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400

    coach_id = coach['coach_id']
    
    durations = get_durations(coach_id)
    
    return jsonify(
        durations=durations,
        booking_scope=coach['booking_scope']
        ), 200
    
@GetFeaturesBlueprint.route('/features/booking-scope', methods=['GET'])
def get_booking_scope():
        
    token = request.headers.get('Authorization', None)
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400

    coach_id = coach['coach_id']
    
    return jsonify(booking_scope=coach['booking_scope']), 200


def get_durations(coach_id):
    results = execute_query('SELECT duration FROM Durations WHERE coach_id=%s', (coach_id,), is_get_query=True)
    
    durations = sorted([result['duration'] for result in results])
    
    return durations
    
def get_hourly_rate(coach_id):
    results = execute_query('SELECT rate FROM PricingRules WHERE is_default=1 AND coach_id=%s', (coach_id,), is_get_query=True)
    
    if len(results) > 0:
        return results[0]['rate']
    else:
        return None