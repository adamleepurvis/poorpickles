// ─── SOUTH OSSETIAN LEAGUE CONFIG ─────────────────────────────────────────────
// 12-team, 5x5 roto, 24 rounds, 4 keepers

export const SOUTH_OSSETIAN_CONFIG = {

  // ── League structure ────────────────────────────────────────────────────────
  leagueName: "SouthOssetian",
  totalTeams: 12,
  totalRounds: 24,
  draftStartPick: 49,          // picks 1-48 = keepers (4 rounds × 12 teams)
  mySlot: 7,

  draftOrder: [
    "Ryan Howard's $5 Footlong",
    "🎯 David Tabor's Aim",
    "🏝️ Let's Get Tropical 🏝️",
    "Magnum Kwandoms",
    "Scott's Strategic Realignment",
    "Saggy Boys",
    "ALP",
    "🐶 Decoy Fan Club",
    "Bobby Weed Jr",
    "🏅 Clutch Trey",
    "🧑‍⚖️ All Rise",
    "Wade Bogg's Next Beer",
  ],

  // ── Scoring categories ──────────────────────────────────────────────────────
  // Standard 5x5 with OBP and NSVH
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
  keeperPicks: [
    // R1 — slots 1→12
    {pick:1,  r:1, player:"Vladimir Guerrero Jr.",    pos:"1B",   team:"Ryan Howard's $5 Footlong"},
    {pick:2,  r:1, player:"Ronald Acuña Jr.",         pos:"RF",   team:"🎯 David Tabor's Aim"},
    {pick:3,  r:1, player:"Juan Soto",                pos:"LF",   team:"🏝️ Let's Get Tropical 🏝️"},
    {pick:4,  r:1, player:"Elly De La Cruz",          pos:"SS",   team:"Magnum Kwandoms"},
    {pick:5,  r:1, player:"Mookie Betts",             pos:"SS",   team:"Scott's Strategic Realignment"},
    {pick:6,  r:1, player:"Julio Rodríguez",          pos:"CF",   team:"Saggy Boys"},
    {pick:7,  r:1, player:"Gunnar Henderson",         pos:"SS",   team:"ALP"},
    {pick:8,  r:1, player:"Shohei Ohtani (Batter)",  pos:"Util", team:"🐶 Decoy Fan Club"},
    {pick:9,  r:1, player:"Bobby Witt Jr.",           pos:"SS",   team:"Bobby Weed Jr"},
    {pick:10, r:1, player:"Kyle Tucker",              pos:"RF",   team:"🏅 Clutch Trey"},
    {pick:11, r:1, player:"Aaron Judge",              pos:"RF",   team:"🧑‍⚖️ All Rise"},
    {pick:12, r:1, player:"José Ramírez",             pos:"3B",   team:"Wade Bogg's Next Beer"},
    // R2 — slots 12→1
    {pick:13, r:2, player:"Francisco Lindor",         pos:"SS",   team:"Wade Bogg's Next Beer"},
    {pick:14, r:2, player:"Fernando Tatis Jr.",       pos:"RF",   team:"🧑‍⚖️ All Rise"},
    {pick:15, r:2, player:"Cal Raleigh",              pos:"C",    team:"🏅 Clutch Trey"},
    {pick:16, r:2, player:"Jazz Chisholm Jr.",        pos:"2B",   team:"Bobby Weed Jr"},
    {pick:17, r:2, player:"Trea Turner",              pos:"SS",   team:"🐶 Decoy Fan Club"},
    {pick:18, r:2, player:"Roman Anthony",            pos:"LF",   team:"ALP"},
    {pick:19, r:2, player:"Pete Alonso",              pos:"1B",   team:"Saggy Boys"},
    {pick:20, r:2, player:"Shea Langeliers",          pos:"C",    team:"Scott's Strategic Realignment"},
    {pick:21, r:2, player:"Josh Naylor",              pos:"1B",   team:"Magnum Kwandoms"},
    {pick:22, r:2, player:"Junior Caminero",          pos:"3B",   team:"🏝️ Let's Get Tropical 🏝️"},
    {pick:23, r:2, player:"Jackson Chourio",          pos:"CF",   team:"🎯 David Tabor's Aim"},
    {pick:24, r:2, player:"Adley Rutschman",          pos:"C",    team:"Ryan Howard's $5 Footlong"},
    // R3 — slots 1→12
    {pick:25, r:3, player:"Paul Skenes",              pos:"SP",   team:"Ryan Howard's $5 Footlong"},
    {pick:26, r:3, player:"Vinnie Pasquantino",       pos:"1B",   team:"🎯 David Tabor's Aim"},
    {pick:27, r:3, player:"Nick Kurtz",               pos:"1B",   team:"🏝️ Let's Get Tropical 🏝️"},
    {pick:28, r:3, player:"Brice Turang",             pos:"2B",   team:"Magnum Kwandoms"},
    {pick:29, r:3, player:"Tarik Skubal",             pos:"SP",   team:"Scott's Strategic Realignment"},
    {pick:30, r:3, player:"CJ Abrams",                pos:"SS",   team:"Saggy Boys"},
    {pick:31, r:3, player:"Yoshinobu Yamamoto",       pos:"SP",   team:"ALP"},
    {pick:32, r:3, player:"Bryce Harper",             pos:"1B",   team:"🐶 Decoy Fan Club"},
    {pick:33, r:3, player:"Cristopher Sánchez",       pos:"SP",   team:"Bobby Weed Jr"},
    {pick:34, r:3, player:"Corbin Carroll",           pos:"CF",   team:"🏅 Clutch Trey"},
    {pick:35, r:3, player:"Kyle Schwarber",           pos:"LF",   team:"🧑‍⚖️ All Rise"},
    {pick:36, r:3, player:"Nico Hoerner",             pos:"2B",   team:"Wade Bogg's Next Beer"},
    // R4 — slots 12→1
    {pick:37, r:4, player:"Freddy Peralta",           pos:"SP",   team:"Wade Bogg's Next Beer"},
    {pick:38, r:4, player:"Manny Machado",            pos:"3B",   team:"🧑‍⚖️ All Rise"},
    {pick:39, r:4, player:"Ketel Marte",              pos:"2B",   team:"🏅 Clutch Trey"},
    {pick:40, r:4, player:"Edwin Díaz",               pos:"RP",   team:"Bobby Weed Jr"},
    {pick:41, r:4, player:"Yordan Alvarez",           pos:"LF",   team:"🐶 Decoy Fan Club"},
    {pick:42, r:4, player:"Bryan Woo",                pos:"SP",   team:"ALP"},
    {pick:43, r:4, player:"Chris Sale",               pos:"SP",   team:"Saggy Boys"},
    {pick:44, r:4, player:"Garrett Crochet",          pos:"SP",   team:"Scott's Strategic Realignment"},
    {pick:45, r:4, player:"Logan Gilbert",            pos:"SP",   team:"Magnum Kwandoms"},
    {pick:46, r:4, player:"James Wood",               pos:"LF",   team:"🏝️ Let's Get Tropical 🏝️"},
    {pick:47, r:4, player:"Jackson Holliday",         pos:"2B",   team:"🎯 David Tabor's Aim"},
    {pick:48, r:4, player:"Hunter Brown",             pos:"SP",   team:"Ryan Howard's $5 Footlong"},
  ],

  // ── Score prefix ───────────────────────────────────────────────────────────
  scorePrefix: "5x5",
}
