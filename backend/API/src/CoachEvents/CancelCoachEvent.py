
from flask import request, jsonify, Blueprint

CancelCoachEventBlueprint = Blueprint('CancelCoachEventBlueprint', __name__)

from src.CoachEvents.GetCoachEvents import get_coach_event

from src.Database.ExecuteQuery import execute_query

from src.Users.GetSelf.GetSelf import get_coach

def cancel_coach_event(coach_event, cancel_repeats=False):

    if not cancel_repeats:

        sql = "UPDATE CoachEvents SET status='cancelled' WHERE coach_event_id=%s"
        
        execute_query(sql, args=(coach_event['event_id'],), is_get_query=False)
        
    else:
        
        if coach_event['repeat_id'] is None:
            return
        
        sql = "UPDATE CoachEvents SET status='cancelled' WHERE repeat_id=%s AND start_time >= %s"
        
        execute_query(sql, args=(coach_event['repeat_id'], coach_event['start_time']), is_get_query=False)
        

@CancelCoachEventBlueprint.route('/coach-event/<coach_event_id>', methods=['DELETE'])
def cancel_coach_event_endpoint(coach_event_id):
    
    token = request.headers.get('Authorization')
    if not token:
        return jsonify(message='Unauthorised'), 400
    
    coach = get_coach(token)    

    if not coach:
        return jsonify(message='Unauthorised'), 400
    
    coach_event = get_coach_event(coach_event_id)
    
    if not coach_event:
        return jsonify(message='Coach event not found'), 404
    
    if coach_event['coach_id'] != coach['coach_id']:
        return jsonify(message='Unauthorised'), 400
    
    if coach_event['status'] == 'cancelled':
        return jsonify(message='Coach event already cancelled'), 400
    
    cancel_repeats = request.args.get('cancel_repeats', False)
    
    cancel_repeats = True if cancel_repeats == 'true' else False
    
    cancel_coach_event(coach_event, cancel_repeats)
    
    return jsonify(message='Coach event cancelled'), 200