from flask import request, jsonify, Blueprint

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach

from dotenv import load_dotenv
import os

load_dotenv('.env')

import stripe

stripe.api_key = os.environ['STRIPE_SECRET_KEY']

AddStripeAccountBlueprint = Blueprint('AddStripeAccountBlueprint', __name__)


@AddStripeAccountBlueprint.route('/user/stripe-account', methods=['POST'])
def create_stripe_account():
    
    token = request.headers.get('Authorization', None)
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400
    
    if coach['stripe_account']:
        return jsonify({'error': 'User already has a stripe account'}), 400
    
    stripe_account = stripe.Account.create(
        type='standard',
        country='GB',
        email=coach['email'],
        business_type='individual',
        business_profile={
            'url': 'https://www.courtsync.co.uk/profile/' + coach['slug'],
            'name': coach['name'],
            'product_description': 'Tennis coach'
        },
        
    )
    
    coach['stripe_account'] = stripe_account['id']
    
    insert_stripe_account(coach['coach_id'], stripe_account['id'])
    
    link = generate_account_link(coach)
    
    return jsonify({'url': link}), 200

@AddStripeAccountBlueprint.route('/user/stripe-account/generate-link', methods=['POST'])
def generate_link():
    token = request.headers.get('Authorization', None)
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400
    
    if not coach['stripe_account']:
        return jsonify({'error': 'User does not have a stripe account'}), 400
    
    link = generate_account_link(coach)
    
    return jsonify({'url': link}), 200

def generate_account_link(coach):
    account_link = stripe.AccountLink.create(
        account=coach['stripe_account'],
        refresh_url=f"{os.environ['WEBSITE_URL']}/#/{coach['slug']}",
        return_url=f"{os.environ['WEBSITE_URL']}/#/dashboard/settings?tab=invoicing",
        type='account_onboarding'
    )
    
    return account_link.url
    
def insert_stripe_account(coach_id, stripe_account_id):
    sql = "UPDATE Coaches SET stripe_account = %s WHERE coach_id = %s"
    execute_query(sql, (stripe_account_id, coach_id), False)