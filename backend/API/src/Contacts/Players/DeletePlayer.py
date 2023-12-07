from flask import jsonify, Blueprint, request   

from src.Contacts.Players.GetPlayer import get_player_from_id
from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach

DeletePlayerBlueprint = Blueprint('DeletePlayerBlueprint', __name__)

@DeletePlayerBlueprint.route('/player/<player_id>', methods=['DELETE']) 
def delete_player_endpoint(player_id):
    
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'Missing token'}), 400
    
    coach = get_coach(token)
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400
    
    player = get_player_from_id(player_id)
    
    if player['coach_id'] != coach['coach_id']:
        return jsonify({'error': 'Unauthorized'}), 400
    
    sql = "UPDATE Players SET enabled=0 WHERE player_id=%s"
    
    execute_query(sql, (player_id, ), False)
    
    return jsonify({'success': True}), 200
