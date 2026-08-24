#!/usr/local/bin/python
from os import environ, path, listdir
import re
import sys
import traceback
from datetime import datetime, timedelta

import mail_sender as mails
import requests
from dateutil import parser
from tzlocal import get_localzone

wr_murl = 'https://{}/workout-records/api/metadata'.format(environ['MSMSERVER'])
tantalus_murl = 'https://{}/api/metadata/schedule'.format(environ['MSMSERVER'])
log_dir = environ['LOGDIR']
db_backup_dir = environ['BAKDIR']

FILE_KEY = 'file'
DIR_KEY = 'dir'
NAME_KEY = 'name'
checks = [
    {FILE_KEY: log_dir + '/checks/bitcoind.log', NAME_KEY: 'Bitcoin'},
    {FILE_KEY: log_dir + '/checks/monero.log', NAME_KEY: 'Monero'},
    {FILE_KEY: log_dir + '/tantalus/is_online.log', NAME_KEY: 'Tantalus online'},
    {FILE_KEY: log_dir + '/tantalus/scheduler.check.log', NAME_KEY: 'Tantalus scheduler'},
    {FILE_KEY: log_dir + '/workout-records/is_online.log', NAME_KEY: 'Workout records'},
    {FILE_KEY: log_dir + '/restart_setup.log', NAME_KEY: 'Qnap'}
]
db_backup_checks = [
    {DIR_KEY: db_backup_dir + '/tantalus', NAME_KEY: 'Tantalus'},
    {DIR_KEY: db_backup_dir + '/workout-records', NAME_KEY: 'Workout records'}
]
db_backup_size_threshold = 20000

report_template_file = path.dirname(path.abspath(__file__)) + '/msm_report_template.html'
date_line_template = '<span class="{}">{}: <small class="pull_right">{}</small></span><br />\n'
today_class = ''
not_today_class = 'not_today'

backup_sync_log = log_dir + '/backup_sync.log'


def format_date(dt):
    return dt.strftime("%-I:%M %p  %Y-%m-%d")


def format_date_line(title, dt, error=False):
    date_indicator = today_class if within_a_day(dt) and not error else not_today_class
    return date_line_template.format(date_indicator, title, format_date(dt))


def within_a_day(dt):
    return datetime.now() - dt.replace(tzinfo=None) < timedelta(days=1)


def get_metadata(url):
    resp = requests.get(url)
    resp.raise_for_status()
    return resp.json()


def get_check_logs():
    result_log = ''
    for check in checks:
        mod_date = datetime.fromtimestamp(path.getmtime(check[FILE_KEY]))
        result_log += format_date_line(check[NAME_KEY], mod_date)
    return result_log


def get_backup_dates():
    result_log = ''
    for db_backup in db_backup_checks:
        directory = db_backup[DIR_KEY]
        bak_files = [
            path.join(directory, f)
            for f in listdir(directory)
            if path.isfile(path.join(directory, f))
        ]
        bak_dates = [
            path.getmtime(bf)
            for bf in bak_files
            if path.getsize(bf) > db_backup_size_threshold
        ]
        latest_date = datetime.fromtimestamp(max(bak_dates))
        result_log += format_date_line(db_backup[NAME_KEY], latest_date)
    return result_log


def get_backup_sync():
    mod_date = datetime.fromtimestamp(path.getmtime(backup_sync_log))
    exit_code = get_latest_sync_status()

    return format_date_line('QNAP backup sync', mod_date, error=exit_code != 0)


def get_latest_sync_status():
    with open(backup_sync_log, 'r', encoding='utf-8') as log_file:
        for line in reversed(log_file.readlines()):
            match = re.search(r'END sync \[(\d+)\]', line)
            if match:
                return int(match.group(1))

    raise ValueError('No END sync entry found in {}'.format(backup_sync_log))


try:
    print('checking...')
    wr_metadata = get_metadata(wr_murl)
    tantalus_metadata = get_metadata(tantalus_murl)
    check_logs = get_check_logs()
    db_backup_checks = get_backup_dates()
    backup_sync = get_backup_sync()

    wr_req_size = wr_metadata['requestLogSize'] / 1024
    wr_congrats_count = wr_metadata['congratsMessages']
    schedule_date = parser.parse(tantalus_metadata['created']).astimezone(get_localzone())
    schedule_line = format_date_line('Latest run', schedule_date)
    report_date = format_date(datetime.now())

    print('sending report...')
    with open(report_template_file, 'r', encoding='utf-8') as report_file:
        report_template = report_file.read()

        report = report_template.format(
            check_logs,
            db_backup_checks,
            backup_sync,
            schedule_line,
            tantalus_metadata['ticker']['count'], tantalus_metadata['graphs']['count'],
            wr_req_size, wr_congrats_count,
            report_date
        )
        mails.send('[msm-itc] Service report', report, True)
    print('done')
except Exception as ex:
    traceback.print_exc(file=sys.stderr)
    print('error: {}'.format(ex))
    mails.send('[MSM report] Server check error', 'An error occurred:\n{}'.format(ex))
