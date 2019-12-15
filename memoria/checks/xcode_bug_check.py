#!/usr/local/bin/python

import os
import sys
import traceback

import requests
from bs4 import BeautifulSoup

from check_file import CheckFile

sys.path.append(os.environ['MBIN'])
import mail_sender as mails

url = 'https://forums.developer.apple.com/thread/126948'
captured_fname = sys.argv[1]


def request_current_version():
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    html = BeautifulSoup(resp.text, 'html.parser')
    replies_list = html.body.find('ul', class_='jive-discussion-replies')
    if replies_list is None:
        return None
    return len(replies_list.find('li'))


def notify(msg):
    if isinstance(msg, Exception):
        print(u'error: {}'.format(msg))
        mails.send('[XCode bug] check error', u'An error occurred:\n{}'.format(msg))
    elif msg is False:
        print('no results')
        mails.send('[XCode bug] no results', 'notext')
    else:
        print(u'new reply: #{}'.format(msg))
        mails.send(u'[NEW XCode bug] {}'.format(msg), 'notext')


exit_code = 0
try:
    out_file = CheckFile(captured_fname)
    print('checking...')
    replies_count = request_current_version()
    captured_counts = out_file.read_entries()

    if replies_count is None:
        notify(False)
        exit_code = 1
    elif replies_count not in captured_counts:
        notify(replies_count)
        out_file.write_entry(replies_count)
    print('done')
except Exception as ex:
    traceback.print_exc(file=sys.stderr)
    notify(ex)
    exit_code = 10

exit(exit_code)
