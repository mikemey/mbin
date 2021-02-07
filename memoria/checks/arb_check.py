#!/usr/local/bin/python

import os
import sys
import traceback

import requests

from check_file import CheckFile

sys.path.append(os.environ['MBIN'])
import mail_sender as mails

url = 'https://{}/arb/api/opportunity'.format(os.environ['MSMSERVER'])
captured_fname = sys.argv[1]
log_cat = 'ARB'


def request_opportunities():
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    return ['{}: {} -> {}'.format(res['cd'], res['be'], res['se']) for res in resp.json()]


def notify(msg):
    if isinstance(msg, Exception):
        print(u'error: {}'.format(msg))
        mails.send('[{}] check error'.format(log_cat), u'An error occurred:\n{}'.format(msg))
    elif msg is False:
        print('no results')
        mails.send('[{}] no results'.format(log_cat), 'notext')
    else:
        print(u'new opps: {}'.format(msg))
        mails.send('[{}] New trades'.format(log_cat), msg)


exit_code = 0
try:
    out_file = CheckFile(captured_fname)
    print('checking...')
    opportunities = request_opportunities()
    captured_opps = out_file.read_entries()

    new_opps = [ep for ep in opportunities if ep not in captured_opps]
    if len(new_opps) > 0:
        notify('\n'.join([opp for opp in new_opps]))
        out_file.write_entries(new_opps)

    print('done')
except Exception as ex:
    traceback.print_exc(file=sys.stderr)
    notify(ex)
    exit_code = 10

exit(exit_code)
