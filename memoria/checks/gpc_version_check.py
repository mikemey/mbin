#!/usr/local/bin/python

import os
import sys

import requests
from bs4 import BeautifulSoup

from check_file import CheckFile

sys.path.append(os.environ['MBIN'])
import mail_sender as mails

url = 'https://github.com/googleads/googleads-consent-sdk-ios/releases'
captured_fname = '{}/versions/gpc.txt'.format(os.environ['LOGDIR'])


def request_current_version():
    resp = requests.get(url)
    resp.raise_for_status()
    html = BeautifulSoup(resp.text, 'html.parser')
    version_divs = html.select('div.f1')
    if not version_divs:
        return None
    return version_divs[0].text.strip()


def notify(msg):
    if isinstance(msg, Exception):
        print('error: {}'.format(msg))
        mails.send('[GPC] check error', 'An error occurred:\n{}'.format(msg))
    elif msg is False:
        print('no results')
        mails.send('[GPC] no results', 'notext')
    else:
        print('new version: {}'.format(msg))
        mails.send('[NEW GPC] {}'.format(msg), 'notext')


try:
    out_file = CheckFile(captured_fname)
    print('checking...')
    current_version = request_current_version()
    captured_versions = out_file.read_entries()

    if current_version is None:
        notify(False)
    elif current_version not in captured_versions:
        notify(current_version)
        out_file.write_entry(current_version)
    print('done')
except Exception as ex:
    notify(ex)
