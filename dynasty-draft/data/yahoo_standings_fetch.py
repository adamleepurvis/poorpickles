"""
Fetch standings + weekly scoreboard results for dynasty leagues (LXG + SouthOssetian).
Outputs: league-history/public/results_history.json

Structure:
{
  "LXG": {
    "2009": {
      "standings": [
        {"team": "TeamName", "rank": 1, "wins": 10, "losses": 3, "ties": 0,
         "points_for": 65.5, "points_against": 48.0}
      ],
      "matchups": [
        {"week": 1, "home": "TeamA", "away": "TeamB",
         "home_score": 6, "away_score": 3}
      ]
    }
  }
}

Run from dynasty-draft/: python3 data/yahoo_standings_fetch.py
"""
import os, json, time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(".env")
load_dotenv("data/.yahoo_token/.env")

from yfpy.query import YahooFantasySportsQuery

OUTPUT = Path(__file__).parent.parent.parent / "league-history" / "public" / "results_history.json"

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


def fetch_league_info(session, league_key):
    """Return {start_week, end_week, current_week, num_teams}."""
    url = f"https://fantasysports.yahooapis.com/fantasy/v2/league/{league_key}?format=json"
    data = session.get(url).json()
    try:
        info = data["fantasy_content"]["league"][0]
        return {
            "start_week": int(info.get("start_week", 1)),
            "end_week":   int(info.get("end_week", 24)),
            "current_week": int(info.get("current_week", info.get("end_week", 24))),
            "num_teams":  int(info.get("num_teams", 12)),
        }
    except Exception as e:
        print(f"    WARNING: league info parse error: {e}")
        return {"start_week": 1, "end_week": 24, "current_week": 24, "num_teams": 12}


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


def fetch_standings(session, league_key, teams):
    """Return list of {team, rank, wins, losses, ties}."""
    url = f"https://fantasysports.yahooapis.com/fantasy/v2/league/{league_key}/standings?format=json"
    data = session.get(url).json()
    standings = []
    try:
        raw = data["fantasy_content"]["league"][1]["standings"][0]["teams"]
        for i in range(raw["count"]):
            team_data = raw[str(i)]["team"]
            info = team_data[0]
            team_key = next(v["team_key"] for v in info if isinstance(v, dict) and "team_key" in v)
            team_name = teams.get(team_key, team_key)
            # team_standings is at index 2
            ts = team_data[2].get("team_standings", {}) if len(team_data) > 2 else {}
            outcome = ts.get("outcome_totals", {})
            standings.append({
                "team":   team_name,
                "rank":   int(ts.get("rank", 0)),
                "wins":   int(outcome.get("wins", 0)),
                "losses": int(outcome.get("losses", 0)),
                "ties":   int(outcome.get("ties", 0)),
            })
    except Exception as e:
        print(f"    WARNING: standings parse error: {e}")
    standings.sort(key=lambda s: s["rank"])
    return standings


def fetch_scoreboard_week(session, league_key, week, teams):
    """Return list of matchup dicts for a given week."""
    url = (f"https://fantasysports.yahooapis.com/fantasy/v2/league/{league_key}"
           f"/scoreboard;week={week}?format=json")
    data = session.get(url).json()
    matchups = []
    try:
        raw = data["fantasy_content"]["league"][1]["scoreboard"]["0"]["matchups"]
        count = int(raw.get("count", 0))
        for i in range(count):
            m = raw[str(i)]["matchup"]
            m_teams = m["0"]["teams"]
            winner_key = m.get("winner_team_key", "")
            pair = []
            for j in range(2):
                t = m_teams[str(j)]["team"]
                tinfo = t[0]
                tkey = next(v["team_key"] for v in tinfo if isinstance(v, dict) and "team_key" in v)
                tname = teams.get(tkey, tkey)
                tpoints = t[1].get("team_points", {}) if len(t) > 1 else {}
                score = float(tpoints.get("total", 0))
                pair.append({"team": tname, "team_key": tkey, "score": score})
            if len(pair) == 2:
                # stat_winners: list of {stat_winner: {stat_id, winner_team_key}}
                stat_winners = {}
                for sw in m.get("stat_winners", []):
                    s = sw.get("stat_winner", {})
                    sid = s.get("stat_id")
                    wkey = s.get("winner_team_key")
                    if sid and wkey:
                        stat_winners[sid] = teams.get(wkey, wkey)
                matchups.append({
                    "week":       week,
                    "home":       pair[0]["team"],
                    "away":       pair[1]["team"],
                    "home_score": pair[0]["score"],
                    "away_score": pair[1]["score"],
                    "winner":     teams.get(winner_key, winner_key),
                    "stat_winners": stat_winners,
                })
    except Exception as e:
        print(f"    WARNING: scoreboard week {week} parse error: {e}")
    return matchups


def main():
    # Load existing data so we can resume / skip completed seasons
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

            # Skip if already fetched (allows resuming)
            if season_str in results[league_name]:
                print(f"  {season} — already fetched, skipping")
                continue

            print(f"\n  {season} ({key})")

            q = make_query(key)
            session = q.oauth.session

            print("    Fetching league info...")
            info = fetch_league_info(session, key)
            end_week = min(info["current_week"], info["end_week"])
            print(f"    Weeks {info['start_week']}–{end_week}, {info['num_teams']} teams")

            print("    Fetching teams...")
            teams = fetch_teams(session, key)
            print(f"    {len(teams)} teams")

            print("    Fetching standings...")
            standings = fetch_standings(session, key, teams)
            print(f"    {len(standings)} entries")
            if standings:
                champ = standings[0]
                print(f"    Champion: {champ['team']} ({champ['wins']}-{champ['losses']})")

            print(f"    Fetching scoreboard weeks {info['start_week']}–{end_week}...")
            all_matchups = []
            for week in range(info["start_week"], end_week + 1):
                week_matchups = fetch_scoreboard_week(session, key, week, teams)
                all_matchups.extend(week_matchups)
                time.sleep(0.3)
            print(f"    {len(all_matchups)} matchups")

            results[league_name][season_str] = {
                "standings": standings,
                "matchups":  all_matchups,
            }

            # Save after each season in case of interruption
            OUTPUT.write_text(json.dumps(results, indent=2))
            print(f"    Saved.")
            time.sleep(0.5)

    # Final summary
    total_seasons = sum(len(v) for v in results.values())
    total_matchups = sum(
        len(season["matchups"])
        for league in results.values()
        for season in league.values()
    )
    print(f"\n{'='*50}")
    print(f"Done: {total_seasons} seasons, {total_matchups} matchups")
    print(f"Output: {OUTPUT}")


if __name__ == "__main__":
    main()
