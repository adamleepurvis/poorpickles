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
    "LF": "LF", "CF": "CF", "RF": "RF", "OF": "RF",  # OF → RF as fallback
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
            "league_name":  str(getattr(meta, "name", "Unknown League")),
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
            team_name = str(getattr(team, "name", f"Team {team}"))
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


# ─── ENTRY POINT ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Sync Yahoo Fantasy league data")
    parser.add_argument("--auth-only",  action="store_true", help="Test auth only")
    parser.add_argument("--rosters",    action="store_true", help="Rosters only")
    parser.add_argument("--no-draft",   action="store_true", help="Skip draft results")
    parser.add_argument("--no-ownership", action="store_true", help="Skip ownership pct")
    args = parser.parse_args()

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
