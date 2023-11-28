from flask import Blueprint, jsonify, request
from src.Users.GetSelf.GetSelf import get_coach

CheckCoachAuthorisedBlueprint = Blueprint('CheckCoachAuthorisedBlueprint', __name__)

@CheckCoachAuthorisedBlueprint.route('/auth/coach/check', methods=['GET'])
def check_is_coach():
    token = request.headers.get('Authorization', None)
    if not token:
        return jsonify(message='No coach found', coach=False), 200

    coach = get_coach(token)
    if not coach:
        return jsonify(message='No coach found', coach=False), 200

    slug = coach['slug']
    if slug is None:
        return jsonify(message='No coach found', coach=False), 200

    return jsonify(slug=slug, coach=True), 200