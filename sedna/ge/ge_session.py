import requests

from ge_statics import BASE_URL, GE_EMAIL, GE_PASSWORD


class GESession:
    def __init__(self):
        self.__session = None
        self.__logged_in = False

    @property
    def session(self):
        if self.__session is None:
            self.__session = requests.Session()
        return self.__session

    def login(self):
        response = self.session.post(
            f"{BASE_URL}/login?-1.0-login-form-login~submit",
            headers={
                "Accept": "application/xml, text/xml, */*; q=0.01",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            },
            data={
                "login-email": GE_EMAIL,
                "login-password": GE_PASSWORD,
                "login-submit": "1",
            },
        )

        if response.status_code == 200:
            self.__logged_in = True
        else:
            raise ValueError("login failed: " + str(response.text))

    def fetch_index(self):
        return self.__fetch(f"{BASE_URL}/index")

    def fetch_all_inboxes(self):
        return self.__fetch(f"{BASE_URL}/messaging/inbox")

    def fetch_inbox(self, inbox_id):
        return self.__fetch(f"{BASE_URL}/messaging/inbox/{inbox_id}")

    def logout(self):
        if not self.__logged_in:
            return

        response = self.session.get(
            f"{BASE_URL}/index?2-1.0-topBar-user-content-logout-link~logout"
        )

        if response.status_code != 200:
            raise ValueError("logout failed: " + str(response.text))

        self.session.cookies.clear()
        self.session.close()
        self.__logged_in = False
        self.__session = None

    def fetch_profile(self, user_id):
        return self.__fetch(get_profile_link(user_id))

    def __fetch(self, url):
        response = self.session.get(url)
        if response.status_code != 200:
            raise ValueError("response was not good: " + str(response.status_code))
        return response.text


def get_profile_link(user_id):
    return f"{BASE_URL}/u/{user_id}"
