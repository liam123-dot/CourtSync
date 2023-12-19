import boto3
import time
import requests

# Initialize Boto3 clients
ec2 = boto3.client('ec2')
autoscaling = boto3.client('autoscaling')

def get_instance_ids(auto_scaling_group_name):
    response = autoscaling.describe_auto_scaling_groups(AutoScalingGroupNames=[auto_scaling_group_name])
    instance_ids = [instance['InstanceId'] for group in response['AutoScalingGroups'] for instance in group['Instances']]
    return instance_ids

def reboot_instance(instance_id):
    print(f"Rebooting instance {instance_id}")
    ec2.reboot_instances(InstanceIds=[instance_id])
    time.sleep(15)

def get_instance_ip(instance_id):
    reservations = ec2.describe_instances(InstanceIds=[instance_id])['Reservations']
    for reservation in reservations:
        for instance in reservation['Instances']:
            return instance.get('PublicIpAddress')

def wait_for_instance(instance_id, instance_ip):
    while True:
        try:
            response = requests.get(f"http://{instance_ip}:8000/")
            if response.status_code == 200:
                print(f"Instance {instance_id} is up and running")
                break
            else:
                print(f"Waiting for instance {instance_id} to be up and running")
                time.sleep(5)
        except requests.ConnectionError:
            print(f"Waiting for instance {instance_id} to respond")
            time.sleep(5)

def main():
    auto_scaling_group_name = "test-api-auto-scale-group"
    instance_ids = get_instance_ids(auto_scaling_group_name)

    for instance_id in instance_ids:
        reboot_instance(instance_id)
        instance_ip = get_instance_ip(instance_id)
        if instance_ip:
            wait_for_instance(instance_id, instance_ip)
        else:
            print(f"No IP found for instance {instance_id}")

    print("All instances are up and running")

if __name__ == "__main__":
    main()
