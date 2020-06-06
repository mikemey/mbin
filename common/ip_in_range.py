#!/usr/bin/env python3
from ipaddress import ip_address
from os import path

import sys

range_file = path.join(path.dirname(__file__), 'ip_ranges', 'ip-ranges-at.txt')


class IpRanges:
    def __init__(self):
        self.ip_ranges = []
        with open(range_file) as fin:
            for line in fin.readlines():
                from_ip, to_ip = line.strip().split(',')
                self.ip_ranges.append((ip_address(from_ip), ip_address(to_ip)))

    def find_range(self, raw_ip):
        ip = ip_address(raw_ip)
        for (from_ip, to_ip) in self.ip_ranges:
            if from_ip <= ip <= to_ip:
                return from_ip, to_ip
        return None


search_ip = sys.argv[1]
ip_ranges = IpRanges()

found_range = ip_ranges.find_range(search_ip)
if found_range:
    print(search_ip, 'found in range:', found_range[0], '->', found_range[1])
else:
    print('{} not found'.format(search_ip))
