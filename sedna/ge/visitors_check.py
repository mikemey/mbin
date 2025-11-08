import os
from datetime import datetime

import requests
from bs4 import BeautifulSoup

from ge_session import GESession, get_profile_link
from ge_statics import VISITORS_FILE, VISITORS_IMAGE_FOLDER


class Visitor:
    def __init__(self, user_id):
        self.user_id = user_id

    @staticmethod
    def from_line(line):
        _, user_id, _ = line.split(",")
        return Visitor(user_id)

    def to_line(self, timestamp):
        profile_link = get_profile_link(self.user_id)
        return f"{timestamp},{self.user_id},{profile_link}"

    def __eq__(self, other):
        return self.user_id == other.user_id


class VisitorCheck:
    def __init__(self, ge_session: GESession):
        self.ge_session = ge_session
        self.visitors = self.__extract_visitors()

    def __extract_visitors(self):
        html = self.ge_session.fetch_index()
        soup = BeautifulSoup(html, "html.parser")
        visitors_div = soup.find("div", class_="visitors")

        if not visitors_div:
            raise ValueError("no visitors div found")

        visitors = []
        for img_tag in visitors_div.select(".userimage img"):
            if "data-src" in img_tag.attrs:
                img_url = img_tag["data-src"]
                user_id = img_url.split("/")[-2]
                visitors.append(Visitor(user_id))

        return visitors

    def append_new_visitors(self):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

        export_visitors = list(reversed(self.__find_new_visitors()))

        if export_visitors:
            print(f"=============> {len(export_visitors)} new visitors found")
            with open(VISITORS_FILE, "a", encoding="utf-8") as file:
                for visitor in export_visitors:
                    file.write(f"{visitor.to_line(timestamp)}\n")
        else:
            print("No new visitors found")

    def __find_new_visitors(self):
        latest = self.__load_latest_visitor()

        if latest and latest in self.visitors:
            ix = self.visitors.index(latest)
            return self.visitors[:ix]
        return self.visitors

    def __load_latest_visitor(self):
        if not os.path.exists(VISITORS_FILE):
            return []

        with open(VISITORS_FILE, "r", encoding="utf-8") as file:
            for line in file:
                pass
            last_line = line
        return Visitor.from_line(last_line)

    def save_profile_pictures(self):
        os.makedirs(VISITORS_IMAGE_FOLDER, exist_ok=True)

        for visitor in self.visitors:
            img_path = os.path.join(VISITORS_IMAGE_FOLDER, f"{visitor.user_id}.jpg")
            if not os.path.exists(img_path):
                img_url = self.__find_image_url(visitor)
                response = requests.get(img_url, stream=True)
                if response.status_code == 200:
                    with open(img_path, "wb") as img_file:
                        for chunk in response.iter_content(1024):
                            img_file.write(chunk)

    def __find_image_url(self, visitor):
        print(f"new user-id: {visitor.user_id}")
        html = self.ge_session.fetch_profile(visitor.user_id)
        soup = BeautifulSoup(html, "html.parser")

        user_image = soup.select_one(".user-info-box img")
        if "data-src" in user_image.attrs:
            return user_image["data-src"]

        raise ValueError("data-src not found in: " + str(user_image))
