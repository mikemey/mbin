#!/usr/local/bin/python

import os
import sys
import traceback

import requests

sys.path.append(os.environ['MBIN'])
import mail_sender as mails
from check_file import CheckFile

url = 'https://downloads.getmonero.org/cli/win64'
captured_fname = sys.argv[1]
max_redirects = 5


def request_version():
    redirects = max_redirects
    location = location_of(url)
    while redirects > 0 and not location.endswith('zip'):
        redirects -= 1
        location = location_of(location)
    if location:
        return location.rsplit('/', 1)[-1]
    else:
        raise Exception('no download file found!')


def location_of(request_url):
    resp = requests.options(request_url, allow_redirects=False, timeout=10)
    resp.raise_for_status()
    return resp.headers.get('location')


def notify(msg):
    if isinstance(msg, Exception):
        print('error: {}'.format(msg))
        mails.send('[MONERO] check error', 'An error occurred:\n{}'.format(msg))
    else:
        print('new version: {}'.format(msg))
        mails.send('[MONERO] {}'.format(msg), 'notext')


try:
    out_file = CheckFile(captured_fname)
    print('checking...')
    available_version = request_version()
    captured_versions = out_file.read_entries()

    if available_version not in captured_versions:
        notify(available_version)
        out_file.write_entry(available_version)
    print('done')
except Exception as ex:
    traceback.print_exc(file=sys.stderr)
    notify(ex)
