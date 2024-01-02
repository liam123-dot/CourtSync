#!/bin/bash

LOG_DIR="./logs"
S3_BUCKET="logging-data-test"
S3_PATH="logs/"

for file in "$LOG_DIR"/*; do
    aws s3 cp "$file" "s3://$S3_BUCKET/$S3_PATH"
    rm "$file" # Remove this line if you don't want to delete after upload
done
