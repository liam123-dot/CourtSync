from flask import request, jsonify, Blueprint

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach
from src.Contacts.GetContact import get_contact_by_id

EditContactBlueprint = Blueprint('EditContactBlueprint', __name__)

uneditable = ['contact_id', 'stripe_customer_id', 'coach_id', 'email_verified']

@EditContactBlueprint.route('/contact/<contact_id>', methods=['PUT'])
def edit_player(contact_id):
    
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify(message='Missing token'), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify(message='Invalid token'), 401
    
    contact_id = int(contact_id)
    
    contact = get_contact_by_id(contact_id)
    
    if not contact:
        return jsonify(message='Invalid contact id'), 400
    
    if contact['coach_id'] != coach['coach_id']:
        return jsonify(message='Unauthorized'), 401
    
    data = request.json
    
    for key in data:
        if key not in contact.keys() or key in uneditable:
            return jsonify(message=f"Invalid key: {key}"), 400        
    
    # construct a query based on provided attributes
    query = "UPDATE Contacts SET "
    
    for key in data:
        query += f"{key} = %s, "
        
    query = query[:-2]
    
    query += f" WHERE contact_id = {contact_id}"
    
    execute_query(query, tuple(data.values()), is_get_query=False)
    
    return jsonify(message='Success')
