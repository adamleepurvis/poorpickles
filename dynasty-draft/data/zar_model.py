#!/usr/bin/env python3
"""
Dynasty Draft Assistant — ZAR Model
=====================================
Z-Score Above Replacement valuation for H2H categories leagues.

Replaces hand-assigned score2026/scoreDyn with mathematically derived values:
  1. Pull Steamer projections from FanGraphs
  2. Filter to draftable player pool (≥ replacement-level playing time)
  3. For each stat category, compute z-score: (player - mean) / stdev
  4. Weight z-scores by your category need weights
  5. Sum weighted z-scores = ZAR value
  6. Normalize to 0-10 scale for the UI

Dynasty score uses the same model but applies an age curve to project
peak value rather than 2026 value.

Usage:
    python data/zar_model.py               # compute ZAR for all players
    python data/zar_model.py --show-top 20 # print top 20 and exit
    python data/zar_model.py --system zips # use ZiPS instead of Steamer

Output:
    data/zar_scores.json  — ZAR values per player, consumed by build.py

Requirements:
    pip install requests pandas numpy
"""

import requests
import pandas as pd
import numpy as np
import json
import argparse
from pathlib import Path
from datetime import datetime

# ─── CONFIG ───────────────────────────────────────────────────────────────────

PROJECTION_SYSTEM = "steamer"   # steamer | zips | atc | thebat | fangraphsdc

# Minimum playing time to be considered "draftable" (not replacement level)
MIN_PA = 150    # hitters: minimum plate appearances projected
MIN_IP = 25     # pitchers: minimum innings (includes relievers)

# Number of draftable players per position — used to set replacement level
# 12 teams × roster spots at each position
LEAGUE_SIZE = 12
ROSTER_SLOTS = {
    "C":   1, "1B": 1, "2B": 1, "3B": 1, "SS": 1,
    "OF":  3,  # LF+CF+RF combined
    "Util":1,
    "SP":  4, "RP": 2, "P":  2,
}
# Total draftable players per position type
# (league_size × slots + ~20% bench/adds)
DRAFTED_HITTERS  = int(LEAGUE_SIZE * (1+1+1+1+1+3+1) * 1.3)  # ~140
DRAFTED_PITCHERS = int(LEAGUE_SIZE * (4+2+2) * 1.3)           # ~125

# Your 9x9 category weights — higher = more important to YOUR team
# Mirrors baseCatNeed in your league config
CAT_WEIGHTS = {
    # Hitting — your gaps
    "HR":  3.0, "RBI": 3.0, "SLG": 3.0,  # critical
    "TB":  2.0,                             # moderate need
    "R":   1.0, "H":   1.0, "SB":  1.0,
    "AVG": 1.0, "OBP": 1.0,               # already strong
    # Pitching
    "K":   2.0, "ERA": 2.0, "WHIP": 2.0,
    "K9":  2.0, "BB9": 2.0,
    "IP":  1.0, "W":   1.0, "ER":   1.0,
    "NSVH":3.0,                             # semi-punt but nonzero
}

# Stat directions: True = higher is better, False = lower is better
STAT_DIRECTION = {
    "HR": True,  "RBI": True,  "R":   True,  "H":   True,
    "SB": True,  "TB":  True,  "AVG": True,  "OBP": True,  "SLG": True,
    "K":  True,  "W":   True,  "IP":  True,  "SV":  True,  "HLD": True,
    "ERA":False, "WHIP":False, "ER":  False,
    "K9": True,  "BB9": False,
}

# Age curve — dynasty score multiplier by age
AGE_CURVE = {
    21: 1.30, 22: 1.25, 23: 1.20, 24: 1.15, 25: 1.10,
    26: 1.05, 27: 1.02, 28: 1.00, 29: 0.97, 30: 0.93,
    31: 0.87, 32: 0.80, 33: 0.72, 34: 0.63, 35: 0.52,
}

# Manual dynasty overrides — for prospects/IL players whose 2026 projection
# understates their true ceiling. ZAR still calculates 2026, but scoreDyn
# uses this value instead of the age-curve estimate.
DYNASTY_OVERRIDES = {
    "Spencer Strider":       9.5,
    "Spencer Schwellenbach": 9.0,
    "Grayson Rodriguez":     8.8,
    "Jared Jones":           8.5,
    "Andrew Painter":        8.0,
    "Dylan Crews":           8.8,
    "Jacob Wilson":          8.2,
    "Kodai Senga":           7.5,
    "Wyatt Langford":        7.8,
    "Jackson Chourio":       7.5,
    "James Wood":            8.0,
}

# IL players — 2026 ZAR discounted by this factor (full dynasty preserved)
IL_PLAYERS = {
    "Spencer Strider", "Spencer Schwellenbach", "Grayson Rodriguez",
    "Jared Jones", "Matt McLain", "Andrew Painter", "Kodai Senga",
    "Felix Bautista",
}

IL_DISCOUNT = 0.4

# Default age when FanGraphs doesn't return one (peak age assumption)
DEFAULT_AGE = 27

OUTPUT_FILE = Path(__file__).parent / "zar_scores.json"
FANTRAX_FILE = Path(__file__).parent / "fantrax_dynasty.csv"

# ─── FANTRAX DYNASTY RANKINGS ────────────────────────────────────────────────

def load_fantrax_dynasty() -> tuple[dict, dict]:
    """
    Load Fantrax Top-500 dynasty rankings CSV.
    Returns:
      scores: normalized_name -> scoreFTDyn (0-10 scale)
      ages:   normalized_name -> age (int)
    Uses the Roto rank column (better fit for category leagues).
    """
    if not FANTRAX_FILE.exists():
        print("  No fantrax_dynasty.csv found — skipping FT dynasty scores.")
        return {}, {}

    def _norm(name: str) -> str:
        import unicodedata
        return unicodedata.normalize("NFD", name).encode("ascii", "ignore").decode().lower().strip()

    df = pd.read_csv(FANTRAX_FILE)
    df = df.rename(columns={"Roto": "roto_rank", "Player": "player_name", "Age": "age"})
    df["roto_rank"] = pd.to_numeric(df["roto_rank"], errors="coerce")
    df["age"]       = pd.to_numeric(df["age"],       errors="coerce")
    df = df.dropna(subset=["roto_rank"])

    max_rank = df["roto_rank"].max()
    scores, ages = {}, {}
    for _, row in df.iterrows():
        name = str(row["player_name"])
        key  = _norm(name)
        rank = float(row["roto_rank"])
        scores[key] = round(10 * (1 - (rank - 1) / max_rank), 1)
        if pd.notna(row.get("age")) and float(row["age"]) > 0:
            ages[key] = int(row["age"])

    print(f"  Loaded {len(scores)} Fantrax dynasty rankings, {len(ages)} ages.")
    return scores, ages

# ─── FANGRAPHS FETCH ─────────────────────────────────────────────────────────

FANGRAPHS_HEADERS = {
    "User-Agent": "Mozilla/5.0 (dynasty-draft-assistant/1.0)",
    "Accept": "application/json",
}

def fetch_fangraphs(player_type: str, system: str) -> pd.DataFrame:
    """
    Fetch projections from FanGraphs API.
    player_type: 'bat' or 'pit'
    system: 'steamer', 'zips', 'atc', 'thebat', 'fangraphsdc'
    """
    url = (
        f"https://www.fangraphs.com/api/projections"
        f"?type={system}&stats={player_type}&pos=all&team=0&players=0&lg=all&z=0"
    )
    print(f"  Fetching FanGraphs {system} {player_type}...")
    try:
        resp = requests.get(url, headers=FANGRAPHS_HEADERS, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        df = pd.DataFrame(data)
        print(f"    Got {len(df)} rows, {len(df.columns)} columns")
        return df
    except Exception as e:
        print(f"  ERROR fetching FanGraphs: {e}")
        return pd.DataFrame()


# ─── STAT COLUMN MAPPING ─────────────────────────────────────────────────────

# FanGraphs column names → our internal stat names
HITTER_COL_MAP = {
    "R": "R", "H": "H", "HR": "HR", "RBI": "RBI", "SB": "SB",
    "2B": "2B", "3B": "3B",       # used to compute TB
    "AVG": "AVG", "OBP": "OBP", "SLG": "SLG",
    "PA": "PA",
    "PlayerName": "name", "Name": "name",
    "Team": "team", "minpos": "pos",  # FanGraphs uses "minpos" for position string
}

PITCHER_COL_MAP = {
    "SO": "K", "W": "W", "ERA": "ERA", "WHIP": "WHIP", "IP": "IP",
    "SV": "SV", "HLD": "HLD", "BB": "BB",
    "K/9": "K9", "BB/9": "BB9",
    "ER": "ER",
    "GS": "GS", "G": "G",
    "PlayerName": "name", "Name": "name",
    "Team": "team",
}

def normalize_df(df: pd.DataFrame, col_map: dict) -> pd.DataFrame:
    """Rename columns and coerce numeric types."""
    rename = {k: v for k, v in col_map.items() if k in df.columns}
    df = df.rename(columns=rename)
    # Ensure name column exists
    if "name" not in df.columns:
        df["name"] = "Unknown"
    # Coerce numeric — Age is excluded from fillna so we can use DEFAULT_AGE downstream
    numeric_cols = [v for v in col_map.values() if v not in ("name", "team", "pos", "Age")]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    # Age: coerce but preserve NaN when missing
    if "Age" in df.columns:
        df["Age"] = pd.to_numeric(df["Age"], errors="coerce")
    return df


# ─── ZAR CALCULATION ─────────────────────────────────────────────────────────

def compute_zar(df: pd.DataFrame, stats: list[str], n_rostered: int) -> pd.Series:
    """
    Compute Z-Score Above Replacement for each player.

    Steps:
    1. Take the top n_rostered players by total fantasy value as the pool
    2. For each stat, compute mean and stdev of the pool
    3. Z-score = (player_stat - pool_mean) / pool_stdev
    4. For lower-is-better stats, negate the z-score
    5. Weight by CAT_WEIGHTS
    6. Sum weighted z-scores = raw ZAR
    """
    available_stats = [s for s in stats if s in df.columns]
    if not available_stats:
        return pd.Series(0.0, index=df.index)

    # First pass: rank by simple sum of available counting stats to identify pool
    # (replacement level = player just outside the drafted pool)
    counting = [s for s in available_stats if s not in ("ERA", "WHIP", "AVG", "OBP", "SLG", "K9", "BB9")]
    if counting:
        raw_rank = df[counting].sum(axis=1)
    else:
        raw_rank = df[available_stats].sum(axis=1)

    # Get pool = top n_rostered + 10% buffer
    pool_size = min(int(n_rostered * 1.1), len(df))
    pool_idx  = raw_rank.nlargest(pool_size).index
    pool      = df.loc[pool_idx]

    # Replacement level player = next player just below the pool
    replacement_idx = raw_rank.drop(pool_idx).nlargest(1).index
    replacement     = df.loc[replacement_idx] if len(replacement_idx) > 0 else pool.tail(5)

    # Compute z-scores for each stat
    zar_components = pd.DataFrame(index=df.index)

    for stat in available_stats:
        pool_mean  = pool[stat].mean()
        pool_stdev = pool[stat].std()
        repl_mean  = replacement[stat].mean() if len(replacement) > 0 else pool_mean

        if pool_stdev < 1e-9:
            continue  # no variance, skip

        # Z-score relative to replacement level (not pool mean)
        z = (df[stat] - repl_mean) / pool_stdev

        # Flip direction for lower-is-better stats
        if not STAT_DIRECTION.get(stat, True):
            z = -z

        weight = CAT_WEIGHTS.get(stat, 1.0)
        zar_components[stat] = z * weight

    return zar_components.sum(axis=1)


def age_curve_factor(age) -> float:
    """Return dynasty multiplier for a given age."""
    try:
        age_int = int(float(age))
        return AGE_CURVE.get(age_int, AGE_CURVE.get(min(AGE_CURVE.keys(),
                                                         key=lambda k: abs(k - age_int)), 1.0))
    except (TypeError, ValueError):
        return 1.0


def project_future_score(score_base: float, age: int, years_forward: int) -> float:
    """Project a ZAR score N years forward using the age curve ratio."""
    current_factor = age_curve_factor(age)
    future_factor  = age_curve_factor(age + years_forward)
    if current_factor < 1e-9:
        return round(min(score_base, 10.0), 1)
    return round(min(score_base * (future_factor / current_factor), 10.0), 1)


def normalize_to_scale(series: pd.Series,
                        low_pct: float = 5,
                        high_pct: float = 95,
                        scale_min: float = 0,
                        scale_max: float = 10) -> pd.Series:
    """
    Normalize a ZAR series to 0-10 scale.
    Uses percentile clipping to handle outliers (Ohtani problem).
    """
    lo = np.percentile(series.dropna(), low_pct)
    hi = np.percentile(series.dropna(), high_pct)
    clipped = series.clip(lo, hi)
    if hi == lo:
        return pd.Series(5.0, index=series.index)
    normalized = (clipped - lo) / (hi - lo) * (scale_max - scale_min) + scale_min
    return normalized.round(1)


# ─── POSITION ASSIGNMENT ─────────────────────────────────────────────────────

def assign_eligible(pos_str: str, is_pitcher: bool) -> list[str]:
    """Map FanGraphs position string to eligible positions list."""
    if is_pitcher:
        if "SP" in str(pos_str) or "ST" in str(pos_str):
            return ["SP"]
        return ["RP"]

    pos_str = str(pos_str).upper()
    eligible = []
    pos_map  = {
        "C": "C", "1B": "1B", "2B": "2B", "3B": "3B", "SS": "SS",
        "LF": "LF", "CF": "CF", "RF": "RF",
        "OF": None,   # handled below
        "DH": "Util",
    }
    parts = [p.strip() for p in pos_str.replace("/", ",").replace("-", ",").split(",")]
    for p in parts:
        if p == "OF":
            for of in ["LF", "CF", "RF"]:
                if of not in eligible:
                    eligible.append(of)
        elif p in pos_map and pos_map[p] and pos_map[p] not in eligible:
            eligible.append(pos_map[p])

    return eligible or ["Util"]


def assign_tier(score2026: float, score_dyn: float) -> str:
    """Assign tier based on combined score."""
    combined = score2026 * 0.25 + score_dyn * 0.75
    if combined >= 8.0:   return "keep6"
    if combined >= 6.5:   return "keep12"
    if score2026 >= 7.5 and score_dyn < 5.5: return "bridge"
    if combined >= 5.0:   return "maybe"
    return "specialist"


def get_cats(row, stat_list: list[str], is_pitcher: bool) -> list[str]:
    """Return categories this player meaningfully contributes to."""
    thresholds = {
        # Hitting
        "HR": 18, "RBI": 65, "R": 65, "SB": 12, "TB": 180,
        "AVG": 0.265, "OBP": 0.335, "SLG": 0.440,
        # Pitching
        "K":  140, "K9": 9.0, "ERA": 3.90, "WHIP": 1.22,
        "BB9": 2.8, "IP": 130,
        "SV": 15, "HLD": 12,
    }
    cats = []
    for stat, threshold in thresholds.items():
        if stat not in row.index:
            continue
        try:
            val = float(row[stat])
            if STAT_DIRECTION.get(stat, True):
                if val >= threshold:
                    cats.append(stat if stat not in ("SV", "HLD") else "NSVH")
            else:
                if val <= threshold:
                    cats.append(stat)
        except (ValueError, TypeError):
            pass
    # Dedupe (SV + HLD both → NSVH once)
    seen = set()
    result = []
    for c in cats:
        if c not in seen:
            seen.add(c)
            result.append(c)
    return result[:5] or (["K"] if is_pitcher else ["R"])


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Compute ZAR player valuations")
    parser.add_argument("--system",    default=PROJECTION_SYSTEM,
                        choices=["steamer","zips","atc","thebat","fangraphsdc"])
    parser.add_argument("--with-zips", action="store_true",
                        help="Also fetch ZiPS projections and add scoreZiPS field")
    parser.add_argument("--show-top",  type=int, default=0)
    args = parser.parse_args()

    system = args.system
    print(f"ZAR Model — {system.upper()} projections\n")

    # ── Load Fantrax dynasty rankings ──────────────────────────────────────────
    import unicodedata
    def _norm(name: str) -> str:
        return unicodedata.normalize("NFD", name).encode("ascii", "ignore").decode().lower().strip()

    fantrax, fantrax_ages = load_fantrax_dynasty()

    # ── Fetch primary system ───────────────────────────────────────────────────
    raw_hitters  = fetch_fangraphs("bat", system)
    raw_pitchers = fetch_fangraphs("pit", system)

    if raw_hitters.empty and raw_pitchers.empty:
        print("ERROR: No data retrieved. Check FanGraphs API or network.")
        raise SystemExit(1)

    # Stat lists (defined early so ZiPS block can reference them)
    hitting_stats  = ["HR","RBI","R","H","SB","TB","AVG","OBP","SLG"]
    pitching_stats = ["K","W","ERA","WHIP","IP","K9","BB9","SV","HLD","ER"]

    # ── Optionally fetch ZiPS for scoreZiPS ────────────────────────────────────
    zips_scores: dict[str, float] = {}
    if args.with_zips and system != "zips":
        print("\nFetching ZiPS projections for scoreZiPS...")
        raw_zips_h = fetch_fangraphs("bat", "zips")
        raw_zips_p = fetch_fangraphs("pit", "zips")
        if not raw_zips_h.empty or not raw_zips_p.empty:
            zh = normalize_df(raw_zips_h, HITTER_COL_MAP)
            zp = normalize_df(raw_zips_p, PITCHER_COL_MAP)
            if "PA" in zh.columns:
                zh = zh[zh["PA"] >= MIN_PA].copy()
            if "IP" in zp.columns:
                zp = zp[zp["IP"] >= MIN_IP].copy()
            zh["zar_raw"] = compute_zar(zh, hitting_stats,  DRAFTED_HITTERS)
            zp["zar_raw"] = compute_zar(zp, pitching_stats, DRAFTED_PITCHERS)
            all_zips_zar = pd.concat([zh["zar_raw"], zp["zar_raw"]])
            lo = float(np.percentile(all_zips_zar.dropna(), 5))
            hi = float(np.percentile(all_zips_zar.dropna(), 95))
            def _norm_zips(v):
                return round(max(0, min(10, (v - lo) / (hi - lo) * 10)), 1) if hi > lo else 5.0
            for df_z, label in [(zh, "H"), (zp, "P")]:
                for _, row in df_z.iterrows():
                    name = str(row["name"])
                    zips_scores[_norm(name)] = _norm_zips(float(row["zar_raw"]))
            print(f"  ZiPS scores computed for {len(zips_scores)} players.")

    # ── Normalize columns ──────────────────────────────────────────────────────
    hitters  = normalize_df(raw_hitters,  HITTER_COL_MAP)
    pitchers = normalize_df(raw_pitchers, PITCHER_COL_MAP)

    # ── Compute TB (FanGraphs doesn't return it directly) ─────────────────────
    # TB = H + 2B + 2×3B + 3×HR  (singles = H - 2B - 3B - HR, but we just expand)
    if "H" in hitters.columns:
        h2b = hitters.get("2B", 0) if "2B" in hitters.columns else 0
        h3b = hitters.get("3B", 0) if "3B" in hitters.columns else 0
        hhr = hitters.get("HR", 0) if "HR" in hitters.columns else 0
        hitters["TB"] = hitters["H"] + h2b + 2 * h3b + 3 * hhr

    # ── Filter to draftable pool ───────────────────────────────────────────────
    if "PA" in hitters.columns:
        hitters = hitters[hitters["PA"] >= MIN_PA].copy()
    if "IP" in pitchers.columns:
        pitchers = pitchers[pitchers["IP"] >= MIN_IP].copy()

    print(f"\nDraftable pool: {len(hitters)} hitters, {len(pitchers)} pitchers")

    # ── Compute ZAR ───────────────────────────────────────────────────────────
    hitters["zar_raw"]  = compute_zar(hitters,  hitting_stats,  DRAFTED_HITTERS)
    pitchers["zar_raw"] = compute_zar(pitchers, pitching_stats, DRAFTED_PITCHERS)

    # ── Normalize to 0-10 ─────────────────────────────────────────────────────
    hitters["score2026"]  = normalize_to_scale(hitters["zar_raw"])
    pitchers["score2026"] = normalize_to_scale(pitchers["zar_raw"])

    # ── Dynasty score = score2026 × age curve ─────────────────────────────────
    def get_age(row) -> int:
        """Extract age: Fantrax CSV first, then FanGraphs, then DEFAULT_AGE."""
        name_key = _norm(str(row.get("name", "")))
        if name_key in fantrax_ages:
            return fantrax_ages[name_key]
        raw = row.get("Age", None)
        try:
            v = float(raw)
            return int(v) if (v > 0 and not np.isnan(v)) else DEFAULT_AGE
        except (TypeError, ValueError):
            return DEFAULT_AGE

    def compute_dyn(row):
        name = str(row["name"])
        if name in DYNASTY_OVERRIDES:
            return DYNASTY_OVERRIDES[name]
        factor = age_curve_factor(get_age(row))
        return round(min(float(row["score2026"]) * factor, 10.0), 1)

    hitters["scoreDyn"]  = hitters.apply(compute_dyn, axis=1)
    pitchers["scoreDyn"] = pitchers.apply(compute_dyn, axis=1)

    # ── Projected 2027 / 2028 scores (computed before IL discount) ────────────
    def compute_future(row, years_forward):
        age = get_age(row)
        return project_future_score(float(row["score2026"]), age, years_forward)

    hitters["score2027"]  = hitters.apply(lambda r: compute_future(r, 1), axis=1)
    hitters["score2028"]  = hitters.apply(lambda r: compute_future(r, 2), axis=1)
    pitchers["score2027"] = pitchers.apply(lambda r: compute_future(r, 1), axis=1)
    pitchers["score2028"] = pitchers.apply(lambda r: compute_future(r, 2), axis=1)

    # ── IL discount ───────────────────────────────────────────────────────────
    def apply_il(row):
        if str(row["name"]) in IL_PLAYERS:
            return round(float(row["score2026"]) * IL_DISCOUNT, 1), True
        return float(row["score2026"]), False

    hitters[["score2026","il"]]  = pd.DataFrame(hitters.apply(
        lambda r: apply_il(r), axis=1).tolist(), index=hitters.index)
    pitchers[["score2026","il"]] = pd.DataFrame(pitchers.apply(
        lambda r: apply_il(r), axis=1).tolist(), index=pitchers.index)

    # ── Build output records ───────────────────────────────────────────────────
    players = []

    for _, row in hitters.iterrows():
        name = str(row["name"])
        age  = get_age(row)
        players.append({
            "name":       name,
            "eligible":   assign_eligible(row.get("pos", ""), False),
            "org":        str(row.get("team", "?")),
            "tier":       assign_tier(float(row["score2026"]), float(row["scoreDyn"])),
            "type":       "H",
            "score2026":  float(row["score2026"]),
            "score2027":  float(row["score2027"]),
            "score2028":  float(row["score2028"]),
            "scoreDyn":   float(row["scoreDyn"]),
            "scoreFTDyn": fantrax.get(_norm(name), None),
            "scoreZiPS":  zips_scores.get(_norm(name), None),
            "zar_raw":    round(float(row["zar_raw"]), 3),
            "age":        age,
            "note":       (f"{system}: {int(row.get('HR',0))}HR "
                          f"{int(row.get('SB',0))}SB "
                          f".{str(row.get('AVG',0)).replace('0.','').replace('.','')[:3]}AVG"),
            "cats":       get_cats(row, hitting_stats, False),
            "il":         bool(row["il"]),
            "est":        False,
        })

    for _, row in pitchers.iterrows():
        name  = str(row["name"])
        age   = get_age(row)
        is_rp = ("GS" in row.index and "G" in row.index and
                 float(row.get("GS", 0) or 0) < float(row.get("G", 1) or 1) * 0.4)
        players.append({
            "name":       name,
            "eligible":   ["RP"] if is_rp else ["SP"],
            "org":        str(row.get("team", "?")),
            "tier":       assign_tier(float(row["score2026"]), float(row["scoreDyn"])),
            "type":       "P",
            "score2026":  float(row["score2026"]),
            "score2027":  float(row["score2027"]),
            "score2028":  float(row["score2028"]),
            "scoreDyn":   float(row["scoreDyn"]),
            "scoreFTDyn": fantrax.get(_norm(name), None),
            "scoreZiPS":  zips_scores.get(_norm(name), None),
            "zar_raw":    round(float(row["zar_raw"]), 3),
            "age":        age,
            "note":       (f"{system}: {int(row.get('K',0))}K "
                          f"{row.get('ERA','?')}ERA "
                          f"{row.get('WHIP','?')}WHIP"),
            "cats":       get_cats(row, pitching_stats, True),
            "il":         bool(row["il"]),
            "est":        False,
        })

    # Sort by combined score descending
    players.sort(key=lambda p: p["score2026"] * 0.25 + p["scoreDyn"] * 0.75, reverse=True)

    # ── Write output ──────────────────────────────────────────────────────────
    output = {
        "generated":  datetime.now().isoformat(),
        "system":     system,
        "count":      len(players),
        "players":    players,
    }
    OUTPUT_FILE.write_text(json.dumps(output, indent=2))
    print(f"\nWrote {len(players)} players to {OUTPUT_FILE}")

    if args.show_top:
        print(f"\nTop {args.show_top} by DNS:")
        for p in players[:args.show_top]:
            il_flag = " [IL]" if p["il"] else ""
            print(f"  {p['name']:<28} {p['type']}  "
                  f"2026:{p['score2026']:.1f}  dyn:{p['scoreDyn']:.1f}  "
                  f"zar:{p['zar_raw']:+.2f}  {p['tier']}{il_flag}")


if __name__ == "__main__":
    main()
