import os


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
