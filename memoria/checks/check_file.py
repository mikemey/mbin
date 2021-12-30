import os
import sys
import traceback

sys.path.append(os.environ['MBIN'])
import mail_sender as mails


class CheckFile:
    def __init__(self, file_name):
        self.file = file_name

    def write_entry(self, new_entry):
        self.write_entries({new_entry})

    def write_entries(self, new_entries):
        with open(self.file, 'a', encoding='utf-8') as f:
            for entry in new_entries:
                f.write(u'{}\n'.format(entry))

    def read_entries(self):
        file_mode = 'r' if os.path.exists(self.file) else 'a+'
        with open(self.file, file_mode, encoding='utf-8') as fin:
            return [line.strip() for line in fin.readlines()]


def run_generic_check(qualifier, url, request_version):
    check_file_name = sys.argv[1]
    exit_code = 0

    def send_mail(title, body):
        print(title)
        mails.send(u'[{}] {}'.format(qualifier, title), u'URL: {}\n{}'.format(url, body))

    try:
        print('checking...')
        version = request_version()

        if version is None:
            send_mail('no results', '')
            exit_code = 1
        else:
            out_file = CheckFile(check_file_name)
            if version not in out_file.read_entries():
                send_mail(u'new version: {}'.format(version), '')
                out_file.write_entry(version)
        print('done')
    except Exception as ex:
        traceback.print_exc(file=sys.stderr)
        send_mail('check error', u'An error occurred:\n{}'.format(ex))
        exit_code = 2

    exit(exit_code)
