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
  // Populated by `python data/build.py` after the draft completes
  keeperPicks: [],
}
