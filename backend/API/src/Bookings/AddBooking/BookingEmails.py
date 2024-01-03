from datetime import datetime
from dotenv import load_dotenv
import logging
import os

from src.Notifications.Emails.SendEmail import send_email
from src.Users.GetSelf.GetSelf import get_attributes

load_dotenv('.env')

website_url = os.getenv('WEBSITE_URL')

logging.basicConfig(level=logging.DEBUG)

def send_player_confirmation_email(player_email, start_time, duration, cost, hash, coach_email=None, coach_phone_number=None):
    start_time = datetime.fromtimestamp(start_time)
    date_str = start_time.strftime('%A, %B %d, %Y')
    time_str = start_time.strftime('%I:%M %p')
    
    cancel_url = f"{website_url}/#/bookings/{hash}/cancel"
    
    # Start constructing the email body with the fixed content
    bodyHTML = f"""
    <html>
        <body>
            <p>Thank you for booking your lesson on {date_str} at {time_str}.</p>
            <p>Summary:</p>
            <p>Duration: {duration} minutes.</p>
            <p>Cost: £{cost/100.0:.2f}.</p>
    """
    
    # Add the coach's email to the body if it is provided
    if coach_email is not None:
        bodyHTML += f"<p>Coach contact email: {coach_email}.</p>"
    if coach_phone_number is not None:
        bodyHTML += f"<p>Coach contact phone number: {coach_phone_number}.</p>"
    
    # Complete the email body with the cancellation link
    bodyHTML += f"""
            <p>To cancel your lesson, <a href="{cancel_url}">click here: {cancel_url}</a></p>
        </body>
    </html>
    """
    
    send_email(
        localFrom='bookings',
        recipients=[player_email],
        subject='Lesson Successfully Booked!',
        bodyText=f"Thank you for booking your lesson on {date_str} at {time_str} for {duration} minutes.",
        bodyHTML=bodyHTML
    )


def send_coach_confirmation_email(coach_email, start_time, duration, player_name):
    start_time = datetime.fromtimestamp(start_time)
    date_str = start_time.strftime('%A, %B %d, %Y')
    time_str = start_time.strftime('%I:%M %p')
    send_email(
        localFrom='bookings',
        recipients=[coach_email],
        subject='New Lesson Booking!',
        bodyText=f"New booking confirmed at {time_str} on {date_str} for {duration} minutes. Player Name: {player_name}. Check website for more details",
        bodyHTML=f"""
        <html>
            <body>
                <p>New booking confirmed at {time_str} on {date_str} for {duration} minutes</p>
                <p>Player Name: {player_name}</p>
                <p><a href={website_url}>Check website for more details</a></p>
            </body>
        </html>
        """
    )


def send_confirmation_emails(contact_email, start_time, duration, cost, hash, player_name, coach_id):
    
    logging.debug(f"hash: {hash}")
    
    attributes = get_attributes(coach_id)
    
    if not attributes:
        return
    
    coach_phone_number = attributes['phone_number']
    coach_email = attributes['email']
    
    show_email_publicly = attributes['show_email_publicly']
    show_phone_number_publicly = attributes['show_phone_number_publicly']
    
    # convert coach phone number from +44 to 07
    if coach_phone_number.startswith("+44"):
        coach_phone_number = coach_phone_number[3:]
        
    try:    
        send_coach_confirmation_email(coach_email, start_time, duration, player_name)
    except Exception as e:
        logging.error(f"Error sending coach confirmation email: {e}")
    
    try:
        send_player_confirmation_email(contact_email, start_time, duration, cost, hash, coach_email if show_email_publicly else None, coach_phone_number if show_phone_number_publicly else None)
    except Exception as e:
        logging.error(f"Error sending player confirmation email: {e}")

def send_confirmation_emails_booked_by_coach(contact_email, start_time, duration, cost, hash, player_name, coach_id):
    
    logging.debug(f"hash: {hash}")
    
    attributes = get_attributes(coach_id)
    
    if not attributes:
        return
    
    coach_phone_number = attributes['phone_number']
    coach_email = attributes['email']
    
    show_email_publicly = attributes['show_email_publicly']
    show_phone_number_publicly = attributes['show_phone_number_publicly']
    
    # convert coach phone number from +44 to 07
    if coach_phone_number.startswith("+44"):
        coach_phone_number = coach_phone_number[3:]
        
    try:    
        send_coach_confirmation_email(coach_email, start_time, duration, player_name)
    except Exception as e:
        logging.error(f"Error sending coach confirmation email: {e}")
    
    try:
        send_player_booked_by_coach_email(contact_email, start_time, duration, cost, hash, attributes['name'], coach_email if show_email_publicly else None, coach_phone_number if show_phone_number_publicly else None)
    except Exception as e:
        logging.error(f"Error sending player confirmation email: {e}")


def send_player_booked_by_coach_email(player_email, start_time, duration, cost, hash, coach_name, coach_email=None, coach_phone_number=None):
    start_time = datetime.fromtimestamp(start_time)
    date_str = start_time.strftime('%A, %B %d, %Y')
    time_str = start_time.strftime('%I:%M %p')
    
    cancel_url = f"{website_url}/#/bookings/{hash}/cancel"
    
    # Start constructing the email body with the fixed content
    bodyHTML = f"""
    <html>
        <body>
            <p>Your lesson with {coach_name} has been booked for {date_str} at {time_str}.</p>
            <p>Summary:</p>
            <p>Duration: {duration} minutes.</p>
            <p>Cost: £{cost/100.0:.2f}.</p>
    """
    
    # Add the coach's email to the body if it is provided
    # if coach_email is not None:
    #     bodyHTML += f"<p>Coach contact email: {coach_email}.</p>"
    # if coach_phone_number is not None:
    #     bodyHTML += f"<p>Coach contact phone number: {coach_phone_number}.</p>"
    
    # Complete the email body with the cancellation link
    bodyHTML += f"""
            <p>To cancel your lesson, <a href="{cancel_url}">click here: {cancel_url}</a></p>
        </body>
    </html>
    """
    
    send_email(
        localFrom='bookings',
        recipients=[player_email],
        subject='Lesson Booked by Coach!',
        bodyText=f"Your lesson with {coach_name} has been booked for {date_str} at {time_str} for {duration} minutes.",
        bodyHTML=bodyHTML
    )

def send_player_repeat_lesson (start_time):
    pass