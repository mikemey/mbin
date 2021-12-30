#!/usr/local/bin/python

from bs4 import BeautifulSoup

from check_utils import run_generic_check

url = 'https://electrum.org/panel-download.html'
find_text = "Latest release: "


def extract_version_from(html: BeautifulSoup):
    version_header = html.find('h2')
    if not version_header or not version_header.text.startswith(find_text):
        return None
    return version_header.text[len(find_text):]


run_generic_check('Electrum', url, extract_version_from)
