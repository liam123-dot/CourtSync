# Inside app.py
from flask import Flask
from flask_cors import CORS

from src.Database.DatabaseConnection import DatabaseConnection

from src.Users.Auth.SignIn import CoachSignIn
from src.Users.Auth.SignUp import CoachSignUp
from src.Users.Auth.ResendConfirmationCode import ResendConfirmationCodeBlueprint
from src.Users.Auth.RefreshTokens import RefreshTokensBlueprint
from src.Users.Auth.ChangePassword import ChangePasswordBlueprint
from src.Users.Auth.CheckCoachAuthorised import CheckCoachAuthorisedBlueprint
from src.Users.Auth.ForgotPassword.ForgotPassword import ForgotPasswordBlueprint
from src.Users.Auth.ForgotPassword.ConfirmForgotPassword import ConfirmForgotPasswordBlueprint
from src.Users.GetSelf.GetSelf import UserGetSelfBlueprint
from src.Users.EditSelf.EditSelf import UserEditSelfBlueprint
from src.Users.UserPublicProfile.GetProfile import GetProfileBlueprint
from src.Users.EditSelf.UploadProfilePicture import UploadProfilePictureBlueprint
from src.Users.StripeAccount.AddStripeAccount import AddStripeAccountBlueprint
from src.Users.Settings.GetSettings import GetSettingsBlueprint
from src.Users.UserPublicProfile.GetCoachDurations import GetDurationsBlueprint

from src.Bookings.AddBooking.GuestAddBooking import GuestAddBookingBlueprint
from src.Bookings.AddBooking.CalculateAvailableTimes import CalculateAvailableTimesBlueprint
from src.Bookings.AddBooking.CoachAddBooking import CoachAddBookingBlueprint
from src.Bookings.AddBooking.CalculateLessonCost import CalculateLessonCostBlueprint
from src.Bookings.Cancellations.PlayerCancellation import PlayerCancelBookingBlueprint
from src.Bookings.Cancellations.CoachCancellation import CoachCancellationBlueprint
from src.Bookings.GetBookings.GetBookings import GetBookingsBlueprint
from src.Bookings.AddBooking.CheckDays import CheckDaysBlueprint

from src.CoachEvents.AddCoachEvent import AddCoachEventBlueprint
from src.CoachEvents.CancelCoachEvent import CancelCoachEventBlueprint
from src.CoachEvents.GetCoachEvents import GetCoachEventBlueprint

from src.Contacts.GetContact import GetContactBlueprint
from src.Contacts.AddContact import CreateContactBlueprint
from src.Contacts.DeleteContact import DeleteContactBlueprint
from src.Contacts.EditContact import EditContactBlueprint
from src.Contacts.VerifyEmail import VerifyEmailBlueprint
from src.Contacts.Players.AddPlayer import CreatePlayerBlueprint
from src.Contacts.Players.GetPlayers import GetPlayersBlueprint
from src.Contacts.Players.DeletePlayer import DeletePlayerBlueprint
from src.Contacts.Players.EditPlayer import EditPlayerBlueprint

from src.Invoices.CancelInvoice import CancelInvoiceBlueprint
from src.Invoices.CancelInvoices import CancelInvoicesBlueprint
from src.Invoices.GetInvoices.GetInvoices import GetInvoicesBlueprint
from src.Invoices.GetInvoices.GetInvoices2 import GetInvoices2Blueprint
from src.Invoices.Private.InvoicePaidWebhook import InvoicePaidWebhookBlueprint
from src.Invoices.MarkInvoiceAsPaid import MarkInvoiceAsPaidBlueprint

from src.Repeats.CancelRepeatingLesson import CancelRepeatingLessonBlueprint

from src.Timetable.CheckOverlaps import CheckOverlapsBlueprint
from src.Timetable.CalendarIntegrations.CreateICS import CreateICSCalendarBlueprint
from src.Timetable.EditFeatures import EditFeaturesBlueprint
from src.Timetable.GetTimetable.GetTimetable import GetTimetableBlueprint
from src.Timetable.GetTimetable.GetTimetable2 import GetTimetable2Blueprint
from src.Timetable.GetFeatures import GetFeaturesBlueprint
from src.Timetable.PostWorkingHours import PostWorkingHoursBlueprint

from src.TestBlueprint import TestBlueprint
# from src.Repeats.CreateRepeatRule import test

from src.Sales.ContactSales import ContactSalesBlueprint
from src.Sales.CreateSignUpLink import CreateSignUpLinkBlueprint
from src.Sales.VerifyHash import VerifyHashBlueprint

from src.PricingRules.GetPricingRules import GetPricingRulesEndpoint
from src.PricingRules.CreatePricingRule import CreatePricingRuleBlueprint
from src.PricingRules.DeletePricingRule import DeletePricingRuleBlueprint

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
    app.register_blueprint(ForgotPasswordBlueprint)
    app.register_blueprint(ConfirmForgotPasswordBlueprint)
    app.register_blueprint(ChangePasswordBlueprint)
    app.register_blueprint(CheckCoachAuthorisedBlueprint)
    app.register_blueprint(GetProfileBlueprint)
    app.register_blueprint(UploadProfilePictureBlueprint)
    app.register_blueprint(AddStripeAccountBlueprint)
    app.register_blueprint(GetSettingsBlueprint)
    app.register_blueprint(GetDurationsBlueprint)
    
    app.register_blueprint(GuestAddBookingBlueprint)
    app.register_blueprint(CalculateAvailableTimesBlueprint)
    app.register_blueprint(CalculateLessonCostBlueprint)
    app.register_blueprint(CoachAddBookingBlueprint)
    app.register_blueprint(PlayerCancelBookingBlueprint)
    app.register_blueprint(CoachCancellationBlueprint)
    app.register_blueprint(CheckDaysBlueprint)
    
    app.register_blueprint(AddCoachEventBlueprint)
    app.register_blueprint(CancelCoachEventBlueprint)
    app.register_blueprint(GetCoachEventBlueprint)
    
    app.register_blueprint(GetContactBlueprint)
    app.register_blueprint(CreatePlayerBlueprint)
    app.register_blueprint(CreateContactBlueprint)
    app.register_blueprint(DeleteContactBlueprint)
    app.register_blueprint(EditContactBlueprint)
    app.register_blueprint(VerifyEmailBlueprint)
    app.register_blueprint(GetPlayersBlueprint)
    app.register_blueprint(DeletePlayerBlueprint)
    app.register_blueprint(EditPlayerBlueprint)
    
    app.register_blueprint(CancelInvoiceBlueprint)
    app.register_blueprint(CancelInvoicesBlueprint)
    app.register_blueprint(GetInvoicesBlueprint)
    app.register_blueprint(GetInvoices2Blueprint)
    app.register_blueprint(InvoicePaidWebhookBlueprint)
    app.register_blueprint(MarkInvoiceAsPaidBlueprint)
    
    app.register_blueprint(CancelRepeatingLessonBlueprint)
    
    app.register_blueprint(CheckOverlapsBlueprint)
    app.register_blueprint(CreateICSCalendarBlueprint)
    app.register_blueprint(GetTimetable2Blueprint)
    app.register_blueprint(PostWorkingHoursBlueprint)
    app.register_blueprint(GetFeaturesBlueprint)
    app.register_blueprint(EditFeaturesBlueprint)
    
    app.register_blueprint(TestBlueprint)
    # app.register_blueprint(test)
    
    app.register_blueprint(ContactSalesBlueprint)
    app.register_blueprint(CreateSignUpLinkBlueprint)
    app.register_blueprint(VerifyHashBlueprint)
    
    app.register_blueprint(GetPricingRulesEndpoint)
    app.register_blueprint(CreatePricingRuleBlueprint)
    app.register_blueprint(DeletePricingRuleBlueprint)
    
    CORS(app)
    
    return app, db_connection