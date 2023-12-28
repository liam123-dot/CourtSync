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
autoscaling_client = boto3.client('autoscaling')

def get_autoscaling_group():
    response = autoscaling_client.describe_auto_scaling_groups()
    for asg in response['AutoScalingGroups']:
        if 'test-autoscaling-group' in asg['AutoScalingGroupName']:             
            if 'Status' in asg and asg['Status'] == "Delete in progress":
                continue
            return asg
        
    return None
      
asg = get_autoscaling_group()  
print(json.dumps(asg, indent=4, cls=DateTimeEncoder))