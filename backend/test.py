import requests
import pyperclip


def send_email(sender_email, recipient_email, username, password):
    try:
        response = requests.post(
            "https://smvm4k14cg.execute-api.eu-west-2.amazonaws.com/Prod/SendTextEmail",
            json={
                "sender_email": sender_email,
                "recipient_email": recipient_email,
                "subject": "Fixr Account Details",
                "body": f"<div><p>Username:</p> <p><a href='javascript:void(0)' onclick='copyToClipboard(\"{username}\")'>{username}</a></p><p>Password:</p> <p><a href='javascript:void(0)' onclick='copyToClipboard(\"{password}\")'>{password}</a></p><p>We recommend you change the account name to your own.</p><p> Remember to log out of the account after the event has passed</p></div>"
            },
        )

        if response.status_code == 200:
            return True
        else:
            print(f"Failed to send email. Status code: {response.status_code}. Response: {response.text}")
            
            return False
    except Exception as e:
        print(f"Error occurred while sending email: {e}")
        return False

def copy_to_clipboard(text):
    pyperclip.copy(text)
    
send_email('tickets.exeter123@gmail.com', 'liambuchanan358@yahoo.co.uk', 'blah@blah.com', '12345')


