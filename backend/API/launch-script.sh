sudo yum update -y
sudo yum install python3 -y
python3 -m venv myenv
source myenv/bin/activate
curl -O https://bootstrap.pypa.io/get-pip.py
python3 get-pip.py
export PATH=$PATH:~/.local/bin
echo "Installing requirements"
pip3 install -r requirements.txt
echo "Installing AWS CLI"
pip3 install --upgrade boto3 botocore s3transfer awscrt
echo "Starting server"
gunicorn app:app -w 5 -b 0.0.0.0:8000
