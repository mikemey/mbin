#!/usr/bin/env python3

import sys
import traceback

import requests

nordvpn_server_url = 'https://nordvpn.com/wp-admin/admin-ajax.php?action=servers_recommendations&filters={"%"22servers_groups"%"22:[15]}'
KW_IP = 'station'
KW_HOST = 'hostname'
KW_LOAD = 'load'


def request_server():
    resp = requests.get(nordvpn_server_url, timeout=10)
    resp.raise_for_status()
    return map(lambda server_details: {
        KW_IP: server_details[KW_IP],
        KW_HOST: server_details[KW_HOST],
        KW_LOAD: server_details[KW_LOAD]
    }, resp.json())


def print_server_urls():
    exit_code = 0
    try:
        servers = request_server()
        for server in servers:
            print('IP: {} \t Host: {} \t load: {}'.format(server[KW_IP], server[KW_HOST], server[KW_LOAD]))
        print('done')
    except Exception as ex:
        traceback.print_exc(file=sys.stderr)
        exit_code = 10
    exit(exit_code)


print_server_urls()
