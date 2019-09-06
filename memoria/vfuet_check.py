#!/usr/local/bin/python

import os
import sys
import requests
from pyquery import PyQuery

sys.path.append(os.environ['MBIN'])
import mail_sender as mails

url = 'https://tvthek.orf.at/search?q=vier+frauen'
captured_fname = '{}/vfuet_captured.txt'.format(os.environ['LOGDIR'])


def request_current_episodes():
    resp = requests.get(url)
    resp.raise_for_status()
    pq = PyQuery(resp.text)
    tags = pq('article > a[title^="Vier Frauen und ein Todesfall"]')
    return [PyQuery(anchor).attr('title') for anchor in tags]


def read_captured_episodes():
    file_mode = 'r' if os.path.exists(captured_fname) else 'a+'
    with open(captured_fname, file_mode) as fin:
        return [line.strip() for line in fin.readlines()]


def add_captured_episodes(new_episodes):
    with open(captured_fname, 'a') as f:
        for new_ep in new_episodes:
            f.write('{}\n'.format(new_ep))


def notify(msg):
    if isinstance(msg, Exception):
        print('error: {}'.format(msg))
        mails.send('[NEW] check error', 'An error occurred:\n{}'.format(msg))
    else:
        print('new episode: {}'.format(msg))
        mails.send('[NEW] {}'.format(msg), 'notext')


try:
    print('checking...')
    available_episodes = request_current_episodes()
    captured_episodes = read_captured_episodes()

    missing_episodes = [ep for ep in available_episodes if ep not in captured_episodes]
    if len(missing_episodes) > 0:
        notify(', '.join([ep for ep in missing_episodes]))
        add_captured_episodes(missing_episodes)
    print('done')
except Exception as ex:
    print('error: {}'.format(ex))
    notify(ex)
