#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup

query_url = 'https://api.tvmaze.com/search/shows?q={}'
episodes_url = 'https://api.tvmaze.com/shows/{}/episodes'


def query_episode_id(series_name):
    url = query_url.format(series_name)
    query_resp = requests.get(url, timeout=10)
    query_resp.raise_for_status()
    query_result = query_resp.json()
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


def query_episodes(id):
    url = episodes_url.format(id)
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    result = resp.json()

    episodes = [Episode(ep['season'], ep['number'], ep['name']) for ep in result]

    sorted(episodes, key=lambda ep: (ep.season, ep.episode))

    curr_season = 'xx'
    for ep in episodes:
        if not ep.season == curr_season:
            print('------ Season', ep.season, '---------')
            curr_season = ep.season
        ep_name = BeautifulSoup(ep.name, 'html.parser').text
        print(f'S{ep.season:02}E{ep.episode:02}: "{ep_name}"')

# query_episode_id('season_name')
# query_episodes(season_id)
