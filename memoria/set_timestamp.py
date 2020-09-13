import os
import sys
import time
import datetime

fileLocation = sys.argv[1]
year = int(sys.argv[2])
month = int(sys.argv[3])
day = int(sys.argv[4])
hour = int(sys.argv[5])
minute = int(sys.argv[6])
second = int(sys.argv[7])

date = datetime.datetime(year=year, month=month, day=day, hour=hour, minute=minute, second=second)
modTime = time.mktime(date.timetuple())

print('updating:', fileLocation, 'to: ', modTime)
os.utime(fileLocation, (modTime, modTime))
