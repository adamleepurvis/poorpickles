"""
Fetch ownership history for dynasty leagues (LXG + SouthOssetian).
Pulls draft results + all transactions for every available season.
Outputs: data/ownership_history.json

Run from dynasty-draft/: python3 data/yahoo_history_fetch.py
"""
import os, json, time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(".env")
load_dotenv("data/.yahoo_token/.env")

from yfpy.query import YahooFantasySportsQuery

OUTPUT = Path(__file__).parent / "ownership_history.json"

# All known season keys for our dynasty leagues
LEAGUES = {
    "LXG": [
        {"season": 2018, "key": "378.l.7717"},
        {"season": 2019, "key": "388.l.3135"},
        {"season": 2020, "key": "398.l.18246"},
        {"season": 2021, "key": "404.l.13425"},
        {"season": 2022, "key": "412.l.25661"},
        {"season": 2023, "key": "422.l.24198"},
        {"season": 2024, "key": "431.l.20378"},
        {"season": 2025, "key": "458.l.15578"},
        {"season": 2026, "key": "469.l.51744"},
    ],
    "SouthOssetian": [
        {"season": 2025, "key": "458.l.135575"},
        {"season": 2026, "key": "469.l.40214"},
    ],
}


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


def fetch_teams(session, league_key):
    """Return {team_key: team_name} map."""
    url = f"https://fantasysports.yahooapis.com/fantasy/v2/league/{league_key}/teams?format=json"
    data = session.get(url).json()
    teams = {}
    try:
        raw = data["fantasy_content"]["league"][1]["teams"]
        for i in range(raw["count"]):
            t = raw[str(i)]["team"][0]
            key = next(v["team_key"] for v in t if isinstance(v, dict) and "team_key" in v)
            name = next(v["name"] for v in t if isinstance(v, dict) and "name" in v)
            teams[key] = name
    except Exception as e:
        print(f"    WARNING: teams parse error: {e}")
    return teams


def fetch_draft(session, league_key):
    """Return list of {player_name, team_key, round, pick}."""
    url = f"https://fantasysports.yahooapis.com/fantasy/v2/league/{league_key}/draftresults?format=json"
    data = session.get(url).json()
    picks = []
    try:
        raw = data["fantasy_content"]["league"][1]["draft_results"]
        for i in range(raw["count"]):
            p = raw[str(i)]["draft_result"]
            picks.append({
                "round": p.get("round"),
                "pick":  p.get("pick"),
                "team_key":   p.get("team_key"),
                "player_key": p.get("player_key"),
            })
    except Exception as e:
        print(f"    WARNING: draft parse error: {e}")
    return picks


def resolve_player_keys(session, keys):
    """Batch-resolve player keys → names. Yahoo allows up to 25 per request."""
    result = {}
    for i in range(0, len(keys), 25):
        batch = keys[i:i+25]
        keys_str = ",".join(batch)
        url = f"https://fantasysports.yahooapis.com/fantasy/v2/players;player_keys={keys_str}?format=json"
        data = session.get(url).json()
        try:
            raw = data["fantasy_content"]["players"]
            for j in range(raw["count"]):
                p = raw[str(j)]["player"][0]
                pkey = next(v["player_key"] for v in p if isinstance(v, dict) and "player_key" in v)
                name = next(
                    (v["full"] for v in p if isinstance(v, dict) and "full" in v),
                    None
                )
                if not name:
                    for v in p:
                        if isinstance(v, dict) and "name" in v:
                            name = v["name"].get("full")
                            break
                if pkey and name:
                    result[pkey] = name
        except Exception as e:
            print(f"    WARNING: player key resolve error: {e}")
        time.sleep(0.3)
    return result


def fetch_transactions(session, league_key):
    """
    Return list of transaction events:
    {type, timestamp, players: [{name, from_team, to_team}]}
    Types: add, drop, trade
    """
    events = []
    # Fetch in pages of 25
    start = 0
    while True:
        url = (f"https://fantasysports.yahooapis.com/fantasy/v2/league/{league_key}"
               f"/transactions;types=add,drop,trade;count=25;start={start}?format=json")
        data = session.get(url).json()
        try:
            raw = data["fantasy_content"]["league"][1]["transactions"]
            count = raw.get("count", 0)
            if count == 0:
                break
            for i in range(count):
                tx = raw[str(i)]["transaction"]
                meta = tx[0]
                tx_type = meta.get("type")
                timestamp = meta.get("timestamp")
                players_raw = tx[1].get("players", {})
                players = []
                for j in range(players_raw.get("count", 0)):
                    pd = players_raw[str(j)]["player"]
                    info = pd[0]
                    name = next(
                        (v["full"] for v in info if isinstance(v, dict) and "full" in v),
                        None
                    )
                    if not name:
                        for v in info:
                            if isinstance(v, dict) and "name" in v:
                                name = v["name"].get("full")
                                break
                    tx_data = pd[1].get("transaction_data", {})
                    if isinstance(tx_data, list):
                        tx_data = tx_data[0] if tx_data else {}
                    players.append({
                        "name":      name,
                        "type":      tx_data.get("type"),
                        "from_team": tx_data.get("source_team_key"),
                        "to_team":   tx_data.get("destination_team_key"),
                    })
                events.append({
                    "type":      tx_type,
                    "timestamp": timestamp,
                    "players":   players,
                })
            if count < 25:
                break
            start += 25
            time.sleep(0.3)
        except Exception as e:
            print(f"    WARNING: transaction parse error at start={start}: {e}")
            break
    return events


def main():
    history = {}  # player_name → {league → [{season, team, how, timestamp}]}

    for league_name, seasons in LEAGUES.items():
        print(f"\n{'='*50}")
        print(f"League: {league_name}")

        for s in seasons:
            season = s["season"]
            key = s["key"]
            print(f"\n  {season} ({key})")

            q = make_query(key)
            session = q.oauth.session

            # Teams
            print("    Fetching teams...")
            teams = fetch_teams(session, key)
            print(f"    {len(teams)} teams: {', '.join(teams.values())}")

            # Draft
            print("    Fetching draft results...")
            draft_picks = fetch_draft(session, key)
            print(f"    {len(draft_picks)} picks")

            # Resolve player keys → names
            all_pkeys = list({p["player_key"] for p in draft_picks})
            print(f"    Resolving {len(all_pkeys)} player keys...")
            key_to_name = resolve_player_keys(session, all_pkeys)
            print(f"    Resolved {len(key_to_name)} names")

            # Build draft ownership entries
            for pick in draft_picks:
                name = key_to_name.get(pick["player_key"])
                team = teams.get(pick["team_key"], pick["team_key"])
                if not name:
                    continue
                entry = {
                    "season":    season,
                    "team":      team,
                    "how":       "drafted",
                    "round":     pick["round"],
                    "pick":      pick["pick"],
                    "timestamp": None,
                }
                history.setdefault(name, {}).setdefault(league_name, [])
                # Avoid duplicates
                existing = history[name][league_name]
                if not any(e["season"] == season and e["how"] == "drafted" for e in existing):
                    existing.append(entry)

            # Transactions
            print("    Fetching transactions...")
            txs = fetch_transactions(session, key)
            print(f"    {len(txs)} transactions")

            for tx in txs:
                tx_type = tx["type"]
                ts = tx["timestamp"]
                for p in tx["players"]:
                    name = p["name"]
                    if not name:
                        continue
                    to_team = teams.get(p["to_team"], p["to_team"])
                    from_team = teams.get(p["from_team"], p["from_team"])
                    if not to_team:
                        continue
                    how = p["type"] or tx_type  # "add", "drop", "trade"
                    entry = {
                        "season":    season,
                        "team":      to_team,
                        "from_team": from_team,
                        "how":       how,
                        "timestamp": ts,
                    }
                    history.setdefault(name, {}).setdefault(league_name, [])
                    history[name][league_name].append(entry)

            time.sleep(0.5)

    # Sort each player's entries by season + timestamp
    for name in history:
        for lg in history[name]:
            history[name][lg].sort(key=lambda e: (e["season"], int(e["timestamp"] or 0)))

    # Summary
    total_players = len(history)
    total_entries = sum(
        len(entries)
        for p in history.values()
        for entries in p.values()
    )
    print(f"\n{'='*50}")
    print(f"Done: {total_players} players, {total_entries} ownership entries")

    OUTPUT.write_text(json.dumps(history, indent=2))
    print(f"Wrote {OUTPUT}")

    # Show a sample
    sample = next((n for n in history if len(history[n].get("LXG", [])) >= 3), None)
    if sample:
        print(f"\nSample — {sample}:")
        for lg, entries in history[sample].items():
            print(f"  {lg}:")
            for e in entries:
                how = e['how']
                team = e['team']
                fr = f" (from {e.get('from_team','')})" if e.get('from_team') else ""
                print(f"    {e['season']} {how:8} → {team}{fr}")


if __name__ == "__main__":
    main()
