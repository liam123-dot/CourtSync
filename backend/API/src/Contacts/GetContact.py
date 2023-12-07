from flask import Blueprint, request, jsonify

from src.Database.ExecuteQuery import execute_query

from src.Contacts.Players.GetPlayer import get_players
from src.Users.GetSelf.GetSelf import get_coach_from_slug, get_coach

GetContactBlueprint = Blueprint('GetContactBlueprint', __name__)

@GetContactBlueprint.route('/<slug>/contact/<contact_email>', methods=['GET'])
def get_contact_endpoint(slug, contact_email):
    
    coach = get_coach_from_slug(slug)
    
    if not coach:
        return jsonify({'error': 'No coach found'}), 400
    
    if not contact_email or contact_email == '':
        return jsonify({'error': 'No contact email provided'}), 400
    
    contact = get_contact(contact_email, coach['coach_id'])
    
    if not contact:
        return jsonify({'error': 'No contact found'}), 400
        
    return jsonify(contact), 200
    

def get_contact(contact_email, coach_id):
    sql = "SELECT * FROM Contacts WHERE email=%s AND coach_id=%s"
    results = execute_query(sql, (contact_email, coach_id), is_get_query=True)
    
    if results is None or len(results) == 0:
        return None
    
    contact = results[0]
    
    contact['players'] = get_players(contact['contact_id'], coach_id)
    
    return contact

def get_contact_by_id(contact_id):
    sql = "SELECT * FROM Contacts WHERE contact_id=%s"
    
    results = execute_query(sql, (contact_id, ), is_get_query=True)
    
    if results is None or len(results) == 0:
        return None
    
    contact = results[0]
    
    contact['players'] = get_players(contact['contact_id'], contact['coach_id'])
    
    return contact


@GetContactBlueprint.route('/contacts', methods=['GET'])
def get_contacts_endpoint():
    
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify(error='No token provided'), 400
    
    coach = get_coach(token)

    if not coach:
        return jsonify({'error': 'No coach found'}), 400
    
    return jsonify(contacts=get_contacts(coach['coach_id'])), 200
    

def get_contacts(coach_id):
    sql = "SELECT * FROM Contacts WHERE coach_id=%s AND enabled=1"
    
    results = execute_query(sql, (coach_id, ), is_get_query=True)
    
    contacts = []
    
    for contact in results:
        contact['players'] = get_players(contact['contact_id'], coach_id)
        contacts.append(contact)
        
    return contacts

