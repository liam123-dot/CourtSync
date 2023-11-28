sudo yum update -y
sudo yum install python3 -y
curl -O https://bootstrap.pypa.io/get-pip.py
python3 get-pip.py --user
export PATH=$PATH:~/.local/bin
pip3 install -r requirements.txt
gunicorn app:app -w 5 -b 0.0.0.0:8000