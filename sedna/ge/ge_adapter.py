#!/usr/bin/env python

from argparse import ArgumentParser

from ge_session import GESession
from messages_extractor import MessageExtractor
from visitors_check import VisitorCheck


def main():
    args = __create_arg_parser().parse_args()
    ge_session = GESession()
    ge_session.login()

    if args.message_extractor:
        __run_message_extractor(ge_session, args.message_extractor)
    if args.visitor_check:
        __run_visitor_check(ge_session)

    ge_session.logout()


def __create_arg_parser():
    p = ArgumentParser(description='Run checks/updates against GE.')
    p.add_argument('-m', '--message-extractor', help='User ID for message extractor')
    p.add_argument('-v', '--visitor-check', action='store_true', help='Visitors check')
    return p


def __run_visitor_check(ge_session):
    check = VisitorCheck(ge_session)
    check.append_new_visitors()
    check.save_profile_pictures()


def __run_message_extractor(ge_session, user_id):
    me = MessageExtractor(ge_session)
    me.print_messages(user_id)


if __name__ == "__main__":
    main()
