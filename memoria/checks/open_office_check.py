#!/usr/local/bin/python

import requests
from bs4 import BeautifulSoup

from check_file import run_generic_check

url = 'https://www.openoffice.org/download/index.html'


def request_version():
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    html = BeautifulSoup(resp.text, 'html.parser')
    return html.find(id='announce').text


run_generic_check('OpenOffice', url, request_version)
