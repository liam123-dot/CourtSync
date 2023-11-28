#!/bin/sh

K8S_FILE="db-deployment.yaml"
CONTAINER_DIR="DatabaseContainer"
DEPLOYMENT_FILE="k8s/local/$K8S_FILE"
DOCKER_HUB_REPO="tennisdockerimages/database-container"

# Function to increment version
increment_version() {
    echo "$1" | awk -F. -v OFS=. '{$NF = $NF + 1 ; print}'
}

# Function to get the latest tag
get_latest_tag() {
    # This command assumes that the tags follow the pattern v<major>.<minor>.<patch>
    docker images $DOCKER_HUB_REPO --format "{{.Tag}}" | grep '^v[0-9]\+\.[0-9]\+\.[0-9]\+$' | sort -V | tail -n1
}

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "docker could not be found, please install it."
    exit 1
fi

# Get the latest tag
LATEST_TAG=$(get_latest_tag)

if [ -z "$LATEST_TAG" ]; then
    echo "No existing tags found. Please create a new tag manually or check your Docker images."
    exit 1
fi

# Increment the patch version
NEW_TAG=$(increment_version $LATEST_TAG)

if [ -z "$NEW_TAG" ]; then
    echo "Failed to increment the version. Exiting."
    exit 1
fi

echo "Building and pushing new Docker image with tag: $NEW_TAG"

# Your custom shared script
./distribute-shared.sh

cd $CONTAINER_DIR
# Build the new Docker image with the incremented tag
sudo docker build -t $DOCKER_HUB_REPO:$NEW_TAG .

# Docker push command
docker push $DOCKER_HUB_REPO:$NEW_TAG
cd ..

sed -i '' "s|$DOCKER_HUB_REPO:v[0-9]*\.[0-9]*\.[0-9]*|$DOCKER_HUB_REPO:$NEW_TAG|g" $DEPLOYMENT_FILE

echo "Updated the Kubernetes deployment file with the new tag: $NEW_TAG"

cd k8s
kubectl apply -f $K8S_FILE
cd ..