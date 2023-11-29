# Inside app.py
from flask import Flask
from flask_cors import CORS

from src.Database.DatabaseConnection import DatabaseConnection

from src.Users.Auth.SignIn import CoachSignIn
from src.Users.Auth.SignUp import CoachSignUp
from src.Users.Auth.ResendConfirmationCode import ResendConfirmationCodeBlueprint
from src.Users.Auth.RefreshTokens import RefreshTokensBlueprint
from src.Users.Auth.CheckCoachAuthorised import CheckCoachAuthorisedBlueprint
from src.Users.GetSelf.GetSelf import UserGetSelfBlueprint
from src.Users.EditSelf.EditSelf import UserEditSelfBlueprint
from src.Users.UserPublicProfile.GetProfile import GetProfileBlueprint
from src.Users.EditSelf.UploadProfilePicture import UploadProfilePictureBlueprint
from src.Users.StripeAccount.AddStripeAccount import AddStripeAccountBlueprint

from src.Bookings.AddBooking.GuestAddBooking import GuestAddBookingBlueprint
from src.Bookings.AddBooking.CalculateAvailableTimes import CalculateAvailableTimesBlueprint
from src.Bookings.AddBooking.CalculateLessonCost import CalculateLessonCostBlueprint
from src.Bookings.Cancellations.PlayerCancellation import PlayerCancelBookingBlueprint
from src.Bookings.Cancellations.CoachCancellation import CoachCancellationBlueprint
from src.Bookings.GetBookings.GetBookings import GetBookingsBlueprint

from src.Contacts.GetContact import GetContactBlueprint
from src.Contacts.Players.AddPlayer import CreatePlayerBlueprint
from src.Contacts.AddContact import CreateContactBlueprint
from src.Contacts.VerifyEmail import VerifyEmailBlueprint

from src.Invoices.GetInvoices.GetInvoices import GetInvoicesBlueprint

from src.Timetable.CheckOverlaps import CheckOverlapsBlueprint
from src.Timetable.PostWorkingHours import PostWorkingHoursBlueprint
from src.Timetable.GetTimetable.GetTimetable import GetTimetableBlueprint
from src.Timetable.GetFeatures import GetFeaturesBlueprint
from src.Timetable.EditFeatures import EditFeaturesBlueprint

from src.TestBlueprint import TestBlueprint

def create_app():
    app = Flask(__name__)
    
    db_connection = DatabaseConnection()
    app.config['db_connection'] = db_connection

    app.register_blueprint(GetBookingsBlueprint)
    
    app.register_blueprint(CoachSignIn)
    app.register_blueprint(CoachSignUp)
    app.register_blueprint(ResendConfirmationCodeBlueprint)
    app.register_blueprint(RefreshTokensBlueprint)
    app.register_blueprint(UserGetSelfBlueprint)
    app.register_blueprint(UserEditSelfBlueprint)
    app.register_blueprint(CheckCoachAuthorisedBlueprint)
    app.register_blueprint(GetProfileBlueprint)
    app.register_blueprint(UploadProfilePictureBlueprint)
    app.register_blueprint(AddStripeAccountBlueprint)
    
    app.register_blueprint(GuestAddBookingBlueprint)
    app.register_blueprint(CalculateAvailableTimesBlueprint)
    app.register_blueprint(CalculateLessonCostBlueprint)
    app.register_blueprint(PlayerCancelBookingBlueprint)
    app.register_blueprint(CoachCancellationBlueprint)
    
    app.register_blueprint(GetContactBlueprint)
    app.register_blueprint(CreatePlayerBlueprint)
    app.register_blueprint(CreateContactBlueprint)
    app.register_blueprint(VerifyEmailBlueprint)
    
    app.register_blueprint(GetInvoicesBlueprint)
    
    app.register_blueprint(CheckOverlapsBlueprint)
    app.register_blueprint(GetTimetableBlueprint)
    app.register_blueprint(PostWorkingHoursBlueprint)
    app.register_blueprint(GetFeaturesBlueprint)
    app.register_blueprint(EditFeaturesBlueprint)
    
    app.register_blueprint(TestBlueprint)
    
    CORS(app)
    
    return app, db_connection