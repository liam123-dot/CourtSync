from flask import jsonify, Blueprint, request

DeleteContactBlueprint = Blueprint('DeleteContactBlueprint', __name__)

from src.Contacts.GetContact import get_contact_by_id
from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach

@DeleteContactBlueprint.route('/contact/<contact_id>', methods=['DELETE'])
def delete_contact_endpoint(contact_id):
    
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'Missing token'}), 400
    
    coach = get_coach(token)
    
    if not coach:
        
        return jsonify({'error': 'Invalid token'}), 400
    
    contact = get_contact_by_id(contact_id)
    
    if not contact:
        return jsonify({'error': 'No contact found'}), 400
    
    if contact['coach_id'] != coach['coach_id']:
        return jsonify({'error': 'Unauthorized'}), 400
    
    sql = "UPDATE Contacts SET enabled=0 WHERE contact_id=%s"
    
    execute_query(sql, (contact_id, ), False)
    
    return jsonify({'success': True}), 200
