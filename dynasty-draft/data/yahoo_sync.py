#!/usr/bin/env python3
"""
Dynasty Draft Assistant — Yahoo Fantasy API Sync
=================================================
Pulls live league data from Yahoo Fantasy API (read-only):
  - League settings (teams, scoring categories, roster positions)
  - All teams' rosters (replaces hand-typed KEEPER_PICKS)
  - Draft results if draft is complete
  - Player ownership percentages (feeds urgency model)

Usage:
    python data/yahoo_sync.py              # full sync, writes yahoo_data.json
    python data/yahoo_sync.py --auth-only  # just test OAuth, don't pull data
    python data/yahoo_sync.py --rosters    # rosters only (fast)

Output:
    data/yahoo_data.json  — raw league snapshot used by build.py

Requirements:
    pip install yfpy

First-time setup:
    1. Go to https://developer.yahoo.com/apps/create/
    2. App Name: anything (e.g. "Draft Assistant")
    3. Redirect URI(s): oob
    4. API Permissions: Fantasy Sports (Read)
    5. Copy Client ID and Client Secret into .env (see .env.sample)
    6. Run this script — browser will open for one-time auth
    7. After that, token auto-refreshes forever
"""

import os
import json
import argparse
from pathlib import Path
from datetime import datetime

# Load .env if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv optional — can set env vars directly

try:
    from yfpy.query import YahooFantasySportsQuery
except ImportError:
    print("ERROR: yfpy not installed. Run: pip install yfpy")
    raise SystemExit(1)

# ─── CONFIG ───────────────────────────────────────────────────────────────────

# Your league key — format is GAME_ID.l.LEAGUE_ID
# Find it: log into Yahoo Fantasy Baseball → URL will show your league ID
# 2026 MLB game ID is 469 (confirmed). Full key example: "469.l.123456"
LEAGUE_KEY = os.getenv("YAHOO_LEAGUE_KEY", "469.l.YOUR_LEAGUE_ID")

# Yahoo app credentials — set in .env file (never commit these)
CONSUMER_KEY    = os.getenv("YAHOO_CONSUMER_KEY", "")
CONSUMER_SECRET = os.getenv("YAHOO_CONSUMER_SECRET", "")

# Where to save the OAuth token between runs
TOKEN_DIR = Path(__file__).parent / ".yahoo_token"

OUTPUT_FILE = Path(__file__).parent / "yahoo_data.json"

# ─── POSITION NORMALIZATION ───────────────────────────────────────────────────

# Yahoo position codes → our eligible[] format
POS_MAP = {
    "C": "C", "1B": "1B", "2B": "2B", "3B": "3B", "SS": "SS",
    "LF": "LF", "CF": "CF", "RF": "RF",
    # Generic OF only appears in leagues without LF/CF/RF distinction — skip it
    # so it doesn't clobber specific eligibility in leagues that do distinguish.
    "OF": None,
    "Util": "Util", "SP": "SP", "RP": "RP", "P": "SP",
    "DL": None, "IL": None, "NA": None,  # injury slots — skip
}

def normalize_positions(yahoo_positions):
    """Convert Yahoo eligible positions list to our format."""
    result = []
    for p in yahoo_positions:
        mapped = POS_MAP.get(str(p), None)
        if mapped and mapped not in result:
            result.append(mapped)
    return result or ["Util"]

# ─── STAT CATEGORY NORMALIZATION ─────────────────────────────────────────────

# Yahoo stat IDs → our category names
# These are the standard Yahoo MLB stat IDs
STAT_ID_MAP = {
    "7":  "R",    "8":  "H",    "12": "HR",   "13": "RBI",
    "16": "SB",   "18": "TB",   "3":  "AVG",  "54": "OBP",
    "55": "SLG",
    "28": "IP",   "53": "W",    "48": "ER",   "42": "K",
    "26": "ERA",  "27": "WHIP", "56": "K/9",  "57": "BB/9",
    "32": "SV",   "39": "HLD",  # SV+HLD → NSVH in post-processing
}

def normalize_stat_categories(yahoo_stat_categories):
    """Map Yahoo stat objects to our category names."""
    cats = []
    for stat in yahoo_stat_categories:
        stat_id = str(getattr(stat, "stat_id", "") or stat.get("stat_id", ""))
        name = STAT_ID_MAP.get(stat_id)
        if name and name not in cats:
            cats.append(name)
    # Merge SV + HLD → NSVH
    if "SV" in cats or "HLD" in cats:
        cats = [c for c in cats if c not in ("SV", "HLD")]
        cats.append("NSVH")
    return cats

# ─── MAIN SYNC ────────────────────────────────────────────────────────────────

def build_query():
    """Initialize Yahoo API query object."""
    if not CONSUMER_KEY or not CONSUMER_SECRET:
        print("\nERROR: Yahoo API credentials not set.")
        print("Create a .env file with:")
        print("  YAHOO_CONSUMER_KEY=your_key")
        print("  YAHOO_CONSUMER_SECRET=your_secret")
        print("  YAHOO_LEAGUE_KEY=458.l.your_league_id")
        print("\nSee: https://developer.yahoo.com/apps/create/")
        raise SystemExit(1)

    TOKEN_DIR.mkdir(exist_ok=True)

    return YahooFantasySportsQuery(
        league_id=LEAGUE_KEY.split(".l.")[-1],
        game_code="mlb",
        game_id=469,
        yahoo_consumer_key=CONSUMER_KEY,
        yahoo_consumer_secret=CONSUMER_SECRET,
        env_file_location=TOKEN_DIR,
        save_token_data_to_env_file=True,
    )


def sync_league_settings(query):
    """Pull league name, team count, scoring categories, roster positions."""
    print("  Fetching league settings...")
    try:
        settings = query.get_league_settings()
        meta     = query.get_league_metadata()

        # Extract stat categories
        stat_cats = []
        try:
            stat_cats = normalize_stat_categories(
                settings.stat_categories.stats if hasattr(settings, "stat_categories") else []
            )
        except Exception:
            pass  # fall back to empty, user can set manually

        return {
            "league_key":   LEAGUE_KEY,
            "league_name":  (lambda n: n.decode() if isinstance(n, bytes) else str(n))(getattr(meta, "name", "Unknown League")),
            "season":       int(getattr(meta, "season", 2026)),
            "num_teams":    int(getattr(meta, "num_teams", 12)),
            "draft_status": str(getattr(meta, "draft_status", "unknown")),
            "scoring_type": str(getattr(settings, "scoring_type", "head")),
            "stat_categories": stat_cats,
            "fetched_at":   datetime.now().isoformat(),
        }
    except Exception as e:
        print(f"  WARNING: Could not fetch settings: {e}")
        return {"league_key": LEAGUE_KEY, "error": str(e)}


def sync_rosters(query):
    """Pull all teams and their rosters."""
    print("  Fetching all team rosters...")
    teams_data = []

    try:
        teams = query.get_league_teams()
        for team in teams:
            raw_name  = getattr(team, "name", f"Team {team}")
            team_name = raw_name.decode() if isinstance(raw_name, bytes) else str(raw_name)
            team_key  = str(getattr(team, "team_key", ""))
            print(f"    {team_name}...")

            players = []
            try:
                roster = query.get_team_roster_by_week(team_key.split(".")[-1])
                for player in (roster or []):
                    name = str(getattr(player, "name", {}).get("full", "") or
                               getattr(getattr(player, "name", None), "full", str(player)))
                    pos_list = []
                    try:
                        pos_list = normalize_positions(
                            player.eligible_positions if hasattr(player, "eligible_positions") else []
                        )
                    except Exception:
                        pass

                    players.append({
                        "name":     name,
                        "eligible": pos_list,
                        "selected_position": str(
                            getattr(player, "selected_position", {}).get("position", "BN")
                            if isinstance(getattr(player, "selected_position", None), dict)
                            else getattr(getattr(player, "selected_position", None), "position", "BN")
                        ),
                        "status": str(getattr(player, "status", "") or ""),
                    })
            except Exception as e:
                print(f"      WARNING: Could not fetch roster for {team_name}: {e}")

            teams_data.append({
                "team_key":  team_key,
                "team_name": team_name,
                "players":   players,
            })

    except Exception as e:
        print(f"  WARNING: Could not fetch teams: {e}")

    return teams_data


def sync_draft_results(query):
    """Pull completed draft picks."""
    print("  Fetching draft results...")
    picks = []
    try:
        draft = query.get_league_draft_results()
        for pick in (draft or []):
            picks.append({
                "pick":       int(getattr(pick, "pick", 0)),
                "round":      int(getattr(pick, "round", 0)),
                "team_key":   str(getattr(pick, "team_key", "")),
                "player_key": str(getattr(pick, "player_key", "")),
            })
        print(f"    Got {len(picks)} picks")
    except Exception as e:
        print(f"  WARNING: Could not fetch draft results: {e}")
        print("    (This is normal if the draft hasn't happened yet)")
    return picks


def sync_ownership(query, player_keys=None):
    """Pull ownership % for players — useful for urgency scoring."""
    print("  Fetching player ownership...")
    ownership = {}
    try:
        # Get top owned players if no specific keys provided
        players = query.get_league_players(player_count_limit=200)
        for p in (players or []):
            name = str(getattr(getattr(p, "name", None), "full", ""))
            pct  = float(getattr(p, "percent_owned_value", 0) or 0)
            if name:
                ownership[name] = pct
        print(f"    Got ownership data for {len(ownership)} players")
    except Exception as e:
        print(f"  WARNING: Could not fetch ownership: {e}")
    return ownership


def sync_player_eligibility(query):
    """
    Fetch eligible positions for all draftable players via direct Yahoo REST API.
    Queries each position separately (which Yahoo supports) and merges results.
    This gives accurate LF/CF/RF eligibility that yfpy's get_league_players() can't.
    Returns dict of player_name -> [eligible positions].
    """
    # Positions Yahoo accepts as query filter
    QUERY_POSITIONS = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "SP", "RP"]
    # Eligible position codes to keep (skip utility/flex slots like CI, IF, MIF, OF)
    KEEP_POSITIONS = {"C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "SP", "RP", "Util", "P"}

    game_key = "469"
    session  = query.oauth.session
    eligibility = {}

    for pos in QUERY_POSITIONS:
        print(f"    Fetching {pos}...", end=" ", flush=True)
        count = 0
        start = 0
        page_size = 25
        while True:
            url = (
                f"https://fantasysports.yahooapis.com/fantasy/v2/"
                f"games;game_keys={game_key}/players"
                f";position={pos};status=A;count={page_size};start={start}?format=json"
            )
            try:
                resp = session.get(url)
                if resp.status_code != 200:
                    break
                data = resp.json()
                players_raw = (data.get("fantasy_content", {})
                                   .get("games", {}).get("0", {})
                                   .get("game", [{}, {}])[1]
                                   .get("players", {}))
                returned = int(players_raw.get("count", 0))
                for k, v in players_raw.items():
                    if k == "count":
                        continue
                    try:
                        player_list = v["player"][0]
                        name = next(
                            (x["name"]["full"] for x in player_list if "name" in x), None
                        )
                        if not name:
                            continue
                        elig_raw = next(
                            (x["eligible_positions"] for x in v["player"][0]
                             if "eligible_positions" in x), []
                        )
                        positions = [
                            e["position"] for e in elig_raw
                            if e.get("position") in KEEP_POSITIONS
                        ]
                        if positions:
                            if name not in eligibility:
                                eligibility[name] = []
                            for p2 in positions:
                                if p2 not in eligibility[name]:
                                    eligibility[name].append(p2)
                            count += 1
                    except Exception:
                        continue
                start += page_size
                # Stop when Yahoo returns fewer than a full page, or hit cap
                if returned < page_size or start >= 400:
                    break
            except Exception as e:
                print(f"(error: {e})")
                break
        print(f"{count} players")

    print(f"    Total: {len(eligibility)} players with eligibility data")
    return eligibility


# ─── YAHOO PROJECTED STATS ───────────────────────────────────────────────────

# Yahoo stat IDs we want for projection comparison
PROJ_STAT_IDS = {
    "7":  "R",    "8":  "H",    "12": "HR",   "13": "RBI",
    "16": "SB",   "18": "TB",   "3":  "AVG",  "54": "OBP",  "55": "SLG",
    "28": "IP",   "53": "W",    "48": "ER",   "42": "K",
    "26": "ERA",  "27": "WHIP", "56": "K/9",  "57": "BB/9",
    "32": "SV",   "39": "HLD",
}

def sync_projected_stats(query):
    """
    Fetch Yahoo projected season stats for all active players by position.
    Returns dict of player_name -> {stat_name: value, ...}
    Uses the same direct REST approach as sync_player_eligibility.
    """
    QUERY_POSITIONS = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "SP", "RP"]
    game_key = "469"
    session  = query.oauth.session
    projections = {}

    for pos in QUERY_POSITIONS:
        print(f"    Fetching projections {pos}...", end=" ", flush=True)
        count = 0
        start = 0
        page_size = 25
        while True:
            url = (
                f"https://fantasysports.yahooapis.com/fantasy/v2/"
                f"games;game_keys={game_key}/players"
                f";position={pos};status=A;count={page_size};start={start}"
                f"/stats;type=projected_season?format=json"
            )
            try:
                resp = session.get(url)
                if resp.status_code != 200:
                    break
                data = resp.json()
                players_raw = (data.get("fantasy_content", {})
                                   .get("games", {}).get("0", {})
                                   .get("game", [{}, {}])[1]
                                   .get("players", {}))
                returned = int(players_raw.get("count", 0))
                for k, v in players_raw.items():
                    if k == "count":
                        continue
                    try:
                        player_list = v["player"]
                        name = next(
                            (x["name"]["full"] for x in player_list[0] if "name" in x), None
                        )
                        if not name:
                            continue
                        # Stats are in player_list[1]
                        stats_raw = player_list[1].get("player_stats", {}).get("stats", [])
                        stats = {}
                        sv = hld = 0
                        for stat_entry in stats_raw:
                            s = stat_entry.get("stat", {})
                            sid = str(s.get("stat_id", ""))
                            val = s.get("value", "-")
                            if val in ("-", "", None):
                                continue
                            try:
                                val = float(val)
                            except (ValueError, TypeError):
                                continue
                            if sid == "32":
                                sv = val
                            elif sid == "39":
                                hld = val
                            elif sid in PROJ_STAT_IDS:
                                stats[PROJ_STAT_IDS[sid]] = round(val, 3)
                        if sv or hld:
                            stats["NSVH"] = round(sv + hld, 1)
                        if stats and name not in projections:
                            projections[name] = stats
                            count += 1
                    except Exception:
                        continue
                start += page_size
                if returned < page_size or start >= 400:
                    break
            except Exception as e:
                print(f"(error: {e})")
                break
        print(f"{count} players")

    print(f"    Total: {len(projections)} players with Yahoo projections")
    return projections


# ─── ENTRY POINT ─────────────────────────────────────────────────────────────

LEAGUE_KEYS = {
    "poor_pickles":   os.getenv("YAHOO_LEAGUE_KEY", "469.l.51744"),
    "south_ossetian": "469.l.40214",
}

def main():
    parser = argparse.ArgumentParser(description="Sync Yahoo Fantasy league data")
    parser.add_argument("--auth-only",  action="store_true", help="Test auth only")
    parser.add_argument("--rosters",    action="store_true", help="Rosters only")
    parser.add_argument("--no-draft",   action="store_true", help="Skip draft results")
    parser.add_argument("--no-ownership", action="store_true", help="Skip ownership pct")
    parser.add_argument("--league",     default="poor_pickles",
                        choices=list(LEAGUE_KEYS.keys()), help="Which league to sync")
    args = parser.parse_args()

    global LEAGUE_KEY, OUTPUT_FILE
    LEAGUE_KEY  = LEAGUE_KEYS[args.league]
    OUTPUT_FILE = Path(__file__).parent / f"yahoo_data_{args.league}.json"

    if "YOUR_LEAGUE_ID" in LEAGUE_KEY:
        print("\nERROR: Update YAHOO_LEAGUE_KEY in your .env file.")
        print("Find your league ID in the Yahoo Fantasy Baseball URL.")
        raise SystemExit(1)

    print(f"Connecting to Yahoo Fantasy API...")
    print(f"League: {LEAGUE_KEY}")
    query = build_query()
    print("Auth OK.\n")

    if args.auth_only:
        print("Auth test successful.")
        return

    data = {"generated": datetime.now().isoformat(), "league_key": LEAGUE_KEY}

    if not args.rosters:
        data["settings"] = sync_league_settings(query)

    data["teams"] = sync_rosters(query)

    if not args.no_draft:
        data["draft_results"] = sync_draft_results(query)

    if not args.no_ownership:
        data["ownership"] = sync_ownership(query)

    print("  Fetching player eligibility by position...")
    data["player_eligibility"] = sync_player_eligibility(query)

    print("  Fetching Yahoo projected stats...")
    data["yahoo_projections"] = sync_projected_stats(query)

    OUTPUT_FILE.write_text(json.dumps(data, indent=2))
    print(f"\nWrote {OUTPUT_FILE}")

    # Summary
    team_count   = len(data.get("teams", []))
    roster_count = sum(len(t["players"]) for t in data.get("teams", []))
    draft_count  = len(data.get("draft_results", []))
    print(f"  {team_count} teams, {roster_count} roster spots, {draft_count} draft picks")
    print("\nDone. Run `python data/build.py` to generate targets.json.")


if __name__ == "__main__":
    main()
