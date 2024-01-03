from datetime import datetime
from dotenv import load_dotenv
import logging
import os

from src.Contacts.GetContact import get_contact_player
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

def send_player_repeat_lesson(cron, player_id, contact_id, start_time, duration, repeat_hash, coach, repeat_until=None):
    repeat_url = f"{website_url}/#/view-repeats/{repeat_hash}"
    
    contact = get_contact_player(contact_id, player_id)

    # Interpret the cron expression for a human-readable schedule
    schedule_str = interpret_cron(cron)

    # Convert the start time to a readable format
    start_time = datetime.fromtimestamp(start_time)
    first_lesson_date = start_time.strftime('%A, %B %d, %Y')
    first_lesson_time = start_time.strftime('%I:%M %p')

    # Handle repeat_until information
    if repeat_until:
        repeat_until_time = datetime.fromtimestamp(repeat_until)
        repeat_until_str = repeat_until_time.strftime('%A, %B %d, %Y')
        repeat_info = f"until {repeat_until_str}"
    else:
        repeat_info = "indefinitely"

    # Construct the email body
    bodyHTML = f"""
    <html>
        <body>
            <p>Dear {contact['name']},</p>
            <p>Your repeating lessons with {coach['name']} are scheduled to start on {first_lesson_date} at {first_lesson_time}.</p>
            <p>These lessons will occur {schedule_str} {repeat_info}.</p>
            <p>Duration: {duration} minutes per session.</p>
            <p>To view or cancel your upcoming 4 lessons, please visit <a href="{repeat_url}">{repeat_url}</a>.</p>
            <p>If you have any questions or need to make changes, please feel free to contact us.</p>
        </body>
    </html>
    """

    send_email(
        localFrom='bookings',
        recipients=[contact['email']],
        subject='Your Repeating Lessons Schedule',
        bodyText=f"Your repeating lessons with {coach['name']} are starting on {first_lesson_date} at {first_lesson_time} and will occur {schedule_str} {repeat_info}.",
        bodyHTML=bodyHTML
    )


def interpret_cron(cron_expression):
    """
    Improved function to interpret a simple cron expression and returns a human-readable schedule.
    The function assumes the cron expression is in the format: minute hour * * day_of_week
    """
    days_of_week = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"]

    parts = cron_expression.split()
    if len(parts) != 5:
        return "Invalid cron expression"

    minute, hour, _, _, day_of_week = parts

    # Convert day of week to human-readable format
    if day_of_week == "*":
        day_of_week_str = "daily"
    else:
        day_of_week_str = f"on {days_of_week[int(day_of_week)]}"

    # Format the time
    time = f"{int(hour):02d}:{int(minute):02d}"

    return f"{time} {day_of_week_str}"