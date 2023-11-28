from flask import request, jsonify, Blueprint

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach

EditFeaturesBlueprint = Blueprint('EditFeaturesBlueprint', __name__)

def update_pricing_rules(default_lesson_cost, username, is_update):
    sql = "SELECT * FROM PricingRules WHERE coach_id=%s AND is_default=1"
    result = execute_query(sql, (username, ), is_get_query=True)
    if len (result) > 0:
        sql = "UPDATE PricingRules SET hourly_rate=%s WHERE coach_id=%s AND is_default=1"
    else:
        sql = "INSERT INTO PricingRules(rule_name, hourly_rate, coach_id, is_default) VALUES(%s, %s, %s, %s)"
    execute_query(sql, ('Default Pricing', default_lesson_cost, username, 1), is_get_query=False)

def delete_durations(username):
    delete_sql = "DELETE FROM Durations WHERE coach_id=%s"
    execute_query(delete_sql, (username, ), is_get_query=False)

def insert_durations(durations, username):
    sql = "INSERT INTO Durations (duration, coach_id) VALUES (%s, %s)"
    for duration in durations:
        execute_query(sql, (duration, username), is_get_query=False)

@EditFeaturesBlueprint.route('/features', methods=['PUT'])
def update_features():
    token = request.headers.get('Authorization', None)

    if not token:
        return jsonify(message='Unauthorised'), 400
    
    coach = get_coach(token)

    if not coach:
        return jsonify(message='Unauthorised'), 400
    
    username = coach['coach_id']
    
    try:
        data = request.json
        durations = data['durations']
        default_lesson_cost = data['default_lesson_cost']
        is_update = data['is_update']
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing Key: {e}")
    
    update_pricing_rules(default_lesson_cost, username, is_update)

    delete_durations(username)

    insert_durations(durations, username)

    return jsonify(message="Features updated successfully"), 200