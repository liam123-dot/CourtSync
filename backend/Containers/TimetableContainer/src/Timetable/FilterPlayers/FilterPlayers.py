from flask import request, jsonify, Blueprint
from src.shared.ExecuteQuery import execute_query
from src.shared.UserGetSelf import get_self

FilterPlayersBlueprint = Blueprint('FilterPlayersBlueprint', __name__)

def get_possible_names(query):
    # given a query, return a list of names. should search by both player_name and contact_name in the database
    
    sql = """
    SELECT GROUP_CONCAT(DISTINCT player_name) as player_names, 
           GROUP_CONCAT(DISTINCT contact_name) as contact_names, 
           contact_email 
    FROM Bookings 
    WHERE player_name LIKE %s OR contact_name LIKE %s 
    GROUP BY contact_email
    """
    
    # Append '%' to the query string so that it matches any string that starts with the query
    query_with_wildcard = query + '%'
    
    results = execute_query(sql, (query_with_wildcard, query_with_wildcard))
    return results
    

@FilterPlayersBlueprint.route('/timetable/<slug>/filter', methods=['GET'])
def filter_players(slug):
    
    token = request.headers.get('Authorization')
    
    query = request.args.get('query')
    
    if not query:
        return jsonify(message='No query provided'), 400
    
    coach = get_self(token)
    
    if coach is None:
        return jsonify(message='Unauthorized'), 400
    
    if coach['slug'] != slug:
        return jsonify(message='Incorrect slug provided'), 400
    
    names = get_possible_names(query)
    
    return jsonify(names), 200
        
