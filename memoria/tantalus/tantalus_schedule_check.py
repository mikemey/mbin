#!/usr/local/bin/python
import os
import requests
import sys

sys.path.append(os.environ['MBIN'])
import mail_sender as mails

url = 'https://{}/api/metadata/schedule'.format(os.environ['MSMSERVER'])
schedule_data_filename = '{}/tantalus/scheduler.ts'.format(os.environ['LOGDIR'])


def check_metadata(current_metadata):
    with open(schedule_data_filename, 'r') as fin:
        previous_metadata = fin.readline()
        if previous_metadata == current_metadata:
            notify(current_metadata)


def update_metadata(current_metadata):
    with open(schedule_data_filename, 'w') as f:
        f.write(current_metadata)


def notify(msg):
    if isinstance(msg, Exception):
        print('error: {}'.format(msg))
        mails.send('[tantalus] Server metadata check error', 'An error occurred:\n{}'.format(msg))
    else:
        print('scheduler not running since: {}'.format(msg))
        mails.send('[tantalus] Scheduler down', 'Last metadata: {}'.format(msg))


try:
    print('checking...')
    resp = requests.get(url)
    resp.raise_for_status()
    metadata = resp.text
    check_metadata(metadata)
    update_metadata(metadata)
    print('done')
except Exception as ex:
    print('error: {}'.format(ex))
    notify(ex)
