#!/usr/bin/env python

from argparse import ArgumentParser

from ge_session import GESession
from messages_extractor import MessageExtractor, print_file_messages
from visitors_check import VisitorCheck


def main():
    args = __create_arg_parser().parse_args()
    ge_session = GESession()
    ge_session.login()

    if args.inbox_messages:
        __run_message_extractor_from_inbox(ge_session, args.inbox_messages)
    if args.file_messages:
        __run_message_extractor_from_file(ge_session, args.file_messages)
    if args.visitor_check:
        __run_visitor_check(ge_session)

    ge_session.logout()


def __create_arg_parser():
    p = ArgumentParser(description='Run checks/updates against GE.')
    p.add_argument('-m', '--inbox-messages', metavar='USER-ID', help='Extract messages from inbox directly')
    p.add_argument('-f', '--file-messages', metavar='FILE', help='Extract messages from file')
    p.add_argument('-v', '--visitor-check', action='store_true', help='Visitors check')
    return p


def __run_visitor_check(ge_session):
    check = VisitorCheck(ge_session)
    check.append_new_visitors()
    check.save_profile_pictures()


def __run_message_extractor_from_inbox(ge_session, user_id):
    me = MessageExtractor(ge_session)
    me.print_messages(user_id)


def __run_message_extractor_from_file(ge_session, file_path):
    print_file_messages(file_path)


if __name__ == "__main__":
    main()
