#!/usr/local/bin/python

import os
import sys
import traceback

import requests
from bs4 import BeautifulSoup

sys.path.append(os.environ['MBIN'])
import mail_sender as mails
from check_file import CheckFile

url = 'https://web.getmonero.org/downloads/'
captured_fname = sys.argv[1]
find_text = "Current Version: "


def request_version():
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    html = BeautifulSoup(resp.text, 'html.parser')
    cli_anchor = html.find(href='//downloads.getmonero.org/cli/win64')
    if not cli_anchor:
        return None
    version_p = cli_anchor.parent.find_next_sibling('p')
    if not version_p or not version_p.text.startswith(find_text):
        return None
    return version_p.text[len(find_text):]


def notify(msg):
    if isinstance(msg, Exception):
        print('error: {}'.format(msg))
        mails.send('[MONERO] check error', 'An error occurred:\n{}'.format(msg))
    elif msg is False:
        print('no results')
        mails.send('[MONERO] no results', 'notext')
    else:
        print('new version: {}'.format(msg))
        mails.send('[MONERO] {}'.format(msg), 'notext')


exit_code = 0
try:
    out_file = CheckFile(captured_fname)
    print('checking...')
    current_version = request_version()
    captured_versions = out_file.read_entries()

    if current_version is None:
        notify(False)
        exit_code = 1
    if current_version not in captured_versions:
        notify(current_version)
        out_file.write_entry(current_version)
    print('done')
except Exception as ex:
    traceback.print_exc(file=sys.stderr)
    notify(ex)
    exit_code = 10

exit(exit_code)
