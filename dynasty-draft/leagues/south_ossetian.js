// ─── SOUTH OSSETIAN LEAGUE CONFIG ─────────────────────────────────────────────
// 12-team, 5x5 roto, 24 rounds, 4 keepers
// To update: fill in draftOrder + mySlot after draft order is set,
// and keeperPicks once keepers are finalized.

export const SOUTH_OSSETIAN_CONFIG = {

  // ── League structure ────────────────────────────────────────────────────────
  leagueName: "SouthOssetian",
  totalTeams: 12,
  totalRounds: 24,
  draftStartPick: 49,          // picks 1-48 = keepers (4 rounds × 12 teams)
  mySlot: 6,                   // placeholder — update after draft order set

  // Draft order — update after draft order is determined
  // Current order is alphabetical placeholder matching rank order
  draftOrder: [
    "Wade Bogg's Next Beer",
    "All Rise",
    "Clutch Trey",
    "Bobby Weed Jr",
    "Ohtani's Best Bet",
    "ALP",
    "Saggy Boys",
    "Hot Dog Heaven",
    "Scott's Strategic Realignment",
    "Edward's TeamToBeNamedLater",
    "David Tabor's Aim",
    "Ryan Howard's $5 Footlong",
  ],

  // ── Scoring categories ──────────────────────────────────────────────────────
  // Standard 5x5 with OBP and NSVH
  hittingCats:  ["R", "HR", "RBI", "SB", "OBP"],
  pitchingCats: ["W", "K", "ERA", "WHIP", "NSVH"],

  // ── My category status ─────────────────────────────────────────────────────
  // Update once you know your roster — placeholders for now
  myCatStatus: {
    R:"ok", HR:"ok", RBI:"ok", SB:"ok", OBP:"ok",
    W:"ok", K:"ok", ERA:"ok", WHIP:"ok", NSVH:"ok",
  },

  // ── Base category need weights ─────────────────────────────────────────────
  // 5x5 = all cats equal weight (2). Adjust after your keepers are set.
  baseCatNeed: {
    R:2, HR:2, RBI:2, SB:2, OBP:2,
    W:2, K:2, ERA:2, WHIP:2, NSVH:2,
  },

  // ── Keeper picks ───────────────────────────────────────────────────────────
  // Format: { pick, r, player, pos, team }
  // pick = overall pick number (slot × round position in snake)
  // Fill in once draft order and keepers are finalized.
  // Your keepers: Henderson (R1), Yamamoto (R2), Anthony (R3), Woo (R4)
  keeperPicks: [],

  // ── Score prefix ───────────────────────────────────────────────────────────
  // Uses 5x5-weighted ZAR scores from targets.json
  scorePrefix: "5x5",
}
