#!/usr/bin/env python3
"""
Dynasty Draft Assistant — Projection Fetcher
============================================
Pulls Steamer600 projections from FanGraphs (free, no API key needed)
and converts them into a targets.json file for the draft assistant.

Usage:
    python data/fetch_projections.py

Output:
    data/targets.json   — player pool with score2026 and scoreDyn

Requirements:
    pip install requests pandas

Notes:
    - FanGraphs CSV export URLs are stable and don't require login for projections.
    - Scores are normalized to 0-10 scale based on percentile rank in the pool.
    - scoreDyn is currently estimated as score2026 * age_curve_factor.
      Replace with manual overrides in DYNASTY_OVERRIDES below for key targets.
    - Run this script a few days before your draft for freshest data.
"""

import requests
import pandas as pd
import json
import math
from datetime import datetime

# ─── CONFIG ───────────────────────────────────────────────────────────────────

# Your 9x9 categories (must match baseCatNeed keys in your league config)
HITTING_CATS  = ["R", "H", "HR", "RBI", "SB", "TB", "AVG", "OBP", "SLG"]
PITCHING_CATS = ["W", "K", "ERA", "WHIP", "IP", "BB9", "K9", "SV", "HLD"]

# FanGraphs projection system — options: "steamer", "zips", "atc", "thebat"
PROJECTION_SYSTEM = "steamer"

# Category need weights (copy from your league config's baseCatNeed)
CAT_NEED = {
    "R": 1, "H": 1, "HR": 3, "RBI": 3, "SB": 1, "TB": 2,
    "AVG": 1, "OBP": 1, "SLG": 3,
    "W": 1, "K": 2, "ERA": 2, "WHIP": 2, "IP": 1,
    "BB9": 2, "K9": 2, "SV": 3, "HLD": 3,
}

# Manual dynasty score overrides — use these for players whose future value
# differs significantly from their 2026 projection (prospects, IL returns, etc.)
# Format: { "Player Name": scoreDyn }
DYNASTY_OVERRIDES = {
    "Spencer Strider":       9.5,
    "Spencer Schwellenbach": 9.0,
    "Grayson Rodriguez":     8.8,
    "Jared Jones":           8.5,
    "Dylan Crews":           8.8,
    "Byron Buxton":          9.0,
    "Jacob Wilson":          8.2,
    "Andrew Painter":        8.0,
    "Kodai Senga":           7.5,
}

# IL players — 2026 score will be discounted by this factor
IL_PLAYERS = {
    "Spencer Strider", "Spencer Schwellenbach", "Grayson Rodriguez",
    "Jared Jones", "Matt McLain", "Andrew Painter", "Kodai Senga",
    "Felix Bautista",
}

# Age curves for dynasty score adjustment
# Players older than 30 get penalized, younger than 25 get a bonus
def age_curve_factor(age):
    if age is None:
        return 1.0
    if age <= 23: return 1.20
    if age <= 25: return 1.10
    if age <= 27: return 1.05
    if age <= 29: return 1.00
    if age <= 31: return 0.90
    if age <= 33: return 0.75
    return 0.55

# ─── FANGRAPHS URLs ───────────────────────────────────────────────────────────

def get_hitter_url(system="steamer"):
    # FanGraphs projections CSV export — hitters
    return (
        f"https://www.fangraphs.com/api/projections?"
        f"type={system}&stats=bat&pos=all&team=0&players=0&lg=all&z=0"
    )

def get_pitcher_url(system="steamer"):
    # FanGraphs projections CSV export — pitchers
    return (
        f"https://www.fangraphs.com/api/projections?"
        f"type={system}&stats=pit&pos=all&team=0&players=0&lg=all&z=0"
    )

# ─── NORMALIZATION ────────────────────────────────────────────────────────────

def percentile_rank(series, value, higher_is_better=True):
    """Return 0-10 score based on percentile rank within series."""
    if higher_is_better:
        pct = (series < value).sum() / len(series)
    else:
        pct = (series > value).sum() / len(series)
    return round(pct * 10, 1)

def normalize_hitter(row, all_hitters):
    """Convert raw projected stats to a 0-10 score2026 for a hitter."""
    scores = []
    weights = []

    stat_map = {
        "HR":  ("HR",  True),
        "RBI": ("RBI", True),
        "R":   ("R",   True),
        "SB":  ("SB",  True),
        "H":   ("H",   True),
        "TB":  ("TB",  True),
        "AVG": ("AVG", True),
        "OBP": ("OBP", True),
        "SLG": ("SLG", True),
    }

    for cat, (col, hib) in stat_map.items():
        if col in all_hitters.columns and col in row.index:
            try:
                val = float(row[col])
                s = percentile_rank(all_hitters[col].dropna(), val, hib)
                w = CAT_NEED.get(cat, 1)
                scores.append(s * w)
                weights.append(w)
            except (ValueError, TypeError):
                pass

    if not weights:
        return 5.0
    return round(sum(scores) / sum(weights), 1)

def normalize_pitcher(row, all_pitchers):
    """Convert raw projected stats to a 0-10 score2026 for a pitcher."""
    scores = []
    weights = []

    stat_map = {
        "K":    ("SO",   True),
        "W":    ("W",    True),
        "ERA":  ("ERA",  False),
        "WHIP": ("WHIP", False),
        "IP":   ("IP",   True),
        "K9":   ("K/9",  True),
        "BB9":  ("BB/9", False),
        "SV":   ("SV",   True),
        "HLD":  ("HLD",  True),
    }

    for cat, (col, hib) in stat_map.items():
        if col in all_pitchers.columns and col in row.index:
            try:
                val = float(row[col])
                s = percentile_rank(all_pitchers[col].dropna(), val, hib)
                w = CAT_NEED.get(cat, 1)
                scores.append(s * w)
                weights.append(w)
            except (ValueError, TypeError):
                pass

    if not weights:
        return 5.0
    return round(sum(scores) / sum(weights), 1)

# ─── POSITION MAPPING ────────────────────────────────────────────────────────

POS_ELIGIBLE = {
    "C":  ["C"],
    "1B": ["1B"],
    "2B": ["2B"],
    "3B": ["3B"],
    "SS": ["SS"],
    "LF": ["LF"],
    "CF": ["CF"],
    "RF": ["RF"],
    "DH": ["Util"],
    "SP": ["SP"],
    "RP": ["RP"],
}

def parse_positions(pos_str):
    """Parse FanGraphs position string into eligible list."""
    if not isinstance(pos_str, str):
        return ["Util"]
    parts = [p.strip() for p in pos_str.replace("/", ",").split(",")]
    eligible = []
    for p in parts:
        if p in POS_ELIGIBLE:
            eligible.extend(POS_ELIGIBLE[p])
    return list(dict.fromkeys(eligible)) or ["Util"]  # dedupe, preserve order

# ─── TIER ASSIGNMENT ─────────────────────────────────────────────────────────

def assign_tier(score2026, scoreDyn, player_name):
    """Assign keep6/keep12/bridge/maybe/specialist based on scores."""
    combined = score2026 * 0.25 + scoreDyn * 0.75
    if combined >= 8.0:
        return "keep6"
    if combined >= 6.5:
        return "keep12"
    if score2026 >= 7.5 and scoreDyn < 5.5:
        return "bridge"
    if combined >= 5.0:
        return "maybe"
    return "specialist"

# ─── CATEGORY TAGS ───────────────────────────────────────────────────────────

def get_hitter_cats(row):
    """Return top contributing categories for a hitter."""
    cats = []
    thresholds = {
        "HR": 20, "RBI": 70, "R": 70, "SB": 15,
        "TB": 200, "AVG": 0.270, "OBP": 0.340, "SLG": 0.450,
    }
    for cat, threshold in thresholds.items():
        try:
            if float(row.get(cat, 0)) >= threshold:
                cats.append(cat)
        except (ValueError, TypeError):
            pass
    return cats[:4] or ["R"]

def get_pitcher_cats(row, is_reliever=False):
    """Return top contributing categories for a pitcher."""
    cats = []
    if is_reliever:
        try:
            sv = float(row.get("SV", 0))
            hld = float(row.get("HLD", 0))
            if sv >= 15 or hld >= 15:
                cats.append("NSVH")
        except (ValueError, TypeError):
            pass
    thresholds = {
        "SO": ("K", 150), "K/9": ("K/9", 9.0), "ERA": ("ERA", 3.80),
        "WHIP": ("WHIP", 1.20), "BB/9": ("BB/9", 2.5),
    }
    for col, (cat, threshold) in thresholds.items():
        try:
            val = float(row.get(col, 0))
            if cat in ("ERA", "WHIP", "BB/9"):
                if val <= threshold:
                    cats.append(cat)
            else:
                if val >= threshold:
                    cats.append(cat)
        except (ValueError, TypeError):
            pass
    return cats[:4] or ["K"]

# ─── MAIN ─────────────────────────────────────────────────────────────────────

def fetch_projections():
    print(f"Fetching {PROJECTION_SYSTEM} projections from FanGraphs...")
    headers = {"User-Agent": "Mozilla/5.0 (dynasty draft assistant)"}

    try:
        h_resp = requests.get(get_hitter_url(PROJECTION_SYSTEM), headers=headers, timeout=15)
        p_resp = requests.get(get_pitcher_url(PROJECTION_SYSTEM), headers=headers, timeout=15)
        h_resp.raise_for_status()
        p_resp.raise_for_status()
        hitters  = pd.DataFrame(h_resp.json())
        pitchers = pd.DataFrame(p_resp.json())
        print(f"  Got {len(hitters)} hitters, {len(pitchers)} pitchers")
    except Exception as e:
        print(f"ERROR fetching from FanGraphs: {e}")
        print("FanGraphs may have changed their API. Check the URL or try a different projection system.")
        print("Falling back to empty targets — update manually.")
        return []

    targets = []
    now_year = datetime.now().year

    # Process hitters
    min_pa = 100  # filter out bench/fringe players
    qualified_hitters = hitters[hitters.get("PA", pd.Series(dtype=float)).fillna(0) >= min_pa].copy()

    for _, row in qualified_hitters.iterrows():
        name = str(row.get("PlayerName", row.get("Name", "Unknown")))
        age  = row.get("Age", None)
        pos  = str(row.get("Pos", row.get("POS", "Util")))

        score2026 = normalize_hitter(row, qualified_hitters)
        age_factor = age_curve_factor(int(age) if age and not pd.isna(age) else None)

        # Dynasty score: future-weighted, with age curve
        scoreDyn = DYNASTY_OVERRIDES.get(name, round(min(score2026 * age_factor, 10.0), 1))

        # IL discount on 2026 for injured players
        if name in IL_PLAYERS:
            score2026 = round(score2026 * 0.4, 1)

        eligible = parse_positions(pos)
        tier = assign_tier(score2026, scoreDyn, name)
        cats = get_hitter_cats(row)

        targets.append({
            "name":      name,
            "eligible":  eligible,
            "org":       str(row.get("Team", "?")),
            "tier":      tier,
            "type":      "H",
            "score2026": score2026,
            "scoreDyn":  scoreDyn,
            "note":      f"Steamer: {row.get('HR','?')}HR {row.get('SB','?')}SB .{str(row.get('AVG','?')).replace('0.','').replace('.','')[:3]}AVG",
            "cats":      cats,
            "il":        name in IL_PLAYERS,
            "est":       False,
        })

    # Process pitchers
    min_ip = 20  # include relievers
    qualified_pitchers = pitchers[pitchers.get("IP", pd.Series(dtype=float)).fillna(0) >= min_ip].copy()

    for _, row in qualified_pitchers.iterrows():
        name = str(row.get("PlayerName", row.get("Name", "Unknown")))
        age  = row.get("Age", None)
        pos  = str(row.get("Pos", row.get("POS", "SP")))
        is_rp = "RP" in pos or float(row.get("GS", 0) or 0) < float(row.get("G", 1) or 1) * 0.5

        score2026 = normalize_pitcher(row, qualified_pitchers)
        age_factor = age_curve_factor(int(age) if age and not pd.isna(age) else None)
        scoreDyn = DYNASTY_OVERRIDES.get(name, round(min(score2026 * age_factor, 10.0), 1))

        if name in IL_PLAYERS:
            score2026 = round(score2026 * 0.4, 1)

        eligible = ["RP"] if is_rp else ["SP"]
        tier = assign_tier(score2026, scoreDyn, name)
        cats = get_pitcher_cats(row, is_rp)

        targets.append({
            "name":      name,
            "eligible":  eligible,
            "org":       str(row.get("Team", "?")),
            "tier":      tier,
            "type":      "P",
            "score2026": score2026,
            "scoreDyn":  scoreDyn,
            "note":      f"Steamer: {row.get('SO','?')}K {row.get('ERA','?')}ERA {row.get('WHIP','?')}WHIP",
            "cats":      cats,
            "il":        name in IL_PLAYERS,
            "est":       False,
        })

    # Sort by draft now score proxy (25/75 blend)
    targets.sort(key=lambda t: t["score2026"] * 0.25 + t["scoreDyn"] * 0.75, reverse=True)

    return targets


def main():
    targets = fetch_projections()

    output = {
        "generated": datetime.now().isoformat(),
        "system": PROJECTION_SYSTEM,
        "count": len(targets),
        "players": targets,
    }

    with open("data/targets.json", "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nWrote {len(targets)} players to data/targets.json")
    print(f"Top 10 by dynasty score:")
    for p in targets[:10]:
        print(f"  {p['name']:<28} {p['type']}  2026:{p['score2026']}  dyn:{p['scoreDyn']}  {p['tier']}")
    print("\nDone. Now commit data/targets.json and redeploy.")


if __name__ == "__main__":
    main()
