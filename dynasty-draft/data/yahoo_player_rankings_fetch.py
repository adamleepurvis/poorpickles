"""
Fetch end-of-season player rankings for dynasty leagues (LXG + SouthOssetian).
Uses Yahoo AR (actual rank) sort — players ordered by season-long roto performance.
This gives us "where did each player actually finish" to compare against draft position.

Outputs: league-history/public/player_rankings_history.json

Structure:
{
  "LXG": {
    "2024": { "Mike Trout": 1, "Shohei Ohtani": 2, ... }
  }
}

Run from dynasty-draft/: python3 data/yahoo_player_rankings_fetch.py
"""
import os, json, time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(".env")
load_dotenv("data/.yahoo_token/.env")

from yfpy.query import YahooFantasySportsQuery

OUTPUT = Path(__file__).parent.parent.parent / "league-history" / "public" / "player_rankings_history.json"

LEAGUES = {
    "LXG": [
        {"season": 2009, "key": "215.l.26614"},
        {"season": 2010, "key": "238.l.153606"},
        {"season": 2011, "key": "253.l.34980"},
        {"season": 2012, "key": "268.l.30899"},
        {"season": 2013, "key": "308.l.20590"},
        {"season": 2014, "key": "328.l.274"},
        {"season": 2015, "key": "346.l.81289"},
        {"season": 2016, "key": "357.l.1332"},
        {"season": 2017, "key": "370.l.22999"},
        {"season": 2018, "key": "378.l.7717"},
        {"season": 2019, "key": "388.l.3135"},
        {"season": 2020, "key": "398.l.18246"},
        {"season": 2021, "key": "404.l.13425"},
        {"season": 2022, "key": "412.l.25661"},
        {"season": 2023, "key": "422.l.24198"},
        {"season": 2024, "key": "431.l.20378"},
        {"season": 2025, "key": "458.l.15578"},
    ],
    "SouthOssetian": [
        {"season": 2025, "key": "458.l.135575"},
    ],
}

MAX_PLAYERS = 350  # covers a 12-team 29-round draft plus free agents


def make_query(league_key):
    game_id, _, league_id = league_key.partition(".l.")
    return YahooFantasySportsQuery(
        league_id=league_id,
        game_code="mlb",
        game_id=int(game_id),
        yahoo_consumer_key=os.environ["YAHOO_CONSUMER_KEY"],
        yahoo_consumer_secret=os.environ["YAHOO_CONSUMER_SECRET"],
        env_file_location=Path("data/.yahoo_token"),
        save_token_data_to_env_file=True,
    )


def parse_player_name(player_info_list):
    """Extract full name from the player info array."""
    for v in player_info_list:
        if isinstance(v, dict):
            if "name" in v and isinstance(v["name"], dict):
                return v["name"].get("full")
            if "full" in v:
                return v["full"]
    return None


def fetch_player_rankings(session, league_key, max_players=MAX_PLAYERS):
    """
    Fetch players sorted by actual season rank (AR).
    Returns {playerName: rank} where rank 1 = best performer.
    """
    rankings = {}
    rank = 1

    for start in range(0, max_players, 25):
        url = (
            f"https://fantasysports.yahooapis.com/fantasy/v2/league/{league_key}"
            f"/players;sort=AR;sort_type=season;count=25;start={start}?format=json"
        )
        data = session.get(url).json()

        try:
            raw = data["fantasy_content"]["league"][1]["players"]
            count = int(raw.get("count", 0))
            if count == 0:
                break

            for i in range(count):
                p = raw[str(i)]["player"][0]
                name = parse_player_name(p)
                if name:
                    rankings[name] = rank
                    rank += 1

            if count < 25:
                break  # last page

            time.sleep(0.3)

        except Exception as e:
            print(f"    WARNING: rankings parse error at start={start}: {e}")
            import traceback; traceback.print_exc()
            # Print raw for debugging
            try:
                print(f"    Raw keys: {list(data.get('fantasy_content', {}).keys())}")
            except Exception:
                pass
            break

    return rankings


def main():
    if OUTPUT.exists():
        results = json.loads(OUTPUT.read_text())
        print(f"Loaded existing data from {OUTPUT}")
    else:
        results = {}

    for league_name, seasons in LEAGUES.items():
        print(f"\n{'='*50}")
        print(f"League: {league_name}")
        results.setdefault(league_name, {})

        for s in seasons:
            season = s["season"]
            key = s["key"]
            season_str = str(season)

            if season_str in results[league_name]:
                existing = results[league_name][season_str]
                print(f"  {season} — already fetched ({len(existing)} players), skipping")
                continue

            print(f"\n  {season} ({key})")

            q = make_query(key)
            session = q.oauth.session

            print(f"    Fetching player rankings (up to {MAX_PLAYERS})...")
            rankings = fetch_player_rankings(session, key)
            print(f"    {len(rankings)} players ranked")

            if rankings:
                top5 = list(rankings.items())[:5]
                print(f"    Top 5: {', '.join(f'{n} (#{r})' for n, r in top5)}")

            results[league_name][season_str] = rankings
            OUTPUT.write_text(json.dumps(results, indent=2))
            print(f"    Saved.")
            time.sleep(0.5)

    total = sum(len(v) for league in results.values() for v in league.values())
    print(f"\n{'='*50}")
    print(f"Done. {total} total player-season rankings.")
    print(f"Output: {OUTPUT}")


if __name__ == "__main__":
    main()
