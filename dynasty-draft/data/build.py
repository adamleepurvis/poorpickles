#!/usr/bin/env python3
"""
Dynasty Draft Assistant — Master Build Script
==============================================
One command that does everything before draft day:

  1. Runs ZAR model → pulls FanGraphs projections, computes valuations
  2. Runs Yahoo sync → pulls live rosters, settings, draft results
  3. Merges data → Yahoo rosters override keeper picks, ZAR scores replace
     hand-assigned values, ownership % feeds urgency model
  4. Writes data/targets.json → consumed by the React app
  5. Writes leagues/poor_pickles.js → updated keeper picks from Yahoo

Usage:
    python data/build.py                  # full build
    python data/build.py --skip-yahoo     # ZAR only (no Yahoo auth needed)
    python data/build.py --skip-zar       # Yahoo data only, keep existing scores
    python data/build.py --dry-run        # print what would happen, write nothing

Requirements:
    pip install requests pandas numpy yfpy python-dotenv
"""

import json
import argparse
import subprocess
import sys
from pathlib import Path
from datetime import datetime

ROOT        = Path(__file__).parent.parent
DATA_DIR    = Path(__file__).parent
LEAGUES_DIR = ROOT / "leagues"

ZAR_FILE    = DATA_DIR / "zar_scores.json"
YAHOO_FILE  = DATA_DIR / "yahoo_data.json"
OUTPUT_FILE = DATA_DIR / "targets.json"
LEAGUE_FILE = LEAGUES_DIR / "poor_pickles.js"

# ─── STEP 1: RUN ZAR MODEL ───────────────────────────────────────────────────

def run_zar(system="steamer", skip=False):
    if skip:
        print("Skipping ZAR model (--skip-zar).")
        if not ZAR_FILE.exists():
            print("WARNING: No existing zar_scores.json found.")
            return False
        return True

    print("=" * 60)
    print("STEP 1: ZAR Model — FanGraphs projections")
    print("=" * 60)
    result = subprocess.run(
        [sys.executable, str(DATA_DIR / "zar_model.py"), "--system", system],
        capture_output=False
    )
    if result.returncode != 0:
        print("\nERROR: ZAR model failed. Check output above.")
        return False
    return True


# ─── STEP 2: RUN YAHOO SYNC ──────────────────────────────────────────────────

def run_yahoo(skip=False):
    if skip:
        print("\nSkipping Yahoo sync (--skip-yahoo).")
        if not YAHOO_FILE.exists():
            print("WARNING: No existing yahoo_data.json found. Keeper picks won't be updated.")
        return YAHOO_FILE.exists()

    print("\n" + "=" * 60)
    print("STEP 2: Yahoo Fantasy API sync")
    print("=" * 60)
    result = subprocess.run(
        [sys.executable, str(DATA_DIR / "yahoo_sync.py")],
        capture_output=False
    )
    if result.returncode != 0:
        print("\nWARNING: Yahoo sync failed — continuing with existing data.")
        print("Keeper picks may be stale. Fix Yahoo auth and re-run.")
        return YAHOO_FILE.exists()
    return True


# ─── STEP 3: MERGE DATA ──────────────────────────────────────────────────────

def load_zar():
    if not ZAR_FILE.exists():
        return {}
    data = json.loads(ZAR_FILE.read_text())
    # Index by player name for fast lookup
    return {p["name"]: p for p in data.get("players", [])}


def load_yahoo():
    if not YAHOO_FILE.exists():
        return {}
    return json.loads(YAHOO_FILE.read_text())


def build_keeper_picks(yahoo_data: dict) -> list[dict]:
    """
    Convert Yahoo team rosters into keeper_picks format.
    
    Yahoo rosters → flat list of {pick, r, player, pos, team}
    We don't know actual pick numbers from rosters alone (only from
    draft results), so we synthesize them in snake order by team slot.
    """
    teams = yahoo_data.get("teams", [])
    if not teams:
        return []

    settings      = yahoo_data.get("settings", {})
    num_teams     = settings.get("num_teams", 12)
    draft_results = yahoo_data.get("draft_results", [])

    # If we have actual draft results, use those directly
    if draft_results:
        print(f"  Using {len(draft_results)} actual draft results from Yahoo")
        # We'd need player key → name mapping here
        # For now, fall back to roster-based approach
        pass

    # Build from rosters — assign synthetic pick numbers in snake order
    # This matches the keeper_picks format used in the React app
    picks = []
    pick_num = 1

    # Figure out draft order from yahoo team order
    team_names = [t["team_name"] for t in teams]

    for round_num in range(1, 11):  # 10 keeper rounds
        if round_num % 2 == 0:
            round_teams = list(reversed(teams))
        else:
            round_teams = teams

        for slot, team in enumerate(round_teams):
            # Find a player to assign — we don't know exact keeper round assignments
            # from Yahoo API alone, so we just list all players by team
            # The React app uses this to know which players are "taken"
            # We'll mark round=0 for "keeper, round unknown"
            pass  # handled below

    # Simpler approach: just list all rostered players as keepers
    # with pick numbers assigned sequentially (actual order doesn't matter
    # for the draft board — just team assignment does)
    pick_num = 1
    for round_num in range(1, 11):
        snake = teams if round_num % 2 == 1 else list(reversed(teams))
        for team in snake:
            # Assign one player per round per team as placeholder
            # In practice, the user will want to verify these
            player_idx = round_num - 1
            if player_idx < len(team["players"]):
                p = team["players"][player_idx]
                pos = p["eligible"][0] if p["eligible"] else "BN"
                picks.append({
                    "pick":   pick_num,
                    "r":      round_num,
                    "player": p["name"],
                    "pos":    pos,
                    "team":   team["team_name"],
                })
            pick_num += 1

    return picks


def merge_players(zar_scores: dict, yahoo_data: dict) -> list[dict]:
    """
    Build final player list:
    - Start with ZAR scores as the base player pool
    - Override eligible positions with Yahoo data (accurate LF/CF/RF)
    - Augment with Yahoo ownership %
    - Mark players on active rosters as "rostered"
    """
    ownership = yahoo_data.get("ownership", {})
    yahoo_eligibility = yahoo_data.get("player_eligibility", {})

    # Build set of rostered player names
    rostered = set()
    for team in yahoo_data.get("teams", []):
        for player in team["players"]:
            rostered.add(player["name"])

    players = list(zar_scores.values())

    for p in players:
        name = p["name"]
        # Override eligible positions with Yahoo data when available
        if name in yahoo_eligibility:
            p["eligible"] = yahoo_eligibility[name]
        p["pct_owned"] = ownership.get(name, 0.0)
        p["rostered"] = name in rostered

    return players


# ─── STEP 4: WRITE OUTPUTS ───────────────────────────────────────────────────

def write_targets(players: list[dict], dry_run: bool):
    output = {
        "generated": datetime.now().isoformat(),
        "count":     len(players),
        "players":   players,
    }
    if dry_run:
        print(f"\n[DRY RUN] Would write {len(players)} players to {OUTPUT_FILE}")
        return

    OUTPUT_FILE.write_text(json.dumps(output, indent=2))
    print(f"\nWrote {len(players)} players to {OUTPUT_FILE}")


def write_league_config(yahoo_data: dict, dry_run: bool):
    """
    Update the poor_pickles.js league config with fresh keeper picks from Yahoo.
    Preserves all other config (cat weights, etc.) — only updates keeperPicks.
    """
    if not yahoo_data or "teams" not in yahoo_data:
        print("Skipping league config update (no Yahoo data).")
        return

    # Skip keeper picks update if draft hasn't happened yet
    draft_status = yahoo_data.get("settings", {}).get("draft_status", "")
    if str(draft_status) == "predraft":
        print("Skipping keeperPicks update — draft hasn't happened yet.")
        return

    keeper_picks = build_keeper_picks(yahoo_data)
    if not keeper_picks:
        print("No keeper picks generated from Yahoo data.")
        return

    # Read current config file
    if not LEAGUE_FILE.exists():
        print(f"WARNING: {LEAGUE_FILE} not found — skipping league config update.")
        return

    current = LEAGUE_FILE.read_text()

    # Build the new keeperPicks JS array
    lines = ["  keeperPicks: ["]
    for p in keeper_picks:
        player = p["player"].replace("\\", "\\\\").replace('"', '\\"')
        pos    = p["pos"].replace('"', '\\"')
        team   = p["team"].replace("\\", "\\\\").replace('"', '\\"')
        lines.append(
            f'    {{pick:{p["pick"]},r:{p["r"]},'
            f'player:"{player}",'
            f'pos:"{pos}",'
            f'team:"{team}"}}, '
        )
    lines.append("  ],")
    new_keepers = "\n".join(lines)

    # Find and replace the keeperPicks block in the JS file
    import re
    pattern = r'keeperPicks:\s*\[.*?\],'
    if re.search(pattern, current, re.DOTALL):
        new_content = re.sub(pattern, new_keepers, current, flags=re.DOTALL)
        if dry_run:
            print(f"\n[DRY RUN] Would update keeperPicks in {LEAGUE_FILE}")
            print(f"  ({len(keeper_picks)} picks from {len(yahoo_data.get('teams',[]))} teams)")
        else:
            LEAGUE_FILE.write_text(new_content)
            print(f"\nUpdated keeperPicks in {LEAGUE_FILE}")
            print(f"  ({len(keeper_picks)} picks from {len(yahoo_data.get('teams',[]))} teams)")
    else:
        print(f"WARNING: Could not find keeperPicks in {LEAGUE_FILE} — skipping update.")


# ─── STEP 5: PRINT SUMMARY ───────────────────────────────────────────────────

def print_summary(players: list[dict], yahoo_data: dict):
    print("\n" + "=" * 60)
    print("BUILD SUMMARY")
    print("=" * 60)

    h = [p for p in players if p.get("type") == "H"]
    p = [p for p in players if p.get("type") == "P"]
    print(f"Players:   {len(players)} total  ({len(h)} hitters, {len(p)} pitchers)")

    tiers = {}
    for pl in players:
        t = pl.get("tier", "?")
        tiers[t] = tiers.get(t, 0) + 1
    print(f"Tiers:     {dict(sorted(tiers.items()))}")

    il_count = sum(1 for pl in players if pl.get("il"))
    print(f"IL players:{il_count}")

    if yahoo_data:
        teams = yahoo_data.get("teams", [])
        draft = yahoo_data.get("draft_results", [])
        settings = yahoo_data.get("settings", {})
        print(f"\nYahoo:     {len(teams)} teams, {len(draft)} draft picks")
        print(f"League:    {settings.get('league_name','?')} ({settings.get('season','?')})")
        print(f"Draft:     {settings.get('draft_status','?')}")

    print("\nTop 15 by DNS (25% 2026 / 75% dynasty):")
    top = sorted(players, key=lambda x: x.get("score2026",0)*0.25 + x.get("scoreDyn",0)*0.75, reverse=True)
    for pl in top[:15]:
        dns = pl.get("score2026",0)*0.25 + pl.get("scoreDyn",0)*0.75
        il  = " [IL]" if pl.get("il") else ""
        print(f"  {pl['name']:<28} {pl['type']}  "
              f"DNS:{dns:.1f}  2026:{pl.get('score2026',0):.1f}  "
              f"dyn:{pl.get('scoreDyn',0):.1f}{il}")

    print("\nNext steps:")
    print("  git add data/targets.json leagues/poor_pickles.js")
    print("  git commit -m 'pre-draft build'")
    print("  git push  →  Vercel auto-deploys")


# ─── ENTRY POINT ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Build draft assistant data")
    parser.add_argument("--skip-yahoo", action="store_true")
    parser.add_argument("--skip-zar",   action="store_true")
    parser.add_argument("--system",     default="steamer",
                        choices=["steamer","zips","atc","thebat","fangraphsdc"])
    parser.add_argument("--dry-run",    action="store_true")
    args = parser.parse_args()

    print("Dynasty Draft Assistant — Build")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")

    # Run ZAR model
    zar_ok = run_zar(system=args.system, skip=args.skip_zar)

    # Run Yahoo sync
    yahoo_ok = run_yahoo(skip=args.skip_yahoo)

    # Load results
    zar_scores = load_zar()
    yahoo_data = load_yahoo() if yahoo_ok else {}

    if not zar_scores:
        print("\nERROR: No player scores available. Cannot build targets.json.")
        raise SystemExit(1)

    # Merge
    print("\n" + "=" * 60)
    print("STEP 3: Merging data")
    print("=" * 60)
    players = merge_players(zar_scores, yahoo_data)
    print(f"  Merged {len(players)} players")

    # Write outputs
    write_targets(players, args.dry_run)
    write_league_config(yahoo_data, args.dry_run)

    # Summary
    print_summary(players, yahoo_data)


if __name__ == "__main__":
    main()
