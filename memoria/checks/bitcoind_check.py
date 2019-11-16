#!/usr/local/bin/python

import os
import sys
import traceback

import requests
from bs4 import BeautifulSoup

from check_file import CheckFile

sys.path.append(os.environ['MBIN'])
import mail_sender as mails

url = 'https://bitcoin.org/en/bitcoin-core/'
captured_fname = sys.argv[1]
find_text = "Bitcoin Core"


def request_current_version():
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    html = BeautifulSoup(resp.text, 'html.parser')
    version_header = html.select_one('div.callout-row')
    if not version_header:
        return None
    version_text = version_header.text.strip()
    if not version_text.startswith(find_text):
        return None
    return version_text


def notify(msg):
    if isinstance(msg, Exception):
        print(u'error: {}'.format(msg))
        mails.send('[bitcoind] check error', u'An error occurred:\n{}'.format(msg))
    elif msg is False:
        print('no results')
        mails.send('[bitcoind] no results', 'notext')
    else:
        print(u'new version: {}'.format(msg))
        mails.send(u'[NEW bitcoind] {}'.format(msg), 'notext')


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
