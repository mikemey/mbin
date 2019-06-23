#!/usr/local/bin/python
import os
import requests
import mail_sender as mails

wr_murl = 'https://{}/workout-records/api/metadata'.format(os.environ['MSMSERVER'])
tantalus_murl = 'https://{}/api/metadata/schedule'.format(os.environ['MSMSERVER'])

report_template_file = 'msm_report_template.html'


def notify(tantalus_meta, wr_meta):
    print('sending report...')
    with open(report_template_file, 'r') as report_file:
        wr_req_size = wr_meta['requestLogSize'] // 1024
        report_template = report_file.read()
        report = report_template.format(
            tantalus_meta['created'], tantalus_meta['ticker']['count'], tantalus_meta['graphs']['count'],
            wr_req_size
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
