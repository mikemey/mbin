#!/usr/local/bin/python

import os
import sys
import traceback

import requests
from bs4 import BeautifulSoup

from check_file import CheckFile

sys.path.append(os.environ['MBIN'])
import mail_sender as mails

url = 'https://web.getmonero.org/downloads/'
captured_fname = sys.argv[1]
find_text = "Current Version:"


def request_version():
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    html = BeautifulSoup(resp.text, 'html.parser')
    cli_info_block = html.find_all('div', class_="info-block")
    if not cli_info_block or len(cli_info_block) < 4:
        return None
    version_i = cli_info_block[3].find('i', text=find_text)
    if not version_i:
        return None
    return version_i.parent.text[len(find_text) + 1:]


def notify(msg):
    if isinstance(msg, Exception):
        print(u'error: {}'.format(msg))
        mails.send('[MONERO] check error', u'An error occurred:\n{}'.format(msg))
    elif msg is False:
        print('no results')
        mails.send('[MONERO] no results', 'notext')
    else:
        print(u'new version: {}'.format(msg))
        mails.send(u'[MONERO] {}'.format(msg), u'URL: {}'.format(url))


exit_code = 0
try:
    out_file = CheckFile(captured_fname)
    print('checking...')
    current_version = request_version()
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
