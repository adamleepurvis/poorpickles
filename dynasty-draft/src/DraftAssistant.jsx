import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import targetsData from "../data/targets.json";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const MY_TEAM = "Poor Pickles";
const TOTAL_TEAMS = 12;
const TOTAL_ROUNDS = 29;
const DRAFT_START_PICK = 121;

// Snake order slot 1-12 in round 1 (Poor Pickles = slot 8)
const DRAFT_ORDER = [
  "Dynasty","Bay of Papi","gamma's Team","Hideo Lobo","JP Licks","Loch Neskie",
  "Nighthawks",MY_TEAM,"Snipe City","StickyBanditz","Team Underdog","Toms River"
];

function getRound(pick) { return Math.ceil(pick / TOTAL_TEAMS); }
function getPickOwner(pick) {
  const round = getRound(pick);
  const pos = (pick - 1) % TOTAL_TEAMS;
  return DRAFT_ORDER[round % 2 === 0 ? (TOTAL_TEAMS - 1 - pos) : pos];
}
function getMyPicks() {
  const picks = [];
  for (let p = DRAFT_START_PICK; p <= TOTAL_TEAMS * TOTAL_ROUNDS; p++)
    if (getPickOwner(p) === MY_TEAM) picks.push(p);
  return picks;
}
const MY_PICKS = getMyPicks();

// ─── KEEPER DATA ─────────────────────────────────────────────────────────────
const KEEPER_PICKS = [
  {pick:1,r:1,player:"Bobby Witt Jr.",pos:"SS",team:"Dynasty"},{pick:2,r:1,player:"Fernando Tatis Jr.",pos:"RF",team:"Bay of Papi"},{pick:3,r:1,player:"José Ramírez",pos:"3B",team:"gamma's Team"},{pick:4,r:1,player:"Shohei Ohtani (Batter)",pos:"Util",team:"Hideo Lobo"},{pick:5,r:1,player:"Zach Neto",pos:"SS",team:"JP Licks"},{pick:6,r:1,player:"Elly De La Cruz",pos:"SS",team:"Loch Neskie"},{pick:7,r:1,player:"Juan Soto",pos:"LF",team:"Nighthawks"},{pick:8,r:1,player:"Geraldo Perdomo",pos:"SS",team:MY_TEAM},{pick:9,r:1,player:"Brent Rooker",pos:"LF",team:"Snipe City"},{pick:10,r:1,player:"Aaron Judge",pos:"RF",team:"StickyBanditz"},{pick:11,r:1,player:"Julio Rodríguez",pos:"CF",team:"Team Underdog"},{pick:12,r:1,player:"Jazz Chisholm Jr.",pos:"2B",team:"Toms River"},
  {pick:13,r:2,player:"Wyatt Langford",pos:"CF",team:"Toms River"},{pick:14,r:2,player:"Ronald Acuña Jr.",pos:"RF",team:"Team Underdog"},{pick:15,r:2,player:"Rafael Devers",pos:"1B",team:"StickyBanditz"},{pick:16,r:2,player:"James Wood",pos:"LF",team:"Snipe City"},{pick:17,r:2,player:"Vinnie Pasquantino",pos:"1B",team:MY_TEAM},{pick:18,r:2,player:"Kyle Tucker",pos:"RF",team:"Nighthawks"},{pick:19,r:2,player:"Kyle Schwarber",pos:"LF",team:"Loch Neskie"},{pick:20,r:2,player:"Matt Olson",pos:"1B",team:"JP Licks"},{pick:21,r:2,player:"Trea Turner",pos:"SS",team:"Hideo Lobo"},{pick:22,r:2,player:"Junior Caminero",pos:"3B",team:"gamma's Team"},{pick:23,r:2,player:"Nick Kurtz",pos:"1B",team:"Bay of Papi"},{pick:24,r:2,player:"Pete Alonso",pos:"1B",team:"Dynasty"},
  {pick:25,r:3,player:"Jarren Duran",pos:"CF",team:"Dynasty"},{pick:26,r:3,player:"Manny Machado",pos:"3B",team:"Bay of Papi"},{pick:27,r:3,player:"Jackson Chourio",pos:"CF",team:"gamma's Team"},{pick:28,r:3,player:"Agustín Ramírez",pos:"C",team:"Hideo Lobo"},{pick:29,r:3,player:"Brice Turang",pos:"2B",team:"JP Licks"},{pick:30,r:3,player:"Ketel Marte",pos:"2B",team:"Loch Neskie"},{pick:31,r:3,player:"Gunnar Henderson",pos:"SS",team:"Nighthawks"},{pick:32,r:3,player:"Maikel Garcia",pos:"3B",team:MY_TEAM},{pick:33,r:3,player:"Randy Arozarena",pos:"CF",team:"Snipe City"},{pick:34,r:3,player:"Corey Seager",pos:"SS",team:"StickyBanditz"},{pick:35,r:3,player:"Corbin Carroll",pos:"CF",team:"Team Underdog"},{pick:36,r:3,player:"CJ Abrams",pos:"SS",team:"Toms River"},
  {pick:37,r:4,player:"Willson Contreras",pos:"C",team:"Toms River"},{pick:38,r:4,player:"Francisco Lindor",pos:"SS",team:"Team Underdog"},{pick:39,r:4,player:"William Contreras",pos:"C",team:"StickyBanditz"},{pick:40,r:4,player:"Michael Busch",pos:"1B",team:"Snipe City"},{pick:41,r:4,player:"Tyler Soderstrom",pos:"C",team:MY_TEAM},{pick:42,r:4,player:"Bryce Harper",pos:"1B",team:"Nighthawks"},{pick:43,r:4,player:"Riley Greene",pos:"CF",team:"Loch Neskie"},{pick:44,r:4,player:"Matt Shaw",pos:"3B",team:"JP Licks"},{pick:45,r:4,player:"Noelvi Marte",pos:"3B",team:"Hideo Lobo"},{pick:46,r:4,player:"Cal Raleigh",pos:"C",team:"gamma's Team"},{pick:47,r:4,player:"Yordan Alvarez",pos:"LF",team:"Bay of Papi"},{pick:48,r:4,player:"Pete Crow-Armstrong",pos:"CF",team:"Dynasty"},
  {pick:49,r:5,player:"Shea Langeliers",pos:"C",team:"Dynasty"},{pick:50,r:5,player:"Mookie Betts",pos:"SS",team:"Bay of Papi"},{pick:51,r:5,player:"Vladimir Guerrero Jr.",pos:"1B",team:"gamma's Team"},{pick:52,r:5,player:"JJ Wetherholt",pos:"SS",team:"Hideo Lobo"},{pick:53,r:5,player:"Travis Bazzana",pos:"2B",team:"JP Licks"},{pick:54,r:5,player:"Josh Naylor",pos:"1B",team:"Loch Neskie"},{pick:55,r:5,player:"Jackson Merrill",pos:"CF",team:"Nighthawks"},{pick:56,r:5,player:"Michael Harris II",pos:"CF",team:MY_TEAM},{pick:57,r:5,player:"Samuel Basallo",pos:"C",team:"Snipe City"},{pick:58,r:5,player:"Ozzie Albies",pos:"2B",team:"StickyBanditz"},{pick:59,r:5,player:"Will Smith",pos:"C",team:"Team Underdog"},{pick:60,r:5,player:"Alec Burleson",pos:"1B",team:"Toms River"},
  {pick:61,r:6,player:"Christian Walker",pos:"1B",team:"Toms River"},{pick:62,r:6,player:"Logan Gilbert",pos:"SP",team:"Team Underdog"},{pick:63,r:6,player:"Colson Montgomery",pos:"SS",team:"StickyBanditz"},{pick:64,r:6,player:"Leo De Vries",pos:"SS",team:"Snipe City"},{pick:65,r:6,player:"Jo Adell",pos:"RF",team:MY_TEAM},{pick:66,r:6,player:"Austin Riley",pos:"3B",team:"Nighthawks"},{pick:67,r:6,player:"Oneil Cruz",pos:"CF",team:"Loch Neskie"},{pick:68,r:6,player:"Max Clark",pos:"CF",team:"JP Licks"},{pick:69,r:6,player:"Royce Lewis",pos:"3B",team:"Hideo Lobo"},{pick:70,r:6,player:"Roman Anthony",pos:"LF",team:"gamma's Team"},{pick:71,r:6,player:"Ben Rice",pos:"C",team:"Bay of Papi"},{pick:72,r:6,player:"Kyle Stowers",pos:"LF",team:"Dynasty"},
  {pick:73,r:7,player:"Tarik Skubal",pos:"SP",team:"Dynasty"},{pick:74,r:7,player:"Konnor Griffin",pos:"CF",team:"Bay of Papi"},{pick:75,r:7,player:"Kevin McGonigle",pos:"SS",team:"gamma's Team"},{pick:76,r:7,player:"Jackson Holliday",pos:"SS",team:"Hideo Lobo"},{pick:77,r:7,player:"Jesús Made",pos:"SS",team:"JP Licks"},{pick:78,r:7,player:"Hunter Brown",pos:"SP",team:"Loch Neskie"},{pick:79,r:7,player:"Bo Bichette",pos:"SS",team:"Nighthawks"},{pick:80,r:7,player:"Drake Baldwin",pos:"C",team:MY_TEAM},{pick:81,r:7,player:"Joe Ryan",pos:"SP",team:"Snipe City"},{pick:82,r:7,player:"Jac Caglianone",pos:"1B",team:"StickyBanditz"},{pick:83,r:7,player:"Kyle Bradish",pos:"SP",team:"Team Underdog"},{pick:84,r:7,player:"Blake Snell",pos:"SP",team:"Toms River"},
  {pick:85,r:8,player:"Bubba Chandler",pos:"SP",team:"Toms River"},{pick:86,r:8,player:"Chase Burns",pos:"SP",team:"Team Underdog"},{pick:87,r:8,player:"Paul Skenes",pos:"SP",team:"StickyBanditz"},{pick:88,r:8,player:"Jesús Luzardo",pos:"SP",team:"Snipe City"},{pick:89,r:8,player:"Bryce Eldridge",pos:"1B",team:MY_TEAM},{pick:90,r:8,player:"Nick Pivetta",pos:"SP",team:"Nighthawks"},{pick:91,r:8,player:"Logan Webb",pos:"SP",team:"Loch Neskie"},{pick:92,r:8,player:"Walker Jenkins",pos:"CF",team:"JP Licks"},{pick:93,r:8,player:"Evan Carter",pos:"LF",team:"Hideo Lobo"},{pick:94,r:8,player:"Garrett Crochet",pos:"SP",team:"gamma's Team"},{pick:95,r:8,player:"Bryan Woo",pos:"SP",team:"Bay of Papi"},{pick:96,r:8,player:"Yoshinobu Yamamoto",pos:"SP",team:"Dynasty"},
  {pick:97,r:9,player:"Cole Ragans",pos:"SP",team:"Dynasty"},{pick:98,r:9,player:"Max Fried",pos:"SP",team:"Bay of Papi"},{pick:99,r:9,player:"Cristopher Sánchez",pos:"SP",team:"gamma's Team"},{pick:100,r:9,player:"Shane McClanahan",pos:"SP",team:"Hideo Lobo"},{pick:101,r:9,player:"Zyhir Hope",pos:"CF",team:"JP Licks"},{pick:102,r:9,player:"George Kirby",pos:"SP",team:"Loch Neskie"},{pick:103,r:9,player:"Nolan McLean",pos:"SP",team:"Nighthawks"},{pick:104,r:9,player:"Framber Valdez",pos:"SP",team:MY_TEAM},{pick:105,r:9,player:"Trevor Rogers",pos:"SP",team:"Snipe City"},{pick:106,r:9,player:"Freddy Peralta",pos:"SP",team:"StickyBanditz"},{pick:107,r:9,player:"Nick Lodolo",pos:"SP",team:"Team Underdog"},{pick:108,r:9,player:"MacKenzie Gore",pos:"SP",team:"Toms River"},
  {pick:109,r:10,player:"Andrew Painter",pos:"SP",team:"Toms River"},{pick:110,r:10,player:"Shohei Ohtani",pos:"SP",team:"Team Underdog"},{pick:111,r:10,player:"Dylan Cease",pos:"SP",team:"StickyBanditz"},{pick:112,r:10,player:"Shota Imanaga",pos:"SP",team:"Snipe City"},{pick:113,r:10,player:"Roki Sasaki",pos:"SP",team:MY_TEAM},{pick:114,r:10,player:"Eury Pérez",pos:"SP",team:"Nighthawks"},{pick:115,r:10,player:"Edwin Díaz",pos:"RP",team:"Loch Neskie"},{pick:116,r:10,player:"Hunter Greene",pos:"SP",team:"JP Licks"},{pick:117,r:10,player:"Kodai Senga",pos:"SP",team:"Hideo Lobo"},{pick:118,r:10,player:"Chris Sale",pos:"SP",team:"gamma's Team"},{pick:119,r:10,player:"Jacob Misiorowski",pos:"SP",team:"Bay of Papi"},{pick:120,r:10,player:"Jacob deGrom",pos:"SP",team:"Dynasty"},
];

const POS_SCARCITY_ORDER = ["C","SS","2B","3B","CF","LF","RF","1B","SP","RP"];

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

// Normalize zar_model cat names to match BASE_CAT_NEED keys (K9→K/9, BB9→BB/9)
const TARGETS = targetsData.players.map(p => ({
  ...p,
  tier: inferTier(p),
  cats: p.cats.map(c => c === "K9" ? "K/9" : c === "BB9" ? "BB/9" : c),
  // Pitchers' 2-year projections carry higher uncertainty — discount at source
  // so sorting, display, and DNS all use the same adjusted number.
  // For IL players, Steamer depresses 2026 IP/stats, so blend projected 2028 with
  // dynasty score to better reflect their healthy ceiling.
  score2028: (() => {
    if (p.score2028 == null) return null;
    const raw = p.type === "P" ? Math.round(p.score2028 * 0.85 * 10) / 10 : p.score2028;
    if (p.il && p.scoreDyn != null) return Math.round(((raw + p.scoreDyn) / 2) * 10) / 10;
    // For prospects, Steamer can't project upside — blend s28 toward FV raw ceiling
    const fvRaw = {"70":10,"65":8.5,"60":7.0,"55":6.0,"50":5.0,"45+":4.5,"45":4.0,"40+":3.5,"40":3.0,"35+":2.5,"35":2.0}[p.prospectFV] ?? null;
    if (fvRaw != null) return Math.round(((raw + fvRaw) / 2) * 10) / 10;
    return raw;
  })(),
}));

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

// BASE category needs — never mutated, used as reference for "original"
const BASE_CAT_NEED = {
  R:1, H:1, HR:3, RBI:3, SB:1, TB:2, AVG:1, OBP:1, SLG:3,
  K:2, IP:1, W:1, ER:1, ERA:2, WHIP:2, "K/9":2, "BB/9":2, NSVH:3
};

// Compute dynamic CAT_NEED by decaying based on my drafted players
// Each pick covering a category drops its need by 1 (floor 0)
function computeDynamicCatNeed(myDraftedNames) {
  const needs = {...BASE_CAT_NEED};
  myDraftedNames.forEach(name => {
    const player = TARGETS.find(t => t.name === name);
    if (!player) return;
    player.cats.forEach(cat => {
      if (needs[cat] !== undefined && needs[cat] > 0) {
        needs[cat] = Math.max(0, needs[cat] - 1);
      }
    });
  });
  // Also factor in keepers — they've already partially filled categories
  // Keepers contribute half a decay step (0.5, floored to int after all picks)
  const keeperCatCounts = {};
  KEEPER_PICKS.filter(p => p.team === MY_TEAM).forEach(kp => {
    const kt = TARGETS.find(t => t.name === kp.player);
    if (!kt) return;
    kt.cats.forEach(cat => {
      keeperCatCounts[cat] = (keeperCatCounts[cat] || 0) + 1;
    });
  });
  // Keepers already encoded in MY_KEEPER_CATS status, so just clamp
  Object.keys(needs).forEach(cat => {
    needs[cat] = Math.max(0, needs[cat]);
  });
  return needs;
}

// Compute which starting positions are already filled on my roster.
// Used by "Needs" mode to discount players at filled positions.
function getFilledPositions(myDraftedNames) {
  const myPlayers = [
    ...KEEPER_PICKS.filter(k => k.team === MY_TEAM)
      .map(k => TARGETS.find(t => t.name === k.player)).filter(Boolean),
    ...myDraftedNames.map(name => TARGETS.find(t => t.name === name)).filter(Boolean),
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

// Normalize accented characters for fuzzy name matching
function normalizeName(name) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function calcCatScore(player, catNeed) {
  const need = catNeed || BASE_CAT_NEED;
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

  // Ceiling bonus: when dynasty ceiling >> current floor, reward the upside gap.
  const dynastyScore = ft ?? dyn;
  const ceilingBonus = Math.min(Math.max(0, dynastyScore - s26) * 0.3, 3.0) * posDiscount;
  return Math.round((base * catMult * posDiscount + ceilingBonus) * 10) / 10;
}

// Positional scarcity: slope-based VOR
// Uses least-squares regression on rank vs. score to measure how steeply
// values drop at this position, then computes VOR vs. replacement level.
function calcPositionalScarcity(player, available, catNeed) {
  const posRanked = [...player.eligible].sort(
    (a, b) => POS_SCARCITY_ORDER.indexOf(a) - POS_SCARCITY_ORDER.indexOf(b)
  );
  const scarcePos = posRanked[0];
  const posPool = available
    .filter(p => p.name !== player.name && p.eligible.includes(scarcePos))
    .map(p => calcBaseScore(p, catNeed))
    .sort((a, b) => b - a);

  // Replacement level = value of the player just past the drafted pool for this pos
  const slotsPerPos = { C:1, "1B":1, "2B":1, "3B":1, SS:1, LF:1, CF:1, RF:1, Util:1, SP:4, RP:2 };
  const draftedAtPos = (slotsPerPos[scarcePos] || 1) * TOTAL_TEAMS;
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
function calcLeagueScarcity(player, available, livePicks) {
  const totalAtPos = TARGETS.filter(p => p.eligible.some(e => player.eligible.includes(e))).length;
  const availAtPos = available.filter(p => p.eligible.some(e => player.eligible.includes(e))).length;
  const depletionRate = 1 - (availAtPos / totalAtPos);
  return Math.round(depletionRate * 100);
}

// Urgency: probability player is gone by next pick
// Uses live position depletion rate (how fast this pos is being taken)
// calibrated to actual picks-away from your next turn.
function calcUrgency(player, currentPick, available) {
  const nextMyPick = MY_PICKS.find(p => p > currentPick);
  if (!nextMyPick) return 0;
  const picksAway = nextMyPick - currentPick;

  // Live depletion rate for this position: fraction of pool already gone
  const scarcePos = [...player.eligible].sort(
    (a, b) => POS_SCARCITY_ORDER.indexOf(a) - POS_SCARCITY_ORDER.indexOf(b)
  )[0];
  const totalAtPos = TARGETS.filter(p => p.eligible.includes(scarcePos)).length;
  const availAtPos = available.filter(p => p.eligible.includes(scarcePos)).length;
  const depletionRate = totalAtPos > 0 ? (totalAtPos - availAtPos) / totalAtPos : 0;

  // Base pick rate per pick = depletion rate / picks elapsed, floored by tier
  const picksElapsed = Math.max(currentPick - DRAFT_START_PICK, 1);
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
function calcDraftNowScore(player, available, livePicks, currentPick, catNeed, filledPositions) {
  const base = calcBaseScore(player, catNeed);
  const { vor } = calcPositionalScarcity(player, available, catNeed);
  const urgency = calcUrgency(player, currentPick, available) / 100;
  const urgencyBonus = urgency * 1.5;
  const vorBonus = Math.min(Math.max(vor * 0.3, 0), 1.0);
  let final = base + urgencyBonus + vorBonus;
  // Needs mode: discount players whose eligible positions are all already filled
  if (filledPositions && player.eligible.length > 0 &&
      player.eligible.every(p => filledPositions.has(p))) {
    final *= NEEDS_DISCOUNT;
  }
  return Math.round(final * 10) / 10;
}

const HIT_CATS   = ["R","H","HR","RBI","SB","TB","AVG","OBP","SLG"];
const PITCH_CATS = ["IP","W","ER","K","ERA","WHIP","K/9","BB/9","NSVH"];

// ─── STYLE CONSTANTS ──────────────────────────────────────────────────────────
const TIER_COLOR = {keep6:"#f59e0b",keep12:"#22c55e",bridge:"#60a5fa",maybe:"#c084fc",specialist:"#f472b6"};
const TIER_LABEL = {keep6:"Keep-6 🔒",keep12:"Keep-12",bridge:"Bridge",maybe:"Maybe",specialist:"Specialist"};
const CAT_NEED_COLOR = {0:"#1e293b",1:"#475569",2:"#60a5fa",3:"#f87171"};
const MY_KEEPER_CATS = {
  R:"ok",H:"ok",HR:"thin",RBI:"thin",SB:"strong",TB:"thin",AVG:"ok",OBP:"ok",SLG:"thin",
  K:"ok",IP:"ok",W:"ok",ER:"ok",ERA:"ok",WHIP:"ok","K/9":"ok","BB/9":"ok",NSVH:"thin"
};
const CAT_STATUS_COLOR = {strong:"#22c55e",ok:"#60a5fa",thin:"#84cc16",missing:"#f87171"};


// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function App() {
  const [livePicks, setLivePicks] = useState({});
  const [myDrafted, setMyDrafted] = useState([]);
  const [playerNotes, setPlayerNotes] = useState({});
  const [currentPick, setCurrentPick] = useState(DRAFT_START_PICK);
  const [pickInput, setPickInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [compareList, setCompareList] = useState([]);
  const [posFilter, setPosFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dns");
  const [search, setSearch] = useState("");
  const [watchList, setWatchList] = useState(new Set());
  const [tab, setTab] = useState("board");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editingNote, setEditingNote] = useState(null);
  const [needsMode, setNeedsMode] = useState(false);
  const [fvFilter, setFvFilter] = useState(null); // null | 40 | 45 | 50 | 55 | 60
  const [noteInput, setNoteInput] = useState("");
  const [catStatus, setCatStatus] = useState(MY_KEEPER_CATS);
  const [catNeed, setCatNeed] = useState(BASE_CAT_NEED);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(null);
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
    setCatNeed(computeDynamicCatNeed(myDrafted));
  }, [myDrafted]);

  const allTaken = useMemo(() =>
    new Set([...KEEPER_PICKS.map(p=>normalizeName(p.player)), ...Object.values(livePicks).map(normalizeName)]),
    [livePicks]
  );

  const available = useMemo(() =>
    TARGETS.filter(t => !allTaken.has(normalizeName(t.name))),
    [allTaken]
  );

  const filledPositions = useMemo(() => getFilledPositions(myDrafted), [myDrafted]);

  // Scored and sorted available targets — recalculates live as catNeed evolves
  const scoredAvailable = useMemo(() =>
    available.map(t => ({
      ...t,
      baseScore: calcBaseScore(t, catNeed),
      draftNowScore: calcDraftNowScore(t, available, livePicks, currentPick, catNeed, needsMode ? filledPositions : null),
      scarcity: calcPositionalScarcity(t, available, catNeed),
      urgency: calcUrgency(t, currentPick, available),
      leagueDepletion: calcLeagueScarcity(t, available, livePicks),
    })).sort((a, b) => b.draftNowScore - a.draftNowScore),
    [available, livePicks, currentPick, catNeed, needsMode, filledPositions]
  );

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
  const isMyClock = MY_PICKS.includes(currentPick);
  const nextMine = MY_PICKS.find(p => p >= currentPick);
  const until = nextMine ? nextMine - currentPick : 0;
  const snakePicks = MY_PICKS.filter(p => p >= currentPick).slice(0, 4);
  const lateAlerts = scoredAvailable.filter(t => t.tier === "keep6" && t.urgency >= 60);

  // Watch list toggle
  const toggleWatch = useCallback((name) => {
    setWatchList(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
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
      ...KEEPER_PICKS.filter(k => k.team === MY_TEAM)
        .map(k => TARGETS.find(t => t.name === k.player)).filter(Boolean),
      ...myDrafted.map(name => TARGETS.find(t => t.name === name)).filter(Boolean),
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

  // Category projection: my projected rank in each category vs all 12 teams (based on keepers + drafted)
  const catProjection = useMemo(() => {
    const teamCoverage = {};
    DRAFT_ORDER.forEach(team => {
      const roster = [
        ...KEEPER_PICKS.filter(p => p.team === team)
          .map(kp => TARGETS.find(t => normalizeName(t.name) === normalizeName(kp.player)))
          .filter(Boolean),
        ...(team === MY_TEAM
          ? myDrafted.map(n => TARGETS.find(t => t.name === n)).filter(Boolean)
          : []),
      ];
      const scores = {};
      [...HIT_CATS, ...PITCH_CATS].forEach(cat => {
        scores[cat] = roster.filter(p => p.cats.includes(cat)).reduce((s, p) => s + p.score2026, 0);
      });
      teamCoverage[team] = scores;
    });
    return [...HIT_CATS, ...PITCH_CATS].map(cat => {
      const myScore = teamCoverage[MY_TEAM]?.[cat] || 0;
      const allScores = DRAFT_ORDER.map(t => teamCoverage[t]?.[cat] || 0).sort((a, b) => b - a);
      const rank = allScores.findIndex(s => s <= myScore) + 1;
      const max = allScores[0] || 1;
      return { cat, myScore, rank, max };
    });
  }, [myDrafted]);

  // Team rosters from keepers
  const teamRosters = useMemo(() => {
    const rosters = {};
    DRAFT_ORDER.filter(t => t !== MY_TEAM).forEach(team => {
      rosters[team] = KEEPER_PICKS.filter(p => p.team === team);
    });
    return rosters;
  }, []);

  const handlePickInput = (val) => {
    setPickInput(val);
    if (val.length < 2) { setSuggestions([]); return; }
    const lower = normalizeName(val);
    const allNames = [...new Set([...TARGETS.map(t=>t.name), ...KEEPER_PICKS.map(p=>p.player)])];
    const matches = allNames.filter(n => normalizeName(n).includes(lower) && !allTaken.has(normalizeName(n))).slice(0, 5);
    setSuggestions(matches);
  };

  const record = () => {
    if (!pickInput.trim()) return;
    const name = pickInput.trim();
    const mine = getPickOwner(currentPick) === MY_TEAM;
    setLivePicks(prev => ({...prev, [currentPick]: name}));
    if (mine) setMyDrafted(prev => [...prev, name]);
    setPickInput(""); setSuggestions([]);
    setCurrentPick(p => p + 1);
    setTimeout(() => pickInputRef.current?.focus(), 50);
  };

  const reset = () => {
    setLivePicks({}); setMyDrafted([]); setCurrentPick(DRAFT_START_PICK);
    setPickInput(""); setSuggestions([]); setCatStatus(MY_KEEPER_CATS);
    setCatNeed(BASE_CAT_NEED);
  };

  const toggleCompare = useCallback((name) => {
    setCompareList(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name);
      if (prev.length >= 2) return [prev[1], name];
      return [...prev, name];
    });
  }, []);

  const myRoster = [
    ...KEEPER_PICKS.filter(p=>p.team===MY_TEAM).map(p=>({name:p.player,kept:true})),
    ...myDrafted.map(n=>({name:n,kept:false}))
  ].map(p => ({...p, target: TARGETS.find(t=>t.name===p.name)||null}));

  const [rosterSelected, setRosterSelected] = useState(null);


  // Score bar color
  const scoreColor = (s) => s >= 8 ? "#84cc16" : s >= 6.5 ? "#22c55e" : s >= 5 ? "#60a5fa" : "#64748b";

  // ── Player card renderer (used in board tab) ─────────────────────────────
  const renderCard = (t, idx, isWatched) => {
    const isExpanded = showScoreBreakdown === t.name;
    const rank = dnsRankMap[t.name] ?? 0;
    const roundDelta = Math.round((DRAFT_START_PICK + rank - 1 - currentPick) / TOTAL_TEAMS);
    const rvColor = roundDelta >= 3 ? "#22c55e" : roundDelta > 0 ? "#84cc16" : roundDelta === 0 ? "#475569" : "#f59e0b";
    const rvLabel = roundDelta > 0 ? `+R${roundDelta}` : roundDelta === 0 ? "~R0" : `-R${Math.abs(roundDelta)}`;
    return (
      <div key={t.name} className="score-row"
        style={{background:"#0d0f16",border:`1px solid ${isWatched?"#f59e0b44":TIER_COLOR[t.tier]+"22"}`,borderLeft:`3px solid ${isWatched?"#f59e0b":TIER_COLOR[t.tier]}`,borderRadius:4,padding:"7px 10px",marginBottom:4,cursor:"pointer"}}
        onClick={()=>setShowScoreBreakdown(isExpanded ? null : t.name)}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:11,color:"#475569",width:18,textAlign:"right",flexShrink:0}}>#{idx+1}</span>
          {/* Score badges */}
          <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0,alignItems:"center"}}>
            <div style={{background:`${scoreColor(t.draftNowScore)}22`,border:`1px solid ${scoreColor(t.draftNowScore)}44`,borderRadius:4,padding:"1px 6px",minWidth:32,textAlign:"center"}}>
              <span style={{fontSize:9,color:"#475569"}}>DNS </span>
              <span style={{fontSize:13,fontWeight:700,color:scoreColor(t.draftNowScore)}}>{t.draftNowScore}</span>
            </div>
            <div style={{background:"#1e293b",borderRadius:4,padding:"1px 6px",minWidth:32,textAlign:"center"}}>
              <span style={{fontSize:9,color:"#475569"}}>26 </span>
              <span style={{fontSize:11,fontWeight:600,color:"#60a5fa"}}>{t.score2026}</span>
            </div>
            {t.score2028 != null && (
              <div style={{background:"#1e293b",borderRadius:4,padding:"1px 6px",minWidth:32,textAlign:"center"}}>
                <span style={{fontSize:9,color:"#475569"}}>28 </span>
                <span style={{fontSize:11,fontWeight:600,color:"#34d399"}}>{t.score2028}</span>
              </div>
            )}
            {t.scoreFTDyn != null && (
              <div style={{background:"#1e293b",borderRadius:4,padding:"1px 6px",minWidth:32,textAlign:"center"}}>
                <span style={{fontSize:9,color:"#475569"}}>FT </span>
                <span style={{fontSize:11,fontWeight:600,color:"#a78bfa"}}>{t.scoreFTDyn}</span>
              </div>
            )}
          </div>
          {/* Name + meta */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
              <span style={{fontSize:15,color:"#f1f5f9",fontWeight:500}}>{t.name}</span>
              {t.il&&<span style={{fontSize:9,color:"#f87171",background:"#7f1d1d33",padding:"1px 4px",borderRadius:3}}>IL</span>}
              {t.est&&<span style={{fontSize:9,color:"#64748b",background:"#1e293b",padding:"1px 4px",borderRadius:3}}>EST</span>}
              {t.eligible.map(p=>(
                <span key={p} style={{fontSize:9,color:"#94a3b8",background:"#1e293b",padding:"1px 5px",borderRadius:3,border:"1px solid #334155"}}>{p}</span>
              ))}
              <span style={{fontSize:10,color:"#475569"}}>· {t.org}</span>
              {t.age > 0 && <span style={{fontSize:10,color:"#475569"}}>· {t.age}</span>}
              {t.prospectFV != null && (() => {
                const fvColor = t.prospectFV >= 60 ? "#f59e0b" : t.prospectFV >= 55 ? "#22c55e" : t.prospectFV >= 50 ? "#60a5fa" : "#94a3b8";
                const riskDot = t.prospectRisk === "Low" ? "●" : t.prospectRisk === "Med" ? "●" : t.prospectRisk === "High" ? "●" : "●";
                const riskColor = t.prospectRisk === "Low" ? "#22c55e" : t.prospectRisk === "Med" ? "#f59e0b" : "#f87171";
                return (
                  <span style={{fontSize:9,padding:"1px 6px",borderRadius:3,background:`${fvColor}18`,color:fvColor,border:`1px solid ${fvColor}44`,fontWeight:600}}>
                    FV{t.prospectFV}
                    <span style={{color:riskColor,marginLeft:3}}>{riskDot}</span>
                    {t.prospectETA && <span style={{color:"#475569",fontWeight:400}}> {t.prospectETA}</span>}
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
            <div style={{fontSize:10,color:"#475569",marginTop:1}}>{playerNotes[t.name]||t.note}</div>
          </div>
          {/* Right side: value indicator + urgency + buttons */}
          <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
            <span style={{fontSize:9,color:rvColor,background:`${rvColor}18`,padding:"1px 5px",borderRadius:3,fontWeight:600}}>{rvLabel}</span>
            {t.urgency >= 50 && (
              <span style={{fontSize:9,color:"#f87171",background:"#7f1d1d33",padding:"1px 5px",borderRadius:3}}>{t.urgency}% gone</span>
            )}
            <span style={{fontSize:9,color:"#475569"}}>VOR {t.scarcity.vor > 0 ? "+":""}{t.scarcity.vor}</span>
            <span style={{fontSize:10,color:"#475569"}}>{t.type==="H"?"⚾":"⚡"}</span>
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
              const mine = getPickOwner(currentPick) === MY_TEAM;
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
            <div style={{fontSize:11,color:"#64748b"}}>
              <div style={{color:"#94a3b8",marginBottom:3,fontSize:10,textTransform:"uppercase",letterSpacing:".06em"}}>Score Breakdown</div>
              <div>Base: <span style={{color:"#94a3b8"}}>{t.baseScore}</span></div>
              <div>2026{t.il?" (IL)":""}: <span style={{color:"#94a3b8"}}>{t.il ? Math.round(t.score2026*IL_2026_DISCOUNT*10)/10 : t.score2026}</span></div>
              <div>2028: <span style={{color:"#94a3b8"}}>{t.score2028??"-"}</span></div>
              {t.scoreFTDyn!=null&&<div>FT Dyn: <span style={{color:"#94a3b8"}}>{t.scoreFTDyn}</span></div>}
              {t.scoreYahoo!=null&&<div>Yahoo proj: <span style={{color:t.scoreYahoo>t.score2026?"#34d399":t.scoreYahoo<t.score2026?"#f87171":"#94a3b8"}}>{t.scoreYahoo}{t.scoreYahoo>t.score2026?" ↑":t.scoreYahoo<t.score2026?" ↓":""}</span></div>}
              {t.fpAdp!=null&&<div>FP ADP: <span style={{color:"#94a3b8"}}>#{t.fpRank} (avg {t.fpAdp})</span></div>}
              {t.espnRank!=null&&<div>ESPN: <span style={{color:"#a78bfa"}}>#{t.espnRank}{t.espnAscending?" ↑ (career-best)":""}{t.espnPrevPeak&&t.espnPrevPeak!==t.espnRank?" (prev peak #"+t.espnPrevPeak+")":""}</span></div>}
              {t.prospectFV!=null&&<div>Prospect: <span style={{color:"#94a3b8"}}>FV{t.prospectFV} · {t.prospectRisk} risk · ETA {t.prospectETA}{t.prospectRank?" · #"+t.prospectRank:""}</span></div>}
              <div>VOR @ {t.scarcity.scarcePos}: <span style={{color:t.scarcity.vor>0?"#22c55e":"#f87171"}}>{t.scarcity.vor>0?"+":""}{t.scarcity.vor}</span></div>
              <div>Urgency bonus: <span style={{color:"#94a3b8"}}>+{Math.round(t.urgency/100*1.5*10)/10}</span></div>
              <div>Round value: <span style={{color:rvColor}}>{rvLabel}</span></div>
              <div style={{marginTop:4,fontWeight:600,color:scoreColor(t.draftNowScore)}}>DNS: {t.draftNowScore}</div>
            </div>
            <div style={{fontSize:11}}>
              <div style={{color:"#94a3b8",marginBottom:3,fontSize:10,textTransform:"uppercase",letterSpacing:".06em"}}>Category Fit</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {t.cats.map(c=>{
                  const orig = BASE_CAT_NEED[c]||0;
                  const curr = catNeed[c]??orig;
                  const decayed = curr < orig;
                  return (
                    <span key={c} style={{fontSize:9,padding:"1px 5px",borderRadius:8,background:`${CAT_NEED_COLOR[curr]||"#1e293b"}18`,color:CAT_NEED_COLOR[curr]||"#475569",border:decayed?"1px solid #84cc1644":"none"}}>
                      {c} {decayed?`(${orig}→${curr})`:`(${orig})`}
                    </span>
                  );
                })}
              </div>
              <div style={{marginTop:6,fontSize:10,color:"#475569"}}>
                Pos depth @ {t.scarcity.scarcePos}: {t.scarcity.depth} left
              </div>
              <div style={{marginTop:2,display:"flex",gap:4}}>
                {editingNote===t.name?(
                  <input value={noteInput} onChange={e=>setNoteInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"){setPlayerNotes(p=>({...p,[t.name]:noteInput}));setEditingNote(null);}}}
                    style={{flex:1,fontSize:10}} onClick={e=>e.stopPropagation()}/>
                ):(
                  <button className="btn" style={{background:"#1e293b",color:"#64748b",fontSize:9}} onClick={e=>{e.stopPropagation();setEditingNote(t.name);setNoteInput(playerNotes[t.name]||t.note);}}>
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
          <span style={{fontSize:22,letterSpacing:".15em",color:"#84cc16",fontWeight:700}}>POOR PICKLES</span>
          <span style={{color:"#1e293b"}}>|</span>
          <span style={{fontSize:10,color:"#475569",letterSpacing:".1em"}}>DYNASTY DRAFT · SCORING ENGINE v2</span>
        </div>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:10,color:"#475569",marginRight:2}}>MY PICKS:</span>
            {snakePicks.map((p,i)=>(
              <div key={p} style={{textAlign:"center",opacity:i===0?1:0.4+i*0.15}}>
                <div style={{fontSize:9,color:"#475569"}}>R{getRound(p)}</div>
                <div style={{fontSize:13,fontWeight:600,color:i===0&&isMyClock?"#84cc16":"#94a3b8"}}>#{p}</div>
              </div>
            ))}
          </div>
          <div style={{width:1,height:24,background:"#1e293b"}}/>
          {[["PICK",currentPick],["RND",currentRound]].map(([l,v])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontSize:9,color:"#475569"}}>{l}</div>
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
          <div style={{padding:10,borderBottom:"1px solid #1e293b"}}>
            <div style={{marginBottom:6}}>
              <div style={{fontSize:10,color:"#475569",letterSpacing:".08em",textTransform:"uppercase"}}>Pick #{currentPick} · [/] to focus</div>
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
                    const t = TARGETS.find(x=>x.name===s);
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
              <button className="btn" style={{flex:1,background:"#1e293b",color:"#64748b"}} onClick={()=>{
                const lastPick = Math.max(...Object.keys(livePicks).map(Number), DRAFT_START_PICK-1);
                if(lastPick>=DRAFT_START_PICK){
                  const name=livePicks[lastPick];
                  setLivePicks(prev=>{const n={...prev};delete n[lastPick];return n;});
                  setMyDrafted(prev=>prev.filter(p=>p!==name));
                  setCurrentPick(lastPick);
                }
              }}>← undo</button>
              <button className="btn" style={{flex:1,background:"#450a0a44",color:"#f87171",border:"1px solid #450a0a"}} onClick={reset}>reset</button>
            </div>
          </div>

          {/* Pick tracker */}
          <div style={{padding:"6px 10px",borderBottom:"1px solid #1e293b",flexShrink:0}}>
            <div style={{fontSize:9,color:"#475569",textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>Pick Order</div>
            <div style={{display:"flex",flexDirection:"column",gap:1}}>
              {Array.from({length:18},(_,i)=>currentPick+i-3).filter(p=>p>=DRAFT_START_PICK&&p<=TOTAL_TEAMS*TOTAL_ROUNDS).map(p=>{
                const owner = getPickOwner(p);
                const isMine = owner===MY_TEAM;
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
                      {isMine?"YOU":owner.split(" ")[0]}
                    </span>
                    {drafted&&<span style={{fontSize:8,color:"#334155",maxWidth:70,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{drafted.split(" ").slice(-1)[0]}</span>}
                    {isCurrent&&<span style={{fontSize:8,color:"#22c55e"}}>◄</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* My roster */}
          <div style={{flex:1,overflowY:"auto",padding:10}}>
            <div style={{fontSize:10,color:"#475569",letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>My Roster ({myRoster.length}/28)</div>
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
                        <span key={e} style={{fontSize:9,color:"#94a3b8",background:"#1e293b",padding:"0 4px",borderRadius:2}}>{e}</span>
                      )) : <span style={{fontSize:9,color:"#475569"}}>?</span>}
                      {p.kept && <span style={{fontSize:9,color:"#3b82f6",marginLeft:2}}>K</span>}
                    </div>
                  </div>
                  {isSelected && t && (
                    <div style={{background:"#0d1829",border:"1px solid #1e3a5f",borderRadius:3,padding:"6px 8px",marginBottom:4,fontSize:11}}>
                      <div style={{display:"flex",gap:6,marginBottom:4,flexWrap:"wrap"}}>
                        {[["DNS", calcBaseScore(t,catNeed)],["26",t.score2026],["28",t.score2028??"-"],["FT",t.scoreFTDyn??"-"],["Age",t.age||"-"]].map(([l,v])=>(
                          <div key={l} style={{textAlign:"center"}}>
                            <div style={{fontSize:9,color:"#475569"}}>{l}</div>
                            <div style={{fontSize:12,fontWeight:700,color:"#60a5fa"}}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{color:"#475569",fontSize:10,marginBottom:2}}>{t.note}</div>
                      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                        {t.cats.map(c=><span key={c} style={{fontSize:9,color:"#94a3b8",background:"#1e293b",padding:"0 4px",borderRadius:2}}>{c}</span>)}
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
        </div>

        {/* CENTER */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{background:"#0b0d14",borderBottom:"1px solid #1e293b",display:"flex",alignItems:"center",padding:"0 10px",flexShrink:0}}>
            {[["board","Targets"],["cats","Categories"],["teams","Other Teams"],["log","Pick Log"]].map(([v,l])=>(
              <button key={v} className="tabn" onClick={()=>setTab(v)}
                style={{color:tab===v?"#84cc16":"#475569",borderBottom:tab===v?"2px solid #84cc16":"2px solid transparent"}}>
                {l}
              </button>
            ))}
            {tab==="board"&&(
              <div style={{marginLeft:"auto",display:"flex",gap:3,alignItems:"center",flexWrap:"wrap"}}>
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
                <span style={{fontSize:9,color:"#475569",letterSpacing:".08em",textTransform:"uppercase",marginRight:2}}>Depth:</span>
                {posDepth.map(({pos, myCount, slots, need, quality}) => {
                  // Color based on quality available vs. how many more I still need
                  const color = need === 0 && myCount > slots ? "#60a5fa"  // filled + backup
                    : need === 0                               ? "#475569"  // filled, no backup
                    : quality >= need * 3                     ? "#22c55e"  // plenty
                    : quality >= need                         ? "#f59e0b"  // enough
                    :                                           "#f87171"; // short
                  return (
                    <div key={pos} style={{display:"flex",flexDirection:"column",alignItems:"center",background:"#0d0f16",border:`1px solid ${color}44`,borderRadius:3,padding:"2px 6px",minWidth:28}}>
                      <span style={{fontSize:9,color:"#475569"}}>{pos}</span>
                      <span style={{fontSize:10,color:"#64748b"}}>{myCount}/{slots}</span>
                      <span style={{fontSize:11,fontWeight:700,color}}>{quality}</span>
                    </div>
                  );
                })}
              </div>
              {/* Score legend */}
              <div style={{display:"flex",gap:12,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:10,color:"#475569"}}>DNS = 20/20/30/30 (26/28/Dyn/FT) · +FV: 15/15/20/25/25 · no expert: 15/21/30 discounted · </span>
                {[["≥8.0","#f59e0b","Elite"],["≥6.5","#22c55e","Strong"],["≥5.0","#60a5fa","Solid"],["<5.0","#64748b","Stash"]].map(([r,c,l])=>(
                  <div key={r} style={{display:"flex",alignItems:"center",gap:4,fontSize:10}}>
                    <div style={{width:7,height:7,borderRadius:2,background:c}}/>
                    <span style={{color:"#64748b"}}>{l} {r}</span>
                  </div>
                ))}
                <span style={{fontSize:10,color:"#475569",marginLeft:4}}>·</span>
                <span style={{fontSize:10,color:"#64748b"}}>⚾ hitter</span>
                <span style={{fontSize:10,color:"#64748b"}}>⚡ pitcher</span>
              </div>

              {filtered.length===0&&<div style={{textAlign:"center",color:"#1e293b",padding:40}}>All targets gone!</div>}
              {(()=>{
                const watched = filtered.filter(t => watchList.has(t.name));
                const rest = filtered.filter(t => !watchList.has(t.name));
                const sections = [];
                if (watched.length > 0) {
                  sections.push(<div key="wl-header" style={{fontSize:9,color:"#f59e0b",letterSpacing:".1em",textTransform:"uppercase",marginBottom:4,marginTop:2}}>★ Watch List</div>);
                  sections.push(...watched.map((t,idx) => renderCard(t, idx, true)));
                  sections.push(<div key="wl-div" style={{borderTop:"1px solid #1e293b",margin:"8px 0 6px"}}/>);
                }
                sections.push(...rest.map((t,idx) => renderCard(t, watched.length + idx, false)));
                return sections;
              })()}
            </div>
          )}

          {/* CATEGORY TRACKER */}
          {tab==="cats"&&(
            <div style={{flex:1,overflowY:"auto",padding:14}}>
              <div style={{marginBottom:10,fontSize:11,color:"#475569"}}>
                Need weights update live as you draft. <span style={{color:"#84cc16"}}>Amber = decayed by your picks.</span> Click to manually cycle status.
              </div>
              {[["HITTING",HIT_CATS],["PITCHING",PITCH_CATS]].map(([label,cats])=>(
                <div key={label} style={{marginBottom:18}}>
                  <div style={{fontSize:10,color:"#475569",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>{label}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {cats.map(c=>{
                      const statuses=["missing","thin","ok","strong"];
                      const cur=catStatus[c]||"ok";
                      const origNeed = BASE_CAT_NEED[c] || 0;
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
                                <span style={{fontSize:9,color:"#475569",textDecoration:"line-through"}}>{origNeed}</span>
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
                <div style={{fontSize:10,color:"#475569",marginBottom:4,letterSpacing:".08em",textTransform:"uppercase"}}>Decay Log</div>
                {myDrafted.length === 0
                  ? <div style={{fontSize:11,color:"#1e293b"}}>No picks recorded yet.</div>
                  : myDrafted.map((name, i) => {
                    const t = TARGETS.find(x => x.name === name);
                    if (!t) return null;
                    return (
                      <div key={i} style={{fontSize:11,color:"#64748b",marginBottom:2,display:"flex",gap:6}}>
                        <span style={{color:"#22c55e"}}>{name}</span>
                        <span style={{color:"#475569"}}>↓</span>
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
                <div style={{fontSize:10,color:"#475569",letterSpacing:".1em",textTransform:"uppercase",marginBottom:6}}>
                  Projected Standing <span style={{color:"#334155",fontWeight:400}}>— based on keepers + drafted</span>
                </div>
                {[["HITTING",HIT_CATS],["PITCHING",PITCH_CATS]].map(([label,cats])=>(
                  <div key={label} style={{marginBottom:12}}>
                    <div style={{fontSize:9,color:"#334155",letterSpacing:".08em",textTransform:"uppercase",marginBottom:5}}>{label}</div>
                    {cats.map(cat => {
                      const proj = catProjection.find(p => p.cat === cat);
                      if (!proj) return null;
                      const rankColor = proj.rank <= 3 ? "#22c55e" : proj.rank <= 6 ? "#84cc16" : proj.rank <= 9 ? "#f59e0b" : "#f87171";
                      const barW = proj.max > 0 ? Math.round((proj.myScore / proj.max) * 100) : 0;
                      return (
                        <div key={cat} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <span style={{fontSize:10,color:"#64748b",width:36,flexShrink:0}}>{cat}</span>
                          <div style={{flex:1,height:6,background:"#1e293b",borderRadius:3,overflow:"hidden"}}>
                            <div style={{width:`${barW}%`,height:"100%",background:rankColor,borderRadius:3,transition:"width .3s"}}/>
                          </div>
                          <span style={{fontSize:10,fontWeight:600,color:rankColor,width:32,textAlign:"right",flexShrink:0}}>
                            #{proj.rank}/12
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
              <div style={{fontSize:10,color:"#475569",marginBottom:10}}>Keeper rosters R1-10. Use to assess positional pressure and SP scarcity.</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {DRAFT_ORDER.filter(t=>t!==MY_TEAM).map(team=>{
                  const keepers = KEEPER_PICKS.filter(p=>p.team===team);
                  const drafted = Object.entries(livePicks)
                    .filter(([pick]) => getPickOwner(Number(pick)) === team)
                    .sort((a,b) => Number(a[0])-Number(b[0]))
                    .map(([pick, name]) => {
                      const t = TARGETS.find(x=>x.name===name);
                      return {pick:Number(pick), name, pos: t?.eligible?.[0] ?? "?"};
                    });
                  const spCount = keepers.filter(p=>p.pos==="SP").length + drafted.filter(p=>p.pos==="SP").length;
                  return (
                    <div key={team} style={{background:"#0d0f16",border:"1px solid #1e293b",borderRadius:4,padding:"8px 10px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                        <span style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>{team}</span>
                        {spCount>0&&<span style={{fontSize:9,color:"#60a5fa",background:"#1e3a5f33",padding:"1px 5px",borderRadius:3}}>{spCount} SP</span>}
                      </div>
                      {keepers.map((p,i)=>(
                        <div key={i} style={{display:"flex",gap:6,marginBottom:2,fontSize:11}}>
                          <span style={{color:"#475569",width:26,flexShrink:0}}>{p.pos}</span>
                          <span style={{color:"#94a3b8"}}>{p.player}</span>
                        </div>
                      ))}
                      {drafted.length>0&&(
                        <>
                          <div style={{borderTop:"1px solid #1e293b",margin:"4px 0"}}/>
                          {drafted.map((p,i)=>(
                            <div key={i} style={{display:"flex",gap:6,marginBottom:2,fontSize:11}}>
                              <span style={{color:"#334155",width:26,flexShrink:0}}>{p.pos}</span>
                              <span style={{color:"#64748b"}}>{p.name}</span>
                              <span style={{color:"#1e3a5f",marginLeft:"auto",fontSize:9}}>#{p.pick}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PICK LOG */}
          {tab==="log"&&(
            <div style={{flex:1,overflowY:"auto",padding:12}}>
              <div style={{fontSize:10,color:"#475569",marginBottom:8}}>Live picks only (R1-10 keepers not shown).</div>
              {Object.keys(livePicks).length===0&&<div style={{color:"#1e293b",textAlign:"center",padding:40}}>No picks recorded yet.</div>}
              {Object.entries(livePicks).sort((a,b)=>Number(b[0])-Number(a[0])).map(([pick,name])=>{
                const mine = myDrafted.includes(name);
                const t = TARGETS.find(x=>x.name===name);
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

        {/* RIGHT: COMPARE PANEL */}
        <div style={{width:280,background:"#09090e",borderLeft:"1px solid #1e293b",display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{padding:"9px 12px",borderBottom:"1px solid #1e293b",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:10,color:"#475569",letterSpacing:".1em",textTransform:"uppercase"}}>Compare Players</span>
            {compareList.length>0&&<button className="btn" style={{fontSize:9,color:"#f87171",background:"transparent"}} onClick={()=>setCompareList([])}>clear</button>}
          </div>
          {compareList.length===0&&(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20,textAlign:"center"}}>
              <span style={{fontSize:11,color:"#475569",lineHeight:1.6}}>Tap <span style={{color:"#84cc16"}}>vs</span> on any two players to compare them side by side.</span>
            </div>
          )}
          {compareList.length>0&&(
            <div style={{flex:1,overflowY:"auto",padding:10}}>
              {compareList.map(name=>{
                const t = scoredAvailable.find(p=>p.name===name);
                if(!t) return null;
                return (
                  <div key={name} style={{background:"#0d0f16",border:`1px solid ${TIER_COLOR[t.tier]}44`,borderLeft:`3px solid ${TIER_COLOR[t.tier]}`,borderRadius:4,padding:"10px",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:"#f1f5f9"}}>{t.name}</div>
                        <div style={{fontSize:10,color:"#475569",marginTop:1}}>{t.eligible.join("/")} · {t.org} · {t.type==="H"?"⚾":"⚡"}</div>
                      </div>
                      <button className="btn" style={{fontSize:9,color:"#f87171",background:"transparent"}} onClick={()=>toggleCompare(name)}>✕</button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 10px",fontSize:11}}>
                      {[["DNS",t.draftNowScore],["2026",t.score2026],["FT",t.scoreFTDyn??"-"],["VOR",(t.scarcity.vor>0?"+":"")+t.scarcity.vor],["Urgency",t.urgency+"%"],["Tier",TIER_LABEL[t.tier]]].map(([label,val])=>(
                        <div key={label}>
                          <span style={{color:"#475569"}}>{label}: </span>
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
                <div style={{textAlign:"center",fontSize:10,color:"#475569",padding:"20px 10px",border:"1px dashed #1e293b",borderRadius:4}}>
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

