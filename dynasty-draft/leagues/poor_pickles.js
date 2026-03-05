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
    // Round 1
    {pick:1,r:1,player:"Bobby Witt Jr.",pos:"SS",team:"Dynasty"},
    {pick:2,r:1,player:"Fernando Tatis Jr.",pos:"RF",team:"Bay of Papi"},
    {pick:3,r:1,player:"José Ramírez",pos:"3B",team:"gamma's Team"},
    {pick:4,r:1,player:"Shohei Ohtani (Batter)",pos:"Util",team:"Hideo Lobo"},
    {pick:5,r:1,player:"Zach Neto",pos:"SS",team:"JP Licks"},
    {pick:6,r:1,player:"Elly De La Cruz",pos:"SS",team:"Loch Neskie"},
    {pick:7,r:1,player:"Juan Soto",pos:"LF",team:"Nighthawks"},
    {pick:8,r:1,player:"Geraldo Perdomo",pos:"SS",team:"Poor Pickles"},
    {pick:9,r:1,player:"Brent Rooker",pos:"LF",team:"Snipe City"},
    {pick:10,r:1,player:"Aaron Judge",pos:"RF",team:"StickyBanditz"},
    {pick:11,r:1,player:"Julio Rodríguez",pos:"CF",team:"Team Underdog"},
    {pick:12,r:1,player:"Jazz Chisholm Jr.",pos:"2B",team:"Toms River"},
    // Round 2
    {pick:13,r:2,player:"Wyatt Langford",pos:"CF",team:"Toms River"},
    {pick:14,r:2,player:"Ronald Acuña Jr.",pos:"RF",team:"Team Underdog"},
    {pick:15,r:2,player:"Rafael Devers",pos:"1B",team:"StickyBanditz"},
    {pick:16,r:2,player:"James Wood",pos:"LF",team:"Snipe City"},
    {pick:17,r:2,player:"Vinnie Pasquantino",pos:"1B",team:"Poor Pickles"},
    {pick:18,r:2,player:"Kyle Tucker",pos:"RF",team:"Nighthawks"},
    {pick:19,r:2,player:"Kyle Schwarber",pos:"LF",team:"Loch Neskie"},
    {pick:20,r:2,player:"Matt Olson",pos:"1B",team:"JP Licks"},
    {pick:21,r:2,player:"Trea Turner",pos:"SS",team:"Hideo Lobo"},
    {pick:22,r:2,player:"Junior Caminero",pos:"3B",team:"gamma's Team"},
    {pick:23,r:2,player:"Nick Kurtz",pos:"1B",team:"Bay of Papi"},
    {pick:24,r:2,player:"Pete Alonso",pos:"1B",team:"Dynasty"},
    // Round 3
    {pick:25,r:3,player:"Jarren Duran",pos:"CF",team:"Dynasty"},
    {pick:26,r:3,player:"Manny Machado",pos:"3B",team:"Bay of Papi"},
    {pick:27,r:3,player:"Jackson Chourio",pos:"CF",team:"gamma's Team"},
    {pick:28,r:3,player:"Agustín Ramírez",pos:"C",team:"Hideo Lobo"},
    {pick:29,r:3,player:"Brice Turang",pos:"2B",team:"JP Licks"},
    {pick:30,r:3,player:"Ketel Marte",pos:"2B",team:"Loch Neskie"},
    {pick:31,r:3,player:"Gunnar Henderson",pos:"SS",team:"Nighthawks"},
    {pick:32,r:3,player:"Maikel Garcia",pos:"3B",team:"Poor Pickles"},
    {pick:33,r:3,player:"Randy Arozarena",pos:"CF",team:"Snipe City"},
    {pick:34,r:3,player:"Corey Seager",pos:"SS",team:"StickyBanditz"},
    {pick:35,r:3,player:"Corbin Carroll",pos:"CF",team:"Team Underdog"},
    {pick:36,r:3,player:"CJ Abrams",pos:"SS",team:"Toms River"},
    // Round 4
    {pick:37,r:4,player:"Willson Contreras",pos:"C",team:"Toms River"},
    {pick:38,r:4,player:"Francisco Lindor",pos:"SS",team:"Team Underdog"},
    {pick:39,r:4,player:"William Contreras",pos:"C",team:"StickyBanditz"},
    {pick:40,r:4,player:"Michael Busch",pos:"1B",team:"Snipe City"},
    {pick:41,r:4,player:"Tyler Soderstrom",pos:"C",team:"Poor Pickles"},
    {pick:42,r:4,player:"Bryce Harper",pos:"1B",team:"Nighthawks"},
    {pick:43,r:4,player:"Riley Greene",pos:"CF",team:"Loch Neskie"},
    {pick:44,r:4,player:"Matt Shaw",pos:"3B",team:"JP Licks"},
    {pick:45,r:4,player:"Noelvi Marte",pos:"3B",team:"Hideo Lobo"},
    {pick:46,r:4,player:"Cal Raleigh",pos:"C",team:"gamma's Team"},
    {pick:47,r:4,player:"Yordan Alvarez",pos:"LF",team:"Bay of Papi"},
    {pick:48,r:4,player:"Pete Crow-Armstrong",pos:"CF",team:"Dynasty"},
    // Round 5
    {pick:49,r:5,player:"Shea Langeliers",pos:"C",team:"Dynasty"},
    {pick:50,r:5,player:"Mookie Betts",pos:"SS",team:"Bay of Papi"},
    {pick:51,r:5,player:"Vladimir Guerrero Jr.",pos:"1B",team:"gamma's Team"},
    {pick:52,r:5,player:"JJ Wetherholt",pos:"SS",team:"Hideo Lobo"},
    {pick:53,r:5,player:"Travis Bazzana",pos:"2B",team:"JP Licks"},
    {pick:54,r:5,player:"Josh Naylor",pos:"1B",team:"Loch Neskie"},
    {pick:55,r:5,player:"Jackson Merrill",pos:"CF",team:"Nighthawks"},
    {pick:56,r:5,player:"Michael Harris II",pos:"CF",team:"Poor Pickles"},
    {pick:57,r:5,player:"Samuel Basallo",pos:"C",team:"Snipe City"},
    {pick:58,r:5,player:"Ozzie Albies",pos:"2B",team:"StickyBanditz"},
    {pick:59,r:5,player:"Will Smith",pos:"C",team:"Team Underdog"},
    {pick:60,r:5,player:"Alec Burleson",pos:"1B",team:"Toms River"},
    // Round 6
    {pick:61,r:6,player:"Christian Walker",pos:"1B",team:"Toms River"},
    {pick:62,r:6,player:"Logan Gilbert",pos:"SP",team:"Team Underdog"},
    {pick:63,r:6,player:"Colson Montgomery",pos:"SS",team:"StickyBanditz"},
    {pick:64,r:6,player:"Leo De Vries",pos:"SS",team:"Snipe City"},
    {pick:65,r:6,player:"Jo Adell",pos:"RF",team:"Poor Pickles"},
    {pick:66,r:6,player:"Austin Riley",pos:"3B",team:"Nighthawks"},
    {pick:67,r:6,player:"Oneil Cruz",pos:"CF",team:"Loch Neskie"},
    {pick:68,r:6,player:"Max Clark",pos:"CF",team:"JP Licks"},
    {pick:69,r:6,player:"Royce Lewis",pos:"3B",team:"Hideo Lobo"},
    {pick:70,r:6,player:"Roman Anthony",pos:"LF",team:"gamma's Team"},
    {pick:71,r:6,player:"Ben Rice",pos:"C",team:"Bay of Papi"},
    {pick:72,r:6,player:"Kyle Stowers",pos:"LF",team:"Dynasty"},
    // Round 7
    {pick:73,r:7,player:"Tarik Skubal",pos:"SP",team:"Dynasty"},
    {pick:74,r:7,player:"Konnor Griffin",pos:"CF",team:"Bay of Papi"},
    {pick:75,r:7,player:"Kevin McGonigle",pos:"SS",team:"gamma's Team"},
    {pick:76,r:7,player:"Jackson Holliday",pos:"SS",team:"Hideo Lobo"},
    {pick:77,r:7,player:"Jesús Made",pos:"SS",team:"JP Licks"},
    {pick:78,r:7,player:"Hunter Brown",pos:"SP",team:"Loch Neskie"},
    {pick:79,r:7,player:"Bo Bichette",pos:"SS",team:"Nighthawks"},
    {pick:80,r:7,player:"Drake Baldwin",pos:"C",team:"Poor Pickles"},
    {pick:81,r:7,player:"Joe Ryan",pos:"SP",team:"Snipe City"},
    {pick:82,r:7,player:"Jac Caglianone",pos:"1B",team:"StickyBanditz"},
    {pick:83,r:7,player:"Kyle Bradish",pos:"SP",team:"Team Underdog"},
    {pick:84,r:7,player:"Blake Snell",pos:"SP",team:"Toms River"},
    // Round 8
    {pick:85,r:8,player:"Bubba Chandler",pos:"SP",team:"Toms River"},
    {pick:86,r:8,player:"Chase Burns",pos:"SP",team:"Team Underdog"},
    {pick:87,r:8,player:"Paul Skenes",pos:"SP",team:"StickyBanditz"},
    {pick:88,r:8,player:"Jesús Luzardo",pos:"SP",team:"Snipe City"},
    {pick:89,r:8,player:"Bryce Eldridge",pos:"1B",team:"Poor Pickles"},
    {pick:90,r:8,player:"Nick Pivetta",pos:"SP",team:"Nighthawks"},
    {pick:91,r:8,player:"Logan Webb",pos:"SP",team:"Loch Neskie"},
    {pick:92,r:8,player:"Walker Jenkins",pos:"CF",team:"JP Licks"},
    {pick:93,r:8,player:"Evan Carter",pos:"LF",team:"Hideo Lobo"},
    {pick:94,r:8,player:"Garrett Crochet",pos:"SP",team:"gamma's Team"},
    {pick:95,r:8,player:"Bryan Woo",pos:"SP",team:"Bay of Papi"},
    {pick:96,r:8,player:"Yoshinobu Yamamoto",pos:"SP",team:"Dynasty"},
    // Round 9
    {pick:97,r:9,player:"Cole Ragans",pos:"SP",team:"Dynasty"},
    {pick:98,r:9,player:"Max Fried",pos:"SP",team:"Bay of Papi"},
    {pick:99,r:9,player:"Cristopher Sánchez",pos:"SP",team:"gamma's Team"},
    {pick:100,r:9,player:"Shane McClanahan",pos:"SP",team:"Hideo Lobo"},
    {pick:101,r:9,player:"Zyhir Hope",pos:"CF",team:"JP Licks"},
    {pick:102,r:9,player:"George Kirby",pos:"SP",team:"Loch Neskie"},
    {pick:103,r:9,player:"Nolan McLean",pos:"SP",team:"Nighthawks"},
    {pick:104,r:9,player:"Framber Valdez",pos:"SP",team:"Poor Pickles"},
    {pick:105,r:9,player:"Trevor Rogers",pos:"SP",team:"Snipe City"},
    {pick:106,r:9,player:"Freddy Peralta",pos:"SP",team:"StickyBanditz"},
    {pick:107,r:9,player:"Nick Lodolo",pos:"SP",team:"Team Underdog"},
    {pick:108,r:9,player:"MacKenzie Gore",pos:"SP",team:"Toms River"},
    // Round 10
    {pick:109,r:10,player:"Andrew Painter",pos:"SP",team:"Toms River"},
    {pick:110,r:10,player:"Shohei Ohtani (Pitcher)",pos:"SP",team:"Team Underdog"},
    {pick:111,r:10,player:"Dylan Cease",pos:"SP",team:"StickyBanditz"},
    {pick:112,r:10,player:"Shota Imanaga",pos:"SP",team:"Snipe City"},
    {pick:113,r:10,player:"Roki Sasaki",pos:"SP",team:"Poor Pickles"},
    {pick:114,r:10,player:"Eury Pérez",pos:"SP",team:"Nighthawks"},
    {pick:115,r:10,player:"Edwin Díaz",pos:"RP",team:"Loch Neskie"},
    {pick:116,r:10,player:"Hunter Greene",pos:"SP",team:"JP Licks"},
    {pick:117,r:10,player:"Kodai Senga",pos:"SP",team:"Hideo Lobo"},
    {pick:118,r:10,player:"Chris Sale",pos:"SP",team:"gamma's Team"},
    {pick:119,r:10,player:"Jacob Misiorowski",pos:"SP",team:"Bay of Papi"},
    {pick:120,r:10,player:"Jacob deGrom",pos:"SP",team:"Dynasty"},
  ],
}
