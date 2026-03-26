"""
Look up Yahoo MLB game_id for every available season.
Run from dynasty-draft/: python3 data/yahoo_game_ids.py
"""
import os, json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(".env")
load_dotenv("data/.yahoo_token/.env")

from yfpy.query import YahooFantasySportsQuery
q = YahooFantasySportsQuery(
    league_id="51744", game_code="mlb", game_id=469,
    yahoo_consumer_key=os.environ["YAHOO_CONSUMER_KEY"],
    yahoo_consumer_secret=os.environ["YAHOO_CONSUMER_SECRET"],
    env_file_location=Path("data/.yahoo_token"),
    save_token_data_to_env_file=True,
)
session = q.oauth.session

url = "https://fantasysports.yahooapis.com/fantasy/v2/games;game_codes=mlb?format=json"
data = session.get(url).json()

try:
    games = data["fantasy_content"]["games"]
    print(f"Found {games['count']} MLB seasons:\n")
    for i in range(games["count"]):
        g = games[str(i)]["game"][0]
        print(f"  {g.get('season')}  game_id={g.get('game_id')}")
except Exception as e:
    print("Parse error:", e)
    print(json.dumps(data, indent=2)[:3000])
