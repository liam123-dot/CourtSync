from flask import jsonify, Blueprint, request

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach

GetPlayersBlueprint = Blueprint('GetPlayersBlueprint', __name__)

@GetPlayersBlueprint.route('/players', methods=['GET'])
def get_players_blueprint():
    
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'Missing token'}), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400    
    
    players = get_players(coach['coach_id'])
    
    return jsonify(players), 200
    
    
    
def get_players(coach_id):
    sql = "SELECT Players.*, Contacts.name as contact_name, Contacts.contact_id as contact_id FROM Players JOIN Contacts ON Players.contact_id = Contacts.contact_id WHERE Players.coach_id=%s AND Players.enabled=1"
    
    results = execute_query(sql, (coach_id,), is_get_query=True)
    
    return results
