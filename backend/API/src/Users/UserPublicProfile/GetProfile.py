from flask import request, jsonify, Blueprint
import time
import boto3
from src.Users.GetSelf.GetSelf import get_coach_from_slug
from src.Users.UserPublicProfile.GetProfilePictureUrl import get_profile_picture_url

GetProfileBlueprint = Blueprint('GetProfileBlueprint', __name__)

client = boto3.client('s3')

@GetProfileBlueprint.route('/user/<slug>/public-profile', methods=['GET'])
def get_profile(slug):
    
    coach = get_coach_from_slug(slug)
    
    if not coach:
        return jsonify({'error': 'Invalid slug'}), 400
    
    output = {
        'name': coach['name'],
        'bio': coach['bio']
    }
    
    if coach['show_email_publicly']:
        output['email'] = coach['email']
        
    if coach['show_phone_number_publicly']:
        output['phone_number'] = coach['phone_number']
    
    if coach['public_profile_picture']:
        output['profile_picture_url'] = get_profile_picture_url(coach)
    else:
        output['profile_picture_url'] = None
    
    return jsonify(output), 200

    
    
@GetProfileBlueprint.route('/user/<slug>/public-profile/<attribute>', methods=['GET'])
def get_profile_attribute(slug, attribute):
    
    coach = get_coach_from_slug(slug)
    
    if not coach:
        return jsonify({'error': 'Invalid slug'}), 400
    
    if attribute in ['email', 'phone_number', 'bio', 'name', 'profile_picture_url']:
    
        if attribute == 'email' and not coach['show_email_publicly']:
            return jsonify({'error': 'Email is not public'}), 400
        
        if attribute == 'phone_number' and not coach['show_phone_number_publicly']:
            return jsonify({'error': 'Phone number is not public'}), 400
        
        if attribute == 'profile_picture_url' and not coach['public_profile_picture']:
            return jsonify({'error': 'Profile picture is not public'}), 400
        
        if attribute == 'profile_picture_url':
            return jsonify({attribute: get_profile_picture_url(coach)}), 200
        
        return jsonify({attribute: coach[attribute]}), 200
    
    else:
        return jsonify({'error': 'Invalid attribute'}), 400
    