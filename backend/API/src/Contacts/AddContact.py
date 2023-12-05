from flask import jsonify, Blueprint, request

from src.Database.ExecuteQuery import execute_query

from src.Users.GetSelf.GetSelf import get_coach
from src.Contacts.GetContact import get_contact
from src.Contacts.Players.InsertPlayer import insert_player

def add_contact(name, email, phone_number, coach_id, email_verified=False):
    
    sql = "INSERT INTO Contacts (name, email, phone_number, coach_id, email_verified) VALUES (%s, %s, %s, %s, %s)"
    
    execute_query(sql, (name, email, phone_number, coach_id, email_verified), is_get_query=False)


CreateContactBlueprint = Blueprint('CreateContactBlueprint', __name__)

@CreateContactBlueprint.route('/contact', methods=['POST'])
def create_contact_endpoint():
    
    token = request.headers.get('Authorization')

    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 401
    
    data = request.json
    
    name = data.get('name')
    email = data.get('email')
    phone_number = data.get('phone_number')
    is_player = data.get('is_player')
    
    if not name:
        return jsonify({'error': 'Missing name'}), 400
    
    if not email:
        return jsonify({'error': 'Missing email'}), 400
    
    if not phone_number:
        return jsonify({'error': 'Missing phone_number'}), 400
    
    add_contact(name, email, phone_number, coach['coach_id'])
    
    if is_player:
        contact = get_contact(email, coach['coach_id'])
        
        insert_player(contact['name'], contact['contact_id'], coach['coach_id'])
        
    
    return jsonify({'success': True}), 200
