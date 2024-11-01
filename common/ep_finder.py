#!/usr/bin/env python3

from argparse import ArgumentParser

import requests


def query_url(series_name):
    return f'https://api.tvmaze.com/search/shows?q={series_name}'


def episodes_url(series_id):
    return f'https://api.tvmaze.com/shows/{series_id}/episodes'


escape_characters = ["'"]


def create_arg_parser():
    p = ArgumentParser(description='Search episode-id from name or episodes from episode-id.')
    group = p.add_mutually_exclusive_group(required=True)
    group.add_argument('-n', '--name', help='search episode-id by NAME')
    group.add_argument('-i', '--id', type=int, help='search episodes by ID')
    p.add_argument('-d', '--dot', action='store_true',
                   help='replace spaces with dots in output and escapes special characters')
    return p


def query_episode_id(series_name):
    query_result = __get_json_response(query_url(series_name))

    print(' Score \t  Id \t  Name')
    print('------------------------------------')
    for res in query_result[:5]:
        show = res['show']
        print('{} \t {} \t {}'.format(int(res['score']), show['id'], show['name']))


class Episode:
    def __init__(self, season, episode, name):
        self.season = season
        self.episode = episode
        self.name = name


def query_episodes(id, replace_chars=True):
    episodes = __get_episodes(id)

    curr_season = 'xx'
    for ep in episodes:
        if not ep.season == curr_season:
            print('------ Season', ep.season, '---------')
            curr_season = ep.season

        ep_name = __clear_name(ep, replace_chars)
        print(f'S{ep.season:02}E{ep.episode:02}: "{ep_name}"')


def __get_episodes(id):
    result = __get_json_response(episodes_url(id))

    episodes = [Episode(ep['season'], ep['number'], ep['name']) for ep in result]
    return sorted(episodes, key=lambda ep: (ep.season, ep.episode))


def __clear_name(episode, replace_chars):
    ep_name = episode.name
    if replace_chars:
        for c in escape_characters:
            ep_name = ep_name.replace(c, f'\\{c}')

        ep_name = ep_name.replace(' ', '.')

    return ep_name


def __get_json_response(url):
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    return resp.json()


if __name__ == '__main__':
    parser = create_arg_parser()
    args = parser.parse_args()

    if args.id:
        query_episodes(args.id, args.dot)
    else:
        query_episode_id(args.name)
