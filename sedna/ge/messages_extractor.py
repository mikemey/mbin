from datetime import datetime, timedelta

from bs4 import BeautifulSoup

from ge_session import GESession


class MessageExtractor:
    def __init__(self, ge_session: GESession):
        self.ge_session = ge_session

    def print_messages(self, user_id):
        user_id = user_id.upper()
        inbox_id = self._find_inbox_id(user_id)
        if not inbox_id:
            print(f"No inbox found for user {user_id}")
            return

        inbox_html = self.ge_session.fetch_inbox(inbox_id)
        _print_messages(inbox_html)

    def _find_inbox_id(self, user_id):
        inboxes_html = self.ge_session.fetch_all_inboxes()
        return _extract_inbox_id(inboxes_html, user_id)


def print_file_messages(file_path):
    html_file = read_html_file(file_path)
    _print_messages(html_file)


def read_html_file(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read()


def _extract_inbox_id(inboxes_html: str, user_id: str) -> str | None:
    soup = BeautifulSoup(inboxes_html, "html.parser")

    for li in soup.select("li.list-item"):
        user_anchor = li.select_one(f'a[data-user-id="{user_id}"]')
        if not user_anchor:
            continue

        inbox_anchor = __find_inbox_link(li)
        if inbox_anchor:
            return _extract_inbox_id_from_href(inbox_anchor["href"])

    return None


def __find_inbox_link(li):
    return li.select_one("a.ajax-content-link[href*='/messaging/inbox/']")


def _extract_inbox_id_from_href(href: str) -> str | None:
    parts = href.rstrip("/").split("/")
    return parts[-1] if parts else None


def _print_messages(html):
    messages = _extract_messages(html)
    for user, text, timestamp in messages:
        print(f"[{timestamp}] {user}: {text}")


def _extract_messages(inbox_html):
    soup = BeautifulSoup(inbox_html, "html.parser")
    for li in soup.select("div#messageRepeater ul.list.fs-dataview-list > li"):
        user = __extract_user(li)
        text = __extract_message_text(li)
        timestamp = __extract_timestamp(li)
        yield user, text, timestamp


def __extract_user(li):
    user_tag = li.select_one(".userimage img")
    return user_tag["title"] if user_tag else "Unknown"


def __extract_message_text(li):
    text = __find_text(li)
    quote = __find_quote(li)
    img = __find_image(li)

    if quote:
        quote_text = f"<quoted: \"{quote}\">"
        append_text = f"\n{text}" if text else ""
        text = f"{quote_text}{append_text}"

    if img:
        separator = "\n" if text else ""
        text = f"{text}{separator}{img}"
    return text


def __find_text(li):
    text_tags = li.select(".col-bubble p")

    full_text = ""
    for text_tag in text_tags:
        full_text += "\n" if full_text else ""
        cleaned_text = [s.replace("\n", "") for s in text_tag.stripped_strings]
        full_text += "\n".join(cleaned_text)
    return full_text


def __find_quote(li):
    quote_bubble = li.select_one(".col-bubble .reply-chat-box")

    if quote_bubble:
        return "\n".join(quote_bubble.stripped_strings)
    return None


def __find_image(li):
    img_div = li.select_one(".col-bubble div.fs-fancybox-captions")
    if img_div:
        return img_div["data-fs-fancy-image"]
    return None


def __extract_timestamp(li):
    time_tag = li.select_one(".time-info")
    timestamp = time_tag.get_text(strip=True) if time_tag else ""

    if "Heute" in timestamp:
        today_str = datetime.today().strftime("%d.%m.%y")
        timestamp = timestamp.replace("Heute", today_str)
    if "Gestern" in timestamp:
        yesterday = datetime.today() - timedelta(days=1)
        yesterday_str = yesterday.strftime("%d.%m.%y")
        timestamp = timestamp.replace("Gestern", yesterday_str)
    return timestamp
