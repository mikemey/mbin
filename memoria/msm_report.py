#!/usr/local/bin/python
import os
from datetime import datetime

import mail_sender as mails
import requests
from dateutil import parser
from tzlocal import get_localzone

wr_murl = 'https://{}/workout-records/api/metadata'.format(os.environ['MSMSERVER'])
tantalus_murl = 'https://{}/api/metadata/schedule'.format(os.environ['MSMSERVER'])
log_dir = os.environ['LOGDIR']

FILE_KEY = 'file'
NAME_KEY = 'name'
checks = [
    {FILE_KEY: log_dir + '/coinfloor/oo.count', NAME_KEY: 'Coinfloor'},
    {FILE_KEY: log_dir + '/monero/check.log', NAME_KEY: 'Monero'},
    {FILE_KEY: log_dir + '/tantalus/is_online.log', NAME_KEY: 'Tantalus online'},
    {FILE_KEY: log_dir + '/tantalus/scheduler.check.log', NAME_KEY: 'Tantalus scheduler'},
    {FILE_KEY: log_dir + '/vfuet/check.log', NAME_KEY: 'VFueT'},
    {FILE_KEY: log_dir + '/workout-records/is_online.log', NAME_KEY: 'Workout records'}
]

report_template_file = os.path.dirname(os.path.abspath(__file__)) + '/msm_report_template.html'
check_log_template = '{}: <small class="pull_right">{}</small><br />\n'
check_log_yesterday_template = '<span class="not_today">{}: <small class="pull_right">{}</small></span><br />\n'


def format_date(dt):
    return dt.strftime("%-I:%M %p  %Y-%m-%d")


def get_metadata(url):
    resp = requests.get(url)
    resp.raise_for_status()
    return resp.json()


def get_check_logs():
    result_log = ''
    for check in checks:
        mod_date = datetime.fromtimestamp(os.path.getmtime(check[FILE_KEY]))
        template = check_log_template \
            if mod_date.date() == datetime.today().date() \
            else check_log_yesterday_template
        result_log += template.format(check[NAME_KEY], format_date(mod_date))
    return result_log


try:
    print('checking...')
    wr_metadata = get_metadata(wr_murl)
    tantalus_metadata = get_metadata(tantalus_murl)
    check_logs = get_check_logs()

    print('sending report...')
    with open(report_template_file, 'r') as report_file:
        report_template = report_file.read()
        report_date = format_date(datetime.now())

        wr_req_size = wr_metadata['requestLogSize'] / 1024
        wr_congrats_count = wr_metadata['congratsMessages']
        schedule_date = parser.parse(tantalus_metadata['created']).astimezone(get_localzone())
        report = report_template.format(
            check_logs,
            format_date(schedule_date),
            tantalus_metadata['ticker']['count'], tantalus_metadata['graphs']['count'],
            wr_req_size, wr_congrats_count,
            report_date
        )
        mails.send('[msm-itc] Service report', report, True)
    print('done')
except Exception as ex:
    print('error: {}'.format(ex))
    mails.send('[MSM report] Server check error', 'An error occurred:\n{}'.format(ex))
