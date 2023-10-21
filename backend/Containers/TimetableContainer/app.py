from flask import Flask
from flask_cors import CORS
from src.Timetable.TimetableEndpoints import timetable

app = Flask(__name__)
app.register_blueprint(timetable)
CORS(app)

@app.route('/')
def main():
    return 'Choose a valid endpoint', 200

if __name__ == '__main__':
    app.run(port=8000)
