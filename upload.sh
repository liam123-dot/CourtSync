aws s3 sync ./backend/API s3://courtsync-api-test

for instance_id in $(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names "test-api-auto-scale-group" --query "AutoScalingGroups[].Instances[].InstanceId" --output text)
do
    echo "Rebooting instance $instance_id"

    instance_ip=$(aws ec2 describe-instances --instance-ids $instance_id --query 'Reservations[].Instances[].PublicIpAddress' --output text)

    aws ec2 reboot-instances --instance-ids $instance_id

    # Sleep for 15 seconds
    sleep 15

    # Get the public IP of the instanc
    # Curl the public IP of the instance and check if the response is 200
    while true; do
        response=$(curl --write-out '%{http_code}' --silent --output /dev/null http://$instance_ip:8000/)

        if [ "$response" -eq 200 ]; then
            echo "Instance $instance_id is up and running"
            break
        else
            echo "Waiting for instance $instance_id to be up and running"
            sleep 5
        fi
    done
    echo "Instance $instance_id is up and running"
done

echo "All instances are up and running"

cd website

# Copy the contents of test_env.txt into .env
cp test_env.txt .env

npm run build
aws s3 sync build s3://test.courtsync.co.uk

# Copy the contents of local_env.txt back into .env
cp local_env.txt .env