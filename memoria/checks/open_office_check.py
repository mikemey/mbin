#!/usr/local/bin/python
from bs4 import BeautifulSoup

from check_file import run_generic_check

url = 'https://www.openoffice.org/download/index.html'


def extract_version_from(html: BeautifulSoup):
    return html.find(id='announce').text


run_generic_check('OpenOffice', url, extract_version_from)
