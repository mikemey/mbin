#!/usr/local/bin/python

import os
import sys
import traceback

import requests
from bs4 import BeautifulSoup

from check_file import CheckFile

sys.path.append(os.environ['MBIN'])
import mail_sender as mails


def request_current_version(github_url):
    resp = requests.get(github_url, timeout=10)
    resp.raise_for_status()
    html = BeautifulSoup(resp.text, 'html.parser')
    title_divs = html.select('div.flex-1 h1')
    version_anchor = html.select('span.wb-break-all')

    if not (title_divs and version_anchor):
        return None
    return title_divs[0].text.strip(), version_anchor[0].text.strip()


# keep '{}'.format(var) variant for python3.5 compatibility
def check_github(identity, url, captured_fname):
    def send_mail(title, body):
        print('{}... '.format(title), end='')
        mails.send(u'[{}] {}'.format(identity, title), u'URL: {}\n{}'.format(url, body))

    exit_code = 0
    try:
        print('checking... ', end='')
        title_version = request_current_version(url)
        if title_version is None:
            send_mail('no results', '')
            exit_code = 1
        else:
            title, version = title_version
            out_file = CheckFile(captured_fname)
            if version not in out_file.read_entries():
                send_mail(u'New: {} [{}]'.format(title, version), '')
                out_file.write_entry(version)
        print('done')
    except Exception as ex:
        traceback.print_exc(file=sys.stderr)
        send_mail('check error', u'An error occurred:\n{}'.format(ex))
        exit_code = 10
    exit(exit_code)


check_github(sys.argv[1], sys.argv[2], sys.argv[3])
