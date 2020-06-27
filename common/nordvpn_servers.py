#!/usr/bin/env python3

import socket
import traceback

import requests
import sys

nordvpn_server_url = 'https://nordvpn.com/wp-admin/admin-ajax.php?action=servers_recommendations&filters={"%"22servers_groups"%"22:[15]}'
KW_IP = 'station'
KW_HOST = 'hostname'
KW_LOAD = 'load'
PORTS_LIST = [80, 1080]


def request_server():
    resp = requests.get(nordvpn_server_url, timeout=10)
    resp.raise_for_status()
    return map(lambda server_details: {
        KW_IP: server_details[KW_IP],
        KW_HOST: server_details[KW_HOST],
        KW_LOAD: server_details[KW_LOAD]
    }, resp.json())


def check_open_ports(server):
    results = ''
    for port in PORTS_LIST:
        results += f' [{port} '
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((server, port))
        sock.close()
        results += ' ok]' if result == 0 else 'T/O]'
    return results


def print_server_urls():
    exit_code = 0
    try:
        for server in request_server():
            open_ports = check_open_ports(server[KW_HOST])
            print(f'IP: {server[KW_IP]:15} Host: {server[KW_HOST]:18} - load: {server[KW_LOAD]:2} - ports:{open_ports}')
        print('done')
    except Exception:
        traceback.print_exc(file=sys.stderr)
        exit_code = 10
    exit(exit_code)


print_server_urls()
