import boto3

client = boto3.client('s3')

response = client.generate_presigned_url(
    'get_object',
    Params={'Bucket': 'coach-profile-pictures-test', 'Key': 'iam-Buchanan'},
)

print(response)