#!/bin/sh

# Check if tag parameter is provided
if [ -z "$1" ]; then
    echo "Please provide a tag as an argument."
    exit 1
fi

# Docker build command
sudo docker build --no-cache -t tennisdockerimages/authentication-container:$1 .

# Docker push command
docker push tennisdockerimages/authentication-container:$1
