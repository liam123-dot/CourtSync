from flask import request, jsonify, Blueprint
from src.shared.CheckAuthorization import get_access_token_username
from src.shared.ExecuteQuery import execute_query

EditUserAttributeBlueprint = Blueprint('EditUserAttributeBlueprint', __name__)

EDITABLE_ATTRIBUTES = [
    'public_profile_picture',
    'invoices_initialised',
    'invoice_type',
    'stripe_account'
]

@EditUserAttributeBlueprint.route('/user', methods=['PUT'])
def edit_attributes():
    token = request.headers.get('Authorization', None)
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400
    
    valid, username = get_access_token_username(token)

    if not valid:
        return jsonify({'error': 'Invalid token'}), 400
    
    data = request.json
    
    if len(data) == 0:
        return jsonify({'error': 'No data provided'}), 400

    for attribute in data.keys():
        if attribute not in EDITABLE_ATTRIBUTES:
            return jsonify({'error': f"Invalid attribute: {attribute}"}), 400

    # Create SQL query
    query = "UPDATE Coaches SET "
    query += ", ".join(f"{attribute} = %s" for attribute in data.keys())
    query += " WHERE coach_id = %s"

    # Create parameters list
    params = list(data.values())
    params.append(username)

    # Execute SQL query
    execute_query(query, params)

    return jsonify({'message': 'User attributes updated successfully'}), 200