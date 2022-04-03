#!/usr/local/bin/python
import os
import re
import sys
import traceback
from time import time

import requests
from bs4 import BeautifulSoup

from check_utils import CheckFile

sys.path.append(os.environ['MBIN'])
import mail_sender as mails

RANGE_LOWER_LIMIT = 350
PRICE_UPPER_LIMIT = 45000

QUALIFIER = 'EVs'
SITE_URL = 'https://ev-database.org'
CURRENT_DATE = time()


def send_mail(title, body):
    print(title)
    mails.send(
        u'[{}] {}'.format(QUALIFIER, title),
        u'URL: {}\n{}'.format(SITE_URL, body),
        True
    )


class _Car:
    def __init__(self, data):
        def extract_number(selector, default=0):
            num = re.sub('\D', '', data.select_one(selector).text)
            return int(num) if num else default

        self.data = data
        car_anchor = data.select_one('h2 a')
        car_range = extract_number('.erange_real')
        price = max(extract_number('.country_de'), extract_number('.country_nl'))
        date = extract_number('.date_from')

        self.model = car_anchor.text.strip()
        self.link = car_anchor.attrs['href']
        self.reach = car_range
        self.price = price
        self.date = date
        self.not_current_flag = data.select_one('.not-current')

    def within_criteria(self):
        return self.reach and self.reach >= RANGE_LOWER_LIMIT and \
               self.price and self.price < PRICE_UPPER_LIMIT and \
               self.date and self.date < CURRENT_DATE and \
               self.not_current_flag is None

    def as_html(self):
        price_fmt = '€{:,}'.format(self.price).replace('.', '')
        return '<div style="border: 1px solid lightgrey; padding: 5px">' \
               '<a href="{}{}">{}</a>' \
               '<div><span>{} km</span><span style="float: right">{}</span></div>' \
               '</div>' \
            .format(SITE_URL, self.link, self.model, self.reach, price_fmt)


def create_body_from(cars):
    car_rows = u'\n'.join([car.as_html() for car in cars])
    return u'<p></p><div style="max-width: 400px">{}</div>'.format(car_rows)


def request_cars():
    resp = requests.get(SITE_URL, timeout=10)
    resp.raise_for_status()
    html = BeautifulSoup(resp.text, 'html.parser')
    return extract_version_from(html)


def extract_version_from(html: BeautifulSoup):
    car_data = html.select('.data-wrapper')
    return [c for c in [_Car(data) for data in car_data] if c.within_criteria()]


def run_check():
    check_file_name = sys.argv[1]
    exit_code = 0
    try:
        print('checking...')
        cars = request_cars()

        if len(cars) == 0:
            send_mail('no results', '')
            exit_code = 1
        else:
            out_file = CheckFile(check_file_name)
            stored_cars = out_file.read_entries()
            new_cars = [car for car in cars if car.model not in stored_cars]
            if len(new_cars) > 0:
                title = u'{} new entr{}'.format(len(new_cars), 'ies' if len(new_cars) > 1 else 'y')
                send_mail(title, create_body_from(new_cars))
                car_models = [car.model for car in new_cars]
                out_file.write_entries(car_models)
        print('done')
    except Exception as ex:
        traceback.print_exc(file=sys.stderr)
        send_mail('check error', u'An error occurred:\n{}'.format(ex))
        exit_code = 2

    exit(exit_code)


run_check()
