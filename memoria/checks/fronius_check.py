#!/usr/local/bin/python
import re

from bs4 import BeautifulSoup

from check_utils import run_generic_check

url = 'https://www.fronius.com/en/solar-energy/installers-partners/service-support/tech-support/software-and-updates/symo-gen24plus-update'

SCRIPT_TEXT_FIND_PATTERN = r'"text":\s*"(?P<value>Firmware Fronius Update[^"]*)'


def extract_version_from(html: BeautifulSoup):
    script = html.find('script', {"id": "__NEXT_DATA__"})
    match = re.search(SCRIPT_TEXT_FIND_PATTERN, script.text)
    if match:
        return match.group('value')
    raise Exception("Version not found in the HTML content.")


run_generic_check('Fronius', url, extract_version_from)
