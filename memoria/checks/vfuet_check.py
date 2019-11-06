#!/usr/local/bin/python

import os
import sys

import requests
from bs4 import BeautifulSoup

from check_file import CheckFile

sys.path.append(os.environ['MBIN'])
import mail_sender as mails

url = 'https://tvthek.orf.at/search?q=vier+frauen'
captured_fname = sys.argv[1]


def request_current_episodes():
    resp = requests.get(url)
    resp.raise_for_status()
    html = BeautifulSoup(resp.text, 'html.parser')
    h5_titles = html.select('h5.teaser-title')
    return [h5.text.strip() for h5 in h5_titles
            if "Vier Frauen und ein Todesfall" in h5.text]


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
