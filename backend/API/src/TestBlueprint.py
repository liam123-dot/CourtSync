from flask import Blueprint, request, jsonify

TestBlueprint = Blueprint('TestBlueprint', __name__)

@TestBlueprint.route('/test', methods=['GET'])
def test_endpoint():
    return jsonify({'test': 'newest'}), 200