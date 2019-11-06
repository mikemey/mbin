#!/usr/local/bin/python

import os
import sys

import requests
from bs4 import BeautifulSoup

from check_file import CheckFile

sys.path.append(os.environ['MBIN'])
import mail_sender as mails

url = 'https://electrum.org/panel-download.html'
captured_fname = '{}/electrum.txt'.format(os.environ['CHECK_LOG_DIR'])
find_text = "Latest release: "


def request_current_version():
    resp = requests.get(url)
    resp.raise_for_status()
    html = BeautifulSoup(resp.text, 'html.parser')
    version_header = html.find('h2')
    if not version_header or not version_header.text.startswith(find_text):
        return None
    return version_header.text[len(find_text):]


def notify(msg):
    if isinstance(msg, Exception):
        print('error: {}'.format(msg))
        mails.send('[electrum] check error', 'An error occurred:\n{}'.format(msg))
    elif msg is False:
        print('no results')
        mails.send('[electrum] no results', 'notext')
    else:
        print('new version: {}'.format(msg))
        mails.send('[NEW electrum] {}'.format(msg), 'notext')


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
