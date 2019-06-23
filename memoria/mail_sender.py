import os
from smtplib import SMTP
from email.mime.text import MIMEText


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

    conn = SMTP(get_env('MM_SMTP_SERVER'))
    conn.set_debuglevel(False)
    conn.starttls()
    conn.login(get_env('MM_USERNAME'), get_env('MM_PASSWORD'))
    conn.sendmail(sender, destination, msg.as_string())
    conn.close()
