#!/usr/local/bin/python
import os
import requests
from datetime import datetime
from dateutil import parser
import mail_sender as mails

wr_murl = 'https://{}/workout-records/api/metadata'.format(os.environ['MSMSERVER'])
tantalus_murl = 'https://{}/api/metadata/schedule'.format(os.environ['MSMSERVER'])

report_template_file = os.path.dirname(os.path.abspath(__file__)) + '/msm_report_template.html'


def format_date(dt):
    return dt.strftime("%Y-%m-%d %H:%M GMT")


def notify(tantalus_meta, wr_meta):
    print('sending report...')
    with open(report_template_file, 'r') as report_file:
        report_template = report_file.read()
        report_date = format_date(datetime.now())

        wr_req_size = round(wr_meta['requestLogSize'] / 1024, 1)
        schedule_rundate = format_date(parser.parse(tantalus_meta['created']))
        report = report_template.format(
            schedule_rundate, tantalus_meta['ticker']['count'], tantalus_meta['graphs']['count'],
            wr_req_size,
            report_date
        )
        print (report)
        mails.send('[MSM report] service report', report, True)


def get_metadata(url):
    resp = requests.get(url)
    resp.raise_for_status()
    return resp.json()


try:
    print('checking...')
    wr_metadata = get_metadata(wr_murl)
    tantalus_metadata = get_metadata(tantalus_murl)
    notify(tantalus_metadata, wr_metadata)
    print('done')
except Exception as ex:
    print('error: {}'.format(ex))
    mails.send('[MSM report] Server check error', 'An error occurred:\n{}'.format(ex))
