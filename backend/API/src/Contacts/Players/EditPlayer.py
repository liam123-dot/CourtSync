from flask import request, jsonify, Blueprint

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach
from src.Contacts.Players.GetPlayer import get_player_from_id

EditPlayerBlueprint = Blueprint('EditPlayerBlueprint', __name__)

uneditable = ['player_id', 'contact_id', 'coach_id']

@EditPlayerBlueprint.route('/player/<player_id>', methods=['PUT'])
def edit_player(player_id):
    
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify(message='Missing token'), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify(message='Invalid token'), 401
    

    player_id = int(player_id)
    
    player = get_player_from_id(player_id)
    
    if not player:
        return jsonify(message='Invalid player id'), 400
    
    if player['coach_id'] != coach['coach_id']:
        return jsonify(message='Unauthorized'), 401
    
    data = request.json
    
    for key in data:
        if key not in player.keys() or key in uneditable:
            return jsonify(message=f"Invalid key: {key}"), 400        
    
    # construct a query based on provided attributes
    query = "UPDATE Players SET "
    
    for key in data:
        query += f"{key} = %s, "
        
    query = query[:-2]
    
    query += f" WHERE player_id = {player_id}"
    
    execute_query(query, tuple(data.values()), is_get_query=False)
    
    return jsonify(message='Success')
