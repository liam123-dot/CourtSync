from flask import Blueprint, request, jsonify
from src.Logs.GetLogger import get_request_logger
from src.Logs.WriteLog import write_log

TestBlueprint = Blueprint('TestBlueprint', __name__)

@TestBlueprint.route('/test2', methods=['GET'])
def test_endpoint():
    global logger
    write_log('test')
    
    return jsonify({'test': 'newest'}), 200