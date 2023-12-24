# import boto3
# import json
# import time

# elbv2_client = boto3.client('elbv2')
# asg_client = boto3.client('autoscaling')

# def check_target_group_health(target_group_arn):
    
#     print(f"Checking health of target group: {target_group_arn}")

#     # Describe target health
#     response = elbv2_client.describe_target_health(TargetGroupArn=target_group_arn)

#     # Extract health information from response
#     target_health_descriptions = response.get('TargetHealthDescriptions', [])

#     if not target_health_descriptions:
#         print(f"No targets found for target group ARN: {target_group_arn}")
#         return
    
#     all_healthy = True

#     # Print health status of each target
#     for target_health in target_health_descriptions:
#         target_id = target_health['Target']['Id']
#         health_status = target_health['TargetHealth']['State']
#         print(f"Target ID: {target_id}, Health Status: {health_status}")
#         if health_status != 'healthy':
#             all_healthy = False

#     return all_healthy

# def create_asg_based_on_existing(existing_asg_name, new_asg_name):
#     # Initialize boto3 client for Auto Scaling
#     asg_client = boto3.client('autoscaling')

#     # Get the configuration of the existing ASG
#     existing_asg = asg_client.describe_auto_scaling_groups(
#         AutoScalingGroupNames=[existing_asg_name]
#     )

#     if not existing_asg['AutoScalingGroups']:
#         print(f"No Auto Scaling Group found with the name {existing_asg_name}")
#         return

#     asg_config = existing_asg['AutoScalingGroups'][0]   
    
#     load_balancer_ARN = 'arn:aws:elasticloadbalancing:eu-west-2:925465361057:loadbalancer/app/test-api-alb/cfacc6060c83c1ad'

#     response = elbv2_client.describe_listeners(LoadBalancerArn=load_balancer_ARN)

#     existing_target_group_arn = None
#     existing_target_group_details = None

#     for listener in response['Listeners']:
#         if listener['LoadBalancerArn'] == load_balancer_ARN:
#             tg_details = listener['DefaultActions'][0]['ForwardConfig']['TargetGroups'][0]
#             existing_target_group_arn = tg_details['TargetGroupArn']
#             get_target_groups_response = elbv2_client.describe_target_groups(LoadBalancerArn=load_balancer_ARN)
            
#             existing_target_group_details = next((tg for tg in get_target_groups_response['TargetGroups'] if tg['TargetGroupArn'] == existing_target_group_arn), None)
    
#     new_tg_response = elbv2_client.create_target_group(
#         Name='new-target-group',
#         Protocol=existing_target_group_details['Protocol'],
#         Port=existing_target_group_details['Port'],
#         VpcId=existing_target_group_details['VpcId'],
#         HealthCheckProtocol=existing_target_group_details['HealthCheckProtocol'],
#         HealthCheckPort=str(existing_target_group_details['HealthCheckPort']),
#         HealthCheckEnabled=existing_target_group_details['HealthCheckEnabled'],
#         HealthCheckPath=existing_target_group_details['HealthCheckPath']
#     )
    
#     print('Target Group Created.')

#     # Create new ASG configuration based on the existing one
#     new_asg_config = {
#         'AutoScalingGroupName': new_asg_name,
#         'LaunchTemplate': {
#             "LaunchTemplateId": asg_config['LaunchTemplate']['LaunchTemplateId'],      
#         },
#         'MinSize': asg_config['MinSize'],
#         'MaxSize': asg_config['MaxSize'],
#         'DesiredCapacity': asg_config['DesiredCapacity'],
#         'DefaultCooldown': asg_config['DefaultCooldown'],
#         'AvailabilityZones': asg_config['AvailabilityZones'],
#         'TargetGroupARNs': [new_tg_response['TargetGroups'][0]['TargetGroupArn']],
#         'VPCZoneIdentifier': asg_config.get('VPCZoneIdentifier', ''),
#         'HealthCheckType': asg_config['HealthCheckType'],
#         'HealthCheckGracePeriod': asg_config['HealthCheckGracePeriod'],
#         'Tags': asg_config.get('Tags', [])
#     }

#     # Optionally, adjust new ASG configuration here (e.g., different size or tags)

#     # Create the new Auto Scaling Group
#     response = asg_client.create_auto_scaling_group(**new_asg_config)
        
#     print('Auto Scaling Group Created.')        
    
#     # assign the target group to the load balancer
    
#     while True:
#         new_group_health = check_target_group_health(new_tg_response['TargetGroups'][0]['TargetGroupArn'])
#         if new_group_health:
#             break
#         else:
#             print('Waiting for instances to be healthy...')
#             print('\n')
#             time.sleep(15)
    
#     return response

# asg_name = 'test-api-auto-scale-group'

# response = create_asg_based_on_existing(asg_name, 'new-asg-name')
# print(response)

import boto3
ec2_client = boto3.client('ec2')

def get_instance_public_ip(instance_id):
    response = ec2_client.describe_instances(InstanceIds=[instance_id])
    print(response)
    return response['Reservations'][0]['Instances'][0]

