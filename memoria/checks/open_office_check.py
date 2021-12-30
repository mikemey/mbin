#!/usr/local/bin/python
from bs4 import BeautifulSoup

from check_utils import run_generic_check

url = 'https://www.openoffice.org/download/index.html'
find_text = "Released: "


def extract_version_from(html: BeautifulSoup):
    return html.find(id='announce').text[len(find_text):]


run_generic_check('OpenOffice', url, extract_version_from)
