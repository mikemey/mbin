#!/usr/local/bin/python

import sys

from bs4 import BeautifulSoup

from check_file import run_generic_check


def extract_version_from(html: BeautifulSoup):
    version_anchor = html.select('span.wb-break-all')

    if version_anchor is None:
        return None
    return version_anchor[0].text.strip()


identity = sys.argv[2]
url = sys.argv[3]

run_generic_check(identity, url, extract_version_from)
