#!/usr/local/bin/python

from bs4 import BeautifulSoup

from check_utils import run_generic_check

url = 'https://www.fronius.com/en/solar-energy/installers-partners/service-support/tech-support/software-and-updates/symo-gen24plus-update'
find_text = "Latest release: "


def extract_version_from(html: BeautifulSoup):
    version = html.find_all('span', class_='title')[3]
    return version.text


run_generic_check('Fronius', url, extract_version_from)
