import requests
import os

def parse_input(user_input: str):
    """
   convert input to id or id-range
    ex.    "313386" -> [313386]
        "313387-313380" -> [313387, 313386, ..., 313380]
    """
    if "-" in user_input:
        start, end = map(int, user_input.split("-"))
        if start >= end:
            return list(range(start, end - 1, -1))
        else:
            return list(range(start, end + 1))
    else:
        return [int(user_input)]


def download_items(ids, folder="items_dpRO"):
    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0"})
    os.makedirs(folder, exist_ok=True)

    for item_id in ids:
        url = f"https://www.divine-pride.net/img/items/item/dpRO/{item_id}"
        resp = session.get(url)
        if resp.status_code == 200:
            filepath = os.path.join(folder, f"{item_id}.png")
            with open(filepath, "wb") as f:
                f.write(resp.content)
            print(f"✔ ดาวน์โหลด {item_id} สำเร็จ -> {filepath}")
        else:
            print(f"✘ ไม่พบไฟล์: {item_id} (HTTP {resp.status_code})")


if __name__ == "__main__":
    user_input = input("give itemid or range ex. 313386 or 313387-313380: ")
    ids = parse_input(user_input)
    download_items(ids)
