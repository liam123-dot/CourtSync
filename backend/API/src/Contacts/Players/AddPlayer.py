from flask import Blueprint, request, jsonify
import logging

from src.Database.ExecuteQuery import execute_query

from src.Users.GetSelf.GetSelf import get_coach

from src.Contacts.GetContact import get_contact, get_contact_by_id
from src.Contacts.AddContact import add_contact

logging.basicConfig(level=logging.DEBUG)

def add_player(name, contact_name, contact_email, contact_phone_number, coach_id):

    contact = get_contact(contact_email, coach_id)
    
    if not contact:
        add_contact(contact_name, contact_email, contact_phone_number, coach_id, email_verified=True)
        
        contact = get_contact(contact_email, coach_id)
        
    logging.debug(f"Contact: {contact}")
        
    if contact['players'] and name.lower() in [player['name'].lower() for player in contact['players']]:
        return
    
    insert_player(name, contact['contact_id'], coach_id)
        
    
def insert_player(player_name, contact_id, coach_id):
    sql = "INSERT INTO Players (name, contact_id, coach_id) VALUES (%s, %s, %s)"
    
    execute_query(sql, (player_name, contact_id, coach_id), is_get_query=False)
    
    

CreatePlayerBlueprint = Blueprint('CreatePlayer', __name__)
@CreatePlayerBlueprint.route('/contact/<contact_id>/player', methods=['POST'])
def add_player_endpoint(contact_id):
    
    token = request.headers.get('Authorization')

    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 401
    
    data = request.json
    
    player_name = data.get('name')
    
    if not player_name:
        return jsonify({'error': 'Missing name'}), 400
    
    contact = get_contact_by_id(contact_id)
    
    if not contact:
        return jsonify({'error': 'Invalid contact_id'}), 400
    
    insert_player(player_name, contact_id, coach['coach_id'])
    
    return jsonify(success=True), 200