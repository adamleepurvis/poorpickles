"""
Quick test: discover all MLB fantasy leagues this Yahoo account has been in.
Run from dynasty-draft/: python3 data/yahoo_history_test.py
"""
import os, json, requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(".env")
load_dotenv("data/.yahoo_token/.env")

# Reuse the saved OAuth token from yfpy
from yfpy.query import YahooFantasySportsQuery
q = YahooFantasySportsQuery(
    league_id="51744", game_code="mlb", game_id=469,
    yahoo_consumer_key=os.environ["YAHOO_CONSUMER_KEY"],
    yahoo_consumer_secret=os.environ["YAHOO_CONSUMER_SECRET"],
    env_file_location=Path("data/.yahoo_token"),
    save_token_data_to_env_file=True,
)
# Force token init
session = q.oauth.session

url = "https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_codes=mlb/leagues?format=json"
resp = session.get(url)
data = resp.json()

# Parse out leagues
try:
    users = data["fantasy_content"]["users"]
    user = users["0"]["user"][1]["games"]
    print(f"Found {user['count']} MLB seasons:\n")
    for i in range(user["count"]):
        game = user[str(i)]["game"]
        game_info = game[0]
        season = game_info.get("season")
        game_id = game_info.get("game_id")
        leagues_data = game[1].get("leagues", {})
        league_count = leagues_data.get("count", 0)
        print(f"  {season} (game_id={game_id}) — {league_count} league(s)")
        for j in range(league_count):
            lg = leagues_data[str(j)]["league"][0]
            print(f"    └ {lg.get('name')}  key={lg.get('league_key')}  teams={lg.get('num_teams')}")
except Exception as e:
    print("Parse error:", e)
    print("Raw response:")
    print(json.dumps(data, indent=2)[:3000])
