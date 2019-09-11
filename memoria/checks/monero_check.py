#!/usr/local/bin/python

import os
import sys

import requests

sys.path.append(os.environ['MBIN'])
import mail_sender as mails

url = 'https://downloads.getmonero.org/cli/win64'
captured_fname = '{}/monero/captured.txt'.format(os.environ['LOGDIR'])
max_redirects = 5


def request_version():
    redirects = max_redirects
    location = location_of(url)
    while redirects > 0 and not location.endswith('zip'):
        redirects -= 1
        print (redirects, location)
        location = location_of(location)
    if location:
        return location.rsplit('/', 1)[-1]
    else:
        raise Exception('no download file found!')


def location_of(request_url):
    resp = requests.options(request_url, allow_redirects=False)
    resp.raise_for_status()
    return resp.headers.get('location')


def read_captured_versions():
    file_mode = 'r' if os.path.exists(captured_fname) else 'a+'
    with open(captured_fname, file_mode) as fin:
        return fin.readline()


def add_captured_version(new_version):
    with open(captured_fname, 'a') as f:
        f.write('{}\n'.format(new_version))


def notify(msg):
    if isinstance(msg, Exception):
        print('error: {}'.format(msg))
        mails.send('[MONERO] check error', 'An error occurred:\n{}'.format(msg))
    else:
        print('new version: {}'.format(msg))
        mails.send('[MONERO] {}'.format(msg), 'notext')


try:
    print('checking...')
    available_version = request_version()
    captured_versions = read_captured_versions()

    if available_version not in captured_versions:
        notify(available_version)
        add_captured_version(available_version)
    print('done')
except Exception as ex:
    notify(ex)
