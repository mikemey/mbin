import os
import platform
import sys
import traceback

import requests
from bs4 import BeautifulSoup

DRY_RUN = True
if platform.uname().node == 'Memoria':
    DRY_RUN = False
    sys.path.append(os.environ['MBIN'])
    import mail_sender as mails


def run_generic_check(qualifier, url, extract_version_from):
    exit_code = 0

    def __send_mail(title, body):
        send_mail(qualifier, url, title, body)

    try:
        print('checking...')
        version = request_version(url, extract_version_from)

        if version is None:
            __send_mail('no results', '')
            exit_code = 1
        else:
            if DRY_RUN:
                print(u'new version: {}'.format(version))
            else:
                check_version(__send_mail, version)
        print('done')
    except Exception as ex:
        traceback.print_exc(file=sys.stderr)
        __send_mail('check error', u'An error occurred:\n{}'.format(ex))
        exit_code = 2

    exit(exit_code)


def send_mail(qualifier, url, title, body):
    mail_subject = u'[{}] {}'.format(qualifier, title)
    mail_body = u'URL: {}\n{}'.format(url, body)
    if DRY_RUN:
        print('Subject:', mail_subject)
    else:
        print(title)
        mails.send(mail_subject, mail_body)


def request_version(url, extract_version_from):
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    html = BeautifulSoup(resp.text, 'html.parser')
    return extract_version_from(html)


def check_version(__send_mail, version):
    check_file_name = sys.argv[1]
    out_file = CheckFile(check_file_name)
    if version not in out_file.read_entries():
        __send_mail(u'new version: {}'.format(version), '')
        out_file.write_entry(version)


class CheckFile:
    def __init__(self, file_name):
        self.file = file_name

    def write_entry(self, new_entry):
        self.write_entries({new_entry})

    def write_entries(self, new_entries):
        with open(self.file, 'a', encoding='utf-8') as f:
            for entry in new_entries:
                f.write(u'{}\n'.format(entry))

    def read_entries(self):
        file_mode = 'r' if os.path.exists(self.file) else 'a+'
        with open(self.file, file_mode, encoding='utf-8') as fin:
            return [line.strip() for line in fin.readlines()]
