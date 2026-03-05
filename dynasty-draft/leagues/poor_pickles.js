// ─── POOR PICKLES LEAGUE CONFIG ───────────────────────────────────────────────
// Edit this file to update league settings, keeper picks, and category gaps.
// Run `python data/fetch_projections.py` to regenerate the player pool.
//
// To create a new league: copy this file, rename it, update all values below,
// then add it to src/App.jsx's LEAGUES array.

export const POOR_PICKLES_CONFIG = {

  // ── League structure ────────────────────────────────────────────────────────
  leagueName: "Poor Pickles",
  totalTeams: 12,
  totalRounds: 29,
  draftStartPick: 121,         // first pick of the live draft (after keepers)
  mySlot: 8,                   // draft slot (1-indexed)

  // Snake draft order — slot 1 through totalTeams
  draftOrder: [
    "Dynasty", "Bay of Papi", "gamma's Team", "Hideo Lobo", "JP Licks",
    "Loch Neskie", "Nighthawks", "Poor Pickles", "Snipe City",
    "StickyBanditz", "Team Underdog", "Toms River"
  ],

  // ── Scoring categories ──────────────────────────────────────────────────────
  // 9x9: 9 hitting + 9 pitching
  hittingCats:  ["R", "H", "HR", "RBI", "SB", "TB", "AVG", "OBP", "SLG"],
  pitchingCats: ["IP", "W", "ER", "K", "ERA", "WHIP", "K/9", "BB/9", "NSVH"],

  // ── My category status (affects scoring model weights) ─────────────────────
  // "strong" = no action needed, "ok" = fine, "thin" = gap, "missing" = urgent
  myCatStatus: {
    R:"ok", H:"ok", HR:"thin", RBI:"thin", SB:"strong", TB:"thin",
    AVG:"ok", OBP:"ok", SLG:"thin",
    K:"ok", IP:"ok", W:"ok", ER:"ok", ERA:"ok", WHIP:"ok",
    "K/9":"ok", "BB/9":"ok", NSVH:"thin"
  },

  // ── Base category need weights (drives scoring model) ─────────────────────
  // 3 = critical gap, 2 = want more, 1 = covered, 0 = punting
  baseCatNeed: {
    R:1, H:1, HR:3, RBI:3, SB:1, TB:2, AVG:1, OBP:1, SLG:3,
    K:2, IP:1, W:1, ER:1, ERA:2, WHIP:2, "K/9":2, "BB/9":2, NSVH:3
  },

  // ── Keeper picks (rounds 1-10, all 12 teams) ───────────────────────────────
  // Format: { pick, r, player, pos, team }
    keeperPicks: [
    {pick:1,r:1,player:"date",pos:"Util",team:"b'Dynasty'"}, 
    {pick:2,r:1,player:"date",pos:"Util",team:"b'Bay of Papi'"}, 
    {pick:3,r:1,player:"date",pos:"Util",team:"b"gamma's Team""}, 
    {pick:4,r:1,player:"date",pos:"Util",team:"b'Hideo Lobo'"}, 
    {pick:5,r:1,player:"date",pos:"Util",team:"b'JP Licks'"}, 
    {pick:6,r:1,player:"date",pos:"Util",team:"b'Loch Neskie Monsters'"}, 
    {pick:7,r:1,player:"date",pos:"Util",team:"b'Nighthawks'"}, 
    {pick:8,r:1,player:"date",pos:"Util",team:"b'Poor Pickles'"}, 
    {pick:9,r:1,player:"date",pos:"Util",team:"b'Snipe City Danglers'"}, 
    {pick:10,r:1,player:"date",pos:"Util",team:"b'StickyBanditz'"}, 
    {pick:11,r:1,player:"date",pos:"Util",team:"b'Team Underdog'"}, 
    {pick:12,r:1,player:"date",pos:"Util",team:"b'Toms River'"}, 
    {pick:13,r:2,player:"2026-03-25",pos:"Util",team:"b'Toms River'"}, 
    {pick:14,r:2,player:"2026-03-25",pos:"Util",team:"b'Team Underdog'"}, 
    {pick:15,r:2,player:"2026-03-25",pos:"Util",team:"b'StickyBanditz'"}, 
    {pick:16,r:2,player:"2026-03-25",pos:"Util",team:"b'Snipe City Danglers'"}, 
    {pick:17,r:2,player:"2026-03-25",pos:"Util",team:"b'Poor Pickles'"}, 
    {pick:18,r:2,player:"2026-03-25",pos:"Util",team:"b'Nighthawks'"}, 
    {pick:19,r:2,player:"2026-03-25",pos:"Util",team:"b'Loch Neskie Monsters'"}, 
    {pick:20,r:2,player:"2026-03-25",pos:"Util",team:"b'JP Licks'"}, 
    {pick:21,r:2,player:"2026-03-25",pos:"Util",team:"b'Hideo Lobo'"}, 
    {pick:22,r:2,player:"2026-03-25",pos:"Util",team:"b"gamma's Team""}, 
    {pick:23,r:2,player:"2026-03-25",pos:"Util",team:"b'Bay of Papi'"}, 
    {pick:24,r:2,player:"2026-03-25",pos:"Util",team:"b'Dynasty'"}, 
    {pick:25,r:3,player:"0",pos:"Util",team:"b'Dynasty'"}, 
    {pick:26,r:3,player:"0",pos:"Util",team:"b'Bay of Papi'"}, 
    {pick:27,r:3,player:"0",pos:"Util",team:"b"gamma's Team""}, 
    {pick:28,r:3,player:"0",pos:"Util",team:"b'Hideo Lobo'"}, 
    {pick:29,r:3,player:"0",pos:"Util",team:"b'JP Licks'"}, 
    {pick:30,r:3,player:"0",pos:"Util",team:"b'Loch Neskie Monsters'"}, 
    {pick:31,r:3,player:"0",pos:"Util",team:"b'Nighthawks'"}, 
    {pick:32,r:3,player:"0",pos:"Util",team:"b'Poor Pickles'"}, 
    {pick:33,r:3,player:"0",pos:"Util",team:"b'Snipe City Danglers'"}, 
    {pick:34,r:3,player:"0",pos:"Util",team:"b'StickyBanditz'"}, 
    {pick:35,r:3,player:"0",pos:"Util",team:"b'Team Underdog'"}, 
    {pick:36,r:3,player:"0",pos:"Util",team:"b'Toms River'"}, 
    {pick:37,r:4,player:"0",pos:"Util",team:"b'Toms River'"}, 
    {pick:38,r:4,player:"0",pos:"Util",team:"b'Team Underdog'"}, 
    {pick:39,r:4,player:"0",pos:"Util",team:"b'StickyBanditz'"}, 
    {pick:40,r:4,player:"0",pos:"Util",team:"b'Snipe City Danglers'"}, 
    {pick:41,r:4,player:"0",pos:"Util",team:"b'Poor Pickles'"}, 
    {pick:42,r:4,player:"0",pos:"Util",team:"b'Nighthawks'"}, 
    {pick:43,r:4,player:"0",pos:"Util",team:"b'Loch Neskie Monsters'"}, 
    {pick:44,r:4,player:"0",pos:"Util",team:"b'JP Licks'"}, 
    {pick:45,r:4,player:"0",pos:"Util",team:"b'Hideo Lobo'"}, 
    {pick:46,r:4,player:"0",pos:"Util",team:"b"gamma's Team""}, 
    {pick:47,r:4,player:"0",pos:"Util",team:"b'Bay of Papi'"}, 
    {pick:48,r:4,player:"0",pos:"Util",team:"b'Dynasty'"}, 
    {pick:49,r:5,player:"{'coverage_type': 'week', 'coverage_value': 1, 'value': 0}",pos:"Util",team:"b'Dynasty'"}, 
    {pick:50,r:5,player:"{'coverage_type': 'week', 'coverage_value': 1, 'value': 0}",pos:"Util",team:"b'Bay of Papi'"}, 
    {pick:51,r:5,player:"{'coverage_type': 'week', 'coverage_value': 1, 'value': 0}",pos:"Util",team:"b"gamma's Team""}, 
    {pick:52,r:5,player:"{'coverage_type': 'week', 'coverage_value': 1, 'value': 0}",pos:"Util",team:"b'Hideo Lobo'"}, 
    {pick:53,r:5,player:"{'coverage_type': 'week', 'coverage_value': 1, 'value': 0}",pos:"Util",team:"b'JP Licks'"}, 
    {pick:54,r:5,player:"{'coverage_type': 'week', 'coverage_value': 1, 'value': 0}",pos:"Util",team:"b'Loch Neskie Monsters'"}, 
    {pick:55,r:5,player:"{'coverage_type': 'week', 'coverage_value': 1, 'value': 0}",pos:"Util",team:"b'Nighthawks'"}, 
    {pick:56,r:5,player:"{'coverage_type': 'week', 'coverage_value': 1, 'value': 0}",pos:"Util",team:"b'Poor Pickles'"}, 
    {pick:57,r:5,player:"{'coverage_type': 'week', 'coverage_value': 1, 'value': 0}",pos:"Util",team:"b'Snipe City Danglers'"}, 
    {pick:58,r:5,player:"{'coverage_type': 'week', 'coverage_value': 1, 'value': 0}",pos:"Util",team:"b'StickyBanditz'"}, 
    {pick:59,r:5,player:"{'coverage_type': 'week', 'coverage_value': 1, 'value': 0}",pos:"Util",team:"b'Team Underdog'"}, 
    {pick:60,r:5,player:"{'coverage_type': 'week', 'coverage_value': 1, 'value': 0}",pos:"Util",team:"b'Toms River'"}, 
    {pick:61,r:6,player:"None",pos:"Util",team:"b'Toms River'"}, 
    {pick:62,r:6,player:"None",pos:"Util",team:"b'Team Underdog'"}, 
    {pick:63,r:6,player:"None",pos:"Util",team:"b'StickyBanditz'"}, 
    {pick:64,r:6,player:"None",pos:"Util",team:"b'Snipe City Danglers'"}, 
    {pick:65,r:6,player:"None",pos:"Util",team:"b'Poor Pickles'"}, 
    {pick:66,r:6,player:"None",pos:"Util",team:"b'Nighthawks'"}, 
    {pick:67,r:6,player:"None",pos:"Util",team:"b'Loch Neskie Monsters'"}, 
    {pick:68,r:6,player:"None",pos:"Util",team:"b'JP Licks'"}, 
    {pick:69,r:6,player:"None",pos:"Util",team:"b'Hideo Lobo'"}, 
    {pick:70,r:6,player:"None",pos:"Util",team:"b"gamma's Team""}, 
    {pick:71,r:6,player:"None",pos:"Util",team:"b'Bay of Papi'"}, 
    {pick:72,r:6,player:"None",pos:"Util",team:"b'Dynasty'"}, 
  ],
}
