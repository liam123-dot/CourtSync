from flask import Flask
from flask_cors import CORS
from src.Timetable.TimetableEndpoints import timetable
from src.Timetable.GetTimetable.GetTimetable import GetTimetable
from src.Timetable.Bookings.BookingsCancelling import bookings_cancelling_blueprint
from src.Timetable.Bookings.AddBooking import add_booking_blueprint

app = Flask(__name__)
app.register_blueprint(timetable)
app.register_blueprint(GetTimetable)
app.register_blueprint(bookings_cancelling_blueprint)
app.register_blueprint(add_booking_blueprint)
CORS(app)

@app.route('/timetable/routes', methods=['GET'])
def main():
    endpoints = []
    for rule in app.url_map.iter_rules():
        if rule.endpoint != 'static':
            endpoints.append(rule.endpoint)
    return {'endpoints': endpoints}, 200

if __name__ == '__main__':
    app.run(port=8000)
