import os
import boto3
from botocore.exceptions import NoCredentialsError

def upload_files_to_s3(log_dir, s3_bucket, s3_path):
    s3_client = boto3.client('s3')

    for file_name in os.listdir(log_dir):
        file_path = os.path.join(log_dir, file_name)
        if os.path.isfile(file_path):
            try:
                s3_client.upload_file(file_path, s3_bucket, s3_path + file_name)
                print(f"Uploaded {file_name} to S3.")
                os.remove(file_path)
                print(f"Deleted local file {file_name}.")
            except NoCredentialsError:
                print("Credentials not available for AWS S3.")
                return

if __name__ == "__main__":
    LOG_DIR = "./logs"
    S3_BUCKET = "logging-data-test"
    S3_PATH = "logs/"

    upload_files_to_s3(LOG_DIR, S3_BUCKET, S3_PATH)
#