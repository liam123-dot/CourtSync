from flask import request, jsonify, Blueprint
from src.shared.CheckAuthorization import get_access_token_username
from src.shared.ExecuteQuery import execute_query
from src.Routes.UserGetSelf import get_attributes
import stripe
import os

AddStripeAccountBlueprint = Blueprint('AddStripeAccountBlueprint', __name__)

stripe.api_key = os.environ['STRIPE_SECRET_KEY']

@AddStripeAccountBlueprint.route('/user/stripe-account', methods=['POST'])
def create_stripe_account():
    
    token = request.headers.get('Authorization', None)
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400
    
    valid, username = get_access_token_username(token)

    if not valid:
        return jsonify({'error': 'Invalid token'}), 400
    
    coach_attributes = get_attributes(username)
    
    if not coach_attributes['stripe_account']:
        return jsonify({'error': 'User already has a stripe account'}), 400
    
    stripe_account = stripe.Account.create(
        type='standard',
        country='GB',
        email=coach_attributes['email'],
        business_type='individual',
        business_profile={
            'url': 'https://www.courtsync.co.uk/profile/' + coach_attributes['slug'],
            'name': coach_attributes['name'],
            'product_description': 'Tennis coach'
        },
        
    )
    
    insert_stripe_account(username, stripe_account['id'])
    
    account_link = stripe.AccountLink.create(
        account=stripe_account,
        refresh_url='https://www.courtsync.co.uk/profile/' + coach_attributes['slug'],
        return_url='https://www.courtsync.co.uk/profile/' + coach_attributes['slug'],
        type='account_onboarding'
    )
    
    return jsonify({'url': account_link.url}), 200
    
    
def insert_stripe_account(coach_id, stripe_account_id):
    sql = "UPDATE Coaches SET stripe_account = %s WHERE coach_id = %s"
    execute_query(sql, (stripe_account_id, coach_id))