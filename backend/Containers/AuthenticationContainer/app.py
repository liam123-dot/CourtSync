from flask import Flask
from flask_cors import CORS

from src.Coach.CoachEndpoints import coach
from src.Coach.CoachSignUp import CoachSignUp
from src.Coach.CoachSignIn import CoachSignIn
from src.Coach.CoachProfile import CoachProfile

app = Flask(__name__)
app.register_blueprint(coach)
app.register_blueprint(CoachSignUp)
app.register_blueprint(CoachSignIn)
app.register_blueprint(CoachProfile)
CORS(app)

@app.route('/')
def main():
    return 'Choose a valid endpoint', 200

if __name__ == '__main__':
    app.run(port=8000)
