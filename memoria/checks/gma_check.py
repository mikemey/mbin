#!/usr/local/bin/python

from bs4 import BeautifulSoup

from check_file import run_generic_check

url = 'https://developers.google.com/admob/ios/download'


def extract_version_from(html: BeautifulSoup):
    version_td = html.body.find('td', text='Version')
    if version_td is None:
        return None
    return version_td.find_next_sibling('td').text


run_generic_check('GMA', url, extract_version_from)
