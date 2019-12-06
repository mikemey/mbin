#!/usr/local/bin/python

import os
import sys
import traceback

import requests
from bs4 import BeautifulSoup

from check_file import CheckFile

sys.path.append(os.environ['MBIN'])
import mail_sender as mails

url = 'https://github.com/uNetworking/uWebSockets.js/releases'
captured_fname = sys.argv[1]


def request_current_version():
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    html = BeautifulSoup(resp.text, 'html.parser')
    version_divs = html.select('div.f1')
    if not version_divs:
        return None
    return version_divs[0].text.strip()


def notify(msg):
    if isinstance(msg, Exception):
        print(u'error: {}'.format(msg))
        mails.send('[uWebSockets] check error', u'An error occurred:\n{}'.format(msg))
    elif msg is False:
        print('no results')
        mails.send('[uWebSockets] no results', 'notext')
    else:
        print(u'new version: {}'.format(msg))
        mails.send(u'[NEW uWebSockets] {}'.format(msg), 'notext')


exit_code = 0
try:
    out_file = CheckFile(captured_fname)
    print('checking...')
    current_version = request_current_version()
    captured_versions = out_file.read_entries()

    if current_version is None:
        notify(False)
        exit_code = 1
    elif current_version not in captured_versions:
        notify(current_version)
        out_file.write_entry(current_version)
    print('done')
except Exception as ex:
    traceback.print_exc(file=sys.stderr)
    notify(ex)
    exit_code = 10

exit(exit_code)
