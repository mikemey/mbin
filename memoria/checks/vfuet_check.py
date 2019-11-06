#!/usr/local/bin/python

import os
import re
import sys

import requests

from check_file import CheckFile

sys.path.append(os.environ['MBIN'])
import mail_sender as mails

url = 'https://tvthek.orf.at/search?q=vier+frauen'
captured_fname = '{}/vfuet/captured.txt'.format(os.environ['LOGDIR'])


def request_current_episodes():
    resp = requests.get(url)
    resp.raise_for_status()
    result = re.findall('title="(Vier Frauen und ein Todesfall[^"]*)', resp.text)
    return set([title.strip() for title in result])


def notify(msg):
    if isinstance(msg, Exception):
        print('error: {}'.format(msg))
        mails.send('[VFueT] check error', 'An error occurred:\n{}'.format(msg))
    elif msg is False:
        print('no results')
        mails.send('[VFueT] no results', 'notext')
    else:
        print('new episode: {}'.format(msg))
        mails.send('[NEW VFueT]', msg)


try:
    out_file = CheckFile(captured_fname)
    print('checking...')
    available_episodes = request_current_episodes()
    captured_episodes = out_file.read_entries()

    if len(available_episodes) == 0:
        notify(False)
    missing_episodes = [ep for ep in available_episodes if ep not in captured_episodes]
    if len(missing_episodes) > 0:
        notify(', '.join([ep for ep in missing_episodes]))
        out_file.write_entries(missing_episodes)
    print('done')
except Exception as ex:
    notify(ex)
