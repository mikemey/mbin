#!/usr/local/bin/python
import sys
import traceback

from bs4 import BeautifulSoup

from check_utils import request_version, send_mail, CheckFile

url = 'https://shop.sksturm.at/sturm-graz-shop/heimspiele.htm'
find_text = "Latest release: "


def request_tickets():
    return request_version(url, extract_tickets_from)


def extract_tickets_from(html: BeautifulSoup):
    ticket_data = html.select('.SmallerGrad2')
    return [data.text for data in ticket_data]


def __send_mail(title, body):
    send_mail("Tickets", url, title, body, True)


def create_body_from(tickets):
    cleanup = map(lambda t: '- ' + t.replace('SK Puntigamer ', ''), tickets)
    return "\n".join(cleanup)


def run_check():
    check_file_name = sys.argv[1]
    exit_code = 0
    try:
        print('checking...')
        tickets = request_tickets()

        if len(tickets) == 0:
            __send_mail('no results', '')
            exit_code = 1
        else:
            out_file = CheckFile(check_file_name)
            stored_tickets = out_file.read_entries()
            new_tickets = [t for t in tickets if t not in stored_tickets]
            if len(new_tickets) > 0:
                __send_mail('New tickets', create_body_from(new_tickets))
                out_file.write_entries(new_tickets)
        print('done')
    except Exception as ex:
        traceback.print_exc(file=sys.stderr)
        __send_mail('check error', u'An error occurred:\n{}'.format(ex))
        exit_code = 2

    exit(exit_code)


run_check()
