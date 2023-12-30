import boto3
import argparse
import requests
import time
import json
import os

ec2_client = boto3.client('ec2')

def launch_instance(launch_template_id, version='1'):
    response = ec2_client.run_instances(
        LaunchTemplate={
            'LaunchTemplateId': launch_template_id
        },
        MinCount=1,
        MaxCount=1
    )

    instance_id = response['Instances'][0]['InstanceId']
    print(f"Instance launched with ID: {instance_id}")

    return response['Instances'][0]

def get_instance_public_ip(instance_id):
    while True:
        response = ec2_client.describe_instances(InstanceIds=[instance_id])
        instance = response['Reservations'][0]['Instances'][0]
        if instance['PublicDnsName'] == '':
            time.sleep(5)
        else:
            return instance['PublicDnsName']

def wait_for_instance_to_be_healthy(instance_public_ip):
    
    url = f"http://{instance_public_ip}:8000"
    sleep_timer = 10
    
    while True:
        try:
            response = requests.get(url)
        except Exception as e:
            # print(f"Exception: {e}")
            print(f"Instance is starting, waiting {sleep_timer} seconds...")
            time.sleep(sleep_timer)
            continue
        if response.status_code == 200:
            print("Instance is healthy")
            break
        else:
            print(f"Instance is starting, waiting {sleep_timer} seconds...")
            time.sleep(sleep_timer)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("launch_template_id", help="The ID of the launch template")
    args = parser.parse_args()

    instance = launch_instance(args.launch_template_id)
    public_ip = get_instance_public_ip(instance['InstanceId'])
    wait_for_instance_to_be_healthy(public_ip)
    os.environ['INTEGRATION_INSTANCE_URL'] = f"http://{public_ip}:8000"
    print(f"Instance is healthy at {os.environ['INTEGRATION_INSTANCE_URL']}")
    os.system("pytest")
    
    # kill instance
    
    response = ec2_client.terminate_instances(InstanceIds=[instance['InstanceId']])
    
    print('Instance terminated.')
    