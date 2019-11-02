#!/usr/local/bin/python

import os
import sys

import requests
from bs4 import BeautifulSoup

sys.path.append(os.environ['MBIN'])
import mail_sender as mails

url = 'https://developers.google.com/admob/ios/download'
captured_fname = '{}/versions/gma.txt'.format(os.environ['LOGDIR'])


def request_current_version():
    resp = requests.get(url)
    resp.raise_for_status()
    html = BeautifulSoup(resp.text, 'html.parser')
    version_td = html.body.find('td', text='Version')
    if version_td is None:
        return None
    return version_td.find_next_sibling('td').text


def read_captured_versions():
    file_mode = 'r' if os.path.exists(captured_fname) else 'a+'
    with open(captured_fname, file_mode) as fin:
        return [line.strip() for line in fin.readlines()]


def add_captured_version(new_version):
    with open(captured_fname, 'a') as f:
        f.write('{}\n'.format(new_version))


def notify(msg):
    if isinstance(msg, Exception):
        print('error: {}'.format(msg))
        mails.send('[NEW GMA] check error', 'An error occurred:\n{}'.format(msg))
    elif msg is False:
        print('no results')
        mails.send('[GMA] no results', 'notext')
    else:
        print('new version: {}'.format(msg))
        mails.send('[NEW GMA] {}'.format(msg), 'notext')


try:
    print('checking...')
    current_version = request_current_version()
    captured_versions = read_captured_versions()

    if current_version is None:
        notify(False)
    elif current_version not in captured_versions:
        notify(current_version)
        add_captured_version(current_version)
    print('done')
except Exception as ex:
    notify(ex)
