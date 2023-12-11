from flask import request, jsonify, Blueprint

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach_from_slug

GetDurationsBlueprint = Blueprint('GetDurationsBlueprint', __name__)

@GetDurationsBlueprint.route('/coach/<slug>/durations', methods=['GET'])
def get_durations_endpoint(slug):
    
    coach = get_coach_from_slug(slug)
    
    if not coach:
        return jsonify({'error': 'Invalid slug'}), 400
    
    query = "SELECT duration FROM Durations WHERE coach_id = %s"
    
    results = execute_query(query, (coach['coach_id'],), is_get_query=True)
    
    output = [
        result['duration']
        for result in results
    ]
    
    return jsonify(output), 200
    
    