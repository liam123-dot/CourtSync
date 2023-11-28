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
    
    results = execute_query('SELECT hourly_rate FROM PricingRules WHERE is_default=1 AND coach_id=%s', (coach_id,), is_get_query=True)
    
    if len(results) > 0:
        hourly_rate = results[0]['hourly_rate']
    else:
        hourly_rate = None
        
    results = execute_query('SELECT duration FROM Durations WHERE coach_id=%s', (coach_id,), is_get_query=True)
    
    durations = sorted([result['duration'] for result in results])
    
    return jsonify(
        hourly_rate=hourly_rate,
        durations=durations
    ), 200
    
