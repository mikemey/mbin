#!/usr/local/bin/python
import os
import requests
import mail_sender as mails

url = 'https://{}/api/version'.format(os.environ['MSMSERVER'])
version_fname = '{}/tantalus_isonline.ts'.format(os.environ['LOGDIR'])


def check_server_time(current_version):
    with open(version_fname, 'r') as fin:
        previous_version = fin.readline()
        if previous_version != current_version:
            notify(current_version)


def update_server_time(current_version):
    with open(version_fname, 'w') as f:
        f.write(current_version)


def notify(msg):
    if isinstance(msg, Exception):
        print('error: {}'.format(msg))
        mails.send('[tantalus] Server check error', 'An error occurred:\n{}'.format(msg))
    else:
        print('restarted: {}'.format(msg))
        mails.send('[tantalus] Server restarted', 'Start time: {}'.format(msg))


try:
    print('checking...')
    resp = requests.get(url)
    resp.raise_for_status()
    serverTime = resp.text
    check_server_time(serverTime)
    update_server_time(serverTime)
    print('done')
except Exception as ex:
    print('error: {}'.format(ex))
    notify(ex)
