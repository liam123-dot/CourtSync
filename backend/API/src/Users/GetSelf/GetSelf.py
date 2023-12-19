from flask import request, jsonify, Blueprint, current_app
from dotenv import load_dotenv

import os

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.CheckAuthorization import get_access_token_username
from src.Users.UserPublicProfile.GetProfilePictureUrl import get_profile_picture_url
import stripe

load_dotenv('.env')

WEBSITE_URL = os.getenv('WEBSITE_URL')
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

UserGetSelfBlueprint = Blueprint('UserGetSelfBlueprint', __name__)

@UserGetSelfBlueprint.route('/user/me', methods=['GET'])
def get_self():
    
    token = request.headers.get('Authorization', None)
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400
    
    return jsonify(coach), 200


def get_coach(token):
    valid, username = get_access_token_username(token)
    
    if not valid:
        return None
    
    return get_attributes(username)


def get_coach_from_slug(slug):
    results = execute_query("SELECT coach_id FROM Coaches WHERE slug = %s", (slug,), is_get_query=True)

    if results is None:
        return None
    
    if len(results) == 0:
        return None
    
    coach_id = results[0]['coach_id']
    
    results = get_attributes(coach_id)
    
    return results
    

def get_attributes(coach_id):
        
    results = execute_query("SELECT * FROM Coaches WHERE coach_id = %s", (coach_id,), is_get_query=True)

    if results is None:
        return None
    
    results = results[0]
    
    results['profile_picture_url'] = get_profile_picture_url(results)
    
    results['name'] = f"{results['first_name']} {results['last_name']}"
    
    results['coach_setup'] = check_stripe(results)

    results['coach_url'] = construct_coach_url(results)

    return results

def check_stripe(coach):
    if coach['stripe_account'] is None:
        return False
    
    if coach['stripe_account_set_up'] is False:
        setup_complete = check_stripe_api(coach)
        if setup_complete:
            sql = "UPDATE Coaches SET stripe_account_set_up = TRUE WHERE coach_id = %s"
            execute_query(sql, (coach['coach_id'],), False)
            return True
        return False
    
    else:
        return True
    
def check_stripe_api(coach):
    
    account = stripe.Account.retrieve(
        coach['stripe_account']
    )
    
    if account['charges_enabled'] and account['details_submitted']:
        return True
    return False

def construct_coach_url(coach):
    return f"{WEBSITE_URL}/#/{coach['slug']}"

def check_account_set_up(coach_id):
    
    return check_duration(coach_id) and check_pricing(coach_id) and check_working_hours(coach_id)

def check_duration(coach_id):
    # check that at least one duration is set in the durations table
    
    sql = "SELECT duration FROM Durations WHERE coach_id=%s"
    
    results = execute_query(sql, (coach_id, ))
    
    if len(results) == 0:
        return False
    return True

def check_pricing(coach_id):
    # check that at least one pricing rule is set in the pricing rules table
    
    sql = "SELECT rate FROM PricingRules WHERE coach_id=%s"
    
    results = execute_query(sql, (coach_id, ))
    
    if len(results) == 0:
        return False
    return True

def check_working_hours(coach_id):
    # check that at least one working hour is set in the working hours table
    
    sql = "SELECT start_time, end_time FROM WorkingHours WHERE coach_id=%s"
    
    results = execute_query(sql, (coach_id, ))
    
    for result in results:
        if result['start_time'] and result['end_time']:
            return True
    
    return False

@UserGetSelfBlueprint.route('/user/me/<attribute>', methods=['GET'])
def get_self_attribute(attribute):
    
    token = request.headers.get('Authorization', None)
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400
    
    if attribute not in coach:
        return jsonify({'error': 'Invalid attribute'}), 400
    
    return jsonify({attribute: coach[attribute]}), 200