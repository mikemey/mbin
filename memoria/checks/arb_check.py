#!/usr/local/bin/python

import os
import sys
import traceback
from datetime import datetime
from os import path

import requests

from check_utils import CheckFile

sys.path.append(os.environ['MBIN'])
import mail_sender as mails

PRICE_UPDATE_TIME_LIMIT_SECONDS = 60

opp_url = 'https://{}/arb/api/opportunity'.format(os.environ['MSMSERVER'])
health_url = 'https://{}/arb/api/health'.format(os.environ['MSMSERVER'])
report_template_file = path.join(path.dirname(path.abspath(__file__)), 'arb_check_template.html')

captured_fname = sys.argv[1]
log_cat = 'ARB'


def request_opportunities():
    resp = requests.get(opp_url, timeout=10)
    resp.raise_for_status()
    return ['{}: {} -> {}'.format(res['cd'], res['be'], res['se']) for res in resp.json()]


def notify(msg):
    if isinstance(msg, Exception):
        print(u'error: {}'.format(msg))
        mails.send('[{}] check error'.format(log_cat), u'An error occurred:\n{}'.format(msg))
    elif msg is False:
        print('no results')
        mails.send('[{}] no results'.format(log_cat), 'notext')
    else:
        print(u'new opps: {}'.format(msg))
        mails.send('[{}] New trades'.format(log_cat), msg)


def format_date(dt):
    return dt.strftime('%Y-%m-%d %H:%M:%S')


def run_health_check():
    resp = requests.get(health_url, timeout=10)
    resp.raise_for_status()
    result = resp.json()

    expected_adapter_count = int(os.environ['MSM_ARB_ADAPTERS_COUNT'])
    expected_sandbox_count = int(os.environ['MSM_ARB_SANDBOX_COUNT'])

    messages = []
    check_adapters(result['adapters'], messages, expected_adapter_count)
    check_exchanges(result['exchanges'], messages, expected_sandbox_count)

    if len(messages):
        send_status_mail(messages)


def check_adapters(adapters, messages, expected_count):
    now_ts = datetime.now().timestamp()

    if len(adapters) != expected_count:
        messages.append('Adapter count different. Expected: {}, actual: {}'.format(expected_count, len(adapters)))

    for adapter in adapters:
        name = adapter['name']
        put = adapter['priceUpdateTime'] / 1000
        ex_status = adapter['exchangeStatus']
        bal_status = adapter['balanceStatus']

        if (now_ts - put) > PRICE_UPDATE_TIME_LIMIT_SECONDS:
            dt = format_date(datetime.fromtimestamp(put))
            messages.append('Adapter [{}] Price update fail: {}'.format(name, dt))
        if status_failed(ex_status):
            messages.append('Adapter [{}] Exchange status fail: {}'.format(name, ex_status))
        if status_failed(bal_status):
            messages.append('Adapter [{}] Balance status fail: {}'.format(name, bal_status))


def check_exchanges(exchanges, messages, expected_count):
    if len(exchanges) != expected_count:
        messages.append('Sandbox count different. Expected: {}, actual: {}'.format(expected_count, len(exchanges)))

    for exchange in exchanges:
        name = exchange['type']
        balance = exchange['balance']
        order = exchange['order']

        if status_failed(balance):
            messages.append('Sandbox [{}] Balance request fail: {}'.format(name, balance))
        if status_failed(order):
            messages.append('Sandbox [{}] Order request fail: {}'.format(name, order))


def status_failed(status):
    return status != 'ok'


def send_status_mail(messages):
    print('status error(s): ' + '. '.join(messages))
    error_messages = '<br>'.join(messages)
    report_date = format_date(datetime.now())

    with open(report_template_file, 'r', encoding='utf-8') as report_file:
        report_template = report_file.read()

        report = report_template.format(
            error_messages,
            report_date
        )
        mails.send('[{}] status report'.format(log_cat), report, True)


exit_code = 0
try:
    print('checking...')
    out_file = CheckFile(captured_fname)
    run_health_check()
    opportunities = request_opportunities()
    captured_opps = out_file.read_entries()

    new_opps = [ep for ep in opportunities if ep not in captured_opps]
    if len(new_opps) > 0:
        notify('\n'.join([opp for opp in new_opps]))
        out_file.write_entries(new_opps)

    print('done')
except Exception as ex:
    traceback.print_exc(file=sys.stderr)
    notify(ex)
    exit_code = 10

exit(exit_code)
