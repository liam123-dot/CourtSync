from flask import request, jsonify, Blueprint

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach
from src.PricingRules.GetPricingRule import get_pricing_rule_from_id

DeletePricingRuleBlueprint = Blueprint('DeletePricingRuleBlueprint', __name__)

@DeletePricingRuleBlueprint.route('/pricing-rules/<pricing_rule_id>', methods=['DELETE'])
def delete_pricing_rule_endpoint(pricing_rule_id):
    
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'Missing token'}), 401
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 401 
    
    pricing_rule = get_pricing_rule_from_id(pricing_rule_id)
    
    if not pricing_rule:
        return jsonify({'error': 'Invalid pricing rule ID'}), 400
    
    if pricing_rule['coach_id'] != coach['coach_id']:
        return jsonify(message='Unauthorized'), 401
    
    disable_rule(pricing_rule_id)
    
    return jsonify(message='Pricing rule deleted'), 200
    
def disable_rule (pricing_rule_id):
    sql = "UPDATE PricingRules SET enabled = 0 WHERE rule_id = %s"
    
    values = (pricing_rule_id,)
    
    execute_query(sql, values, False)
    