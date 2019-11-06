#!/usr/local/bin/python

import os
import sys

import requests
from bs4 import BeautifulSoup

from check_file import CheckFile

sys.path.append(os.environ['MBIN'])
import mail_sender as mails

url = 'https://developers.google.com/admob/ios/download'
captured_fname = sys.argv[1]


def request_current_version():
    resp = requests.get(url)
    resp.raise_for_status()
    html = BeautifulSoup(resp.text, 'html.parser')
    version_td = html.body.find('td', text='Version')
    if version_td is None:
        return None
    return version_td.find_next_sibling('td').text


def notify(msg):
    if isinstance(msg, Exception):
        print('error: {}'.format(msg))
        mails.send('[GMA] check error', 'An error occurred:\n{}'.format(msg))
    elif msg is False:
        print('no results')
        mails.send('[GMA] no results', 'notext')
    else:
        print('new version: {}'.format(msg))
        mails.send('[NEW GMA] {}'.format(msg), 'notext')


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
