// ─── FANTASY AWESOMEBALL 2026 (Spaghett) ──────────────────────────────────────
// 14-team, H2H, 8-cat, 21 rounds, redraft (no keepers)

export const SPAGHETT_CONFIG = {

  // ── League structure ────────────────────────────────────────────────────────
  leagueName: "Spaghett",
  totalTeams: 14,
  totalRounds: 21,
  draftStartPick: 1,           // full redraft — no keeper rounds
  mySlot: 3,

  draftOrder: [
    "Bargain Bangers",
    "D\u2019ump",
    "Spaghett",
    "Les Sexpos de Montréal",
    "Trash Pandas",
    "Yellow King Felix",
    "Coffee's for Closers",
    "Let Shohei Pitch",
    "Buehrle 18",
    "St. Guaranteed Rate",
    "PGS",
    "Clase Innocence Project",
    "Acuña Matada",
    "AI Thot Leadership",
  ],

  // ── Scoring categories ──────────────────────────────────────────────────────
  hittingCats:  ["R", "HR", "RBI", "SB", "OBP"],
  pitchingCats: ["W", "K", "ERA", "WHIP", "NSVH"],

  // ── My category status ─────────────────────────────────────────────────────
  myCatStatus: {
    R:"ok", HR:"ok", RBI:"ok", SB:"ok", OBP:"ok",
    W:"ok", K:"ok", ERA:"ok", WHIP:"ok", NSVH:"ok",
  },

  // ── Base category need weights ─────────────────────────────────────────────
  baseCatNeed: {
    R:2, HR:2, RBI:2, SB:2, OBP:2,
    W:2, K:2, ERA:2, WHIP:2, NSVH:2,
  },

  // ── Keeper picks ───────────────────────────────────────────────────────────
  keeperPicks: [],  // full redraft — no keepers

  // ── My picks ───────────────────────────────────────────────────────────────
  myPicks: [],  // postdraft — not needed

  // ── Full pick order ────────────────────────────────────────────────────────
  pickOrder: [],  // postdraft — not needed

  // ── Score prefix ───────────────────────────────────────────────────────────
  scorePrefix: "5x5",

  draftMode: false,
}
