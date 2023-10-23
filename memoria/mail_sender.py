import os
import ssl
from email.mime.text import MIMEText
from smtplib import SMTP_SSL


def get_env(name):
    return os.environ[name]


def send(email_subject, email_content, as_html=False):
    sender = get_env('MM_SENDER')
    destination = get_env('MM_DESTINATION')
    email_type = 'html' if as_html else 'plain'
    msg = MIMEText(email_content, email_type)
    msg['Subject'] = email_subject
    msg['From'] = sender
    msg['To'] = destination

    context = ssl.create_default_context()
    with SMTP_SSL(get_env('MM_SMTP_SERVER'), int(get_env('MM_SMTP_SERVER_PORT')), context=context) as server:
        server.set_debuglevel(False)
        server.login(get_env('MM_USERNAME'), get_env('MM_PASSWORD'))
        server.sendmail(sender, destination, msg.as_string())
