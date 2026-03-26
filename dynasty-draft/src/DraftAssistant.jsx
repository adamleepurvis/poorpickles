import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import poorPicklesTargets   from "../data/targets_poor_pickles.json";
import southOssetianTargets from "../data/targets_south_ossetian.json";
import spaghettTargets      from "../data/targets_spaghett.json";
import fantraxProspects     from "../data/fantrax_prospects.json";

const TARGETS_DATA = {
  "Poor Pickles":   poorPicklesTargets,
  "SouthOssetian":  southOssetianTargets,
  "Spaghett":       spaghettTargets,
};
const TARGETS_CACHE = {};
function getTargets(leagueName) {
  if (!TARGETS_CACHE[leagueName]) {
    const raw = (TARGETS_DATA[leagueName] || poorPicklesTargets).players;
    TARGETS_CACHE[leagueName] = raw.map(p => ({
      ...p,
      tier:      inferTier(p),
      cats:      (p.cats || []).map(c => c === "K9" ? "K/9" : c === "BB9" ? "BB/9" : c),
      score2028: computeBlendedScore2028(p, p.score2028, p.scoreDyn),
    }));
  }
  return TARGETS_CACHE[leagueName];
}
function getLeagueMeta(leagueName) {
  const d = TARGETS_DATA[leagueName] || poorPicklesTargets;
  return { scoreboard: d.scoreboard || null, standings: d.standings || null };
}


// ─── HELPERS ──────────────────────────────────────────────────────────────────
const POS_SCARCITY_ORDER = ["C","SS","2B","3B","CF","LF","RF","1B","SP","RP"];

// Extract score2028 blending logic so it can be reused for per-league scores
function computeBlendedScore2028(p, rawScore2028, rawScoreDyn) {
  if (rawScore2028 == null) return null;
  const pitcherDisc = p.type === "P"
    ? (p.age <= 25 ? 0.95 : p.age <= 27 ? 0.92 : p.age <= 29 ? 0.90 : p.age <= 31 ? 0.87 : 0.85)
    : 1.0;
  const raw = p.type === "P" ? Math.round(rawScore2028 * pitcherDisc * 10) / 10 : rawScore2028;
  if (p.il && rawScoreDyn != null) return Math.round(((raw + rawScoreDyn) / 2) * 10) / 10;
  const fvRaw = {"70":10,"65":8.5,"60":7.0,"55":6.0,"50":5.0,"45+":4.5,"45":4.0,"40+":3.5,"40":3.0,"35+":2.5,"35":2.0}[p.prospectFV] ?? null;
  if (fvRaw != null) return Math.round(((raw + fvRaw) / 2) * 10) / 10;
  return raw;
}

// ─── TARGET PLAYERS ───────────────────────────────────────────────────────────
// Tier is recomputed from FT Dyn score (which already embeds age/dynasty value)
// rather than raw ZAR scores, which inflate per-position and ignore aging.
//   keep6:  FT Dyn ≥ 9.0  (≈ Fantrax top 50  — true dynasty cornerstones)
//   keep12: FT Dyn ≥ 7.5  (≈ Fantrax top 125 — solid multi-year keepers)
//   bridge: FT Dyn ≥ 6.0 + good 2026 (contribute now, limited dynasty upside)
//   maybe:  everything else ranked by Fantrax
//   specialist/maybe: unranked players, heavy ZAR discount applied
function inferTier(p) {
  const ft = p.scoreFTDyn;
  const s26 = p.score2026;
  const dyn = p.scoreDyn;
  if (ft != null) {
    if (ft >= 9.0) return "keep6";
    if (ft >= 7.5) return "keep12";
    if (ft >= 6.0 && s26 >= 6.5) return "bridge";
    return "maybe";
  }
  // Not in Fantrax top 500 — can't be keep6/keep12; use discounted ZAR
  const combined = s26 * 0.4 + dyn * 0.5 * 0.6;
  if (combined >= 6.5 && s26 >= 7.5) return "bridge";
  if (combined >= 4.0) return "maybe";
  return "specialist";
}


// ─── SCORING ENGINE ────────────────────────────────────────────────────────────
// DNS weights: 2026 / 2028 / Dynasty / FanTrax / Prospect FV
// When FT is missing, apply uncertainty discounts to ZAR-derived scores (dyn×0.5, s28×0.7)
// to correct for ZAR's separate H/P normalization inflating unranked pitcher scores.
// Prospect FV (raw, no risk discount) acts as an expert ceiling signal same as FT.
const W_FT         = { s26: 0.25, s28: 0.35, ft: 0.40 };                       // FT only (dyn removed — FT captures dynasty value)
const W_PROS       = { s26: 0.20, s28: 0.35, fv: 0.45 };                       // prospect only
const W_FT_PROS    = { s26: 0.15, s28: 0.25, ft: 0.30, fv: 0.30 };            // both
const W_NOFT       = { s26: 0.15, s28: 0.30, dyn: 0.55 };                      // neither — dyn stays as dynasty proxy
const NOFT_DYN_DISCOUNT = 0.5;
const NOFT_S28_DISCOUNT = 0.7;

// Raw FV grade → 0-10 (ceiling, no risk penalty — risk shown in badge)
const FV_RAW = {"70":10,"65":8.5,"60":7.0,"55":6.0,"50":5.0,"45+":4.5,"45":4.0,"40+":3.5,"40":3.0,"35+":2.5,"35":2.0};

// ESPN dynasty rank → 0-10 score (rank 1 = 10.0, rank 300 = 0.0, linear)
function espnScore(rank) { return rank != null ? Math.max(0, 10 - (rank - 1) * (10 / 299)) : null; }
const IL_2026_DISCOUNT = 0.4;
const NEEDS_DISCOUNT = 0.72; // multiplier when all eligible positions already filled on my roster

// Compute dynamic CAT_NEED by decaying based on my drafted players
function computeDynamicCatNeed(myDraftedNames, targets, baseCatNeed) {
  const needs = {...baseCatNeed};
  myDraftedNames.forEach(name => {
    const player = targets.find(t => t.name === name);
    if (!player) return;
    player.cats.forEach(cat => {
      if (needs[cat] !== undefined && needs[cat] > 0) {
        needs[cat] = Math.max(0, needs[cat] - 1);
      }
    });
  });
  Object.keys(needs).forEach(cat => { needs[cat] = Math.max(0, needs[cat]); });
  return needs;
}

// Compute which starting positions are already filled on my roster.
// Used by "Needs" mode to discount players at filled positions.
function getFilledPositions(myDraftedNames, targets, keeperPicks, myTeam) {
  const myPlayers = [
    ...keeperPicks.filter(k => k.team === myTeam)
      .map(k => targets.find(t => t.name === k.player)).filter(Boolean),
    ...myDraftedNames.map(name => targets.find(t => t.name === name)).filter(Boolean),
  ];
  const counts = { C:0, "1B":0, "2B":0, "3B":0, SS:0, LF:0, CF:0, RF:0, SP:0, RP:0 };
  myPlayers.forEach(p => {
    p.eligible.forEach(pos => { if (counts[pos] !== undefined) counts[pos]++; });
  });
  const filled = new Set();
  if (counts.C  >= 1) filled.add("C");
  if (counts["1B"] >= 1) filled.add("1B");
  if (counts["2B"] >= 1) filled.add("2B");
  if (counts["3B"] >= 1) filled.add("3B");
  if (counts.SS >= 1) filled.add("SS");
  if (counts.LF + counts.CF + counts.RF >= 3) { filled.add("LF"); filled.add("CF"); filled.add("RF"); }
  if (counts.SP >= 4) filled.add("SP");
  if (counts.RP >= 2) filled.add("RP");
  return filled;
}

// ─── WEEKLY PROJECTION ENGINE ─────────────────────────────────────────────────
const HIT_COUNT  = ["R","H","HR","RBI","SB","TB"];
const HIT_RATE   = ["AVG","OBP","SLG"];
const PIT_COUNT  = ["K","W","ER","IP","NSVH"];
const PIT_RATE   = ["ERA","WHIP","K/9","BB/9"];
const LOWER_BETTER = new Set(["ERA","WHIP","BB/9","ER"]);
const CLOSE_THRESH = {
  R:2, HR:0.5, RBI:2, SB:0.5, H:4, TB:6, AVG:0.010, OBP:0.010, SLG:0.015,
  IP:5, K:4, W:0.5, ERA:0.20, WHIP:0.05, "K/9":0.3, "BB/9":0.2, NSVH:2, ER:1,
};

// Scale a player's season projStats to one week using the MLB schedule.
// Hitters: linear by team games. SPs: by projected starts (games/5). RPs: linear.
// fallbackGames used when schedule not yet loaded (defaults to avg week: 162/26 ≈ 6.2).
function computeWeeklyStats(roster, mlbSchedule, fallbackGames = 6.2) {
  const numBuf = {};
  const totals = {};
  let totalPA = 0, totalIP = 0;

  roster.forEach(p => {
    const proj = p.projStats;
    if (!proj) return;
    const teamGames = mlbSchedule?.[p.org]?.thisWeek ?? fallbackGames;
    const isH  = p.type === "H";
    const isRP = !isH && p.eligible?.every(e => e === "RP");
    const isSP = !isH && !isRP;

    let scale;
    if (isH || isRP) {
      scale = teamGames / 162;
    } else {
      // SP: one start per ~5 days; season starts ≈ IP / 5.5
      const seasonGS = Math.max(1, (proj.IP ?? 150) / 5.5);
      scale = (teamGames / 5) / seasonGS;
    }

    if (isH) {
      HIT_COUNT.forEach(c => { if (proj[c] != null) totals[c] = (totals[c] || 0) + proj[c] * scale; });
      const weekPA = proj.AVG ? (proj.H ?? 0) / proj.AVG * scale : 0;
      totalPA += weekPA;
      HIT_RATE.forEach(c => { if (proj[c] != null) numBuf[c] = (numBuf[c] || 0) + proj[c] * weekPA; });
    } else {
      PIT_COUNT.forEach(c => { if (proj[c] != null) totals[c] = (totals[c] || 0) + proj[c] * scale; });
      const weekIP = (proj.IP ?? 0) * scale;
      totalIP += weekIP;
      PIT_RATE.forEach(c => { if (proj[c] != null) numBuf[c] = (numBuf[c] || 0) + proj[c] * weekIP; });
    }
  });

  HIT_RATE.forEach(c => { totals[c] = totalPA > 0 ? numBuf[c] / totalPA : null; });
  PIT_RATE.forEach(c => { totals[c] = totalIP > 0 ? numBuf[c] / totalIP : null; });
  return totals;
}

function fmtStat(val, cat) {
  if (val == null) return "—";
  if (["AVG","OBP","SLG"].includes(cat)) return val.toFixed(3).replace(/^0/, "");
  if (["ERA","WHIP"].includes(cat))       return val.toFixed(2);
  if (["K/9","BB/9"].includes(cat))       return val.toFixed(1);
  return val.toFixed(1);
}

// Normalize accented characters for fuzzy name matching
function normalizeName(name) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function calcCatScore(player, catNeed) {
  const need = catNeed || {};
  const totalNeed = player.cats.reduce((sum, c) => sum + (need[c] || 0), 0);
  const maxPossible = player.cats.length * 3;
  return maxPossible > 0 ? totalNeed / maxPossible : 0;
}

function calcBaseScore(player, catNeed) {
  const s26 = player.il ? player.score2026 * IL_2026_DISCOUNT : player.score2026;
  const s28 = player.score2028 ?? player.score2026;
  const dyn = player.scoreDyn;
  const ft  = player.scoreFTDyn;
  const es  = espnScore(player.espnRank);  // ESPN rank → 0-10
  const catMult = 0.6 + 0.4 * calcCatScore(player, catNeed);
  const posDiscount = player.eligible.every(p => p === "RP") ? 0.75 : 1.0;

  // Combine expert dynasty signals: FT (dynasty-specific) weighted 60%, ESPN 40%
  // Discount ESPN-only slightly since it's less dynasty-specific than Fantrax
  const expert = ft != null && es != null ? ft * 0.6 + es * 0.4
               : ft != null               ? ft
               : es != null               ? es * 0.85
               : null;

  const fv = FV_RAW[player.prospectFV] ?? null;
  let base;
  if (expert != null && fv != null)
    base = s26*W_FT_PROS.s26 + s28*W_FT_PROS.s28 + expert*W_FT_PROS.ft + fv*W_FT_PROS.fv;
  else if (expert != null)
    base = s26*W_FT.s26 + s28*W_FT.s28 + expert*W_FT.ft;
  else if (fv != null)
    base = s26*W_PROS.s26 + s28*W_PROS.s28 + fv*W_PROS.fv;
  else
    base = s26*W_NOFT.s26 + (s28*NOFT_S28_DISCOUNT)*W_NOFT.s28 + (dyn*NOFT_DYN_DISCOUNT)*W_NOFT.dyn;

  // Durability proxy: penalize players projected for limited playing time.
  // IL players are already discounted via IL_2026_DISCOUNT so skip them.
  let durabilityDisc = 1.0;
  if (!player.il) {
    const isRP = player.eligible.every(p => p === "RP");
    const fullPT = player.type === "P" ? (isRP ? 65 : 160) : 500;
    const projPT = player.type === "P" ? (player.projIP ?? fullPT) : (player.projPA ?? fullPT);
    durabilityDisc = 0.80 + 0.20 * Math.min(1.0, projPT / fullPT);
  }

  // Ceiling bonus: gap between projected 2028 ceiling and current 2026 floor.
  // Uses s28 directly (already blended with FV/IL corrections at source).
  const ceilingBonus = Math.min(Math.max(0, (s28 - s26)) * 0.3, 3.0) * posDiscount;
  return Math.round((base * catMult * posDiscount * durabilityDisc + ceilingBonus) * 10) / 10;
}

// Positional scarcity: slope-based VOR
// Uses least-squares regression on rank vs. score to measure how steeply
// values drop at this position, then computes VOR vs. replacement level.
function calcPositionalScarcity(player, available, catNeed, drafted = [], totalTeams = 12) {
  const posRanked = [...player.eligible].sort(
    (a, b) => POS_SCARCITY_ORDER.indexOf(a) - POS_SCARCITY_ORDER.indexOf(b)
  );
  const scarcePos = posRanked[0];
  const posPool = available
    .filter(p => p.name !== player.name && p.eligible.includes(scarcePos))
    .map(p => calcBaseScore(p, catNeed))
    .sort((a, b) => b - a);

  // Replacement level = actual # of this position already drafted (keepers + live picks)
  // Falls back to roster-slot estimate if no draft data yet.
  const slotsPerPos = { C:1, "1B":1, "2B":1, "3B":1, SS:1, LF:1, CF:1, RF:1, Util:1, SP:4, RP:2 };
  const actualDrafted = drafted.filter(p => p.eligible?.includes(scarcePos)).length;
  const draftedAtPos = actualDrafted > 0 ? actualDrafted : (slotsPerPos[scarcePos] || 1) * totalTeams;
  const replacementIdx = Math.min(draftedAtPos, posPool.length - 1);
  const replacementVal = posPool[replacementIdx] ?? (posPool[posPool.length - 1] ?? 0);

  // Dropoff slope via least-squares regression (steeper = scarcer position)
  const n = posPool.length;
  let slope = 0;
  if (n >= 3) {
    const meanX = (n - 1) / 2;
    const meanY = posPool.reduce((s, v) => s + v, 0) / n;
    let num = 0, den = 0;
    posPool.forEach((v, i) => { num += (i - meanX) * (v - meanY); den += (i - meanX) ** 2; });
    slope = den > 0 ? num / den : 0;
  }
  // Normalize slope bonus: steeper drop = higher bonus (capped at 1.0)
  const slopeBonus = Math.min(Math.abs(slope) * 0.5, 1.0);

  const playerScore = calcBaseScore(player, catNeed);
  const vor = (playerScore - replacementVal) + slopeBonus;
  return { scarcePos, vor: Math.round(vor * 10) / 10, depth: posPool.length };
}

// League scarcity: how fast is this tier/position being depleted?
function calcLeagueScarcity(player, available, targets) {
  const totalAtPos = targets.filter(p => p.eligible.some(e => player.eligible.includes(e))).length;
  const availAtPos = available.filter(p => p.eligible.some(e => player.eligible.includes(e))).length;
  const depletionRate = 1 - (availAtPos / totalAtPos);
  return Math.round(depletionRate * 100);
}

// Urgency: probability player is gone by next pick
// Uses live position depletion rate (how fast this pos is being taken)
// calibrated to actual picks-away from your next turn.
function calcUrgency(player, currentPick, available, myPicks, targets, draftStartPick) {
  const nextMyPick = myPicks.find(p => p > currentPick);
  if (!nextMyPick) return 0;
  const picksAway = nextMyPick - currentPick;

  const scarcePos = [...player.eligible].sort(
    (a, b) => POS_SCARCITY_ORDER.indexOf(a) - POS_SCARCITY_ORDER.indexOf(b)
  )[0];
  const totalAtPos = targets.filter(p => p.eligible.includes(scarcePos)).length;
  const availAtPos = available.filter(p => p.eligible.includes(scarcePos)).length;
  const depletionRate = totalAtPos > 0 ? (totalAtPos - availAtPos) / totalAtPos : 0;

  const picksElapsed = Math.max(currentPick - draftStartPick, 1);
  const tierFloor = { keep6: 0.12, keep12: 0.07, bridge: 0.08, maybe: 0.04, specialist: 0.03 };
  const baseRate = Math.max(depletionRate / picksElapsed, tierFloor[player.tier] || 0.05);

  // Adjust by how "hot" this position is (high depletion = teams targeting it)
  const demandMultiplier = 1 + depletionRate;
  const adjustedRate = Math.min(baseRate * demandMultiplier, 0.25);

  // P(gone) = 1 - (1 - rate)^picksAway
  const probGone = 1 - Math.pow(1 - adjustedRate, picksAway);
  return Math.round(probGone * 100);
}

// Final adjusted score shown in UI
function calcDraftNowScore(player, available, livePicks, currentPick, catNeed, filledPositions, drafted = [], myPicks = [], targets = [], draftStartPick = 1, totalTeams = 12) {
  const base = calcBaseScore(player, catNeed);
  const { vor } = calcPositionalScarcity(player, available, catNeed, drafted, totalTeams);
  const urgency = calcUrgency(player, currentPick, available, myPicks, targets, draftStartPick) / 100;
  const draftProgress = Math.min(1.0, Math.max(0, currentPick - draftStartPick) / (totalTeams * 4));
  const urgencyBonus = urgency * 1.5 * (0.4 + 0.6 * draftProgress);
  const vorBonus = Math.min(Math.max(vor * 0.3, 0), 0.3);
  let final = base + urgencyBonus + vorBonus;
  // Needs mode: discount players whose eligible positions are all already filled
  if (filledPositions && player.eligible.length > 0 &&
      player.eligible.every(p => filledPositions.has(p))) {
    final *= NEEDS_DISCOUNT;
  }
  return Math.round(final * 10) / 10;
}

// ─── STYLE CONSTANTS ──────────────────────────────────────────────────────────
const TIER_COLOR = {keep6:"#f59e0b",keep12:"#22c55e",bridge:"#60a5fa",maybe:"#c084fc",specialist:"#f472b6"};
const TIER_LABEL = {keep6:"Keep-6 🔒",keep12:"Keep-12",bridge:"Bridge",maybe:"Maybe",specialist:"Specialist"};
const CAT_NEED_COLOR = {0:"#1e293b",1:"#475569",2:"#60a5fa",3:"#f87171"};
const CAT_STATUS_COLOR = {strong:"#22c55e",ok:"#60a5fa",thin:"#84cc16",missing:"#f87171"};


// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function DraftAssistant({ config }) {
  // ── Derived league constants ─────────────────────────────────────────────
  const draftMode      = config.draftMode !== false;
  const myTeam         = config.draftOrder[config.mySlot - 1];
  const totalTeams     = config.totalTeams;
  const totalRounds    = config.totalRounds;
  const draftStartPick = config.draftStartPick;
  const draftOrder     = config.draftOrder;
  const keeperPicks    = config.keeperPicks;
  const baseCatNeed    = config.baseCatNeed;
  const hitCats        = config.hittingCats;
  const pitchCats      = config.pitchingCats;

  const getRound     = (pick) => Math.ceil(pick / totalTeams);
  const getPickOwner = (pick) => {
    if (config.pickOrder) {
      const round = Math.ceil(pick / totalTeams);
      const pos   = (pick - 1) % totalTeams;
      return config.pickOrder[round - 1]?.[pos] ?? null;
    }
    const round = getRound(pick);
    const pos   = (pick - 1) % totalTeams;
    return draftOrder[round % 2 === 0 ? (totalTeams - 1 - pos) : pos];
  };
  const myPicks = useMemo(() => {
    if (config.myPicks) return config.myPicks;
    const picks = [];
    for (let p = draftStartPick; p <= totalTeams * totalRounds; p++)
      if (getPickOwner(p) === myTeam) picks.push(p);
    return picks;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.myPicks, draftStartPick, totalTeams, totalRounds, myTeam, draftOrder.join(",")]);

  const [neutralMode, setNeutralMode] = useState(false);

  // ── Per-league score remapping ───────────────────────────────────────────
  const leagueTargets = useMemo(() => {
    const base   = getTargets(config.leagueName);
    const prefix = config.scorePrefix;
    // Fast path: no remapping needed
    if (!prefix && !neutralMode) return base;
    return base.map(p => {
      let s26    = prefix ? (p[`score2026_${prefix}`] ?? p.score2026) : p.score2026;
      let dyn    = prefix ? (p[`scoreDyn_${prefix}`]  ?? p.scoreDyn)  : p.scoreDyn;
      let s28raw = prefix ? (p[`score2028_${prefix}`] ?? p.score2028) : p.score2028;
      // Neutral override for hitters (9x9 only; 5x5 already has equal weights)
      if (neutralMode && !prefix && p.type === "H") {
        s26    = p.score2026_neutral ?? s26;
        dyn    = p.scoreDyn_neutral  ?? dyn;
        s28raw = p.score2028_neutral ?? s28raw;
      }
      const s28 = computeBlendedScore2028(p, s28raw, dyn);
      const cats = prefix ? (p.cats_5x5 ?? p.cats) : p.cats;
      return { ...p, score2026: s26, scoreDyn: dyn, score2028: s28, cats, tier: inferTier({...p, score2026: s26, scoreDyn: dyn}) };
    });
  }, [config.scorePrefix, neutralMode]);

  const leagueMeta = useMemo(() => getLeagueMeta(config.leagueName), [config.leagueName]);

  const [livePicks, setLivePicks] = useState({});
  const [myDrafted, setMyDrafted] = useState([]);
  const [playerNotes, setPlayerNotes] = useState({});
  const [currentPick, setCurrentPick] = useState(draftStartPick);
  const [pickInput, setPickInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [compareList, setCompareList] = useState([]);
  const [posFilter, setPosFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dns");
  const [search, setSearch] = useState("");
  const lsKey = `watchList_${config.leagueName}`;
  const [watchList, setWatchList] = useState(() => {
    try { return JSON.parse(localStorage.getItem(lsKey) || "[]"); } catch { return []; }
  });
  const dragWatchIdx = useRef(null);
  useEffect(() => { localStorage.setItem(lsKey, JSON.stringify(watchList)); }, [watchList]);
  const [tab, setTab] = useState(config.draftMode !== false ? "board" : "inseason");
  const [rightTab, setRightTab] = useState("watch");
  const [syncStatus, setSyncStatus] = useState(null); // null | "loading" | {runUrl} | "error"
  const [rosterSearch, setRosterSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editingNote, setEditingNote] = useState(null);
  const [needsMode, setNeedsMode] = useState(false);
  const [histPos, setHistPos] = useState("All");
  const [histScore, setHistScore] = useState("dns");
  const [fvFilter, setFvFilter] = useState(null); // null | 40 | 45 | 50 | 55 | 60
  const [noteInput, setNoteInput] = useState("");
  const [catStatus, setCatStatus] = useState(config.myCatStatus);
  const [catNeed, setCatNeed] = useState(baseCatNeed);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(null);
  const oppLsKey = `opp_${config.leagueName}`;
  const [inSeasonOpponent, setInSeasonOpponent] = useState(() => localStorage.getItem(oppLsKey) || null);
  const [inSeasonTab, setInSeasonTab] = useState("matchup");
  const [catStandingsCat, setCatStandingsCat] = useState("R");
  const [tradeGive, setTradeGive] = useState([]);
  const [tradeReceive, setTradeReceive] = useState([]);
  const [tradeSearch, setTradeSearch] = useState("");
  const [tradeSearchSide, setTradeSearchSide] = useState("give");
  useEffect(() => {
    if (inSeasonOpponent) localStorage.setItem(oppLsKey, inSeasonOpponent);
    else localStorage.removeItem(oppLsKey);
  }, [inSeasonOpponent, oppLsKey]);
  // Auto-populate opponent from scoreboard on first load (if nothing saved)
  useEffect(() => {
    if (inSeasonOpponent || !leagueMeta.scoreboard?.matchups) return;
    const myMatchup = leagueMeta.scoreboard.matchups.find(m => m.teams.some(t => t.team_name === myTeam));
    if (myMatchup) {
      const opp = myMatchup.teams.find(t => t.team_name !== myTeam);
      if (opp) setInSeasonOpponent(opp.team_name);
    }
  }, []); // run once on mount
  const [mlbSchedule, setMlbSchedule] = useState(null);
  const pickInputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (document.activeElement === pickInputRef.current) return;
      if (e.key === "/") { e.preventDefault(); pickInputRef.current?.focus(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Recompute dynamic category needs whenever my roster changes
  useEffect(() => {
    setCatNeed(computeDynamicCatNeed(myDrafted, leagueTargets, baseCatNeed));
  }, [myDrafted]);

  // Fetch MLB schedule when in-season tab opens
  useEffect(() => {
    if (tab !== "inseason" || (mlbSchedule !== null && Object.keys(mlbSchedule || {}).length > 0)) return;
    const today = new Date();
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
    const fmt = d => d.toISOString().slice(0, 10);
    const nextWeekEnd = new Date(monday);
    nextWeekEnd.setDate(monday.getDate() + 13);
    const thisWeekEnd = new Date(monday);
    thisWeekEnd.setDate(monday.getDate() + 6);
    fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${fmt(monday)}&endDate=${fmt(nextWeekEnd)}&gameType=R&hydrate=team`)
      .then(r => r.json())
      .then(data => {
        const counts = {};
        data.dates?.forEach(d => {
          const gameDate = new Date(d.date + "T12:00:00");
          const isThis = gameDate <= thisWeekEnd;
          d.games?.forEach(g => {
            const home = g.teams?.home?.team?.abbreviation;
            const away = g.teams?.away?.team?.abbreviation;
            if (!home || !away) return;
            [[home, `vs ${away}`], [away, `@ ${home}`]].forEach(([org, opp]) => {
              if (!counts[org]) counts[org] = { thisWeek: 0, nextWeek: 0, thisWeekOpps: [], nextWeekOpps: [] };
              if (isThis) { counts[org].thisWeek++; counts[org].thisWeekOpps.push(opp); }
              else { counts[org].nextWeek++; counts[org].nextWeekOpps.push(opp); }
            });
          });
        });
        setMlbSchedule(counts);
      })
      .catch(() => setMlbSchedule({}));
  }, [tab, mlbSchedule]);

  const allTaken = useMemo(() =>
    new Set([...keeperPicks.map(p=>normalizeName(p.player)), ...Object.values(livePicks).map(normalizeName)]),
    [livePicks, keeperPicks]
  );

  // Post-draft: if targets.json has Yahoo roster data, use it for availability
  const hasYahooRosters = useMemo(() => leagueTargets.some(p => p.rostered != null), [leagueTargets]);

  const available = useMemo(() =>
    hasYahooRosters
      ? leagueTargets.filter(t => !t.rostered)
      : leagueTargets.filter(t => !allTaken.has(normalizeName(t.name))),
    [allTaken, leagueTargets, hasYahooRosters]
  );

  // My roster from Yahoo data (post-draft)
  const myYahooRoster = useMemo(() =>
    hasYahooRosters ? leagueTargets.filter(p => p.owner === myTeam) : [],
    [leagueTargets, myTeam, hasYahooRosters]
  );

  const filledPositions = useMemo(() => getFilledPositions(myDrafted, leagueTargets, keeperPicks, myTeam), [myDrafted, leagueTargets, keeperPicks, myTeam]);

  // Scored and sorted available targets — recalculates live as catNeed evolves
  const scoredAvailable = useMemo(() => {
    const drafted = leagueTargets.filter(t => !available.some(a => a.name === t.name));

    const withScores = available.map(t => ({
      ...t,
      baseScore: calcBaseScore(t, catNeed),
      draftNowScore: calcDraftNowScore(t, available, livePicks, currentPick, catNeed, needsMode ? filledPositions : null, drafted, myPicks, leagueTargets, draftStartPick, totalTeams),
      scarcity: calcPositionalScarcity(t, available, catNeed, drafted, totalTeams),
      urgency: calcUrgency(t, currentPick, available, myPicks, leagueTargets, draftStartPick),
      leagueDepletion: calcLeagueScarcity(t, available, leagueTargets),
    }));

    // Second pass: steal score = DNS vs. expected DNS at player's ADP
    // Expected DNS = average DNS of players within ±15 ADP of this player
    const adpPool = withScores.filter(t => t.fpAdp != null).sort((a, b) => a.fpAdp - b.fpAdp);
    const expectedDnsAtAdp = (adp) => {
      const nearby = adpPool.filter(p => Math.abs(p.fpAdp - adp) <= 15);
      if (nearby.length < 3) return null;
      return nearby.reduce((s, p) => s + p.draftNowScore, 0) / nearby.length;
    };

    return withScores.map(t => ({
      ...t,
      stealScore: t.fpAdp != null
        ? Math.round((t.draftNowScore - (expectedDnsAtAdp(t.fpAdp) ?? t.draftNowScore)) * 10) / 10
        : null,
    })).sort((a, b) => b.draftNowScore - a.draftNowScore);
  }, [available, livePicks, currentPick, catNeed, needsMode, filledPositions]);

  const OF_POSITIONS = ["LF","CF","RF"];
  const filtered = useMemo(() => {
    const q = normalizeName(search);
    const f = scoredAvailable.filter(t => {
      if (q && !normalizeName(t.name).includes(q)) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (fvFilter != null) {
        const raw = FV_RAW[t.prospectFV] ?? null;
        if (raw == null || raw < fvFilter) return false;
      }
      if (posFilter === "all") return true;
      if (posFilter === "OF") return t.eligible.some(p => OF_POSITIONS.includes(p));
      return t.eligible.includes(posFilter);
    });
    if (sortBy === "2026") return [...f].sort((a, b) => b.score2026 - a.score2026);
    if (sortBy === "2028") return [...f].sort((a, b) => (b.score2028 ?? 0) - (a.score2028 ?? 0));
    if (sortBy === "ftdyn") return [...f].sort((a, b) => (b.scoreFTDyn ?? -1) - (a.scoreFTDyn ?? -1));
    if (sortBy === "espn")  return [...f].sort((a, b) => (a.espnRank ?? 9999) - (b.espnRank ?? 9999));
    if (sortBy === "adp")   return [...f].sort((a, b) => (a.fpAdp ?? 9999) - (b.fpAdp ?? 9999));
    if (sortBy === "zips") return [...f].sort((a, b) => (b.scoreZiPS ?? -1) - (a.scoreZiPS ?? -1));
    return f; // "dns" — already sorted
  }, [scoredAvailable, typeFilter, posFilter, sortBy, search, fvFilter]);

  const currentRound = getRound(currentPick);
  const isMyClock = myPicks.includes(currentPick);
  const nextMine = myPicks.find(p => p >= currentPick);
  const until = nextMine ? nextMine - currentPick : 0;
  const snakePicks = myPicks.filter(p => p >= currentPick).slice(0, 4);
  const lateAlerts = scoredAvailable.filter(t => t.tier === "keep6" && t.urgency >= 60);

  // Watch list toggle — auto-switch right panel to Watch tab
  const toggleWatch = useCallback((name) => {
    setWatchList(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
    setRightTab("watch");
  }, []);

  // DNS rank → round value indicator (how many rounds early/late vs. market)
  const dnsRankMap = useMemo(() => {
    const m = {}; scoredAvailable.forEach((p, i) => { m[p.name] = i + 1; }); return m;
  }, [scoredAvailable]);

  // Positional depth: quality options remaining + how many I have vs. need
  // Starting roster slots per position (OF = LF+CF+RF combined)
  const OF_POS = ["LF","CF","RF"];
  const POS_SLOTS = { C:1, "1B":1, "2B":1, "3B":1, SS:1, OF:3, SP:4, RP:2 };
  const posDepth = useMemo(() => {
    const myPlayers = [
      ...keeperPicks.filter(k => k.team === myTeam)
        .map(k => leagueTargets.find(t => t.name === k.player)).filter(Boolean),
      ...myDrafted.map(name => leagueTargets.find(t => t.name === name)).filter(Boolean),
    ];
    return ["C","1B","2B","3B","SS","OF","SP","RP"].map(pos => {
      const isOF = pos === "OF";
      const pool = scoredAvailable.filter(p =>
        isOF ? p.eligible.some(e => OF_POS.includes(e)) : p.eligible.includes(pos)
      );
      const myCount = myPlayers.filter(p =>
        isOF ? p.eligible.some(e => OF_POS.includes(e)) : p.eligible.includes(pos)
      ).length;
      const slots = POS_SLOTS[pos] ?? 1;
      const need = Math.max(0, slots - myCount);
      const quality = pool.filter(p => p.draftNowScore >= 4.5).length;
      return { pos, myCount, slots, need, quality };
    });
  }, [scoredAvailable, myDrafted]);

  // Category projection: my projected rank in each category vs all teams
  const catProjection = useMemo(() => {
    const teamCoverage = {};
    draftOrder.forEach(team => {
      const roster = (hasYahooRosters && !draftMode)
        ? leagueTargets.filter(p => p.owner === team)
        : [
            ...keeperPicks.filter(p => p.team === team)
              .map(kp => leagueTargets.find(t => normalizeName(t.name) === normalizeName(kp.player)))
              .filter(Boolean),
            ...(team === myTeam
              ? myDrafted.map(n => leagueTargets.find(t => t.name === n)).filter(Boolean)
              : []),
          ];
      const scores = {};
      [...hitCats, ...pitchCats].forEach(cat => {
        scores[cat] = roster.filter(p => p.cats?.includes(cat)).reduce((s, p) => s + p.score2026, 0);
      });
      teamCoverage[team] = scores;
    });
    return [...hitCats, ...pitchCats].map(cat => {
      const myScore = teamCoverage[myTeam]?.[cat] || 0;
      const allScores = draftOrder.map(t => teamCoverage[t]?.[cat] || 0).sort((a, b) => b - a);
      const rank = allScores.findIndex(s => s <= myScore) + 1;
      const max = allScores[0] || 1;
      return { cat, myScore, rank, max };
    });
  }, [myDrafted, leagueTargets, hasYahooRosters, draftMode]);

  // Category gap vs opponent — weekly projected stats scaled by schedule
  const catGapAnalysis = useMemo(() => {
    if (!inSeasonOpponent || !hasYahooRosters) return null;
    const myRosterFull = leagueTargets.filter(p => p.owner === myTeam);
    const oppRoster    = leagueTargets.filter(p => p.owner === inSeasonOpponent);
    const sched = mlbSchedule && Object.keys(mlbSchedule).length > 0 ? mlbSchedule : null;
    const myStats  = computeWeeklyStats(myRosterFull, sched);
    const oppStats = computeWeeklyStats(oppRoster,    sched);
    return [...hitCats, ...pitchCats].map(cat => {
      const myVal  = myStats[cat]  ?? null;
      const oppVal = oppStats[cat] ?? null;
      if (myVal == null && oppVal == null) return null;
      const lowerBetter = LOWER_BETTER.has(cat);
      const gap     = myVal != null && oppVal != null ? myVal - oppVal : null;
      const winning = gap != null ? (lowerBetter ? gap < 0 : gap > 0) : null;
      const absDiff = gap != null ? Math.abs(gap) : 0;
      const close   = absDiff < (CLOSE_THRESH[cat] ?? Infinity);
      return { cat, myVal, oppVal, gap, winning, lowerBetter, close, isScheduled: sched != null };
    }).filter(Boolean);
  }, [inSeasonOpponent, leagueTargets, myTeam, hitCats, pitchCats, mlbSchedule, hasYahooRosters]);

  // Roster holes — positions below healthy threshold
  const rosterHoles = useMemo(() => {
    if (!hasYahooRosters || draftMode !== false) return [];
    const THRESHOLDS = { SP: 4, C: 1, "1B": 1, "2B": 1, "3B": 1, SS: 1, OF: 3 };
    const OF_POS = new Set(["LF", "CF", "RF"]);
    const healthy = {}, total = {};
    myYahooRoster.forEach(p => {
      const elig = p.eligible || [];
      const positions = [...elig.filter(e => !OF_POS.has(e)), ...(elig.some(e => OF_POS.has(e)) ? ["OF"] : [])];
      positions.forEach(pos => {
        if (!(pos in THRESHOLDS)) return;
        total[pos] = (total[pos] || 0) + 1;
        if (!p.il) healthy[pos] = (healthy[pos] || 0) + 1;
      });
    });
    return Object.entries(THRESHOLDS)
      .filter(([pos, thresh]) => (healthy[pos] || 0) < thresh)
      .map(([pos, thresh]) => ({
        pos, thresh,
        healthy: healthy[pos] || 0,
        total:   total[pos]   || 0,
        topFA: scoredAvailable
          .filter(p => pos === "OF" ? p.eligible?.some(e => OF_POS.has(e)) : p.eligible?.includes(pos))
          .slice(0, 4),
      }));
  }, [myYahooRoster, scoredAvailable, hasYahooRosters, draftMode]);

  // IL/NA slot optimizer
  const ilOptimizer = useMemo(() => {
    if (!hasYahooRosters || draftMode !== false) return null;
    const IL_SLOTS = new Set(["IL", "IL10", "IL15", "IL60", "NA"]);
    const injured = myYahooRoster.filter(p => p.il);
    const healthyOnIL = myYahooRoster.filter(p => !p.il && p.selected_position && IL_SLOTS.has(p.selected_position));
    const injuredNotOnIL = myYahooRoster.filter(p => p.il && p.selected_position && !IL_SLOTS.has(p.selected_position));
    return { injured, healthyOnIL, injuredNotOnIL };
  }, [myYahooRoster, hasYahooRosters, draftMode]);

  // Trade analyzer
  const tradeAnalysis = useMemo(() => {
    if (!tradeGive.length && !tradeReceive.length) return null;
    const scoreKeys = ["score2026", "score2028", "scoreDyn"];
    const giving    = tradeGive.map(n => leagueTargets.find(p => p.name === n)).filter(Boolean);
    const receiving = tradeReceive.map(n => leagueTargets.find(p => p.name === n)).filter(Boolean);
    const scoreDelta = {};
    scoreKeys.forEach(k => {
      const give = giving.reduce((s, p) => s + (p[k] || 0), 0);
      const recv = receiving.reduce((s, p) => s + (p[k] || 0), 0);
      scoreDelta[k] = { give: +give.toFixed(1), recv: +recv.toFixed(1), net: +(recv - give).toFixed(1) };
    });
    const RATE_CATS = new Set(["AVG", "OBP", "SLG", "ERA", "WHIP", "K/9", "BB/9"]);
    const allCats = [...(config.hittingCats || []), ...(config.pitchingCats || [])];
    const catDelta = {};
    allCats.filter(c => !RATE_CATS.has(c)).forEach(c => {
      const lose = giving.reduce((s, p) => s + (p.projStats?.[c] ?? p.yahooProj?.[c] ?? 0), 0);
      const gain = receiving.reduce((s, p) => s + (p.projStats?.[c] ?? p.yahooProj?.[c] ?? 0), 0);
      catDelta[c] = +(gain - lose).toFixed(1);
    });
    return { giving, receiving, scoreDelta, catDelta };
  }, [tradeGive, tradeReceive, leagueTargets, config]);

  // Per-player weekly projections for Lineup tab
  const computeLineup = useCallback((roster) => {
    return roster.map(p => {
      const proj = p.projStats;
      const games = mlbSchedule?.[p.org]?.thisWeek ?? null;
      const isH  = p.type === "H";
      const isRP = !isH && (p.eligible||[]).every(e => e === "RP");
      const isSP = !isH && !isRP;
      let weekStats = {}, weeklyValue = 0, starts = null;
      if (proj) {
        if (isH) {
          const scale = (games ?? 6.2) / 162;
          HIT_COUNT.forEach(c => { if (proj[c] != null) weekStats[c] = proj[c] * scale; });
          HIT_RATE.forEach(c => { if (proj[c] != null) weekStats[c] = proj[c]; });
          weeklyValue = (weekStats.R||0) + (weekStats.HR||0)*2 + (weekStats.RBI||0) + (weekStats.SB||0);
        } else if (isSP) {
          const seasonGS = Math.max(1, (proj.IP ?? 150) / 5.5);
          const scale = (games ?? 6.2) / 5 / seasonGS;
          starts = Math.max(0, Math.min(2, Math.round((games ?? 0) / 5)));
          PIT_COUNT.forEach(c => { if (proj[c] != null) weekStats[c] = proj[c] * scale; });
          const weekIP = (proj.IP ?? 0) * scale;
          if (weekIP > 0) PIT_RATE.forEach(c => { if (proj[c] != null) weekStats[c] = proj[c]; });
          weeklyValue = (weekStats.K||0) + (starts||0)*2 - (weekStats.ERA||4)*0.5;
        } else {
          const scale = (games ?? 6.2) / 162;
          PIT_COUNT.forEach(c => { if (proj[c] != null) weekStats[c] = proj[c] * scale; });
          weeklyValue = (weekStats.K||0) + (weekStats.NSVH||0)*1.5;
        }
      }
      return { ...p, games, starts, weekStats, weeklyValue };
    }).sort((a,b) => b.weeklyValue - a.weeklyValue);
  }, [mlbSchedule]);

  // Team rosters from keepers
  const teamRosters = useMemo(() => {
    const rosters = {};
    draftOrder.filter(t => t !== myTeam).forEach(team => {
      rosters[team] = keeperPicks.filter(p => p.team === team);
    });
    return rosters;
  }, [draftOrder, myTeam, keeperPicks]);

  const handlePickInput = (val) => {
    setPickInput(val);
    if (val.length < 2) { setSuggestions([]); return; }
    const lower = normalizeName(val);
    const allNames = [...new Set([...leagueTargets.map(t=>t.name), ...keeperPicks.map(p=>p.player)])];
    const matches = allNames.filter(n => normalizeName(n).includes(lower) && !allTaken.has(normalizeName(n))).slice(0, 5);
    setSuggestions(matches);
  };

  const record = () => {
    if (!pickInput.trim()) return;
    const name = pickInput.trim();
    const mine = getPickOwner(currentPick) === myTeam;
    setLivePicks(prev => ({...prev, [currentPick]: name}));
    if (mine) setMyDrafted(prev => [...prev, name]);
    setPickInput(""); setSuggestions([]);
    setCurrentPick(p => p + 1);
    setTimeout(() => pickInputRef.current?.focus(), 50);
  };

  const reset = () => {
    setLivePicks({}); setMyDrafted([]); setCurrentPick(draftStartPick);
    setPickInput(""); setSuggestions([]); setCatStatus(config.myCatStatus);
    setCatNeed(baseCatNeed);
  };

  const toggleCompare = useCallback((name) => {
    setCompareList(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name);
      setRightTab("compare");
      if (prev.length >= 2) return [prev[1], name];
      return [...prev, name];
    });
  }, []);

  const myRoster = (hasYahooRosters && !draftMode)
    ? myYahooRoster.map(p => ({name: p.name, kept: false, target: p}))
    : [
        ...keeperPicks.filter(p=>p.team===myTeam).map(p=>({name:p.player,kept:true})),
        ...myDrafted.map(n=>({name:n,kept:false}))
      ].map(p => ({...p, target: leagueTargets.find(t=>t.name===p.name)||null}));

  const [rosterSelected, setRosterSelected] = useState(null);


  // Score bar color
  const scoreColor = (s) => s >= 8 ? "#84cc16" : s >= 6.5 ? "#22c55e" : s >= 5 ? "#60a5fa" : "#64748b";

  // ── Player card renderer (used in board tab) ─────────────────────────────
  const renderCard = (t, idx, isWatched) => {
    const isExpanded = showScoreBreakdown === t.name;
    const rank = dnsRankMap[t.name] ?? 0;
    const roundDelta = Math.round((draftStartPick + rank - 1 - currentPick) / totalTeams);
    const rvColor = roundDelta >= 3 ? "#22c55e" : roundDelta > 0 ? "#84cc16" : roundDelta === 0 ? "#475569" : "#f59e0b";
    const rvLabel = roundDelta > 0 ? `+R${roundDelta}` : roundDelta === 0 ? "~R0" : `-R${Math.abs(roundDelta)}`;
    return (
      <div key={t.name} className="score-row"
        style={{background:"#0d0f16",border:`1px solid ${isWatched?"#f59e0b44":TIER_COLOR[t.tier]+"22"}`,borderLeft:`3px solid ${isWatched?"#f59e0b":TIER_COLOR[t.tier]}`,borderRadius:4,padding:"7px 10px",marginBottom:4,cursor:"pointer"}}
        onClick={()=>setShowScoreBreakdown(isExpanded ? null : t.name)}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:11,color:"#cbd5e1",width:18,textAlign:"right",flexShrink:0}}>#{idx+1}</span>
          {/* Score badges */}
          <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0,alignItems:"center"}}>
            <div style={{background:`${scoreColor(t.draftNowScore)}22`,border:`1px solid ${scoreColor(t.draftNowScore)}44`,borderRadius:4,padding:"1px 6px",minWidth:32,textAlign:"center"}}>
              <span style={{fontSize:9,color:"#cbd5e1"}}>DNS </span>
              <span style={{fontSize:13,fontWeight:700,color:scoreColor(t.draftNowScore)}}>{t.draftNowScore}</span>
            </div>
            <div style={{background:"#1e293b",borderRadius:4,padding:"1px 6px",minWidth:32,textAlign:"center"}}>
              <span style={{fontSize:9,color:"#cbd5e1"}}>26 </span>
              <span style={{fontSize:11,fontWeight:600,color:"#60a5fa"}}>{t.score2026}</span>
            </div>
            {t.score2028 != null && (
              <div style={{background:"#1e293b",borderRadius:4,padding:"1px 6px",minWidth:32,textAlign:"center"}}>
                <span style={{fontSize:9,color:"#cbd5e1"}}>28 </span>
                <span style={{fontSize:11,fontWeight:600,color:"#34d399"}}>{t.score2028}</span>
              </div>
            )}
            {t.scoreFTDyn != null && (
              <div style={{background:"#1e293b",borderRadius:4,padding:"1px 6px",minWidth:32,textAlign:"center"}}>
                <span style={{fontSize:9,color:"#cbd5e1"}}>FT </span>
                <span style={{fontSize:11,fontWeight:600,color:"#a78bfa"}}>{t.scoreFTDyn}</span>
              </div>
            )}
          </div>
          {/* Name + meta */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
              <span style={{fontSize:15,color:"#f1f5f9",fontWeight:500}}>{t.name}</span>
              {t.owner&&<span style={{fontSize:9,color:"#94a3b8",background:"#1e293b",padding:"1px 6px",borderRadius:3}}>{t.owner}</span>}
              {t.il&&<span style={{fontSize:9,color:"#f87171",background:"#7f1d1d33",padding:"1px 4px",borderRadius:3}}>{t.yahoo_status||"IL"}</span>}
              {!t.il&&t.yahoo_status==="DTD"&&<span style={{fontSize:9,color:"#fb923c",background:"#7c2d1233",padding:"1px 4px",borderRadius:3}}>DTD</span>}
              {!t.il&&t.yahoo_status==="O"&&<span style={{fontSize:9,color:"#f87171",background:"#7f1d1d33",padding:"1px 4px",borderRadius:3}}>OUT</span>}
              {t.est&&<span style={{fontSize:9,color:"#e2e8f0",background:"#1e293b",padding:"1px 4px",borderRadius:3}}>EST</span>}
              {t.eligible.map(p=>(
                <span key={p} style={{fontSize:9,color:"#f1f5f9",background:"#1e293b",padding:"1px 5px",borderRadius:3,border:"1px solid #334155"}}>{p}</span>
              ))}
              <span style={{fontSize:10,color:"#cbd5e1"}}>· {t.org}</span>
              {t.age > 0 && <span style={{fontSize:10,color:"#cbd5e1"}}>· {t.age}</span>}
              {t.prospectFV != null && (() => {
                const fvColor = t.prospectFV >= 60 ? "#f59e0b" : t.prospectFV >= 55 ? "#22c55e" : t.prospectFV >= 50 ? "#60a5fa" : "#94a3b8";
                const riskDot = t.prospectRisk === "Low" ? "●" : t.prospectRisk === "Med" ? "●" : t.prospectRisk === "High" ? "●" : "●";
                const riskColor = t.prospectRisk === "Low" ? "#22c55e" : t.prospectRisk === "Med" ? "#f59e0b" : "#f87171";
                return (
                  <span style={{fontSize:9,padding:"1px 6px",borderRadius:3,background:`${fvColor}18`,color:fvColor,border:`1px solid ${fvColor}44`,fontWeight:600}}>
                    FV{t.prospectFV}
                    <span style={{color:riskColor,marginLeft:3}}>{riskDot}</span>
                    {t.prospectETA && <span style={{color:"#cbd5e1",fontWeight:400}}> {t.prospectETA}</span>}
                  </span>
                );
              })()}
              {t.espnRank != null && (
                <span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:"#7c3aed18",color:"#a78bfa",border:"1px solid #7c3aed44",fontWeight:600}}>
                  ESPN #{t.espnRank}
                  {t.espnAscending && <span style={{color:"#34d399",marginLeft:3}} title="At career-best dynasty rank">↑</span>}
                </span>
              )}
              <span style={{fontSize:9,padding:"1px 5px",borderRadius:8,background:`${TIER_COLOR[t.tier]}18`,color:TIER_COLOR[t.tier]}}>{TIER_LABEL[t.tier]}</span>
            </div>
            <div style={{fontSize:10,color:"#cbd5e1",marginTop:1}}>{playerNotes[t.name]||t.note}</div>
          </div>
          {/* Right side: value indicator + urgency + buttons */}
          <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
            <span style={{fontSize:9,color:rvColor,background:`${rvColor}18`,padding:"1px 5px",borderRadius:3,fontWeight:600}}>{rvLabel}</span>
            {t.urgency >= 50 && (
              <span style={{fontSize:9,color:"#f87171",background:"#7f1d1d33",padding:"1px 5px",borderRadius:3}}>{t.urgency}% gone</span>
            )}
            <span style={{fontSize:9,color:"#cbd5e1"}}>VOR {t.scarcity.vor > 0 ? "+":""}{t.scarcity.vor}</span>
            <span style={{fontSize:10,color:"#cbd5e1"}}>{t.type==="H"?"⚾":"⚡"}</span>
            <button className="btn" onClick={e=>{e.stopPropagation();toggleWatch(t.name);}}
              style={{fontSize:11,padding:"1px 5px",background:isWatched?"#f59e0b22":"#1e293b",color:isWatched?"#f59e0b":"#475569",border:isWatched?"1px solid #f59e0b44":"1px solid transparent"}}>
              {isWatched?"★":"☆"}
            </button>
            <button className="btn" onClick={e=>{e.stopPropagation();toggleCompare(t.name);}}
              style={{fontSize:9,padding:"1px 6px",background:compareList.includes(t.name)?"#84cc1622":"#1e293b",color:compareList.includes(t.name)?"#84cc16":"#475569",border:compareList.includes(t.name)?"1px solid #84cc1644":"1px solid transparent"}}>
              {compareList.includes(t.name)?"✓ vs":"vs"}
            </button>
            <button className="btn" onClick={e=>{
              e.stopPropagation();
              const mine = getPickOwner(currentPick) === myTeam;
              setLivePicks(prev => ({...prev, [currentPick]: t.name}));
              if (mine) setMyDrafted(prev => [...prev, t.name]);
              setCurrentPick(p => p + 1);
            }} style={{fontSize:9,padding:"1px 6px",background:"#1e40af44",color:"#60a5fa",border:"1px solid #1e40af"}}>
              draft
            </button>
          </div>
        </div>
        {/* Expanded score breakdown */}
        {isExpanded&&(
          <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #1e293b",display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            <div style={{fontSize:11,color:"#e2e8f0"}}>
              <div style={{color:"#f1f5f9",marginBottom:3,fontSize:10,textTransform:"uppercase",letterSpacing:".06em"}}>Score Breakdown</div>
              <div>Base: <span style={{color:"#f1f5f9"}}>{t.baseScore}</span></div>
              <div>2026{t.il?" (IL)":""}: <span style={{color:"#f1f5f9"}}>{t.il ? Math.round(t.score2026*IL_2026_DISCOUNT*10)/10 : t.score2026}</span>{t.type==="H"&&t.score2026_neutral!=null&&<span style={{color:"#cbd5e1",marginLeft:6,fontSize:10}}>(neutral: {t.score2026_neutral})</span>}</div>
              <div>2028: <span style={{color:"#f1f5f9"}}>{t.score2028??"-"}</span></div>
              {t.scoreFTDyn!=null&&<div>FT Dyn: <span style={{color:"#f1f5f9"}}>{t.scoreFTDyn}</span></div>}
              {t.scoreYahoo!=null&&<div>Yahoo proj: <span style={{color:t.scoreYahoo>t.score2026?"#34d399":t.scoreYahoo<t.score2026?"#f87171":"#94a3b8"}}>{t.scoreYahoo}{t.scoreYahoo>t.score2026?" ↑":t.scoreYahoo<t.score2026?" ↓":""}</span></div>}
              {t.fpAdp!=null&&<div>FP ADP: <span style={{color:"#f1f5f9"}}>#{t.fpRank} (avg {t.fpAdp})</span>{t.stealScore!=null&&<span style={{marginLeft:4,color:t.stealScore>0.5?"#34d399":t.stealScore<-0.5?"#f87171":"#94a3b8"}}>{t.stealScore>0?"+":""}{t.stealScore} steal</span>}</div>}
              {t.espnRank!=null&&<div>ESPN: <span style={{color:"#a78bfa"}}>#{t.espnRank}{t.espnAscending?" ↑ (career-best)":""}{t.espnPrevPeak&&t.espnPrevPeak!==t.espnRank?" (prev peak #"+t.espnPrevPeak+")":""}</span></div>}
              {t.prospectFV!=null&&<div>Prospect: <span style={{color:"#f1f5f9"}}>FV{t.prospectFV} · {t.prospectRisk} risk · ETA {t.prospectETA}{t.prospectRank?" · #"+t.prospectRank:""}</span></div>}
              {(t.projPA!=null&&t.projPA>0&&t.projPA<480)||((t.projIP!=null&&t.projIP>0&&t.projIP<(t.eligible?.every(p=>p==="RP")?62:150)))
                ?<div>Playing time: <span style={{color:"#f59e0b"}}>{t.type==="P"?`${t.projIP} IP`:`${t.projPA} PA`} projected</span></div>
                :null}
              <div>VOR @ {t.scarcity.scarcePos}: <span style={{color:t.scarcity.vor>0?"#22c55e":"#f87171"}}>{t.scarcity.vor>0?"+":""}{t.scarcity.vor}</span></div>
              <div>Urgency bonus: <span style={{color:"#f1f5f9"}}>+{Math.round(t.urgency/100*1.5*10)/10}</span></div>
              <div>Round value: <span style={{color:rvColor}}>{rvLabel}</span></div>
              <div style={{marginTop:4,fontWeight:600,color:scoreColor(t.draftNowScore)}}>DNS: {t.draftNowScore} <span style={{fontWeight:400,color:"#cbd5e1",fontSize:10}}>(#{dnsRankMap[t.name]} overall)</span></div>
            </div>
            <div style={{fontSize:11}}>
              <div style={{color:"#f1f5f9",marginBottom:3,fontSize:10,textTransform:"uppercase",letterSpacing:".06em"}}>Category Fit</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {t.cats.map(c=>{
                  const orig = baseCatNeed[c]||0;
                  const curr = catNeed[c]??orig;
                  const decayed = curr < orig;
                  return (
                    <span key={c} style={{fontSize:9,padding:"1px 5px",borderRadius:8,background:`${CAT_NEED_COLOR[curr]||"#1e293b"}18`,color:CAT_NEED_COLOR[curr]||"#475569",border:decayed?"1px solid #84cc1644":"none"}}>
                      {c} {decayed?`(${orig}→${curr})`:`(${orig})`}
                    </span>
                  );
                })}
              </div>
              <div style={{marginTop:6,fontSize:10,color:"#cbd5e1"}}>
                Pos depth @ {t.scarcity.scarcePos}: {t.scarcity.depth} left
              </div>
              {t.projStats&&(
                <div style={{marginTop:6}}>
                  <div style={{color:"#f1f5f9",marginBottom:3,fontSize:10,textTransform:"uppercase",letterSpacing:".06em"}}>Steamer Proj</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {(t.type==="H"?hitCats:pitchCats).filter(c=>t.projStats[c]!=null).map(c=>{
                      const v=t.projStats[c];
                      const disp=["AVG","OBP","SLG"].includes(c)?v.toFixed(3).replace(/^0/,""):
                                 ["ERA","WHIP"].includes(c)?v.toFixed(2):
                                 ["K/9","BB/9"].includes(c)?v.toFixed(1):v;
                      return <span key={c} style={{fontSize:9,color:"#f1f5f9"}}><span style={{color:"#e2e8f0"}}>{c}:</span> {disp}</span>;
                    })}
                  </div>
                </div>
              )}
              <div style={{marginTop:2,display:"flex",gap:4}}>
                {editingNote===t.name?(
                  <input value={noteInput} onChange={e=>setNoteInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"){setPlayerNotes(p=>({...p,[t.name]:noteInput}));setEditingNote(null);}}}
                    style={{flex:1,fontSize:10}} onClick={e=>e.stopPropagation()}/>
                ):(
                  <button className="btn" style={{background:"#1e293b",color:"#e2e8f0",fontSize:9}} onClick={e=>{e.stopPropagation();setEditingNote(t.name);setNoteInput(playerNotes[t.name]||t.note);}}>
                    edit note
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{fontFamily:"'IBM Plex Mono','Courier New',monospace",background:"#08090d",height:"100vh",color:"#e2e8f0",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:#0f1117}
        ::-webkit-scrollbar-thumb{background:#475569;border-radius:2px}
        .pulse{animation:glow 1.4s ease-in-out infinite}
        @keyframes glow{0%,100%{box-shadow:0 0 0 0 #84cc1655}50%{box-shadow:0 0 0 8px #84cc1600}}
        input,textarea{background:#0f1117;border:1px solid #1e293b;color:#e2e8f0;font-family:'IBM Plex Mono','Courier New',monospace;font-size:12px;padding:5px 8px;border-radius:3px;outline:none}
        input:focus,textarea:focus{border-color:#84cc16}
        .btn{cursor:pointer;border:none;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;letter-spacing:.07em;text-transform:uppercase;padding:5px 9px;border-radius:3px;transition:all .15s}
        .tabn{background:none;border:none;cursor:pointer;padding:8px 12px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;transition:all .15s}
        .sug-item:hover{background:#1e293b}
        .score-row:hover{background:#111520}
      `}</style>

      {/* HEADER */}
      <div style={{background:"#0b0d14",borderBottom:"1px solid #1e293b",padding:"9px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:22,letterSpacing:".15em",color:"#84cc16",fontWeight:700}}>{config.leagueName.toUpperCase()}</span>
          <span style={{color:"#1e293b"}}>|</span>
          <span style={{fontSize:10,color:"#cbd5e1",letterSpacing:".1em"}}>DYNASTY DRAFT · SCORING ENGINE v2</span>
        </div>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:10,color:"#cbd5e1",marginRight:2}}>MY PICKS:</span>
            {snakePicks.map((p,i)=>(
              <div key={p} style={{textAlign:"center",opacity:i===0?1:0.4+i*0.15}}>
                <div style={{fontSize:9,color:"#cbd5e1"}}>R{getRound(p)}</div>
                <div style={{fontSize:13,fontWeight:600,color:i===0&&isMyClock?"#84cc16":"#94a3b8"}}>#{p}</div>
              </div>
            ))}
          </div>
          <div style={{width:1,height:24,background:"#1e293b"}}/>
          {[["PICK",currentPick],["RND",currentRound]].map(([l,v])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontSize:9,color:"#cbd5e1"}}>{l}</div>
              <div style={{fontSize:15,fontWeight:600,color:"#f1f5f9"}}>{v}</div>
            </div>
          ))}
          <div className={isMyClock?"pulse":""} style={{padding:"3px 10px",borderRadius:3,background:isMyClock?"#84cc1622":"#1e293b",border:`1px solid ${isMyClock?"#84cc16":"#1e293b"}`,color:isMyClock?"#84cc16":"#475569",fontSize:11,fontWeight:600,letterSpacing:".08em"}}>
            {isMyClock?"⚡ ON CLOCK":`−${until} picks`}
          </div>
        </div>
      </div>

      {/* ALERT BAR */}
      {lateAlerts.length > 0 && (
        <div style={{background:"#7f1d1d22",borderBottom:"1px solid #dc262622",padding:"4px 16px",display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
          <span style={{fontSize:10,color:"#f87171",letterSpacing:".08em",fontWeight:600}}>⚠ URGENT — Keep-6 targets at risk:</span>
          {lateAlerts.map(t=>(
            <span key={t.name} style={{fontSize:11,color:"#fca5a5",background:"#7f1d1d44",padding:"1px 7px",borderRadius:10}}>
              {t.name} <span style={{opacity:0.6}}>{t.urgency}% gone</span>
            </span>
          ))}
        </div>
      )}

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* LEFT SIDEBAR */}
        <div style={{width:210,background:"#09090e",borderRight:"1px solid #1e293b",display:"flex",flexDirection:"column",flexShrink:0}}>
          {draftMode && <div style={{padding:10,borderBottom:"1px solid #1e293b"}}>
            <div style={{marginBottom:6}}>
              <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".08em",textTransform:"uppercase"}}>Pick #{currentPick} · [/] to focus</div>
              <div style={{fontSize:12,fontWeight:600,color:isMyClock?"#84cc16":"#94a3b8",marginTop:2}}>
                {isMyClock ? "⚡ YOUR PICK" : `🕐 ${getPickOwner(currentPick)}`}
              </div>
            </div>
            <div style={{position:"relative"}}>
              <input ref={pickInputRef} value={pickInput} onChange={e=>handlePickInput(e.target.value)}
                onKeyDown={e=>{
                  if(e.key==="Enter"){record();}
                  if(e.key==="Escape"){setSuggestions([]);setPickInput("");}
                  if(e.key==="ArrowDown"&&suggestions.length){e.preventDefault();setPickInput(suggestions[0]);setSuggestions([]);}
                }}
                placeholder={isMyClock?"Your pick...":"Type player name..."}
                style={{width:"100%",borderColor:isMyClock?"#84cc1644":"#1e293b"}}/>
              {suggestions.length>0&&(
                <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#111318",border:"1px solid #84cc1666",borderTop:"none",borderRadius:"0 0 4px 4px",zIndex:200}}>
                  {suggestions.map(s=>{
                    const t = leagueTargets.find(x=>x.name===s);
                    const scored = scoredAvailable.find(x=>x.name===s);
                    return (
                      <div key={s} className="sug-item" onClick={()=>{setPickInput(s);setSuggestions([]);pickInputRef.current?.focus();}}
                        style={{padding:"5px 8px",fontSize:12,color:"#e2e8f0",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span>{s}</span>
                        <div style={{display:"flex",gap:5,alignItems:"center"}}>
                          {scored&&<span style={{fontSize:9,color:scoreColor(scored.draftNowScore),fontWeight:600}}>{scored.draftNowScore}</span>}
                          {t&&<span style={{fontSize:9,color:TIER_COLOR[t.tier]}}>{TIER_LABEL[t.tier]}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <button className="btn" style={{width:"100%",marginTop:5,background:isMyClock?"#14532d44":"#1e293b",color:isMyClock?"#22c55e":"#94a3b8",border:isMyClock?"1px solid #14532d":"none",fontWeight:600}} onClick={record}>
              {isMyClock?"Record My Pick [Enter]":"Record + Advance [Enter]"}
            </button>
            <div style={{display:"flex",gap:3,marginTop:3}}>
              <button className="btn" style={{flex:1,background:"#1e293b",color:"#e2e8f0"}} onClick={()=>{
                const lastPick = Math.max(...Object.keys(livePicks).map(Number), draftStartPick-1);
                if(lastPick>=draftStartPick){
                  const name=livePicks[lastPick];
                  setLivePicks(prev=>{const n={...prev};delete n[lastPick];return n;});
                  setMyDrafted(prev=>prev.filter(p=>p!==name));
                  setCurrentPick(lastPick);
                }
              }}>← undo</button>
              <button className="btn" style={{flex:1,background:"#450a0a44",color:"#f87171",border:"1px solid #450a0a"}} onClick={reset}>reset</button>
            </div>
          </div>}

          {draftMode && /* Pick tracker */
          <div style={{padding:"6px 10px",borderBottom:"1px solid #1e293b",flexShrink:0}}>
            <div style={{fontSize:9,color:"#cbd5e1",textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>Pick Order</div>
            <div style={{display:"flex",flexDirection:"column",gap:1}}>
              {Array.from({length:18},(_,i)=>currentPick+i-3).filter(p=>p>=draftStartPick&&p<=totalTeams*totalRounds).map(p=>{
                const owner = getPickOwner(p);
                const isMine = owner===myTeam;
                const isCurrent = p===currentPick;
                const isDone = p<currentPick;
                const drafted = livePicks[p];
                return (
                  <div key={p} style={{display:"flex",gap:5,alignItems:"center",padding:"1px 4px",borderRadius:3,
                    background:isCurrent?"#14532d44":isMine&&!isDone?"#14532d22":"transparent",
                    borderLeft:isCurrent?"2px solid #22c55e":isMine&&!isDone?"2px solid #14532d":"2px solid transparent",
                    opacity:isDone?0.4:1}}>
                    <span style={{fontSize:9,color:"#334155",width:22,flexShrink:0}}>#{p}</span>
                    <span style={{fontSize:9,color:isCurrent?"#22c55e":isMine?"#86efac":"#475569",flex:1,fontWeight:isMine?600:400}}>
                      {isMine?"YOU":(owner?.split(" ")[0] ?? "?")}
                    </span>
                    {drafted&&<span style={{fontSize:8,color:"#334155",maxWidth:70,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{drafted.split(" ").slice(-1)[0]}</span>}
                    {isCurrent&&<span style={{fontSize:8,color:"#22c55e"}}>◄</span>}
                  </div>
                );
              })}
            </div>
          </div>}

          {/* Sidebar roster */}
          {!draftMode && hasYahooRosters ? (
            <div style={{flex:1,overflowY:"auto",padding:10}}>
              <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>My Roster ({myYahooRoster.length})</div>
              {(()=>{
                const POS_ORDER = ["C","1B","2B","3B","SS","LF","CF","RF","SP","RP"];
                const groups = {};
                POS_ORDER.forEach(pos => { groups[pos] = []; });
                const bench = [];
                myYahooRoster.forEach(p => {
                  const primary = p.eligible?.[0];
                  if (primary && groups[primary] !== undefined) groups[primary].push(p);
                  else bench.push(p);
                });
                return [...POS_ORDER.map(pos => ({pos, players: groups[pos]})), ...(bench.length?[{pos:"BN",players:bench}]:[])]
                  .filter(({players}) => players.length > 0)
                  .map(({pos, players}) => (
                    <div key={pos} style={{marginBottom:10}}>
                      <div style={{fontSize:9,color:"#475569",textTransform:"uppercase",letterSpacing:".1em",marginBottom:3,paddingBottom:2,borderBottom:"1px solid #1e293b"}}>{pos}</div>
                      {players.map(p => (
                        <div key={p.name} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 5px",marginBottom:2,background:"#0c1218",borderRadius:3,borderLeft:`2px solid ${p.il?"#f87171":"#334155"}`}}>
                          <span style={{fontSize:11,color:p.il?"#94a3b8":"#e2e8f0",flex:1,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{p.name}</span>
                          {p.il&&<span style={{fontSize:8,color:"#f87171",flexShrink:0}}>IL</span>}
                          <span style={{fontSize:10,color:"#64748b",flexShrink:0}}>{p.score2026!=null?(+p.score2026).toFixed(1):"—"}</span>
                        </div>
                      ))}
                    </div>
                  ));
              })()}
            </div>
          ) : draftMode !== false && (
            <div style={{flex:1,overflowY:"auto",padding:10}}>
              <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>My Roster ({myRoster.length}/{totalRounds})</div>
              {myRoster.map((p,i)=>{
                const isSelected = rosterSelected === p.name;
                const t = p.target;
                return (
                  <div key={i}>
                    <div onClick={()=>setRosterSelected(isSelected ? null : p.name)}
                      style={{padding:"3px 7px",marginBottom:2,background:isSelected?(p.kept?"#1e3a5f":"#14532d"):p.kept?"#0c1624":"#0c1a10",borderRadius:3,borderLeft:`2px solid ${p.kept?"#3b82f6":"#22c55e"}`,cursor:"pointer"}}>
                      <div style={{fontSize:12,color:"#e2e8f0"}}>{p.name}</div>
                      <div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:1}}>
                        {t ? t.eligible.map(e=>(
                          <span key={e} style={{fontSize:9,color:"#f1f5f9",background:"#1e293b",padding:"0 4px",borderRadius:2}}>{e}</span>
                        )) : <span style={{fontSize:9,color:"#cbd5e1"}}>?</span>}
                        {p.kept && <span style={{fontSize:9,color:"#3b82f6",marginLeft:2}}>K</span>}
                      </div>
                    </div>
                    {isSelected && t && (
                      <div style={{background:"#0d1829",border:"1px solid #1e3a5f",borderRadius:3,padding:"6px 8px",marginBottom:4,fontSize:11}}>
                        <div style={{display:"flex",gap:6,marginBottom:4,flexWrap:"wrap"}}>
                          {[["DNS", calcBaseScore(t,catNeed)],["26",t.score2026],["28",t.score2028??"-"],["FT",t.scoreFTDyn??"-"],["Age",t.age||"-"]].map(([l,v])=>(
                            <div key={l} style={{textAlign:"center"}}>
                              <div style={{fontSize:9,color:"#cbd5e1"}}>{l}</div>
                              <div style={{fontSize:12,fontWeight:700,color:"#60a5fa"}}>{v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{color:"#cbd5e1",fontSize:10,marginBottom:2}}>{t.note}</div>
                        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                          {t.cats.map(c=><span key={c} style={{fontSize:9,color:"#f1f5f9",background:"#1e293b",padding:"0 4px",borderRadius:2}}>{c}</span>)}
                        </div>
                        <div style={{marginTop:4}}>
                          <span style={{fontSize:9,padding:"1px 5px",borderRadius:8,background:`${TIER_COLOR[t.tier]}18`,color:TIER_COLOR[t.tier]}}>{TIER_LABEL[t.tier]}</span>
                          {t.il && <span style={{fontSize:9,color:"#f87171",marginLeft:4}}>IL</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CENTER */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{background:"#0b0d14",borderBottom:"1px solid #1e293b",display:"flex",alignItems:"center",padding:"0 10px",flexShrink:0}}>
            {[["board","FA Board"],["roster","My Roster"],["depth","Depth"],["cats","Categories"],["teams","Other Teams"],...(draftMode!==false?[["log","Pick Log"]]:[]),...(hasYahooRosters?[["rostered","Rostered"]]:[]),...(!draftMode&&hasYahooRosters?[["lineup","Lineup"],["inseason","In-Season"]]:[])]
            .map(([v,l])=>(
              <button key={v} className="tabn" onClick={()=>setTab(v)}
                style={{color:tab===v?"#84cc16":"#475569",borderBottom:tab===v?"2px solid #84cc16":"2px solid transparent"}}>
                {l}
              </button>
            ))}
            {!draftMode&&hasYahooRosters&&(
              <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
                {syncStatus==="loading"?(
                  <span style={{fontSize:10,color:"#64748b"}}>syncing…</span>
                ):syncStatus&&syncStatus.runUrl?(
                  <><span style={{fontSize:10,color:"#22c55e"}}>✓ syncing</span>
                  <a href={syncStatus.runUrl} target="_blank" rel="noreferrer"
                    style={{fontSize:10,color:"#64748b",textDecoration:"underline"}}>watch</a></>
                ):syncStatus==="error"?(
                  <span style={{fontSize:10,color:"#ef4444"}}>sync failed</span>
                ):null}
                <button onClick={async()=>{
                  setSyncStatus("loading");
                  try {
                    const r = await fetch("/api/trigger-sync",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({league:"all"})});
                    const d = await r.json();
                    setSyncStatus(r.ok?{runUrl:d.runUrl}:"error");
                  } catch { setSyncStatus("error"); }
                }} style={{fontSize:10,background:"#1e293b",color:"#94a3b8",border:"1px solid #334155",
                  borderRadius:3,padding:"2px 8px",cursor:"pointer",fontFamily:"inherit"}}
                  disabled={syncStatus==="loading"}>
                  ↺ Sync Yahoo
                </button>
              </div>
            )}
            {tab==="rostered"&&(
              <div style={{marginLeft:"auto",display:"flex",gap:3,alignItems:"center"}}>
                <input value={rosterSearch} onChange={e=>setRosterSearch(e.target.value)}
                  placeholder="search rostered..."
                  style={{background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",fontSize:11,padding:"3px 8px",width:140,fontFamily:"inherit",outline:"none"}}
                  onKeyDown={e=>e.key==="Escape"&&setRosterSearch("")}/>
              </div>
            )}
            {tab==="board"&&(
              <div style={{marginLeft:(!draftMode&&hasYahooRosters)?"4px":"auto",display:"flex",gap:3,alignItems:"center",flexWrap:"wrap"}}>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="search..."
                  style={{background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",fontSize:11,padding:"3px 8px",width:110,fontFamily:"inherit",outline:"none"}}
                  onKeyDown={e=>e.key==="Escape"&&setSearch("")}/>
                <span style={{color:"#1e293b",margin:"0 2px"}}>|</span>
                {[["dns","DNS"],["2026","2026"],["2028","2028"],["ftdyn","FT Dyn"],["espn","ESPN"],["adp","ADP"],["zips","ZiPS"]].map(([v,l])=>(
                  <button key={v} className="btn" onClick={()=>setSortBy(v)}
                    style={{background:sortBy===v?"#60a5fa22":"#1e293b",color:sortBy===v?"#60a5fa":"#64748b",border:sortBy===v?"1px solid #60a5fa44":"1px solid transparent"}}>
                    {l}
                  </button>
                ))}
                <span style={{color:"#1e293b",margin:"0 2px"}}>|</span>
                {[["all","All"],["H","⚾"],["P","⚡"]].map(([v,l])=>(
                  <button key={v} className="btn" onClick={()=>{setTypeFilter(v);setPosFilter("all");}}
                    style={{background:typeFilter===v&&posFilter==="all"?"#84cc1622":"#1e293b",color:typeFilter===v&&posFilter==="all"?"#84cc16":"#64748b",border:typeFilter===v&&posFilter==="all"?"1px solid #84cc1644":"1px solid transparent"}}>
                    {l}
                  </button>
                ))}
                <span style={{color:"#1e293b",margin:"0 2px"}}>|</span>
                {[["C","C"],["1B","1B"],["2B","2B"],["3B","3B"],["SS","SS"],["LF","LF"],["CF","CF"],["RF","RF"],["OF","OF"],["SP","SP"],["RP","RP"]].map(([v,l])=>(
                  <button key={v} className="btn" onClick={()=>{setPosFilter(v);setTypeFilter("all");}}
                    style={{background:posFilter===v?"#84cc1622":"#1e293b",color:posFilter===v?"#84cc16":"#64748b",border:posFilter===v?"1px solid #84cc1644":"1px solid transparent"}}>
                    {l}
                  </button>
                ))}
                <span style={{color:"#1e293b",margin:"0 2px"}}>|</span>
                <button className="btn" onClick={()=>setNeedsMode(n=>!n)}
                  title="Discount players at positions already filled on your roster"
                  style={{background:needsMode?"#f59e0b22":"#1e293b",color:needsMode?"#f59e0b":"#64748b",border:needsMode?"1px solid #f59e0b44":"1px solid transparent",fontWeight:needsMode?700:400}}>
                  Needs
                </button>
                {!config.scorePrefix&&<button className="btn" onClick={()=>setNeutralMode(n=>!n)}
                  title="Score hitters with equal category weights (ignores personal gaps)"
                  style={{background:neutralMode?"#34d39922":"#1e293b",color:neutralMode?"#34d399":"#64748b",border:neutralMode?"1px solid #34d39944":"1px solid transparent",fontWeight:neutralMode?700:400}}>
                  Neutral
                </button>}
                <span style={{color:"#1e293b",margin:"0 2px"}}>|</span>
                {[[null,"All"],[3.0,"FV40+"],[4.0,"FV45+"],[5.0,"FV50+"],[6.0,"FV55+"],[7.0,"FV60+"]].map(([v,l])=>(
                  <button key={l} className="btn" onClick={()=>setFvFilter(fvFilter===v?null:v)}
                    style={{background:fvFilter===v?"#34d39922":"#1e293b",color:fvFilter===v?"#34d399":"#64748b",border:fvFilter===v?"1px solid #34d39944":"1px solid transparent"}}>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TARGET BOARD */}
          {tab==="board"&&(
            <div style={{flex:1,overflowY:"auto",padding:12}}>
              {/* Positional depth gauge */}
              <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:9,color:"#cbd5e1",letterSpacing:".08em",textTransform:"uppercase",marginRight:2}}>Depth:</span>
                {posDepth.map(({pos, myCount, slots, need, quality}) => {
                  // Color based on quality available vs. how many more I still need
                  const color = need === 0 && myCount > slots ? "#60a5fa"  // filled + backup
                    : need === 0                               ? "#475569"  // filled, no backup
                    : quality >= need * 3                     ? "#22c55e"  // plenty
                    : quality >= need                         ? "#f59e0b"  // enough
                    :                                           "#f87171"; // short
                  return (
                    <div key={pos} style={{display:"flex",flexDirection:"column",alignItems:"center",background:"#0d0f16",border:`1px solid ${color}44`,borderRadius:3,padding:"2px 6px",minWidth:28}}>
                      <span style={{fontSize:9,color:"#cbd5e1"}}>{pos}</span>
                      <span style={{fontSize:10,color:"#e2e8f0"}}>{myCount}/{slots}</span>
                      <span style={{fontSize:11,fontWeight:700,color}}>{quality}</span>
                    </div>
                  );
                })}
              </div>
              {/* Score legend */}
              <div style={{display:"flex",gap:12,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:10,color:"#cbd5e1"}}>DNS = 20/20/30/30 (26/28/Dyn/FT) · +FV: 15/15/20/25/25 · no expert: 15/21/30 discounted · </span>
                {[["≥8.0","#f59e0b","Elite"],["≥6.5","#22c55e","Strong"],["≥5.0","#60a5fa","Solid"],["<5.0","#64748b","Stash"]].map(([r,c,l])=>(
                  <div key={r} style={{display:"flex",alignItems:"center",gap:4,fontSize:10}}>
                    <div style={{width:7,height:7,borderRadius:2,background:c}}/>
                    <span style={{color:"#e2e8f0"}}>{l} {r}</span>
                  </div>
                ))}
                <span style={{fontSize:10,color:"#cbd5e1",marginLeft:4}}>·</span>
                <span style={{fontSize:10,color:"#e2e8f0"}}>⚾ hitter</span>
                <span style={{fontSize:10,color:"#e2e8f0"}}>⚡ pitcher</span>
              </div>

              {filtered.length===0&&<div style={{textAlign:"center",color:"#1e293b",padding:40}}>All targets gone!</div>}
              {filtered.map((t,idx) => renderCard(t, idx, watchList.includes(t.name)))}
            </div>
          )}

          {/* ROSTERED PLAYERS */}
          {tab==="rostered"&&(()=>{
            const q = normalizeName(rosterSearch);
            const rosteredPlayers = leagueTargets
              .filter(p => p.rostered && (!q || normalizeName(p.name).includes(q)))
              .sort((a,b) => (b.score2026??0) - (a.score2026??0))
              .map(p => ({
                draftNowScore: p.score2026 ?? 0,
                baseScore: p.score2026 ?? 0,
                scarcity: {vor: 0, scarcePos: p.eligible?.[0] ?? ""},
                urgency: 0,
                cats: p.eligible ?? [],
                stealScore: null,
                ...p,
              }));
            return (
              <div style={{flex:1,overflowY:"auto",padding:12}}>
                {rosteredPlayers.length===0&&<div style={{textAlign:"center",color:"#475569",padding:40}}>No rostered players found.</div>}
                {rosteredPlayers.map((t,i) => renderCard(t, i, watchList.includes(t.name)))}
              </div>
            );
          })()}

          {/* MY ROSTER */}
          {tab==="roster"&&(()=>{
            const hitters  = myYahooRoster.filter(p => p.type === "H");
            const pitchers = myYahooRoster.filter(p => p.type === "P");
            const POS_ORDER = ["C","1B","2B","3B","SS","LF","CF","RF","SP","RP"];
            const sortRoster = ps => [...ps].sort((a,b) => {
              const ai = POS_ORDER.indexOf(a.eligible?.[0] ?? "");
              const bi = POS_ORDER.indexOf(b.eligible?.[0] ?? "");
              return (ai<0?99:ai) - (bi<0?99:bi);
            });

            // Sum projected stats across roster for each group
            const sumProj = (players, cats, rateCats) => {
              const totals = {};
              let totalIP = 0;
              players.forEach(p => {
                const proj = p.yahooProj || {};
                cats.forEach(c => {
                  if (rateCats.includes(c)) return;
                  totals[c] = (totals[c] || 0) + (proj[c] || 0);
                });
                if (proj.IP) totalIP += proj.IP;
              });
              // Rate stats: IP-weighted for pitchers, simple avg for hitters
              rateCats.forEach(c => {
                const vals = players.map(p => p.yahooProj?.[c]).filter(v => v != null);
                if (!vals.length) return;
                if (c === "ERA" || c === "WHIP" || c === "K/9" || c === "BB/9") {
                  // IP-weighted
                  const weighted = players.reduce((s, p) => s + (p.yahooProj?.[c] ?? 0) * (p.yahooProj?.IP ?? 0), 0);
                  totals[c] = totalIP > 0 ? +(weighted / totalIP).toFixed(3) : 0;
                } else {
                  totals[c] = +(vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(3);
                }
              });
              return totals;
            };

            const hitCatsList  = config.hittingCats  || ["R","H","HR","RBI","SB","TB","AVG","OBP","SLG"];
            const pitchCatsList = config.pitchingCats || ["IP","W","ER","K","ERA","WHIP","K/9","BB/9","NSVH"];
            const hitRateCats  = ["AVG","OBP","SLG"];
            const pitRateCats  = ["ERA","WHIP","K/9","BB/9"];
            const hitTotals    = sumProj(hitters,  hitCatsList,   hitRateCats);
            const pitTotals    = sumProj(pitchers, pitchCatsList, pitRateCats);

            const PlayerRow = ({p}) => {
              const scored = scoredAvailable.find(x => x.name === p.name);
              const dns = scored?.draftNowScore;
              return (
                <div style={{display:"flex",gap:6,padding:"6px 0",borderBottom:"1px solid #0d1117",alignItems:"center"}}>
                  <span style={{fontSize:9,color:"#94a3b8",width:36,flexShrink:0}}>{p.eligible?.[0] ?? "—"}</span>
                  <span style={{flex:1,fontSize:12,color:p.il?"#f87171":"#f1f5f9",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}{p.il&&" ⚠"}</span>
                  {dns != null && <span style={{fontSize:11,color:"#84cc16",width:36,textAlign:"right",flexShrink:0}}>{"DNS:"+dns}</span>}
                  <span style={{fontSize:11,color:"#60a5fa",width:36,textAlign:"right",flexShrink:0}}>{p.score2026 != null ? p.score2026 : "—"}</span>
                  <span style={{fontSize:11,color:"#a78bfa",width:36,textAlign:"right",flexShrink:0,paddingRight:4}}>{p.scoreFTDyn ?? "—"}</span>
                </div>
              );
            };

            const TotalsRow = ({totals, cats}) => (
              <div style={{marginTop:10,padding:"8px 10px",background:"#0d0f16",borderRadius:4,border:"1px solid #1e293b"}}>
                <div style={{fontSize:9,color:"#64748b",letterSpacing:".1em",textTransform:"uppercase",marginBottom:6}}>Projected Totals</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px 14px"}}>
                  {cats.map(c => {
                    const v = totals[c];
                    if (v == null) return null;
                    const needColor = CAT_NEED_COLOR[catNeed[c] ?? 0] || "#475569";
                    return (
                      <div key={c} style={{fontSize:11}}>
                        <span style={{color:"#64748b"}}>{c} </span>
                        <span style={{color:needColor, fontWeight:600}}>{typeof v === "number" ? (Number.isInteger(v) ? v : v.toFixed(3)) : v}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );

            if (!hasYahooRosters) return (
              <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:40,textAlign:"center"}}>
                <div>
                  <div style={{fontSize:13,color:"#f1f5f9",marginBottom:8}}>No Yahoo roster data yet.</div>
                  <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.7}}>
                    Run <code style={{background:"#1e293b",padding:"1px 5px",borderRadius:3,color:"#84cc16"}}>python data/build.py --skip-zar</code> to pull live rosters from Yahoo.
                  </div>
                </div>
              </div>
            );

            return (
              <div style={{flex:1,overflowY:"auto",padding:14}}>
                <div style={{marginBottom:4,display:"flex",gap:20,alignItems:"center"}}>
                  <span style={{fontSize:13,color:"#f1f5f9",fontWeight:600}}>{myTeam}</span>
                  <span style={{fontSize:10,color:"#475569"}}>{myYahooRoster.length} players · {hitters.length}H / {pitchers.length}P</span>
                  <span style={{fontSize:10,color:"#475569",marginLeft:"auto"}}>DNS · 2026 · FT</span>
                </div>

                <div style={{fontSize:9,color:"#64748b",letterSpacing:".1em",textTransform:"uppercase",margin:"10px 0 4px"}}>Hitters</div>
                {sortRoster(hitters).map(p => <PlayerRow key={p.name} p={p} />)}
                <TotalsRow totals={hitTotals} cats={hitCatsList} />

                <div style={{fontSize:9,color:"#64748b",letterSpacing:".1em",textTransform:"uppercase",margin:"18px 0 4px"}}>Pitchers</div>
                {sortRoster(pitchers).map(p => <PlayerRow key={p.name} p={p} />)}
                <TotalsRow totals={pitTotals} cats={pitchCatsList} />
              </div>
            );
          })()}

          {/* CATEGORY TRACKER */}
          {tab==="cats"&&(
            <div style={{flex:1,overflowY:"auto",padding:14}}>
              <div style={{marginBottom:10,fontSize:11,color:"#cbd5e1"}}>
                Need weights update live as you draft. <span style={{color:"#84cc16"}}>Amber = decayed by your picks.</span> Click to manually cycle status.
              </div>
              {[["HITTING",hitCats],["PITCHING",pitchCats]].map(([label,cats])=>(
                <div key={label} style={{marginBottom:18}}>
                  <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>{label}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {cats.map(c=>{
                      const statuses=["missing","thin","ok","strong"];
                      const cur=catStatus[c]||"ok";
                      const origNeed = baseCatNeed[c] || 0;
                      const currNeed = catNeed[c] ?? origNeed;
                      const decayed = currNeed < origNeed;
                      return (
                        <div key={c} onClick={()=>setCatStatus(prev=>({...prev,[c]:statuses[(statuses.indexOf(cur)+1)%statuses.length]}))}
                          style={{cursor:"pointer",padding:"8px 10px",borderRadius:4,background:`${CAT_STATUS_COLOR[cur]}15`,border:`1px solid ${decayed?"#84cc1655":CAT_STATUS_COLOR[cur]+"44"}`,textAlign:"center",minWidth:64,position:"relative"}}>
                          {decayed&&<div style={{position:"absolute",top:3,right:4,width:5,height:5,borderRadius:"50%",background:"#84cc16"}}/>}
                          <div style={{fontSize:13,fontWeight:600,color:CAT_STATUS_COLOR[cur]}}>{c}</div>
                          <div style={{fontSize:9,color:CAT_STATUS_COLOR[cur],opacity:0.7,marginTop:1,textTransform:"uppercase"}}>{cur}</div>
                          {/* Need weight: show original → current if decayed */}
                          <div style={{marginTop:3,display:"flex",justifyContent:"center",alignItems:"center",gap:3}}>
                            {decayed ? (
                              <>
                                <span style={{fontSize:9,color:"#cbd5e1",textDecoration:"line-through"}}>{origNeed}</span>
                                <span style={{fontSize:9,color:"#84cc16"}}>→{currNeed}</span>
                              </>
                            ) : (
                              <span style={{fontSize:9,color:CAT_NEED_COLOR[origNeed]||"#475569"}}>need:{origNeed}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div style={{marginTop:4,padding:"8px 10px",background:"#0d0f16",borderRadius:4,border:"1px solid #1e293b"}}>
                <div style={{fontSize:10,color:"#cbd5e1",marginBottom:4,letterSpacing:".08em",textTransform:"uppercase"}}>Decay Log</div>
                {myDrafted.length === 0
                  ? <div style={{fontSize:11,color:"#1e293b"}}>No picks recorded yet.</div>
                  : myDrafted.map((name, i) => {
                    const t = leagueTargets.find(x => x.name === name);
                    if (!t) return null;
                    return (
                      <div key={i} style={{fontSize:11,color:"#e2e8f0",marginBottom:2,display:"flex",gap:6}}>
                        <span style={{color:"#22c55e"}}>{name}</span>
                        <span style={{color:"#cbd5e1"}}>↓</span>
                        {t.cats.map(c => (
                          <span key={c} style={{color:CAT_NEED_COLOR[catNeed[c]]||"#475569",background:"#1e293b",padding:"0 4px",borderRadius:3,fontSize:10}}>{c}</span>
                        ))}
                      </div>
                    );
                  })
                }
              </div>

              {/* Category Projection */}
              <div style={{marginTop:14}}>
                <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".1em",textTransform:"uppercase",marginBottom:6}}>
                  Projected Standing <span style={{color:"#334155",fontWeight:400}}>— based on keepers + drafted</span>
                </div>
                {[["HITTING",hitCats],["PITCHING",pitchCats]].map(([label,cats])=>(
                  <div key={label} style={{marginBottom:12}}>
                    <div style={{fontSize:9,color:"#334155",letterSpacing:".08em",textTransform:"uppercase",marginBottom:5}}>{label}</div>
                    {cats.map(cat => {
                      const proj = catProjection.find(p => p.cat === cat);
                      if (!proj) return null;
                      const rankColor = proj.rank <= 3 ? "#22c55e" : proj.rank <= 6 ? "#84cc16" : proj.rank <= 9 ? "#f59e0b" : "#f87171";
                      const barW = proj.max > 0 ? Math.round((proj.myScore / proj.max) * 100) : 0;
                      return (
                        <div key={cat} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <span style={{fontSize:10,color:"#e2e8f0",width:36,flexShrink:0}}>{cat}</span>
                          <div style={{flex:1,height:6,background:"#1e293b",borderRadius:3,overflow:"hidden"}}>
                            <div style={{width:`${barW}%`,height:"100%",background:rankColor,borderRadius:3,transition:"width .3s"}}/>
                          </div>
                          <span style={{fontSize:10,fontWeight:600,color:rankColor,width:32,textAlign:"right",flexShrink:0}}>
                            #{proj.rank}/{totalTeams}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div style={{fontSize:9,color:"#334155",marginTop:4}}>
                  Rank is estimated from keeper rosters. Updates live as you record picks.
                </div>
              </div>
            </div>
          )}

          {/* OTHER TEAMS */}
          {tab==="teams"&&(
            <div style={{flex:1,overflowY:"auto",padding:12}}>
              <div style={{fontSize:10,color:"#cbd5e1",marginBottom:10}}>
                {hasYahooRosters && !draftMode ? "Full rosters from Yahoo." : "Keeper rosters R1-10. Use to assess positional pressure and SP scarcity."}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {draftOrder.filter(t=>t!==myTeam).map(team=>{
                  const players = (hasYahooRosters && !draftMode)
                    ? leagueTargets.filter(p => p.owner === team)
                    : null;
                  const keepers = players ? [] : keeperPicks.filter(p=>p.team===team);
                  const drafted = players ? [] : Object.entries(livePicks)
                    .filter(([pick]) => getPickOwner(Number(pick)) === team)
                    .sort((a,b) => Number(a[0])-Number(b[0]))
                    .map(([pick, name]) => {
                      const t = leagueTargets.find(x=>x.name===name);
                      return {pick:Number(pick), name, pos: t?.eligible?.[0] ?? "?"};
                    });
                  const spCount = players
                    ? players.filter(p=>p.eligible?.includes("SP")).length
                    : keepers.filter(p=>p.pos==="SP").length + drafted.filter(p=>p.pos==="SP").length;
                  return (
                    <div key={team} style={{background:"#0d0f16",border:"1px solid #1e293b",borderRadius:4,padding:"8px 10px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                        <span style={{fontSize:11,color:"#f1f5f9",fontWeight:600}}>{team}</span>
                        {spCount>0&&<span style={{fontSize:9,color:"#60a5fa",background:"#1e3a5f33",padding:"1px 5px",borderRadius:3}}>{spCount} SP</span>}
                      </div>
                      {players ? players.map((p,i)=>(
                        <div key={i} style={{display:"flex",gap:6,marginBottom:2,fontSize:11}}>
                          <span style={{color:"#cbd5e1",width:26,flexShrink:0}}>{p.eligible?.[0]??"-"}</span>
                          <span style={{color:"#f1f5f9"}}>{p.name}</span>
                        </div>
                      )) : <>
                        {keepers.map((p,i)=>(
                          <div key={i} style={{display:"flex",gap:6,marginBottom:2,fontSize:11}}>
                            <span style={{color:"#cbd5e1",width:26,flexShrink:0}}>{p.pos}</span>
                            <span style={{color:"#f1f5f9"}}>{p.player}</span>
                          </div>
                        ))}
                        {drafted.length>0&&(
                          <>
                            <div style={{borderTop:"1px solid #1e293b",margin:"4px 0"}}/>
                            {drafted.map((p,i)=>(
                              <div key={i} style={{display:"flex",gap:6,marginBottom:2,fontSize:11}}>
                                <span style={{color:"#334155",width:26,flexShrink:0}}>{p.pos}</span>
                                <span style={{color:"#e2e8f0"}}>{p.name}</span>
                                <span style={{color:"#1e3a5f",marginLeft:"auto",fontSize:9}}>#{p.pick}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PICK LOG */}
          {tab==="depth"&&(
            <div style={{flex:1,overflowY:"auto",padding:16}}>
              {/* Score toggle */}
              <div style={{display:"flex",gap:4,marginBottom:8}}>
                {[["dns","DNS"],["s26","2026"],["dyn","Dyn"],["s28","2028"]].map(([v,l])=>(
                  <button key={v} className="btn" onClick={()=>setHistScore(v)}
                    style={{background:histScore===v?"#1a2744":"#1e293b",
                            color:histScore===v?"#84cc16":"#64748b",
                            border:histScore===v?"1px solid #84cc1644":"1px solid transparent",
                            fontWeight:histScore===v?700:400}}>
                    {l}
                  </button>
                ))}
              </div>
              {/* Position filter */}
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:20}}>
                {["All","H","P",...POS_SCARCITY_ORDER].map(pos=>(
                  <button key={pos} className="btn" onClick={()=>setHistPos(pos)}
                    style={{background:histPos===pos?"#1a2744":"#1e293b",
                            color:histPos===pos?"#84cc16":"#64748b",
                            border:histPos===pos?"1px solid #84cc1644":"1px solid transparent",
                            fontWeight:histPos===pos?700:400,minWidth:32}}>
                    {pos}
                  </button>
                ))}
              </div>
              {(()=>{
                const scoreKey = histScore==="dns"?"draftNowScore":histScore==="s26"?"score2026":histScore==="dyn"?"scoreDyn":"score2028";
                const scoreLabel = histScore==="dns"?"DNS":histScore==="s26"?"2026":histScore==="dyn"?"Dyn":"2028";
                const pool = scoredAvailable.filter(p =>
                  histPos==="All" ? true :
                  histPos==="H"   ? p.type==="H" :
                  histPos==="P"   ? p.type==="P" :
                  (p.eligible||[]).includes(histPos)
                );
                // Half-point buckets 6–10, 1-point buckets 0–6, displayed high→low
                const buckets = [
                  {label:"9.5+", lo:9.5, hi:10.0},
                  {label:"9",    lo:9.0, hi:9.5},
                  {label:"8.5",  lo:8.5, hi:9.0},
                  {label:"8",    lo:8.0, hi:8.5},
                  {label:"7.5",  lo:7.5, hi:8.0},
                  {label:"7",    lo:7.0, hi:7.5},
                  {label:"6.5",  lo:6.5, hi:7.0},
                  {label:"6",    lo:6.0, hi:6.5},
                  {label:"5",    lo:5.0, hi:6.0},
                  {label:"4",    lo:4.0, hi:5.0},
                  {label:"3",    lo:3.0, hi:4.0},
                  {label:"2",    lo:2.0, hi:3.0},
                  {label:"1",    lo:1.0, hi:2.0},
                  {label:"0",    lo:0.0, hi:1.0},
                ].map(b=>({...b, players:[]}));
                pool.forEach(p=>{
                  const val = p[scoreKey] ?? 0;
                  const b = buckets.find(b => val >= b.lo && val < b.hi) ?? buckets[buckets.length-1];
                  b.players.push(p);
                });
                const maxCount = Math.max(...buckets.map(b=>b.players.length), 1);
                const W=36, GAP=5, H=160, LABEL_H=26;
                const totalW = buckets.length*(W+GAP)-GAP;
                const BAR_COLOR = (lo) => lo>=9?"#84cc16":lo>=7.5?"#4ade80":lo>=6?"#facc15":lo>=3?"#fb923c":"#94a3b8";
                return (
                  <div>
                    <svg width={totalW} height={H+LABEL_H+24} style={{overflow:"visible",display:"block",margin:"0 auto"}}>
                      {buckets.map((b,i)=>{
                        const barH = b.players.length===0 ? 0 : Math.max(4, Math.round((b.players.length/maxCount)*H));
                        const x = i*(W+GAP);
                        const y = H - barH;
                        const color = BAR_COLOR(b.lo);
                        const countY = Math.max(y - 4, 10); // prevent clipping at top
                        return (
                          <g key={i}>
                            <title>{b.label} {scoreLabel} — {b.players.length} players:\n{b.players.slice(0,20).map(p=>p.name).join("\n")}</title>
                            <rect x={x} y={y} width={W} height={barH} fill={color} rx={3} opacity={0.85}/>
                            {b.players.length>0&&(
                              <text x={x+W/2} y={countY} textAnchor="middle" fill={color} fontSize={10} fontFamily="IBM Plex Mono,monospace">{b.players.length}</text>
                            )}
                            <text x={x+W/2} y={H+14} textAnchor="end" fill="#475569" fontSize={9} fontFamily="IBM Plex Mono,monospace"
                              transform={`rotate(-45,${x+W/2},${H+14})`}>{b.label}</text>
                          </g>
                        );
                      })}
                      <line x1={0} y1={H} x2={totalW} y2={H} stroke="#1e293b" strokeWidth={1}/>
                    </svg>
                    <div style={{textAlign:"center",fontSize:9,color:"#334155",marginTop:4,fontFamily:"IBM Plex Mono,monospace",letterSpacing:".06em"}}>
                      {scoreLabel} — {pool.length} AVAILABLE PLAYERS {histPos!=="All"?`(${histPos})`:""}
                    </div>
                    {/* Top players by bucket (8+) */}
                    {buckets.filter(b=>b.lo>=8&&b.players.length>0).map(b=>(
                      <div key={b.label} style={{marginTop:16}}>
                        <div style={{fontSize:9,color:"#84cc16",letterSpacing:".1em",textTransform:"uppercase",marginBottom:4}}>{b.label} {scoreLabel} ({b.players.length})</div>
                        {b.players.sort((a,z)=>(z[scoreKey]??0)-(a[scoreKey]??0)).map(p=>(
                          <div key={p.name} style={{display:"flex",gap:8,padding:"3px 0",borderBottom:"1px solid #0d0f16",fontSize:11}}>
                            <span style={{color:"#f1f5f9",width:180,flexShrink:0}}>{p.name}</span>
                            <span style={{color:"#cbd5e1",width:60,flexShrink:0}}>{(p.eligible||[]).join("/")}</span>
                            <span style={{color:"#84cc16"}}>{(p[scoreKey]??0).toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
          {tab==="lineup"&&(()=>{
            if (!hasYahooRosters) return null;
            const myL  = computeLineup(myYahooRoster);
            const oppL = inSeasonOpponent ? computeLineup(leagueTargets.filter(p=>p.owner===inSeasonOpponent)) : [];
            const BADGE = p => {
              const isSP = p.type==="P" && p.eligible?.includes("SP");
              if (p.il) return [p.yahoo_status||"IL","#f87171"];
              if (p.games===0) return ["SIT","#f87171"];
              if (isSP && p.starts===0) return ["SIT","#f87171"];
              if (p.games!=null && p.games<4) return ["SIT?","#f59e0b"];
              return ["START","#22c55e"];
            };
            const renderRow = p => {
              const isSP = p.type==="P" && p.eligible?.includes("SP");
              const [badge, bc] = BADGE(p);
              return (
                <tr key={p.name+p.type} style={{borderTop:"1px solid #0d0f16"}}>
                  <td style={{padding:"4px 8px 4px 0",maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    <span style={{fontSize:11,color:"#e2e8f0",fontWeight:500}}>{p.name}</span>
                    <span style={{fontSize:9,color:"#475569",marginLeft:5}}>{(p.eligible||[]).slice(0,2).join("/")}</span>
                  </td>
                  <td style={{textAlign:"center",padding:"4px 8px 4px 0",fontSize:10,color:"#475569"}}>{p.org||"—"}</td>
                  <td style={{textAlign:"center",padding:"4px 8px 4px 0"}}>
                    {isSP
                      ? <span style={{fontSize:12,fontWeight:700,color:p.starts===0?"#f87171":p.starts>=2?"#22c55e":"#f59e0b"}}>{p.starts??"-"}<span style={{fontSize:8,color:"#475569"}}> GS</span></span>
                      : <span style={{fontSize:12,fontWeight:700,color:p.games===0?"#f87171":p.games>=6?"#22c55e":p.games>=4?"#f59e0b":"#f87171"}}>{p.games??"-"}<span style={{fontSize:8,color:"#475569"}}> G</span></span>
                    }
                  </td>
                  <td style={{textAlign:"right",padding:"4px 8px 4px 0",fontSize:9,color:"#64748b",whiteSpace:"nowrap"}}>
                    {p.type==="H"
                      ? `${(p.weekStats.R||0).toFixed(1)}R ${(p.weekStats.HR||0).toFixed(1)}HR ${(p.weekStats.RBI||0).toFixed(1)}RBI ${(p.weekStats.SB||0).toFixed(1)}SB`
                      : isSP
                        ? `${(p.weekStats.K||0).toFixed(1)}K ${p.weekStats.ERA!=null?p.weekStats.ERA.toFixed(2):"—"}ERA ${p.weekStats.WHIP!=null?p.weekStats.WHIP.toFixed(2):"—"}WHIP`
                        : `${(p.weekStats.K||0).toFixed(1)}K`
                    }
                  </td>
                  <td style={{textAlign:"right",padding:"4px 0",minWidth:40}}>
                    <span style={{fontSize:9,fontWeight:700,color:bc,background:`${bc}18`,padding:"1px 5px",borderRadius:3}}>{badge}</span>
                  </td>
                </tr>
              );
            };
            const Section = ({label, rows}) => rows.length===0 ? null : (
              <div style={{marginBottom:16}}>
                <div style={{fontSize:9,color:"#334155",letterSpacing:".08em",textTransform:"uppercase",marginBottom:4}}>{label}</div>
                <table style={{borderCollapse:"collapse",width:"100%"}}>
                  <thead><tr>{["PLAYER","TEAM","G","PROJ WEEK",""].map((h,i)=>(
                    <th key={i} style={{textAlign:i>=2?"center":"left",color:"#334155",fontSize:8,fontWeight:400,letterSpacing:".08em",paddingBottom:3,paddingRight:8}}>{h}</th>
                  ))}</tr></thead>
                  <tbody>{rows.map(renderRow)}</tbody>
                </table>
              </div>
            );
            const Side = ({label, lineup}) => (
              <div style={{marginBottom:24}}>
                <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".1em",textTransform:"uppercase",marginBottom:10,paddingBottom:5,borderBottom:"1px solid #1e293b"}}>{label}</div>
                <Section label="Hitters" rows={lineup.filter(p=>p.type==="H")}/>
                <Section label="Pitchers" rows={lineup.filter(p=>p.type==="P")}/>
              </div>
            );
            return (
              <div style={{flex:1,overflowY:"auto",padding:14}}>
                {!inSeasonOpponent && <div style={{fontSize:11,color:"#475569",marginBottom:12}}>Select an opponent in In-Season to also compare their lineup.</div>}
                <Side label={myTeam} lineup={myL}/>
                {inSeasonOpponent && <Side label={inSeasonOpponent} lineup={oppL}/>}
              </div>
            );
          })()}

          {tab==="inseason"&&(()=>{
            // Ratio stats from my current pitching staff
            const myPitchers = myYahooRoster.filter(p => p.type === "P");
            const totalIP = myPitchers.reduce((s,p) => s + (p.yahooProj?.IP ?? p.projIP ?? 0), 0);
            const wtdERA  = totalIP > 0 ? myPitchers.reduce((s,p) => s + (p.yahooProj?.ERA  ?? p.projStats?.ERA  ?? 0) * (p.yahooProj?.IP ?? p.projIP ?? 0), 0) / totalIP : null;
            const wtdWHIP = totalIP > 0 ? myPitchers.reduce((s,p) => s + (p.yahooProj?.WHIP ?? p.projStats?.WHIP ?? 0) * (p.yahooProj?.IP ?? p.projIP ?? 0), 0) / totalIP : null;

            // Top FA adds ranked by weighted category fit
            const faAdds = available
              .filter(p => p.score2026 > 0)
              .map(p => {
                const addValue = Math.round(p.cats.reduce((s,c) => s + (catNeed[c] || 0), 0) * p.score2026 * 10) / 10;
                const isP = p.type === "P";
                const pIP   = p.yahooProj?.IP   ?? p.projIP   ?? 0;
                const pERA  = p.yahooProj?.ERA   ?? p.projStats?.ERA  ?? null;
                const pWHIP = p.yahooProj?.WHIP  ?? p.projStats?.WHIP ?? null;
                const newIP   = totalIP + pIP;
                const newERA  = (isP && pERA  != null && wtdERA  != null && newIP > 0) ? (wtdERA  * totalIP + pERA  * pIP) / newIP : null;
                const newWHIP = (isP && pWHIP != null && wtdWHIP != null && newIP > 0) ? (wtdWHIP * totalIP + pWHIP * pIP) / newIP : null;
                const starts  = mlbSchedule ? (mlbSchedule[p.org]?.thisWeek ?? 0) : null;
                return { ...p, addValue, newERA, newWHIP, starts };
              })
              .sort((a,b) => b.addValue - a.addValue)
              .slice(0, 30);

            // My pitchers with schedule
            const mySpSchedule = myYahooRoster
              .filter(p => p.type === "P")
              .map(p => ({ ...p, thisWeek: mlbSchedule?.[p.org]?.thisWeek ?? null, nextWeek: mlbSchedule?.[p.org]?.nextWeek ?? null }))
              .sort((a,b) => (b.thisWeek ?? 0) - (a.thisWeek ?? 0));

            const standings = leagueMeta.standings || [];
            const catStandingsAllCats = [...(config.hittingCats||[]), ...(config.pitchingCats||[])];
            const lowerBetterCats = new Set(["ERA","WHIP","BB/9","ER"]);
            const rankedByCat = standings.length > 0 ? [...standings].sort((a,b) => {
              const av = a.cat_stats?.[catStandingsCat] ?? -1;
              const bv = b.cat_stats?.[catStandingsCat] ?? -1;
              return lowerBetterCats.has(catStandingsCat) ? av - bv : bv - av;
            }) : [];
            const tradeSearchNorm = tradeSearch.toLowerCase();
            const tradeResults = tradeSearch.length > 1
              ? leagueTargets.filter(p => p.name.toLowerCase().includes(tradeSearchNorm)
                  && !tradeGive.includes(p.name) && !tradeReceive.includes(p.name)).slice(0, 8)
              : [];

            return (
              <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                <div style={{background:"#0b0d14",borderBottom:"1px solid #1e293b",display:"flex",padding:"0 10px",flexShrink:0}}>
                  {[["matchup","Matchup"],["standings","Standings"],["il","Roster"],["trade","Trade"]].map(([v,l])=>(
                    <button key={v} className="tabn" onClick={()=>setInSeasonTab(v)}
                      style={{color:inSeasonTab===v?"#84cc16":"#475569",borderBottom:inSeasonTab===v?"2px solid #84cc16":"2px solid transparent",fontSize:11}}>
                      {l}
                    </button>
                  ))}
                </div>
                <div style={{flex:1,overflowY:"auto",padding:14}}>

                {inSeasonTab==="matchup"&&<>
                {/* 1. Category Gap Analysis */}
                <div style={{marginBottom:22}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
                    <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".1em",textTransform:"uppercase"}}>Weekly Matchup</div>
                    <select value={inSeasonOpponent??""} onChange={e=>setInSeasonOpponent(e.target.value||null)}
                      style={{background:"#1e293b",border:"1px solid #334155",color:"#e2e8f0",fontSize:11,padding:"3px 8px",borderRadius:3,fontFamily:"inherit",outline:"none"}}>
                      <option value="">— vs —</option>
                      {draftOrder.filter(t=>t!==myTeam).map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                    {catGapAnalysis && <span style={{fontSize:9,color:"#334155"}}>{catGapAnalysis[0]?.isScheduled ? "scaled by this week's schedule" : "avg week (schedule loading)"}</span>}
                  </div>
                  {catGapAnalysis ? (
                    <div style={{overflowX:"auto"}}>
                      {(()=>{
                        const wins   = catGapAnalysis.filter(r => r.winning === true && !r.close).length;
                        const losses = catGapAnalysis.filter(r => r.winning === false && !r.close).length;
                        const ties   = catGapAnalysis.filter(r => r.close || r.winning === null).length;
                        const total  = catGapAnalysis.length;
                        const pct    = total > 0 ? Math.round(wins / total * 100) : 0;
                        const color  = wins > losses ? "#22c55e" : wins < losses ? "#f87171" : "#f59e0b";
                        return (
                          <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:10}}>
                            <span style={{fontSize:22,fontWeight:700,color}}>{wins}–{losses}{ties>0?`–${ties}`:""}</span>
                            <span style={{fontSize:10,color:"#475569"}}>proj ({pct}% cats)</span>
                          </div>
                        );
                      })()}
                      {[["HITTING", hitCats], ["PITCHING", pitchCats]].map(([label, cats]) => (
                        <div key={label} style={{marginBottom:12}}>
                          <div style={{fontSize:9,color:"#334155",letterSpacing:".08em",textTransform:"uppercase",marginBottom:5}}>{label}</div>
                          <table style={{borderCollapse:"collapse",width:"100%",fontSize:11}}>
                            <thead>
                              <tr>
                                {["CAT","YOU","OPP","DIFF"].map(h=>(
                                  <th key={h} style={{textAlign:h==="CAT"?"left":"right",color:"#334155",fontSize:9,fontWeight:400,letterSpacing:".08em",paddingBottom:3,paddingRight:12}}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {cats.map(cat => {
                                const row = catGapAnalysis.find(r => r.cat === cat);
                                if (!row) return null;
                                const {myVal, oppVal, gap, winning, lowerBetter, close} = row;
                                const color = winning ? "#22c55e" : winning === false ? "#f87171" : "#475569";
                                const diffSign = gap != null ? (lowerBetter ? -gap : gap) : null;
                                return (
                                  <tr key={cat} style={{borderTop:"1px solid #0d0f16"}}>
                                    <td style={{padding:"3px 12px 3px 0",color:"#94a3b8",fontWeight:600}}>
                                      {cat}
                                      {close && <span style={{marginLeft:4,fontSize:8,color:"#f59e0b"}}>◆</span>}
                                    </td>
                                    <td style={{textAlign:"right",padding:"3px 12px 3px 0",color:"#f1f5f9"}}>{fmtStat(myVal,cat)}</td>
                                    <td style={{textAlign:"right",padding:"3px 12px 3px 0",color:"#64748b"}}>{fmtStat(oppVal,cat)}</td>
                                    <td style={{textAlign:"right",padding:"3px 0 3px 0",color,fontWeight:600}}>
                                      {diffSign != null ? (diffSign > 0 ? "+" : "") + fmtStat(Math.abs(gap),cat) : "—"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ))}
                      <div style={{fontSize:9,color:"#334155",marginTop:2}}>◆ = close (within per-cat threshold)</div>
                    </div>
                  ) : (
                    <div style={{fontSize:11,color:"#334155"}}>Select an opponent to see matchup projections.</div>
                  )}
                </div>

                {/* 3. Roster Holes */}
                {rosterHoles.length > 0 && (
                  <div style={{marginBottom:22}}>
                    <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Roster Holes</div>
                    {rosterHoles.map(({pos, healthy, total, thresh, topFA}) => {
                      const color = healthy === 0 ? "#f87171" : "#f59e0b";
                      const boardPos = pos === "OF" ? null : pos; // OF needs special handling
                      return (
                        <div key={pos} style={{marginBottom:10,background:"#0d0f16",border:`1px solid ${color}33`,borderRadius:4,padding:"8px 10px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                            <span style={{fontSize:11,fontWeight:700,color,minWidth:30}}>{pos}</span>
                            <span style={{fontSize:10,color:"#475569"}}>{healthy}/{total} healthy (need {thresh}+)</span>
                            <button onClick={()=>{setTab("board"); setPosFilter(pos==="OF"?"OF":pos); setSortBy("dns");}}
                              style={{marginLeft:"auto",fontSize:9,color:"#60a5fa",background:"#1e3a5f33",border:"1px solid #1e3a5f",borderRadius:3,padding:"2px 7px",cursor:"pointer",fontFamily:"inherit"}}>
                              View Board →
                            </button>
                          </div>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            {topFA.map(p => (
                              <div key={p.name} style={{background:"#131926",border:"1px solid #1e293b",borderRadius:3,padding:"4px 8px",fontSize:10}}>
                                <span style={{color:"#e2e8f0",fontWeight:500}}>{p.name}</span>
                                <span style={{color:"#475569",marginLeft:5}}>{p.draftNowScore?.toFixed(1)}</span>
                              </div>
                            ))}
                            {topFA.length === 0 && <span style={{fontSize:10,color:"#334155"}}>No FA available at this position.</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4. Stat Tracker */}
                {(()=>{
                  const IL_SLOTS = new Set(["IL","IL10","IL15","IL60","NA"]);
                  const RATE_CATS = new Set(["AVG","OBP","SLG","ERA","WHIP","K/9","BB/9"]);
                  const SLOT_ORDER = ["C","1B","2B","3B","SS","LF","CF","RF","OF","Util","SP","RP","P","BN","IL","IL10","IL15","IL60","NA"];
                  const slotSort = s => { const i = SLOT_ORDER.indexOf(s); return i === -1 ? 99 : i; };
                  const sorted = [...myYahooRoster].sort((a,b) => slotSort(a.selected_position??"BN") - slotSort(b.selected_position??"BN"));
                  const starters = sorted.filter(p => p.selected_position && !IL_SLOTS.has(p.selected_position) && p.selected_position !== "BN");
                  const bench    = sorted.filter(p => !p.selected_position || p.selected_position === "BN");
                  const il       = sorted.filter(p => p.selected_position && IL_SLOTS.has(p.selected_position));

                  const playerScale = p => {
                    const isSP = p.eligible?.includes("SP") && !p.eligible?.every(e=>e==="RP");
                    const games = mlbSchedule?.[p.org]?.thisWeek ?? 6.2;
                    if (p.type !== "P" || !isSP) return games / 162;
                    const seasonGS = Math.max(1, (p.projStats?.IP ?? 150) / 5.5);
                    return (games / 5) / seasonGS;
                  };

                  const scaledStat = (p, cat) => {
                    const v = p.projStats?.[cat];
                    if (v == null) return null;
                    if (RATE_CATS.has(cat)) return v;
                    return v * playerScale(p);
                  };

                  const renderTable = (players, cats, dim) => {
                    if (!players.length) return null;
                    const totals = {};
                    const paMap = {}, ipMap = {};
                    players.forEach(p => {
                      const sc = playerScale(p);
                      const proj = p.projStats || {};
                      if (p.type === "H") {
                        const pa = (proj.H != null && proj.AVG ? proj.H / proj.AVG * sc : 0);
                        paMap[p.name] = pa;
                        cats.filter(c=>!RATE_CATS.has(c)).forEach(c => {
                          if (proj[c] != null) totals[c] = (totals[c]||0) + proj[c] * sc;
                        });
                        ["AVG","OBP","SLG"].forEach(c => {
                          if (proj[c] != null) totals[`_num_${c}`] = (totals[`_num_${c}`]||0) + proj[c] * pa;
                          totals[`_pa`] = (totals[`_pa`]||0) + pa;
                        });
                      } else {
                        const ip = (proj.IP ?? 0) * sc;
                        ipMap[p.name] = ip;
                        cats.filter(c=>!RATE_CATS.has(c)).forEach(c => {
                          if (proj[c] != null) totals[c] = (totals[c]||0) + proj[c] * sc;
                        });
                        ["ERA","WHIP","K/9","BB/9"].forEach(c => {
                          if (proj[c] != null) totals[`_num_${c}`] = (totals[`_num_${c}`]||0) + proj[c] * ip;
                        });
                        totals[`_ip`] = (totals[`_ip`]||0) + ip;
                      }
                    });
                    cats.filter(c=>RATE_CATS.has(c)).forEach(c => {
                      const denom = ["AVG","OBP","SLG"].includes(c) ? totals[`_pa`] : totals[`_ip`];
                      totals[c] = denom > 0 ? totals[`_num_${c}`] / denom : null;
                    });

                    const nameW = 90, slotW = 26, schedW = 32, statW = 38;
                    const thStyle = {fontSize:8,color:"#64748b",textAlign:"right",padding:"2px 4px",fontWeight:400,letterSpacing:".06em",whiteSpace:"nowrap"};
                    const tdStyle = (dim) => ({fontSize:10,color:dim?"#475569":"#f1f5f9",textAlign:"right",padding:"3px 4px",whiteSpace:"nowrap"});

                    return (
                      <div style={{overflowX:"auto",marginBottom:10}}>
                        <table style={{borderCollapse:"collapse",fontSize:10,width:"100%"}}>
                          <thead>
                            <tr>
                              <th style={{...thStyle,textAlign:"left",width:slotW}}>SLT</th>
                              <th style={{...thStyle,textAlign:"left",width:nameW}}>NAME</th>
                              <th style={{...thStyle,width:schedW}}>OPP</th>
                              {cats.map(c=><th key={c} style={{...thStyle,width:statW}}>{c}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {players.map(p => {
                              const sched = mlbSchedule?.[p.org];
                              const isSP = p.eligible?.includes("SP") && !p.eligible?.every(e=>e==="RP");
                              const games = sched?.thisWeek ?? null;
                              const dispG = games == null ? "—" : isSP ? `${Math.round(games/5)}GS` : `${games}G`;
                              const opps = (sched?.thisWeekOpps ?? []).map(o=>o.replace("vs ","").replace("@ ","@")).join(" ");
                              return (
                                <tr key={p.name} style={{borderTop:"1px solid #0d0f16"}}>
                                  <td style={{fontSize:9,color:"#475569",padding:"3px 4px",whiteSpace:"nowrap"}}>{p.selected_position??"BN"}</td>
                                  <td style={{padding:"3px 4px"}}>
                                    <div style={{fontSize:10,color:dim?"#475569":"#f1f5f9",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:nameW}}>{p.name}</div>
                                    <div style={{fontSize:8,color:"#475569"}}>{p.org} {opps && <span style={{color:"#64748b"}}>{opps}</span>}</div>
                                  </td>
                                  <td style={{...tdStyle(dim),fontSize:9,color:games==null?"#334155":isSP?(Math.round(games/5)>=2?"#22c55e":Math.round(games/5)===1?"#f59e0b":"#f87171"):(games>=5?"#22c55e":games>=3?"#f59e0b":"#f87171")}}>{dispG}</td>
                                  {cats.map(c => {
                                    const v = scaledStat(p, c);
                                    return <td key={c} style={tdStyle(dim)}>{v==null?"—":fmtStat(v,c)}</td>;
                                  })}
                                </tr>
                              );
                            })}
                            <tr style={{borderTop:"2px solid #1e293b"}}>
                              <td colSpan={3} style={{fontSize:9,color:"#475569",padding:"3px 4px",fontWeight:700}}>TOTAL</td>
                              {cats.map(c => <td key={c} style={{fontSize:10,color:"#84cc16",fontWeight:700,textAlign:"right",padding:"3px 4px"}}>{totals[c]==null?"—":fmtStat(totals[c],c)}</td>)}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );
                  };

                  const hitters  = starters.filter(p => p.type === "H");
                  const pitchers = starters.filter(p => p.type === "P");
                  const benchH   = bench.filter(p => p.type === "H");
                  const benchP   = bench.filter(p => p.type === "P");

                  return (
                    <div style={{marginBottom:22}}>
                      <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>
                        My Lineup — This Week
                        {mlbSchedule === null && <span style={{color:"#334155",marginLeft:8,fontSize:9,fontWeight:400}}>loading schedule...</span>}
                        {mlbSchedule !== null && Object.keys(mlbSchedule).length === 0 && <span style={{color:"#f59e0b",marginLeft:8,fontSize:9,fontWeight:400}}>schedule unavailable</span>}
                      </div>
                      {(hitters.length>0||benchH.length>0) && <>
                        <div style={{fontSize:9,color:"#334155",letterSpacing:".08em",textTransform:"uppercase",marginBottom:4}}>Hitters</div>
                        {renderTable(hitters, hitCats, false)}
                        {benchH.length>0 && renderTable(benchH, hitCats, true)}
                      </>}
                      {(pitchers.length>0||benchP.length>0) && <>
                        <div style={{fontSize:9,color:"#334155",letterSpacing:".08em",textTransform:"uppercase",marginBottom:4,marginTop:8}}>Pitchers</div>
                        {renderTable(pitchers, pitchCats, false)}
                        {benchP.length>0 && renderTable(benchP, pitchCats, true)}
                      </>}
                      {il.length>0 && (
                        <div style={{marginTop:8}}>
                          <div style={{fontSize:9,color:"#334155",letterSpacing:".08em",textTransform:"uppercase",marginBottom:4}}>IL / NA</div>
                          {il.map(p=><div key={p.name} style={{fontSize:10,color:"#334155",padding:"2px 0"}}>{p.selected_position} · {p.name} · {p.org}</div>)}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 2 + 4. Waiver Wire + Ratio Safety */}
                <div>
                  <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".1em",textTransform:"uppercase",marginBottom:2}}>Top Adds — by category fit</div>
                  {(wtdERA != null || wtdWHIP != null) && (
                    <div style={{fontSize:9,color:"#64748b",marginBottom:8}}>
                      Current staff: ERA {wtdERA?.toFixed(2)} · WHIP {wtdWHIP?.toFixed(3)} · {Math.round(totalIP)} IP projected
                    </div>
                  )}
                  {faAdds.map(p=>{
                    const isP = p.type === "P";
                    const eraChange  = isP && p.newERA  != null && wtdERA  != null ? p.newERA  - wtdERA  : null;
                    const whipChange = isP && p.newWHIP != null && wtdWHIP != null ? p.newWHIP - wtdWHIP : null;
                    const eraColor  = eraChange  == null ? null : eraChange  <= -0.10 ? "#22c55e" : eraChange  <= 0.10 ? "#f59e0b" : "#f87171";
                    const whipColor = whipChange == null ? null : whipChange <= -0.02 ? "#22c55e" : whipChange <= 0.03 ? "#f59e0b" : "#f87171";
                    return (
                      <div key={p.name} style={{background:"#0d0f16",border:"1px solid #1e293b",borderRadius:4,padding:"7px 10px",marginBottom:4,display:"flex",gap:8,alignItems:"center"}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                            <span style={{fontSize:12,color:"#f1f5f9",fontWeight:500}}>{p.name}</span>
                            {p.eligible.slice(0,2).map(e=><span key={e} style={{fontSize:9,color:"#f1f5f9",background:"#1e293b",padding:"0 4px",borderRadius:2}}>{e}</span>)}
                            <span style={{fontSize:9,color:"#64748b"}}>{p.org}</span>
                            {p.il && <span style={{fontSize:9,color:"#f87171",background:"#7f1d1d33",padding:"1px 4px",borderRadius:3}}>IL</span>}
                          </div>
                          <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap",alignItems:"center"}}>
                            {p.cats.map(c=>{
                              const need = catNeed[c]??0;
                              return <span key={c} style={{fontSize:9,padding:"1px 5px",borderRadius:8,background:`${CAT_NEED_COLOR[need]||"#1e293b"}18`,color:CAT_NEED_COLOR[need]||"#475569"}}>{c}</span>;
                            })}
                            {eraChange != null && (
                              <span style={{fontSize:9,fontWeight:600,color:eraColor,background:`${eraColor}18`,padding:"1px 5px",borderRadius:3}}>
                                ERA {eraChange>=0?"+":""}{eraChange.toFixed(2)}
                              </span>
                            )}
                            {whipChange != null && (
                              <span style={{fontSize:9,fontWeight:600,color:whipColor,background:`${whipColor}18`,padding:"1px 5px",borderRadius:3}}>
                                WHIP {whipChange>=0?"+":""}{whipChange.toFixed(3)}
                              </span>
                            )}
                            {isP && p.starts != null && (
                              <span style={{fontSize:9,color:"#60a5fa",background:"#1e3a5f33",padding:"1px 5px",borderRadius:3}}>{p.starts}G this wk</span>
                            )}
                          </div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontSize:9,color:"#475569"}}>fit</div>
                          <div style={{fontSize:13,fontWeight:700,color:"#84cc16"}}>{p.addValue}</div>
                          <div style={{fontSize:9,color:"#334155"}}>{p.score2026}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </>}

                {/* STANDINGS sub-tab */}
                {inSeasonTab==="standings"&&(
                  <div>
                    {standings.length > 0 ? (
                      <div>
                        <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>
                          Standings — Wk {leagueMeta.scoreboard?.week ?? "?"}
                        </div>
                        <table style={{borderCollapse:"collapse",width:"100%",fontSize:11,marginBottom:18}}>
                          <thead><tr>{["#","TEAM","W","L","T"].map(h=>(
                            <th key={h} style={{textAlign:h==="TEAM"?"left":"right",color:"#334155",fontSize:9,fontWeight:400,paddingBottom:3,paddingRight:h!=="T"?10:0}}>{h}</th>
                          ))}</tr></thead>
                          <tbody>{standings.map(t=>{
                            const isMe=t.team_name===myTeam, isOpp=t.team_name===inSeasonOpponent;
                            return <tr key={t.team_key} style={{borderTop:"1px solid #0d0f16",background:isMe?"#0f1f2e":isOpp?"#1a1000":"transparent"}}>
                              <td style={{textAlign:"right",padding:"3px 10px 3px 0",color:"#475569",width:20}}>{t.rank}</td>
                              <td style={{padding:"3px 10px 3px 0",color:isMe?"#60a5fa":isOpp?"#f59e0b":"#94a3b8",fontWeight:isMe||isOpp?600:400,maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.team_name}{isMe?" ★":""}</td>
                              <td style={{textAlign:"right",padding:"3px 10px 3px 0",color:"#22c55e"}}>{t.wins}</td>
                              <td style={{textAlign:"right",padding:"3px 10px 3px 0",color:"#f87171"}}>{t.losses}</td>
                              <td style={{textAlign:"right",color:"#475569"}}>{t.ties}</td>
                            </tr>;
                          })}</tbody>
                        </table>
                        <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Category Rankings</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:12}}>
                          {catStandingsAllCats.map(c=>(
                            <button key={c} onClick={()=>setCatStandingsCat(c)}
                              style={{fontSize:10,padding:"2px 8px",borderRadius:3,border:"none",cursor:"pointer",fontFamily:"inherit",
                                background:catStandingsCat===c?"#84cc16":"#1e293b",color:catStandingsCat===c?"#0d0f16":"#94a3b8"}}>
                              {c}
                            </button>
                          ))}
                        </div>
                        {rankedByCat.map((t,i)=>{
                          const isMe=t.team_name===myTeam, isOpp=t.team_name===inSeasonOpponent;
                          const val=t.cat_stats?.[catStandingsCat];
                          const hasData=val!=null&&val!==0;
                          return (
                            <div key={t.team_key} style={{display:"flex",alignItems:"center",gap:8,padding:"3px 6px",marginBottom:2,borderRadius:3,
                              background:isMe?"#0f1f2e":isOpp?"#1a1000":"transparent",
                              borderLeft:`2px solid ${isMe?"#60a5fa":isOpp?"#f59e0b":"#1e293b"}`}}>
                              <span style={{fontSize:9,color:"#334155",width:16,flexShrink:0}}>#{i+1}</span>
                              <span style={{fontSize:11,color:isMe?"#60a5fa":isOpp?"#f59e0b":"#94a3b8",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:isMe||isOpp?600:400}}>
                                {t.team_name}{isMe?" ★":""}
                              </span>
                              <span style={{fontSize:11,color:hasData?"#e2e8f0":"#334155",flexShrink:0}}>{hasData?val:"—"}</span>
                            </div>
                          );
                        })}
                        {!rankedByCat.some(t=>t.cat_stats?.[catStandingsCat])&&(
                          <div style={{fontSize:10,color:"#334155",marginTop:8}}>Season stats not yet available — sync after Opening Day.</div>
                        )}
                      </div>
                    ) : <div style={{fontSize:10,color:"#334155"}}>No standings data. Run a sync.</div>}
                  </div>
                )}

                {/* ROSTER sub-tab */}
                {inSeasonTab==="il"&&(()=>{
                  const prospects = myYahooRoster
                    .filter(p => p.prospectFV != null)
                    .sort((a,b) => (b.prospectFV||0)-(a.prospectFV||0)||(a.prospectETA||9999)-(b.prospectETA||9999));
                  const dropCandidates = myYahooRoster
                    .filter(p => !p.prospectFV && (p.score2026||0) < 5 && (p.scoreDyn||0) < 5)
                    .sort((a,b) => (a.score2026||0)-(b.score2026||0));
                  const ownedNames = new Set(leagueTargets.filter(p=>p.owner).map(p=>p.name));
                  const topFAProspects = fantraxProspects.prospects
                    .filter(p => !ownedNames.has(p.name))
                    .slice(0, 10);
                  return (
                    <div>
                      {/* IL/NA slots section */}
                      <div style={{marginBottom:22}}>
                        <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>IL / NA Slots</div>
                        {!ilOptimizer ? (
                          <div style={{fontSize:11,color:"#334155"}}>Not available.</div>
                        ) : ilOptimizer.healthyOnIL.length===0&&ilOptimizer.injuredNotOnIL.length===0 ? (
                          ilOptimizer.injured.length===0
                            ? <div style={{fontSize:11,color:"#22c55e"}}>✓ No injured players on your roster.</div>
                            : <div>
                                <div style={{fontSize:10,color:"#f59e0b",marginBottom:8}}>{ilOptimizer.injured.length} injured — verify IL/NA placement in Yahoo.</div>
                                {ilOptimizer.injured.map(p=>(
                                  <div key={p.name} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 8px",marginBottom:3,background:"#0d0f16",borderRadius:3,borderLeft:"2px solid #f87171"}}>
                                    <span style={{fontSize:11,color:"#e2e8f0",flex:1}}>{p.name}</span>
                                    <span style={{fontSize:9,color:"#94a3b8"}}>{p.eligible?.[0]??""}</span>
                                    <span style={{fontSize:9,color:"#f87171",background:"#7f1d1d33",padding:"1px 5px",borderRadius:3}}>{p.yahoo_status||"IL"}</span>
                                  </div>
                                ))}
                              </div>
                        ) : (
                          <div>
                            {ilOptimizer.healthyOnIL.length>0&&(
                              <div style={{marginBottom:12}}>
                                <div style={{fontSize:10,color:"#f87171",marginBottom:6}}>Move off IL/NA (healthy, wasting a slot):</div>
                                {ilOptimizer.healthyOnIL.map(p=>(
                                  <div key={p.name} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 8px",marginBottom:3,background:"#0d0f16",borderRadius:3,borderLeft:"2px solid #f87171"}}>
                                    <span style={{fontSize:11,color:"#e2e8f0",flex:1}}>{p.name}</span>
                                    <span style={{fontSize:9,color:"#94a3b8"}}>{p.selected_position}</span>
                                    <span style={{fontSize:9,color:"#22c55e",background:"#14532d33",padding:"1px 5px",borderRadius:3}}>→ BN</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {ilOptimizer.injuredNotOnIL.length>0&&(
                              <div>
                                <div style={{fontSize:10,color:"#f59e0b",marginBottom:6}}>Move to IL/NA (injured, wasting active slot):</div>
                                {ilOptimizer.injuredNotOnIL.map(p=>(
                                  <div key={p.name} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 8px",marginBottom:3,background:"#0d0f16",borderRadius:3,borderLeft:"2px solid #f59e0b"}}>
                                    <span style={{fontSize:11,color:"#e2e8f0",flex:1}}>{p.name}</span>
                                    <span style={{fontSize:9,color:"#94a3b8"}}>{p.selected_position}</span>
                                    <span style={{fontSize:9,color:"#f87171",background:"#7f1d1d33",padding:"1px 5px",borderRadius:3}}>{p.yahoo_status||"IL"}</span>
                                    <span style={{fontSize:9,color:"#f59e0b"}}>→ IL</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* My Prospects */}
                      {prospects.length > 0 && (
                        <div style={{marginBottom:22}}>
                          <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>My Prospects</div>
                          {prospects.map(p=>{
                            const fvColor = p.prospectFV>=60?"#f59e0b":p.prospectFV>=55?"#22c55e":p.prospectFV>=50?"#60a5fa":"#94a3b8";
                            const etaYear = parseInt(p.prospectETA)||null;
                            const arriving = etaYear != null && etaYear <= 2026;
                            const ftRank = p.fantraxProspectRank;
                            return (
                              <div key={p.name} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",marginBottom:3,background:"#0d0f16",borderRadius:3,borderLeft:`2px solid ${fvColor}`}}>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:11,color:"#e2e8f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                                  <div style={{fontSize:9,color:"#475569",marginTop:1}}>{p.eligible?.[0]??""} · {p.org??""}{ftRank?` · FTX #${ftRank}`:""}</div>
                                </div>
                                <span style={{fontSize:10,fontWeight:700,color:fvColor,background:`${fvColor}18`,padding:"1px 6px",borderRadius:3,flexShrink:0}}>FV{p.prospectFV}</span>
                                {etaYear&&<span style={{fontSize:10,color:arriving?"#84cc16":"#64748b",flexShrink:0}}>{etaYear}{arriving?" ↑":""}</span>}
                                {p.il&&<span style={{fontSize:9,color:"#f87171",flexShrink:0}}>IL</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Top FA Prospects */}
                      {topFAProspects.length > 0 && (
                        <div style={{marginBottom:22}}>
                          <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>Top FA Prospects — FantraxHQ</div>
                          {topFAProspects.map(p=>{
                            const target = leagueTargets.find(t=>t.name===p.name);
                            const fvColor = target?.prospectFV>=60?"#f59e0b":target?.prospectFV>=55?"#22c55e":target?.prospectFV>=50?"#60a5fa":"#64748b";
                            return (
                              <div key={p.name} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",marginBottom:3,background:"#0d0f16",borderRadius:3,borderLeft:"2px solid #334155"}}>
                                <span style={{fontSize:10,color:"#334155",width:28,flexShrink:0}}>#{p.rank}</span>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:11,color:"#e2e8f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                                  <div style={{fontSize:9,color:"#475569",marginTop:1}}>{p.pos} · {p.team} · {p.level}{p.eta?` · ETA ${p.eta}`:""}</div>
                                </div>
                                {target?.prospectFV&&<span style={{fontSize:10,fontWeight:700,color:fvColor,background:`${fvColor}18`,padding:"1px 6px",borderRadius:3,flexShrink:0}}>FV{target.prospectFV}</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Drop candidates */}
                      {dropCandidates.length > 0 && (
                        <div>
                          <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".1em",textTransform:"uppercase",marginBottom:6}}>Consider Dropping</div>
                          <div style={{fontSize:9,color:"#334155",marginBottom:8}}>Low score2026 + no dynasty upside (non-prospect)</div>
                          {dropCandidates.map(p=>{
                            const bestFA = scoredAvailable.find(fa =>
                              fa.type === p.type && !fa.il && (fa.score2026||0) > (p.score2026||0)
                            );
                            return (
                              <div key={p.name} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",marginBottom:3,background:"#0d0f16",borderRadius:3,borderLeft:"2px solid #334155"}}>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:11,color:"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                                  <div style={{fontSize:9,color:"#334155",marginTop:1}}>{p.eligible?.[0]??""} · age {p.age??""}{p.il?` · ${p.yahoo_status||"IL"}`:""}</div>
                                </div>
                                <span style={{fontSize:10,color:"#475569",flexShrink:0}}>{p.score2026??"-"}</span>
                                {bestFA&&(
                                  <div style={{textAlign:"right",flexShrink:0}}>
                                    <div style={{fontSize:9,color:"#334155"}}>best FA</div>
                                    <div style={{fontSize:10,color:"#22c55e"}}>{bestFA.name.split(" ").slice(-1)[0]}</div>
                                    <div style={{fontSize:9,color:"#475569"}}>{bestFA.score2026}</div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* TRADE ANALYZER sub-tab */}
                {inSeasonTab==="trade"&&(
                  <div>
                    <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".1em",textTransform:"uppercase",marginBottom:12}}>Trade Analyzer</div>
                    <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center"}}>
                      <input value={tradeSearch} onChange={e=>setTradeSearch(e.target.value)} placeholder="Search player…"
                        style={{flex:1,background:"#0d0f16",border:"1px solid #1e293b",color:"#e2e8f0",fontSize:11,padding:"5px 8px",borderRadius:3,fontFamily:"inherit",outline:"none"}}/>
                      {[["give","I Give"],["receive","I Get"]].map(([v,l])=>(
                        <button key={v} onClick={()=>setTradeSearchSide(v)}
                          style={{fontSize:10,padding:"4px 10px",borderRadius:3,border:"none",cursor:"pointer",fontFamily:"inherit",
                            background:tradeSearchSide===v?(v==="give"?"#7f1d1d":"#14532d"):"#1e293b",
                            color:tradeSearchSide===v?"#f1f5f9":"#64748b"}}>
                          {l}
                        </button>
                      ))}
                    </div>
                    {tradeResults.length>0&&(
                      <div style={{background:"#0d0f16",border:"1px solid #1e293b",borderRadius:4,marginBottom:10,maxHeight:160,overflowY:"auto"}}>
                        {tradeResults.map(p=>(
                          <div key={p.name}
                            onClick={()=>{tradeSearchSide==="give"?setTradeGive(g=>[...g,p.name]):setTradeReceive(r=>[...r,p.name]);setTradeSearch("");}}
                            style={{padding:"5px 10px",cursor:"pointer",borderBottom:"1px solid #0b0d14",display:"flex",alignItems:"center",gap:8}}
                            onMouseEnter={e=>e.currentTarget.style.background="#131926"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <span style={{fontSize:11,color:"#e2e8f0",flex:1}}>{p.name}</span>
                            <span style={{fontSize:9,color:"#64748b"}}>{p.eligible?.[0]??""} · {p.org??""}</span>
                            {p.owner&&<span style={{fontSize:9,color:"#475569",background:"#1e293b",padding:"1px 5px",borderRadius:3,maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.owner.split(" ").slice(-1)[0]}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                      {[["I Give",tradeGive,setTradeGive,"#7f1d1d","#f87171"],["I Get",tradeReceive,setTradeReceive,"#14532d","#22c55e"]].map(([label,list,setter,bg,color])=>(
                        <div key={label}>
                          <div style={{fontSize:9,color:"#64748b",textTransform:"uppercase",letterSpacing:".08em",marginBottom:5}}>{label}</div>
                          <div style={{minHeight:36,background:"#0d0f16",border:`1px solid ${bg}`,borderRadius:4,padding:6,display:"flex",flexWrap:"wrap",gap:4}}>
                            {list.map(name=>(
                              <div key={name} onClick={()=>setter(l=>l.filter(n=>n!==name))}
                                style={{fontSize:10,color,background:`${bg}44`,padding:"2px 7px",borderRadius:3,cursor:"pointer"}}>
                                {name.split(" ").slice(-1)[0]} ×
                              </div>
                            ))}
                            {list.length===0&&<span style={{fontSize:9,color:"#334155"}}>click search result to add</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {tradeAnalysis&&(
                      <div>
                        <div style={{marginBottom:14}}>
                          <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>ZAR Score Impact</div>
                          <table style={{borderCollapse:"collapse",width:"100%",fontSize:11}}>
                            <thead><tr>
                              <th style={{textAlign:"left",color:"#334155",fontSize:9,fontWeight:400,paddingBottom:4}}>Score</th>
                              <th style={{textAlign:"right",color:"#f87171",fontSize:9,fontWeight:400,paddingBottom:4}}>Give</th>
                              <th style={{textAlign:"right",color:"#22c55e",fontSize:9,fontWeight:400,paddingBottom:4}}>Get</th>
                              <th style={{textAlign:"right",color:"#94a3b8",fontSize:9,fontWeight:400,paddingBottom:4}}>Net</th>
                            </tr></thead>
                            <tbody>
                              {[["2026","score2026"],["2028","score2028"],["Dyn","scoreDyn"]].map(([label,key])=>{
                                const d=tradeAnalysis.scoreDelta[key]||{};
                                const netColor=d.net>0?"#22c55e":d.net<0?"#f87171":"#475569";
                                return <tr key={key} style={{borderTop:"1px solid #0d0f16"}}>
                                  <td style={{padding:"3px 0",color:"#94a3b8"}}>{label}</td>
                                  <td style={{textAlign:"right",padding:"3px 8px 3px 0",color:"#f87171"}}>{d.give}</td>
                                  <td style={{textAlign:"right",padding:"3px 8px 3px 0",color:"#22c55e"}}>{d.recv}</td>
                                  <td style={{textAlign:"right",color:netColor,fontWeight:600}}>{d.net>0?"+":""}{d.net}</td>
                                </tr>;
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div>
                          <div style={{fontSize:10,color:"#cbd5e1",letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>Category Impact</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                            {Object.entries(tradeAnalysis.catDelta).map(([cat,delta])=>{
                              const lower=lowerBetterCats.has(cat);
                              const good=lower?delta<0:delta>0, bad=lower?delta>0:delta<0;
                              const color=good?"#22c55e":bad?"#f87171":"#475569";
                              const weight=catNeed[cat]??0;
                              return (
                                <div key={cat} style={{background:"#0d0f16",border:`1px solid ${color}33`,borderRadius:4,padding:"4px 8px",minWidth:52,textAlign:"center"}}>
                                  <div style={{fontSize:8,color:"#475569",marginBottom:1}}>{cat}</div>
                                  <div style={{fontSize:12,fontWeight:700,color}}>{delta>0?"+":""}{delta}</div>
                                  {weight>0&&<div style={{width:4,height:4,borderRadius:"50%",background:CAT_NEED_COLOR[weight]||"#334155",margin:"2px auto 0"}}/>}
                                </div>
                              );
                            })}
                          </div>
                          <div style={{fontSize:9,color:"#334155",marginTop:8}}>Rate stats (AVG, ERA, WHIP, etc.) excluded — see Matchup tab.</div>
                        </div>
                      </div>
                    )}
                    {!tradeAnalysis&&<div style={{fontSize:11,color:"#334155",marginTop:8}}>Add players to both sides to see the analysis.</div>}
                  </div>
                )}

                </div>
              </div>
            );
          })()}

          {tab==="log"&&(
            <div style={{flex:1,overflowY:"auto",padding:12}}>
              <div style={{fontSize:10,color:"#cbd5e1",marginBottom:8}}>Live picks only (R1-10 keepers not shown).</div>
              {Object.keys(livePicks).length===0&&<div style={{color:"#1e293b",textAlign:"center",padding:40}}>No picks recorded yet.</div>}
              {Object.entries(livePicks).sort((a,b)=>Number(b[0])-Number(a[0])).map(([pick,name])=>{
                const mine = myDrafted.includes(name);
                const t = leagueTargets.find(x=>x.name===name);
                const owner = getPickOwner(Number(pick));
                return (
                  <div key={pick} style={{padding:"5px 8px",marginBottom:3,background:"#0d0f16",borderRadius:3,display:"flex",gap:8,fontSize:12,borderLeft:`2px solid ${mine?"#84cc16":"#1e293b"}`}}>
                    <span style={{color:"#1e3a5f",width:52,flexShrink:0}}>R{getRound(Number(pick))} #{pick}</span>
                    <span style={{color:mine?"#84cc16":"#94a3b8",flex:1}}>{name}</span>
                    {t&&<span style={{fontSize:9,color:TIER_COLOR[t.tier]}}>{TIER_LABEL[t.tier]}</span>}
                    <span style={{fontSize:9,color:mine?"#84cc16":"#475569"}}>{mine?"MINE":owner}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: WATCH / COMPARE PANEL */}
        <div style={{width:280,background:"#09090e",borderLeft:"1px solid #1e293b",display:"flex",flexDirection:"column",flexShrink:0}}>
          {/* Tab header */}
          <div style={{display:"flex",borderBottom:"1px solid #1e293b",flexShrink:0}}>
            {[["watch","★ Watch"],["compare","⚖ Compare"]].map(([id,label])=>(
              <button key={id} className="btn" onClick={()=>setRightTab(id)}
                style={{flex:1,padding:"8px 0",fontSize:10,letterSpacing:".08em",textTransform:"uppercase",
                  color:rightTab===id?"#f1f5f9":"#475569",
                  borderBottom:rightTab===id?"2px solid #84cc16":"2px solid transparent",
                  background:"transparent",borderRadius:0}}>
                {label}{id==="watch"&&watchList.length>0?` (${watchList.length})`:""}
                {id==="compare"&&compareList.length>0?` (${compareList.length})`:""}
              </button>
            ))}
          </div>

          {/* Watch tab */}
          {rightTab==="watch"&&(
            watchList.length===0
              ? <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20,textAlign:"center"}}>
                  <span style={{fontSize:11,color:"#cbd5e1",lineHeight:1.6}}>Tap <span style={{color:"#f59e0b"}}>☆</span> on any player to add them to your watch list.</span>
                </div>
              : <div style={{flex:1,overflowY:"auto",padding:10}}>
                  {watchList.map((name, idx)=>{
                    const t = scoredAvailable.find(p=>p.name===name) ?? leagueTargets.find(p=>p.name===name);
                    if(!t) return null;
                    const drafted = !scoredAvailable.some(p => p.name === name);
                    return (
                      <div key={name}
                        draggable
                        onDragStart={()=>{ dragWatchIdx.current = idx; }}
                        onDragOver={e=>{ e.preventDefault(); }}
                        onDrop={()=>{
                          const from = dragWatchIdx.current;
                          if (from == null || from === idx) return;
                          setWatchList(prev => {
                            const next = [...prev];
                            next.splice(idx, 0, next.splice(from, 1)[0]);
                            return next;
                          });
                          dragWatchIdx.current = null;
                        }}
                        style={{background:"#0d0f16",border:`1px solid #f59e0b44`,borderLeft:`3px solid #f59e0b`,borderRadius:4,padding:"10px",marginBottom:8,opacity:drafted?0.5:1,cursor:"grab"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:"#f1f5f9"}}>{t.name}{drafted&&<span style={{fontSize:9,color:"#f87171",marginLeft:5}}>DRAFTED</span>}</div>
                            <div style={{fontSize:10,color:"#cbd5e1",marginTop:1}}>{t.eligible.join("/")} · {t.org} · {t.type==="H"?"⚾":"⚡"}</div>
                          </div>
                          <button className="btn" style={{fontSize:9,color:"#f59e0b",background:"transparent",cursor:"pointer"}} onClick={()=>toggleWatch(name)}>✕</button>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 10px",fontSize:11}}>
                          {[["DNS",t.draftNowScore],["2026",t.score2026],["FT",t.scoreFTDyn??"-"],["VOR",(t.scarcity?.vor>0?"+":"")+t.scarcity?.vor],["Urgency",t.urgency+"%"],["Tier",TIER_LABEL[t.tier]]].map(([label,val])=>(
                            <div key={label}>
                              <span style={{color:"#cbd5e1"}}>{label}: </span>
                              <span style={{color:"#e2e8f0",fontWeight:600}}>{val}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{marginTop:6,display:"flex",gap:4,flexWrap:"wrap"}}>
                          {t.cats.map(c=>(
                            <span key={c} style={{fontSize:9,padding:"1px 5px",borderRadius:8,background:`${CAT_NEED_COLOR[catNeed[c]??0]}33`,color:CAT_NEED_COLOR[catNeed[c]??1]||"#475569"}}>{c}</span>
                          ))}
                        </div>
                        {t.il&&<div style={{marginTop:5,fontSize:9,color:"#f87171"}}>⚠ IL</div>}
                      </div>
                    );
                  })}
                </div>
          )}

          {/* Compare tab */}
          {rightTab==="compare"&&(
            compareList.length===0
              ? <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20,textAlign:"center"}}>
                  <span style={{fontSize:11,color:"#cbd5e1",lineHeight:1.6}}>Tap <span style={{color:"#84cc16"}}>vs</span> on any two players to compare them side by side.</span>
                </div>
              : <div style={{flex:1,overflowY:"auto",padding:10}}>
                  {compareList.map(name=>{
                    const t = scoredAvailable.find(p=>p.name===name);
                    if(!t) return null;
                    return (
                      <div key={name} style={{background:"#0d0f16",border:`1px solid ${TIER_COLOR[t.tier]}44`,borderLeft:`3px solid ${TIER_COLOR[t.tier]}`,borderRadius:4,padding:"10px",marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                          <div>
                            <div style={{fontSize:13,fontWeight:600,color:"#f1f5f9"}}>{t.name}</div>
                            <div style={{fontSize:10,color:"#cbd5e1",marginTop:1}}>{t.eligible.join("/")} · {t.org} · {t.type==="H"?"⚾":"⚡"}</div>
                          </div>
                          <button className="btn" style={{fontSize:9,color:"#f87171",background:"transparent"}} onClick={()=>toggleCompare(name)}>✕</button>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 10px",fontSize:11}}>
                          {[["DNS",t.draftNowScore],["2026",t.score2026],["FT",t.scoreFTDyn??"-"],["VOR",(t.scarcity.vor>0?"+":"")+t.scarcity.vor],["Urgency",t.urgency+"%"],["Tier",TIER_LABEL[t.tier]]].map(([label,val])=>(
                            <div key={label}>
                              <span style={{color:"#cbd5e1"}}>{label}: </span>
                              <span style={{color:"#e2e8f0",fontWeight:600}}>{val}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{marginTop:6,display:"flex",gap:4,flexWrap:"wrap"}}>
                          {t.cats.map(c=>(
                            <span key={c} style={{fontSize:9,padding:"1px 5px",borderRadius:8,background:`${CAT_NEED_COLOR[catNeed[c]??0]}33`,color:CAT_NEED_COLOR[catNeed[c]??1]||"#475569"}}>{c}</span>
                          ))}
                        </div>
                        {t.il&&<div style={{marginTop:5,fontSize:9,color:"#f87171"}}>⚠ IL — 2026 score discounted 40%</div>}
                      </div>
                    );
                  })}
                  {compareList.length===1&&(
                    <div style={{textAlign:"center",fontSize:10,color:"#cbd5e1",padding:"20px 10px",border:"1px dashed #1e293b",borderRadius:4}}>
                      Tap <span style={{color:"#84cc16"}}>vs</span> on a second player
                    </div>
                  )}
                </div>
          )}
        </div>
      </div>
    </div>
  );
}

