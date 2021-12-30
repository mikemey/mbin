#!/usr/local/bin/python

from bs4 import BeautifulSoup

from check_utils import run_generic_check

url = 'https://web.getmonero.org/downloads/'
find_text = "Current Version:"


def extract_version_from(html: BeautifulSoup):
    cli_info_block = html.find_all('div', class_="info-block")
    if not cli_info_block or len(cli_info_block) < 4:
        return None
    version_i = cli_info_block[3].find('i', text=find_text)
    if not version_i:
        return None
    return version_i.parent.text[len(find_text) + 1:]


run_generic_check('Monero', url, extract_version_from)
