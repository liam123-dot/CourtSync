#!/bin/bash

# The tag for the Docker images
# Path to the shared directory
SHARED_DIR="shared"

# Find directories containing the word 'Container'
CONTAINERS=$(find . -type d -name "*Container" -maxdepth 1)

# Loop through each found container directory
for CONTAINER_DIR in $CONTAINERS; do
    CONTAINER=$(basename $CONTAINER_DIR)
    # echo "Processing $CONTAINER..."

    # Create the src/shared directory if it doesn't exist
    mkdir -p $CONTAINER_DIR/src/shared

    # Copy the shared file into the container's src/shared directory
    cp $SHARED_DIR/* $CONTAINER_DIR/src/shared/

done

echo "Shared directories copied"
