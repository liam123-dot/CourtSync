import boto3
import json
import datetime

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        return super(DateTimeEncoder, self).default(obj)

load_balancer_ARN = 'arn:aws:elasticloadbalancing:eu-west-2:925465361057:loadbalancer/app/test-api-alb/cfacc6060c83c1ad'

elbv2_client = boto3.client('elbv2')

def get_listener(load_balancer_ARN):
    
    response = elbv2_client.describe_listeners(
        LoadBalancerArn=load_balancer_ARN
    )

    listener = response['Listeners'][0]
    
    return listener
    
listener = 

print(json.dumps(listener, indent=4, cls=DateTimeEncoder))