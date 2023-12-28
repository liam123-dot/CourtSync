import boto3
import time
import requests
import random

elbv2_client = boto3.client('elbv2')
asg_client = boto3.client('autoscaling')
ec2_client = boto3.client('ec2')

def get_instance(instance_id):
    response = ec2_client.describe_instances(InstanceIds=[instance_id])    
    return response['Reservations'][0]['Instances'][0]

def check_target_group_health(target_group_arn):
    
    # iterate through each instance in the target group, get it's public IP and check if it's healthy
    
    healthy = False
    
    response = elbv2_client.describe_target_health(TargetGroupArn=target_group_arn)    
    
    for target in response['TargetHealthDescriptions']:
        target_id = target['Target']['Id']
        
        # get the target public DNS
        target_instance = get_instance(target_id)
        target_public_ip = target_instance['PublicIpAddress']
        
        try:
            response = requests.get(f'http://{target_public_ip}:8000')
            if response.ok:
                print(f'Instance {target_id} is healthy.')
                healthy = True
            else:
                print(f'Instance {target_id} is not healthy.')
                return False
        except:
            print(f'Instance {target_id} is not healthy.')
            return False
        
    return healthy
        
def get_listener(load_balancer_ARN):
    
    response = elbv2_client.describe_listeners(
        LoadBalancerArn=load_balancer_ARN
    )

    listener = response['Listeners'][0]
    
    return listener

def get_load_balancer(load_balancer_ARN):

    response = elbv2_client.describe_load_balancers(
        LoadBalancerArns=[
            load_balancer_ARN
        ]
    )

    load_balancer = response['LoadBalancers'][0]
    
    return load_balancer

def create_asg_based_on_existing(existing_asg_name, new_asg_name):
    # Initialize boto3 client for Auto Scaling

    # Get the configuration of the existing ASG
    existing_asg = asg_client.describe_auto_scaling_groups(
        AutoScalingGroupNames=[existing_asg_name]
    )

    if not existing_asg['AutoScalingGroups']:
        print(f"No Auto Scaling Group found with the name {existing_asg_name}")
        return

    asg_config = existing_asg['AutoScalingGroups'][0]   
    
    load_balancer_ARN = 'arn:aws:elasticloadbalancing:eu-west-2:925465361057:loadbalancer/app/test-api-alb/cfacc6060c83c1ad'

    response = elbv2_client.describe_listeners(LoadBalancerArn=load_balancer_ARN)

    existing_target_group_arn = None
    existing_target_group_details = None

    for listener in response['Listeners']:
        if listener['LoadBalancerArn'] == load_balancer_ARN:
            tg_details = listener['DefaultActions'][0]['ForwardConfig']['TargetGroups'][0]
            existing_target_group_arn = tg_details['TargetGroupArn']
            get_target_groups_response = elbv2_client.describe_target_groups(LoadBalancerArn=load_balancer_ARN)
            
            existing_target_group_details = next((tg for tg in get_target_groups_response['TargetGroups'] if tg['TargetGroupArn'] == existing_target_group_arn), None)
    
    new_target_group_name = f"new-test-target-group-{random.randint(0, 1000)}"
    
    new_tg_response = elbv2_client.create_target_group(
        Name=new_target_group_name,
        Protocol=existing_target_group_details['Protocol'],
        Port=existing_target_group_details['Port'],
        VpcId=existing_target_group_details['VpcId'],
        HealthCheckProtocol=existing_target_group_details['HealthCheckProtocol'],
        HealthCheckPort=str(existing_target_group_details['HealthCheckPort']),
        HealthCheckEnabled=existing_target_group_details['HealthCheckEnabled'],
        HealthCheckPath=existing_target_group_details['HealthCheckPath']
    )
    
    print(f"Target Group Created: {new_target_group_name}")
    
    new_target_group_arn = new_tg_response['TargetGroups'][0]['TargetGroupArn']

    # Create new ASG configuration based on the existing one
    new_asg_config = {
        'AutoScalingGroupName': new_asg_name,
        'LaunchTemplate': {
            "LaunchTemplateId": asg_config['LaunchTemplate']['LaunchTemplateId'],      
        },
        'MinSize': asg_config['MinSize'],
        'MaxSize': asg_config['MaxSize'],
        'DesiredCapacity': asg_config['DesiredCapacity'],
        'DefaultCooldown': asg_config['DefaultCooldown'],
        'AvailabilityZones': asg_config['AvailabilityZones'],
        'TargetGroupARNs': [new_target_group_arn],
        'VPCZoneIdentifier': asg_config.get('VPCZoneIdentifier', ''),
        'HealthCheckType': asg_config['HealthCheckType'],
        'HealthCheckGracePeriod': asg_config['HealthCheckGracePeriod'],
        'Tags': asg_config.get('Tags', [])
    }

    # Optionally, adjust new ASG configuration here (e.g., different size or tags)

    # Create the new Auto Scaling Group
    response = asg_client.create_auto_scaling_group(**new_asg_config)
        
    print('Auto Scaling Group Created.')        
    
    # assign the target group to the load balancer
    
    while True:
        new_group_health = check_target_group_health(new_tg_response['TargetGroups'][0]['TargetGroupArn'])
        if new_group_health:
            break
        else:
            print('Waiting for instances to be healthy...')            
            time.sleep(10)
          
    print('Rerouting traffic to new target group...')
    
    listener_arn = get_listener(load_balancer_ARN)['ListenerArn']
            
    response = elbv2_client.modify_listener(
        ListenerArn=listener_arn,
        Port=existing_target_group_details['Port'],
        Protocol='HTTPS',
        DefaultActions=[
            {
                'Type': 'forward',
                'TargetGroupArn': new_target_group_arn
            }
        ]
    )
    
    print("Traffic rerouted")
    
    print('Detaching old target group from the old ASG...')

    response = asg_client.detach_load_balancer_target_groups(
        AutoScalingGroupName=existing_asg_name,
        TargetGroupARNs=[existing_target_group_arn]
    )
    
    print('Old target group detached from the old ASG.')

    print("Assigning new target group to the old ASG...")
    
    response = asg_client.attach_load_balancer_target_groups(
        AutoScalingGroupName=existing_asg_name,
        TargetGroupARNs=[new_target_group_arn]
    )
    
    print('New target group assigned to the old ASG.')    

    # Delete the old Auto Scaling Group
    
    print('Deleting old ASG...')
    print(f'ASG Name: {existing_asg_name}')
    
    response = asg_client.delete_auto_scaling_group(
        AutoScalingGroupName=existing_asg_name,
        ForceDelete=True
    )
    
    # Delete original target group
    
    print('Deleting old target group...')
    
    response = elbv2_client.delete_target_group(
        TargetGroupArn=existing_target_group_arn
    )
    
    print ('Old target group deleted.')
        
def get_autoscaling_group():
    response = asg_client.describe_auto_scaling_groups()
    for asg in response['AutoScalingGroups']:
        if 'test-autoscaling-group' in asg['AutoScalingGroupName']:            
            if 'Status' in asg and asg['Status'] == "Delete in progress":
                continue
            return asg
        
    return None

asg_name = get_autoscaling_group()['AutoScalingGroupName']

if asg_name:
    print(f"Found ASG: {asg_name}")
    new_asg_name = f"test-autoscaling-group-{random.randint(0, 1000)}"
    print(f"Creating new ASG: {new_asg_name}")
    create_asg_based_on_existing(asg_name, new_asg_name)


