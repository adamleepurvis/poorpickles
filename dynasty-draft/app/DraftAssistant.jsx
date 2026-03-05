import { useState, useCallback, useRef, useEffect, useMemo } from "react";

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
  {pick:109,r:10,player:"Andrew Painter",pos:"SP",team:"Toms River"},{pick:110,r:10,player:"Shohei Ohtani (Pitcher)",pos:"SP",team:"Team Underdog"},{pick:111,r:10,player:"Dylan Cease",pos:"SP",team:"StickyBanditz"},{pick:112,r:10,player:"Shota Imanaga",pos:"SP",team:"Snipe City"},{pick:113,r:10,player:"Roki Sasaki",pos:"SP",team:MY_TEAM},{pick:114,r:10,player:"Eury Pérez",pos:"SP",team:"Nighthawks"},{pick:115,r:10,player:"Edwin Díaz",pos:"RP",team:"Loch Neskie"},{pick:116,r:10,player:"Hunter Greene",pos:"SP",team:"JP Licks"},{pick:117,r:10,player:"Kodai Senga",pos:"SP",team:"Hideo Lobo"},{pick:118,r:10,player:"Chris Sale",pos:"SP",team:"gamma's Team"},{pick:119,r:10,player:"Jacob Misiorowski",pos:"SP",team:"Bay of Papi"},{pick:120,r:10,player:"Jacob deGrom",pos:"SP",team:"Dynasty"},
];

const POS_SCARCITY_ORDER = ["C","SS","2B","3B","CF","LF","RF","1B","SP","RP"];

// ─── TARGET PLAYERS ───────────────────────────────────────────────────────────
// score2026: raw 2026 contribution score (0-10)
// scoreDyn:  raw dynasty/peak score (0-10)
// eligible:  all position eligibilities
// il: true = IL/injured, discount 2026 score
const TARGETS = [
  // ── HITTERS: KEEP-6 TIER
  {name:"Byron Buxton",eligible:["CF"],org:"MIN",tier:"keep6",type:"H",score2026:7.5,scoreDyn:9.0,note:"Multi-cat elite, 2027 prime",cats:["HR","SB","SLG","TB"]},
  {name:"Luis Robert Jr.",eligible:["CF"],org:"NYM",tier:"keep6",type:"H",score2026:6.5,scoreDyn:8.5,note:"27 SB + 20 HR if healthy",cats:["SB","HR","R","TB"]},
  {name:"Dylan Crews",eligible:["CF","RF"],org:"WSH",tier:"keep6",type:"H",score2026:5.0,scoreDyn:8.8,note:"23yo, 2027 prime — mediocre 2026 floor",cats:["SB","R","TB","H"]},
  {name:"Jacob Wilson",eligible:["SS"],org:"OAK",tier:"keep6",type:"H",score2026:6.0,scoreDyn:8.2,note:"Elite hit tool, power developing",cats:["AVG","OBP","H","R"]},
  {name:"Gunnar Henderson",eligible:["SS","3B"],org:"BAL",tier:"keep6",type:"H",score2026:8.5,scoreDyn:9.0,note:"EST — elite SS, power+speed",cats:["HR","SB","RBI","SLG","TB"],est:true},
  {name:"Bobby Witt Jr.",eligible:["SS"],org:"KC",tier:"keep6",type:"H",score2026:9.0,scoreDyn:9.5,note:"EST — best SS available",cats:["HR","SB","RBI","AVG","TB"],est:true},
  {name:"Jose Ramirez",eligible:["3B"],org:"CLE",tier:"keep6",type:"H",score2026:8.5,scoreDyn:7.5,note:"EST — elite 3B, HR+SB",cats:["HR","SB","RBI","TB","SLG"],est:true},
  // ── HITTERS: KEEP-12 TIER
  {name:"Corbin Carroll",eligible:["CF","LF"],org:"ARI",tier:"keep12",type:"H",score2026:7.0,scoreDyn:8.0,note:"EST — SB/speed, 25yo CF",cats:["SB","R","AVG","H"],est:true},
  {name:"James Wood",eligible:["LF"],org:"WSH",tier:"keep12",type:"H",score2026:6.5,scoreDyn:8.0,note:"EST — elite prospect, power+SB",cats:["HR","SB","TB","R"],est:true},
  {name:"Wyatt Langford",eligible:["CF"],org:"TEX",tier:"keep12",type:"H",score2026:6.5,scoreDyn:7.8,note:"EST — SB/power, 24yo CF",cats:["SB","HR","R","TB"],est:true},
  {name:"Jackson Chourio",eligible:["CF"],org:"MIL",tier:"keep12",type:"H",score2026:6.5,scoreDyn:7.5,note:"EST — SB/HR upside, 22yo",cats:["SB","HR","R"],est:true},
  {name:"Eugenio Suarez",eligible:["3B"],org:"CIN",tier:"bridge",type:"H",score2026:8.0,scoreDyn:5.5,note:"34 HR bridge, fills power gap now",cats:["HR","RBI","SLG","TB"]},
  {name:"Xavier Edwards",eligible:["2B","SS"],org:"MIA",tier:"keep12",type:"H",score2026:6.5,scoreDyn:7.0,note:"27 SB, 4-cat contributor",cats:["SB","AVG","H","OBP"]},
  {name:"Willy Adames",eligible:["SS"],org:"SF",tier:"keep12",type:"H",score2026:7.5,scoreDyn:7.0,note:"30 HR + 11 SB, contributes now",cats:["HR","SB","RBI","TB"]},
  {name:"Jeremy Pena",eligible:["SS"],org:"HOU",tier:"keep12",type:"H",score2026:7.0,scoreDyn:7.2,note:"18 SB, solid floor, 29 in 2027",cats:["SB","AVG","R"]},
  {name:"Nico Hoerner",eligible:["2B"],org:"CHC",tier:"keep12",type:"H",score2026:7.0,scoreDyn:6.5,note:"26 SB, .277 AVG, consistent",cats:["SB","AVG","H"]},
  {name:"Matt McLain",eligible:["2B"],org:"CIN",tier:"keep12",type:"H",score2026:5.5,scoreDyn:7.5,note:"Buy-low, 2-way upside",cats:["HR","SB","AVG"],il:true},
  {name:"Spencer Torkelson",eligible:["1B"],org:"DET",tier:"keep12",type:"H",score2026:6.5,scoreDyn:6.8,note:"26 HR, 28 in 2027",cats:["HR","RBI","TB","SLG"]},
  {name:"Taylor Ward",eligible:["LF"],org:"BAL",tier:"keep12",type:"H",score2026:7.0,scoreDyn:6.0,note:"27 HR, undervalued",cats:["HR","RBI","SLG"]},
  {name:"Brenton Doyle",eligible:["CF"],org:"COL",tier:"keep12",type:"H",score2026:6.5,scoreDyn:6.5,note:"21 SB + 18 HR, two-way",cats:["SB","HR"]},
  {name:"Chandler Simpson",eligible:["CF"],org:"TB",tier:"specialist",type:"H",score2026:6.0,scoreDyn:5.0,note:"37 SB specialist, no power",cats:["SB"]},
  {name:"Luke Keaschall",eligible:["2B"],org:"MIN",tier:"keep12",type:"H",score2026:5.5,scoreDyn:6.8,note:"21 SB, young, OBP upside",cats:["SB","OBP"]},
  {name:"Jakob Marsee",eligible:["LF","CF"],org:"MIA",tier:"keep12",type:"H",score2026:5.5,scoreDyn:6.5,note:"27 SB, speed profile",cats:["SB","R"]},
  {name:"Steven Kwan",eligible:["LF"],org:"CLE",tier:"keep12",type:"H",score2026:7.0,scoreDyn:5.5,note:"17 SB, .268 AVG, consistent floor",cats:["AVG","OBP","H"]},
  {name:"Masyn Winn",eligible:["SS"],org:"STL",tier:"keep12",type:"H",score2026:6.5,scoreDyn:7.0,note:"EST — SB/AVG, young SS",cats:["SB","AVG","H","R"],est:true},
  {name:"Zach Neto",eligible:["SS"],org:"LAA",tier:"keep12",type:"H",score2026:6.5,scoreDyn:7.2,note:"EST — SB/HR, 25yo SS",cats:["SB","HR","AVG"],est:true},
  {name:"Junior Caminero",eligible:["3B"],org:"TB",tier:"keep12",type:"H",score2026:6.0,scoreDyn:7.5,note:"EST — power upside, young 3B",cats:["HR","RBI","SLG"],est:true},
  // ── HITTERS: BRIDGE
  {name:"Anthony Santander",eligible:["LF","RF"],org:"TOR",tier:"bridge",type:"H",score2026:7.5,scoreDyn:5.0,note:"EST — 30 HR, bridge power bat",cats:["HR","RBI","SLG","TB"],est:true},
  {name:"Teoscar Hernandez",eligible:["LF","RF"],org:"LAD",tier:"bridge",type:"H",score2026:7.0,scoreDyn:4.5,note:"EST — HR/RBI bridge bat",cats:["HR","RBI","TB"],est:true},
  {name:"Seiya Suzuki",eligible:["RF"],org:"CHC",tier:"bridge",type:"H",score2026:7.0,scoreDyn:5.0,note:"EST — 26 HR, solid floor, ages out",cats:["HR","RBI","AVG"],est:true},
  {name:"Ian Happ",eligible:["LF","CF"],org:"CHC",tier:"bridge",type:"H",score2026:6.5,scoreDyn:4.5,note:"EST — OBP, 20 HR, steady",cats:["HR","OBP","AVG"],est:true},
  {name:"Nolan Arenado",eligible:["3B"],org:"STL",tier:"bridge",type:"H",score2026:6.5,scoreDyn:3.5,note:"EST — HR/RBI, declining",cats:["HR","RBI","SLG"],est:true},
  {name:"Christian Yelich",eligible:["LF"],org:"MIL",tier:"bridge",type:"H",score2026:6.5,scoreDyn:4.0,note:"EST — AVG/OBP aging vet",cats:["AVG","OBP","SB"],est:true},
  {name:"Manny Machado",eligible:["3B"],org:"SD",tier:"bridge",type:"H",score2026:7.0,scoreDyn:4.5,note:"EST — HR/AVG, age 34 in 2027",cats:["HR","RBI","AVG","SLG"],est:true},
  {name:"Trea Turner",eligible:["SS"],org:"PHI",tier:"bridge",type:"H",score2026:7.5,scoreDyn:5.0,note:"EST — SB/AVG, aging 32",cats:["SB","AVG","R","H"],est:true},
  {name:"Josh Lowe",eligible:["LF","CF"],org:"TB",tier:"maybe",type:"H",score2026:6.0,scoreDyn:6.0,note:"EST — SB upside, power emerging",cats:["SB","HR","R"],est:true},
  // ── HITTERS: PROSPECTS
  {name:"Colt Keith",eligible:["2B","3B"],org:"DET",tier:"maybe",type:"H",score2026:5.5,scoreDyn:6.5,note:"EST — young 3B, AVG/power mix",cats:["HR","AVG","RBI"],est:true},
  {name:"Noelvi Marte",eligible:["3B"],org:"CIN",tier:"maybe",type:"H",score2026:5.5,scoreDyn:6.8,note:"EST — power upside 3B",cats:["HR","RBI","SLG"],est:true},
  {name:"Rece Hinds",eligible:["3B"],org:"CIN",tier:"maybe",type:"H",score2026:4.5,scoreDyn:7.0,note:"EST — raw power, strikeout risk",cats:["HR","RBI","TB"],est:true},
  {name:"Colton Cowser",eligible:["LF","CF"],org:"BAL",tier:"maybe",type:"H",score2026:6.0,scoreDyn:6.5,note:"EST — OBP/SB, developing",cats:["OBP","SB","AVG"],est:true},
  {name:"Coby Mayo",eligible:["3B"],org:"BAL",tier:"maybe",type:"H",score2026:5.0,scoreDyn:6.8,note:"EST — power 3B, developing",cats:["HR","RBI","SLG"],est:true},
  {name:"Cam Collier",eligible:["3B"],org:"CIN",tier:"maybe",type:"H",score2026:4.0,scoreDyn:7.0,note:"EST — top 3B prospect, patience",cats:["AVG","OBP","HR"],est:true},
  {name:"Jordan Walker",eligible:["RF","3B"],org:"STL",tier:"maybe",type:"H",score2026:5.5,scoreDyn:7.0,note:"EST — raw tools, inconsistent",cats:["HR","SB","AVG"],est:true},
  {name:"Edouard Julien",eligible:["2B"],org:"MIN",tier:"maybe",type:"H",score2026:6.0,scoreDyn:6.0,note:"EST — OBP machine, SB",cats:["OBP","SB","R"],est:true},
  {name:"Ha-Seong Kim",eligible:["2B","SS","3B"],org:"SD",tier:"maybe",type:"H",score2026:6.0,scoreDyn:5.5,note:"EST — multi-pos, SB/AVG",cats:["SB","AVG","OBP"],est:true},
  {name:"Adael Amador",eligible:["SS"],org:"COL",tier:"maybe",type:"H",score2026:4.5,scoreDyn:6.8,note:"EST — SS prospect, hit tool",cats:["AVG","OBP","H"],est:true},
  {name:"Jonatan Clase",eligible:["CF"],org:"SEA",tier:"maybe",type:"H",score2026:5.5,scoreDyn:6.5,note:"EST — elite SB upside",cats:["SB","R"],est:true},
  {name:"Kristian Campbell",eligible:["2B","SS"],org:"BOS",tier:"maybe",type:"H",score2026:5.0,scoreDyn:7.0,note:"EST — young middle IF, upside",cats:["AVG","OBP","SB"],est:true},
  {name:"Zach DeLoach",eligible:["LF","CF"],org:"SEA",tier:"maybe",type:"H",score2026:5.0,scoreDyn:6.0,note:"EST — contact/speed upside",cats:["AVG","SB","H"],est:true},
  {name:"Thairo Estrada",eligible:["2B","SS"],org:"SF",tier:"maybe",type:"H",score2026:5.5,scoreDyn:5.0,note:"EST — SB/AVG utility",cats:["SB","AVG","H"],est:true},
  {name:"Cedric Mullins",eligible:["CF"],org:"BAL",tier:"maybe",type:"H",score2026:6.0,scoreDyn:5.0,note:"EST — SB/speed, limited power",cats:["SB","R","H"],est:true},
  {name:"Brendan Donovan",eligible:["2B","3B","LF"],org:"STL",tier:"maybe",type:"H",score2026:6.0,scoreDyn:5.0,note:"EST — OBP, contact, utility",cats:["AVG","OBP","H"],est:true},
  {name:"Lane Thomas",eligible:["CF","RF"],org:"WSH",tier:"maybe",type:"H",score2026:5.5,scoreDyn:5.5,note:"EST — SB/speed, low AVG",cats:["SB","R"],est:true},
  {name:"Michael Siani",eligible:["CF","LF"],org:"STL",tier:"maybe",type:"H",score2026:5.0,scoreDyn:5.0,note:"EST — SB specialist depth",cats:["SB","R"],est:true},
  {name:"Nick Castellanos",eligible:["RF"],org:"PHI",tier:"bridge",type:"H",score2026:6.0,scoreDyn:3.5,note:"EST — AVG/RBI, aging out",cats:["AVG","RBI","H"],est:true},
  {name:"CJ Cron",eligible:["1B"],org:"COL",tier:"bridge",type:"H",score2026:6.0,scoreDyn:3.5,note:"EST — HR/RBI depth, Coors",cats:["HR","RBI","TB"],est:true},
  // ── PITCHERS: KEEP-6 TIER
  {name:"Spencer Strider",eligible:["SP"],org:"ATL",tier:"keep6",type:"P",score2026:5.0,scoreDyn:9.5,note:"10.30 K/9, buy on injury discount",cats:["K","K/9","ERA","WHIP"],il:true},
  {name:"Spencer Schwellenbach",eligible:["SP"],org:"ATL",tier:"keep6",type:"P",score2026:3.0,scoreDyn:9.0,note:"1.08 WHIP when healthy, deep IL",cats:["ERA","WHIP","BB/9"],il:true},
  {name:"Trey Yesavage",eligible:["SP"],org:"TOR",tier:"keep6",type:"P",score2026:7.5,scoreDyn:8.8,note:"10.00 K/9, 24yo, contributes now",cats:["K","K/9","ERA"]},
  {name:"Emmet Sheehan",eligible:["SP"],org:"LAD",tier:"keep6",type:"P",score2026:7.5,scoreDyn:8.5,note:"10.53 K/9, 25yo, LAD",cats:["K","K/9","ERA"]},
  {name:"Grayson Rodriguez",eligible:["SP"],org:"LAA",tier:"keep6",type:"P",score2026:6.0,scoreDyn:8.8,note:"12% rostered, buy-low ace",cats:["K","ERA","WHIP"],il:true},
  {name:"Jared Jones",eligible:["SP"],org:"PIT",tier:"keep6",type:"P",score2026:2.5,scoreDyn:8.5,note:"IL stash, ace ceiling",cats:["K","K/9"],il:true},
  {name:"Tarik Skubal",eligible:["SP"],org:"DET",tier:"keep6",type:"P",score2026:9.0,scoreDyn:9.0,note:"EST — best SP in AL",cats:["K","K/9","ERA","WHIP","BB/9"],est:true},
  {name:"Roki Sasaki",eligible:["SP"],org:"LAD",tier:"keep6",type:"P",score2026:7.5,scoreDyn:9.0,note:"EST — elite stuff, 24yo",cats:["K","K/9","ERA","WHIP","BB/9"],est:true},
  // ── PITCHERS: KEEP-12 / BRIDGE
  {name:"Zack Wheeler",eligible:["SP"],org:"PHI",tier:"bridge",type:"P",score2026:9.0,scoreDyn:5.0,note:"Best 2026 ratios available",cats:["ERA","WHIP","K"]},
  {name:"Sonny Gray",eligible:["SP"],org:"BOS",tier:"bridge",type:"P",score2026:8.5,scoreDyn:4.5,note:"182 K, 2.3 BB/9, bridge ace",cats:["K","BB/9","ERA"]},
  {name:"Cade Horton",eligible:["SP"],org:"CHC",tier:"maybe",type:"P",score2026:7.0,scoreDyn:7.5,note:"24yo, 3.67 ERA",cats:["ERA","WHIP","K"]},
  {name:"Jack Leiter",eligible:["SP"],org:"TEX",tier:"keep12",type:"P",score2026:6.5,scoreDyn:7.8,note:"24yo, developing ace",cats:["K","ERA"]},
  {name:"Gavin Williams",eligible:["SP"],org:"CLE",tier:"keep12",type:"P",score2026:7.0,scoreDyn:7.5,note:"174 K, 25yo",cats:["K","K/9"]},
  {name:"Edward Cabrera",eligible:["SP"],org:"CHC",tier:"maybe",type:"P",score2026:6.5,scoreDyn:7.2,note:"9.70 K/9, 25yo",cats:["K","K/9"]},
  {name:"Jack Flaherty",eligible:["SP"],org:"DET",tier:"keep12",type:"P",score2026:7.5,scoreDyn:6.0,note:"9.86 K/9, proven innings",cats:["K","K/9","ERA"]},
  {name:"Kevin Gausman",eligible:["SP"],org:"TOR",tier:"bridge",type:"P",score2026:8.0,scoreDyn:4.0,note:"181 K, bridge innings",cats:["K","ERA","WHIP"]},
  {name:"Cam Schlittler",eligible:["SP"],org:"NYY",tier:"keep12",type:"P",score2026:5.5,scoreDyn:7.0,note:"9.22 K/9, 24yo stash",cats:["K","K/9"]},
  {name:"George Kirby",eligible:["SP"],org:"SEA",tier:"keep12",type:"P",score2026:8.0,scoreDyn:7.0,note:"EST — elite BB/9, 27yo",cats:["ERA","WHIP","BB/9","K"],est:true},
  {name:"Logan Gilbert",eligible:["SP"],org:"SEA",tier:"keep12",type:"P",score2026:7.5,scoreDyn:6.5,note:"EST — innings/K, 28yo",cats:["K","ERA","WHIP","IP"],est:true},
  {name:"Michael King",eligible:["SP"],org:"SD",tier:"keep12",type:"P",score2026:7.5,scoreDyn:6.5,note:"EST — elite K/9, 29yo",cats:["K","K/9","ERA","WHIP"],est:true},
  {name:"Pablo Lopez",eligible:["SP"],org:"MIN",tier:"bridge",type:"P",score2026:7.5,scoreDyn:5.0,note:"EST — elite WHIP, 29yo",cats:["ERA","WHIP","K","BB/9"],est:true},
  {name:"MacKenzie Gore",eligible:["SP"],org:"WSH",tier:"keep12",type:"P",score2026:7.0,scoreDyn:6.5,note:"EST — K/9 upside, 27yo",cats:["K","K/9","ERA"],est:true},
  {name:"Hunter Brown",eligible:["SP"],org:"HOU",tier:"keep12",type:"P",score2026:7.0,scoreDyn:6.5,note:"EST — K/9 upside, 26yo",cats:["K","K/9","ERA"],est:true},
  {name:"Cristopher Sanchez",eligible:["SP"],org:"PHI",tier:"keep12",type:"P",score2026:7.0,scoreDyn:6.0,note:"EST — WHIP specialist, 27yo",cats:["ERA","WHIP","BB/9"],est:true},
  {name:"Dylan Cease",eligible:["SP"],org:"SD",tier:"keep12",type:"P",score2026:7.5,scoreDyn:6.0,note:"EST — high K, high BB",cats:["K","K/9","ERA"],est:true},
  {name:"Andrew Painter",eligible:["SP"],org:"PHI",tier:"keep12",type:"P",score2026:5.5,scoreDyn:8.0,note:"EST — elite prospect, TJ recovery",cats:["K","K/9","ERA","WHIP"],il:true,est:true},
  {name:"Kodai Senga",eligible:["SP"],org:"NYM",tier:"maybe",type:"P",score2026:5.0,scoreDyn:7.5,note:"EST — elite when healthy, IL risk",cats:["K","K/9","ERA"],il:true,est:true},
  {name:"Jacob Misiorowski",eligible:["SP"],org:"MIL",tier:"maybe",type:"P",score2026:5.0,scoreDyn:7.5,note:"EST — elite K/9, control developing",cats:["K","K/9"],est:true},
  {name:"AJ Smith-Shawver",eligible:["SP"],org:"ATL",tier:"maybe",type:"P",score2026:5.5,scoreDyn:7.0,note:"EST — 23yo, K upside",cats:["K","K/9"],est:true},
  {name:"Max Meyer",eligible:["SP"],org:"MIA",tier:"maybe",type:"P",score2026:6.0,scoreDyn:7.0,note:"EST — 27yo, K/9 upside",cats:["K","K/9"],est:true},
  {name:"Ryan Pepiot",eligible:["SP"],org:"TB",tier:"maybe",type:"P",score2026:6.5,scoreDyn:6.5,note:"EST — K upside, health TBD",cats:["K","K/9","ERA"],est:true},
  {name:"Reese Olson",eligible:["SP"],org:"DET",tier:"maybe",type:"P",score2026:6.5,scoreDyn:6.5,note:"EST — K/9 + BB/9 combo",cats:["K","K/9","BB/9"],est:true},
  {name:"Clarke Schmidt",eligible:["SP"],org:"NYY",tier:"maybe",type:"P",score2026:6.5,scoreDyn:6.0,note:"EST — K/9, NYY depth",cats:["K","K/9","ERA"],est:true},
  {name:"Bryce Miller",eligible:["SP"],org:"SEA",tier:"maybe",type:"P",score2026:6.5,scoreDyn:6.5,note:"EST — K/9 + BB/9, 26yo",cats:["K","K/9","BB/9"],est:true},
  {name:"Landen Roupp",eligible:["SP"],org:"SF",tier:"maybe",type:"P",score2026:6.0,scoreDyn:6.5,note:"EST — 25yo, developing",cats:["K","ERA","WHIP"],est:true},
  {name:"Nestor Cortes",eligible:["SP"],org:"MIL",tier:"maybe",type:"P",score2026:6.5,scoreDyn:5.0,note:"EST — BB/9, WHIP, low K",cats:["ERA","WHIP","BB/9"],est:true},
  {name:"Ranger Suarez",eligible:["SP"],org:"PHI",tier:"maybe",type:"P",score2026:6.5,scoreDyn:5.5,note:"EST — ERA/WHIP, health risk",cats:["ERA","WHIP","BB/9"],est:true},
  {name:"Merrill Kelly",eligible:["SP"],org:"ARI",tier:"bridge",type:"P",score2026:7.0,scoreDyn:4.0,note:"EST — ratios, aging out",cats:["ERA","WHIP","IP"],est:true},
  {name:"Graham Ashcraft",eligible:["SP"],org:"CIN",tier:"maybe",type:"P",score2026:6.0,scoreDyn:5.5,note:"EST — groundball, ERA depth",cats:["ERA","WHIP","IP"],est:true},
  // ── RELIEVERS
  {name:"Mason Miller",eligible:["RP"],org:"OAK",tier:"keep12",type:"P",score2026:7.0,scoreDyn:6.5,note:"EST — elite velocity closer",cats:["NSVH","K/9","ERA"],est:true},
  {name:"Jhoan Duran",eligible:["RP"],org:"MIN",tier:"keep12",type:"P",score2026:7.0,scoreDyn:6.5,note:"EST — elite K/9 closer",cats:["NSVH","K/9","ERA"],est:true},
  {name:"Ryan Helsley",eligible:["RP"],org:"STL",tier:"maybe",type:"P",score2026:7.0,scoreDyn:5.5,note:"EST — elite closer, K/9",cats:["NSVH","K/9","ERA"],est:true},
  {name:"Emmanuel Clase",eligible:["RP"],org:"CLE",tier:"maybe",type:"P",score2026:7.0,scoreDyn:5.0,note:"EST — saves leader, cutter",cats:["NSVH","ERA","WHIP"],est:true},
  {name:"Josh Hader",eligible:["RP"],org:"HOU",tier:"bridge",type:"P",score2026:7.0,scoreDyn:4.0,note:"EST — saves, elite K/9, aging",cats:["NSVH","K/9","ERA"],est:true},
  {name:"Devin Williams",eligible:["RP"],org:"NYY",tier:"maybe",type:"P",score2026:6.5,scoreDyn:5.0,note:"EST — SV/HD, elite K/9",cats:["NSVH","K/9","ERA"],est:true},
  {name:"Tanner Scott",eligible:["RP"],org:"LAD",tier:"maybe",type:"P",score2026:6.5,scoreDyn:5.0,note:"EST — saves/holds, BB risk",cats:["NSVH","ERA","WHIP"],est:true},
  {name:"Edwin Diaz",eligible:["RP"],org:"NYM",tier:"maybe",type:"P",score2026:7.0,scoreDyn:5.5,note:"EST — saves + K/9 elite",cats:["NSVH","K/9","ERA"],est:true},
  {name:"Alexis Diaz",eligible:["RP"],org:"CIN",tier:"maybe",type:"P",score2026:6.5,scoreDyn:5.5,note:"EST — saves, K/9",cats:["NSVH","K/9"],est:true},
  {name:"David Bednar",eligible:["RP"],org:"PIT",tier:"maybe",type:"P",score2026:6.5,scoreDyn:5.0,note:"EST — saves, K upside",cats:["NSVH","K/9","ERA"],est:true},
  {name:"Felix Bautista",eligible:["RP"],org:"BAL",tier:"maybe",type:"P",score2026:5.5,scoreDyn:6.0,note:"EST — elite when healthy, IL",cats:["NSVH","K/9","ERA"],il:true,est:true},
  {name:"Clay Holmes",eligible:["RP"],org:"NYM",tier:"maybe",type:"P",score2026:6.0,scoreDyn:4.5,note:"EST — SV/sinker, BB risk",cats:["NSVH","ERA","WHIP"],est:true},
  {name:"Pete Fairbanks",eligible:["RP"],org:"TB",tier:"maybe",type:"P",score2026:6.0,scoreDyn:4.5,note:"EST — SV opps, health risk",cats:["NSVH","K/9"],est:true},
];

// ─── SCORING ENGINE ────────────────────────────────────────────────────────────
const DYNASTY_WEIGHT = 0.75;
const NOW_WEIGHT = 0.25;
const IL_2026_DISCOUNT = 0.4;

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

function calcCatScore(player, catNeed) {
  const need = catNeed || BASE_CAT_NEED;
  const totalNeed = player.cats.reduce((sum, c) => sum + (need[c] || 0), 0);
  const maxPossible = player.cats.length * 3;
  return maxPossible > 0 ? totalNeed / maxPossible : 0;
}

function calcBaseScore(player, catNeed) {
  const s2026 = player.il ? player.score2026 * IL_2026_DISCOUNT : player.score2026;
  const catMult = 0.6 + 0.4 * calcCatScore(player, catNeed);
  const base = (s2026 * NOW_WEIGHT + player.scoreDyn * DYNASTY_WEIGHT) * catMult;
  return Math.round(base * 10) / 10;
}

// Positional scarcity: VOR = player score - avg score of next 3 at same pos group
function calcPositionalScarcity(player, available, catNeed) {
  const posRanked = [...player.eligible].sort(
    (a, b) => POS_SCARCITY_ORDER.indexOf(a) - POS_SCARCITY_ORDER.indexOf(b)
  );
  const scarcePos = posRanked[0];
  const posPool = available
    .filter(p => p.name !== player.name && p.eligible.includes(scarcePos))
    .map(p => calcBaseScore(p, catNeed))
    .sort((a, b) => b - a);
  const replacements = posPool.slice(0, 3);
  const replacement = replacements.length > 0
    ? replacements.reduce((s, v) => s + v, 0) / replacements.length
    : 0;
  const vor = calcBaseScore(player, catNeed) - replacement;
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
// Based on: player's tier, picks between now and next my pick, historical draft rate
function calcUrgency(player, currentPick, available) {
  const nextMyPick = MY_PICKS.find(p => p > currentPick);
  if (!nextMyPick) return 0;
  const picksAway = nextMyPick - currentPick;

  // Base gone% by tier (keep6 go faster)
  const tierRate = { keep6: 0.15, keep12: 0.08, bridge: 0.10, maybe: 0.06, specialist: 0.05 };
  const rate = tierRate[player.tier] || 0.08;

  // How many teams still need this position?
  const teamsNeedingPos = 8; // rough estimate — will refine with team tracking
  const adjustedRate = rate * (teamsNeedingPos / TOTAL_TEAMS);

  // Probability gone = 1 - (1-rate)^picksAway (geometric)
  const probGone = 1 - Math.pow(1 - adjustedRate, picksAway);
  return Math.round(probGone * 100);
}

// Final adjusted score shown in UI
function calcDraftNowScore(player, available, livePicks, currentPick, catNeed) {
  const base = calcBaseScore(player, catNeed);
  const { vor } = calcPositionalScarcity(player, available, catNeed);
  const urgency = calcUrgency(player, currentPick, available) / 100;
  const urgencyBonus = urgency * 1.5;
  const vorBonus = Math.min(Math.max(vor * 0.3, 0), 1.0);
  const final = base + urgencyBonus + vorBonus;
  return Math.round(final * 10) / 10;
}

// ─── STYLE CONSTANTS ──────────────────────────────────────────────────────────
const TIER_COLOR = {keep6:"#f59e0b",keep12:"#22c55e",bridge:"#60a5fa",maybe:"#c084fc",specialist:"#f472b6"};
const TIER_LABEL = {keep6:"Keep-6 🔒",keep12:"Keep-12",bridge:"Bridge",maybe:"Maybe",specialist:"Specialist"};
const CAT_NEED_COLOR = {0:"#1e293b",1:"#334155",2:"#60a5fa",3:"#f87171"};
const MY_KEEPER_CATS = {
  R:"ok",H:"ok",HR:"thin",RBI:"thin",SB:"strong",TB:"thin",AVG:"ok",OBP:"ok",SLG:"thin",
  K:"ok",IP:"ok",W:"ok",ER:"ok",ERA:"ok",WHIP:"ok","K/9":"ok","BB/9":"ok",NSVH:"thin"
};
const CAT_STATUS_COLOR = {strong:"#22c55e",ok:"#60a5fa",thin:"#f59e0b",missing:"#f87171"};

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a fantasy baseball dynasty draft advisor for "Poor Pickles" (12-team snake draft).

SCORING 9x9: Hitting: R, H, HR, RBI, SB, TB, AVG, OBP, SLG | Pitching: IP, W, ER, K, ERA, WHIP, K/9, BB/9, NSVH
ROSTER: C, 1B, 2B, 3B, SS, LF, CF, RF, UTIL, SP×4, RP×2, P×2, BN×11 | 29 rounds total
SNAKE: Poor Pickles picks 5th odd rounds, 8th even rounds

KEEPERS: Perdomo(SS), Pasquantino(1B), M.Garcia(3B), Soderstrom(C), Harris II(CF), Adell(RF), Baldwin(C), Eldridge(1B)🔒, Valdez(SP), Sasaki(SP)🔒

SCORING MODEL (25% 2026 / 75% dynasty):
- Base score = weighted category fit × time-blended raw score
- IL players: 40% of 2026 score, full dynasty score
- Positional scarcity bonus added (VOR vs next 3 at position)
- Urgency bonus added (prob gone by next pick)
- Final = Draft Now Score shown in UI

CATEGORY GAPS: HR❗(3) RBI❗(3) SLG❗(3) NSVH❗(3) TB(2) — SB/AVG/OBP already strong
KEEP-6 TARGETS P: Strider, Schwellenbach, Yesavage, Sheehan, Rodriguez, Jones
KEEP-6 TARGETS H: Buxton, Luis Robert Jr., Dylan Crews, Jacob Wilson

Be concise. Lead with the top 1-2 names + score-based reason. Reference Draft Now Score when relevant.`;

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function App() {
  const [livePicks, setLivePicks] = useState({});
  const [myDrafted, setMyDrafted] = useState([]);
  const [playerNotes, setPlayerNotes] = useState({});
  const [currentPick, setCurrentPick] = useState(DRAFT_START_PICK);
  const [pickInput, setPickInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [messages, setMessages] = useState([
    {role:"assistant", content:"Scoring engine loaded. Rankings now use:\n• 25% 2026 production / 75% dynasty\n• Category fit multiplier (HR/RBI/SLG weighted 3×)\n• Positional scarcity (VOR vs next 3 at position)\n• Urgency bonus (prob gone by your next pick)\n• IL discount on 2026 only\n\nDraft starts at pick 121. Ask me anything or just start recording picks."}
  ]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("board");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editingNote, setEditingNote] = useState(null);
  const [noteInput, setNoteInput] = useState("");
  const [catStatus, setCatStatus] = useState(MY_KEEPER_CATS);
  const [catNeed, setCatNeed] = useState(BASE_CAT_NEED);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(null);
  const endRef = useRef(null);
  const pickInputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

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
    new Set([...KEEPER_PICKS.map(p=>p.player), ...Object.values(livePicks)]),
    [livePicks]
  );

  const available = useMemo(() =>
    TARGETS.filter(t => !allTaken.has(t.name)),
    [allTaken]
  );

  // Scored and sorted available targets — recalculates live as catNeed evolves
  const scoredAvailable = useMemo(() =>
    available.map(t => ({
      ...t,
      baseScore: calcBaseScore(t, catNeed),
      draftNowScore: calcDraftNowScore(t, available, livePicks, currentPick, catNeed),
      scarcity: calcPositionalScarcity(t, available, catNeed),
      urgency: calcUrgency(t, currentPick, available),
      leagueDepletion: calcLeagueScarcity(t, available, livePicks),
    })).sort((a, b) => b.draftNowScore - a.draftNowScore),
    [available, livePicks, currentPick, catNeed]
  );

  const filtered = useMemo(() =>
    scoredAvailable.filter(t => typeFilter === "all" || t.type === typeFilter),
    [scoredAvailable, typeFilter]
  );

  const currentRound = getRound(currentPick);
  const isMyClock = MY_PICKS.includes(currentPick);
  const nextMine = MY_PICKS.find(p => p >= currentPick);
  const until = nextMine ? nextMine - currentPick : 0;
  const snakePicks = MY_PICKS.filter(p => p >= currentPick).slice(0, 4);
  const lateAlerts = scoredAvailable.filter(t => t.tier === "keep6" && t.urgency >= 60);

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
    const lower = val.toLowerCase();
    const allNames = [...new Set([...TARGETS.map(t=>t.name), ...KEEPER_PICKS.map(p=>p.player)])];
    const matches = allNames.filter(n => n.toLowerCase().includes(lower) && !allTaken.has(n)).slice(0, 5);
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
    setMessages([{role:"assistant", content:"Reset to pick 121. Scoring engine ready."}]);
  };

  const sendMsg = useCallback(async () => {
    if (!chatInput.trim() || loading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setMessages(prev => [...prev, {role:"user", content:msg}]);
    setLoading(true);
    const top5 = filtered.slice(0, 5).map(t =>
      `${t.name} (DNS:${t.draftNowScore}, VOR:${t.scarcity.vor}, urgency:${t.urgency}%)`
    ).join(", ");
    const ctx = `Pick: ${currentPick} | Round: ${currentRound} | My turn: ${isMyClock ? "YES — ON CLOCK" : `No, ${until} away (next: ${nextMine})`}
My drafted: ${myDrafted.join(", ")||"none"}
Top 5 by Draft Now Score: ${top5}
Category gaps: ${Object.entries(catStatus).filter(([,v])=>v==="thin"||v==="missing").map(([c])=>c).join(", ")||"none"}
Question: ${msg}`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:500, system:SYSTEM_PROMPT,
          messages:[...messages.slice(-6).map(m=>({role:m.role,content:m.content})),{role:"user",content:ctx}]
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, {role:"assistant", content:data.content?.map(b=>b.text||"").join("")||"Error."}]);
    } catch { setMessages(prev => [...prev, {role:"assistant", content:"Connection error."}]); }
    setLoading(false);
  }, [chatInput, loading, currentPick, currentRound, isMyClock, until, nextMine, myDrafted, messages, filtered, catStatus]);

  const myRoster = [
    ...KEEPER_PICKS.filter(p=>p.team===MY_TEAM).map(p=>({name:p.player,pos:p.pos,kept:true})),
    ...myDrafted.map(n=>({name:n, pos:TARGETS.find(t=>t.name===n)?.eligible[0]||"?", kept:false}))
  ];

  const hitCats = ["R","H","HR","RBI","SB","TB","AVG","OBP","SLG"];
  const pitchCats = ["IP","W","ER","K","ERA","WHIP","K/9","BB/9","NSVH"];

  // Score bar color
  const scoreColor = (s) => s >= 8 ? "#f59e0b" : s >= 6.5 ? "#22c55e" : s >= 5 ? "#60a5fa" : "#475569";

  return (
    <div style={{fontFamily:"'IBM Plex Mono','Courier New',monospace",background:"#08090d",height:"100vh",color:"#cbd5e1",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:#0f1117}
        ::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}
        .pulse{animation:glow 1.4s ease-in-out infinite}
        @keyframes glow{0%,100%{box-shadow:0 0 0 0 #f59e0b55}50%{box-shadow:0 0 0 8px #f59e0b00}}
        input,textarea{background:#0f1117;border:1px solid #1e293b;color:#cbd5e1;font-family:'IBM Plex Mono','Courier New',monospace;font-size:11px;padding:5px 8px;border-radius:3px;outline:none}
        input:focus,textarea:focus{border-color:#f59e0b}
        .btn{cursor:pointer;border:none;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;letter-spacing:.07em;text-transform:uppercase;padding:5px 9px;border-radius:3px;transition:all .15s}
        .tabn{background:none;border:none;cursor:pointer;padding:8px 12px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;transition:all .15s}
        .sug-item:hover{background:#1e293b}
        .score-row:hover{background:#111520}
      `}</style>

      {/* HEADER */}
      <div style={{background:"#0b0d14",borderBottom:"1px solid #1e293b",padding:"9px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:20,letterSpacing:".15em",color:"#f59e0b",fontWeight:700}}>POOR PICKLES</span>
          <span style={{color:"#1e293b"}}>|</span>
          <span style={{fontSize:9,color:"#334155",letterSpacing:".1em"}}>DYNASTY DRAFT · SCORING ENGINE v2</span>
        </div>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:9,color:"#334155",marginRight:2}}>MY PICKS:</span>
            {snakePicks.map((p,i)=>(
              <div key={p} style={{textAlign:"center",opacity:i===0?1:0.4+i*0.15}}>
                <div style={{fontSize:8,color:"#334155"}}>R{getRound(p)}</div>
                <div style={{fontSize:12,fontWeight:600,color:i===0&&isMyClock?"#f59e0b":"#64748b"}}>#{p}</div>
              </div>
            ))}
          </div>
          <div style={{width:1,height:24,background:"#1e293b"}}/>
          {[["PICK",currentPick],["RND",currentRound]].map(([l,v])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontSize:8,color:"#334155"}}>{l}</div>
              <div style={{fontSize:13,fontWeight:600,color:"#f1f5f9"}}>{v}</div>
            </div>
          ))}
          <div className={isMyClock?"pulse":""} style={{padding:"3px 10px",borderRadius:3,background:isMyClock?"#f59e0b22":"#1e293b",border:`1px solid ${isMyClock?"#f59e0b":"#1e293b"}`,color:isMyClock?"#f59e0b":"#334155",fontSize:10,fontWeight:600,letterSpacing:".08em"}}>
            {isMyClock?"⚡ ON CLOCK":`−${until} picks`}
          </div>
        </div>
      </div>

      {/* ALERT BAR */}
      {lateAlerts.length > 0 && (
        <div style={{background:"#7f1d1d22",borderBottom:"1px solid #dc262622",padding:"4px 16px",display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
          <span style={{fontSize:9,color:"#f87171",letterSpacing:".08em",fontWeight:600}}>⚠ URGENT — Keep-6 targets at risk:</span>
          {lateAlerts.map(t=>(
            <span key={t.name} style={{fontSize:10,color:"#fca5a5",background:"#7f1d1d44",padding:"1px 7px",borderRadius:10}}>
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
              <div style={{fontSize:9,color:"#334155",letterSpacing:".08em",textTransform:"uppercase"}}>Pick #{currentPick} · [/] to focus</div>
              <div style={{fontSize:11,fontWeight:600,color:isMyClock?"#f59e0b":"#94a3b8",marginTop:2}}>
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
                style={{width:"100%",borderColor:isMyClock?"#f59e0b44":"#1e293b"}}/>
              {suggestions.length>0&&(
                <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#111318",border:"1px solid #f59e0b66",borderTop:"none",borderRadius:"0 0 4px 4px",zIndex:200}}>
                  {suggestions.map(s=>{
                    const t = TARGETS.find(x=>x.name===s);
                    const scored = scoredAvailable.find(x=>x.name===s);
                    return (
                      <div key={s} className="sug-item" onClick={()=>{setPickInput(s);setSuggestions([]);pickInputRef.current?.focus();}}
                        style={{padding:"5px 8px",fontSize:11,color:"#e2e8f0",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span>{s}</span>
                        <div style={{display:"flex",gap:5,alignItems:"center"}}>
                          {scored&&<span style={{fontSize:8,color:scoreColor(scored.draftNowScore),fontWeight:600}}>{scored.draftNowScore}</span>}
                          {t&&<span style={{fontSize:8,color:TIER_COLOR[t.tier]}}>{TIER_LABEL[t.tier]}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <button className="btn" style={{width:"100%",marginTop:5,background:isMyClock?"#14532d44":"#1e293b",color:isMyClock?"#22c55e":"#64748b",border:isMyClock?"1px solid #14532d":"none",fontWeight:600}} onClick={record}>
              {isMyClock?"Record My Pick [Enter]":"Record + Advance [Enter]"}
            </button>
            <div style={{display:"flex",gap:3,marginTop:3}}>
              <button className="btn" style={{flex:1,background:"#1e293b",color:"#475569"}} onClick={()=>{
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

          {/* My roster */}
          <div style={{flex:1,overflowY:"auto",padding:10}}>
            <div style={{fontSize:9,color:"#334155",letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>My Roster ({myRoster.length}/28)</div>
            {myRoster.map((p,i)=>(
              <div key={i} style={{padding:"3px 7px",marginBottom:2,background:p.kept?"#0c1624":"#0c1a10",borderRadius:3,borderLeft:`2px solid ${p.kept?"#3b82f6":"#22c55e"}`}}>
                <div style={{fontSize:11,color:"#e2e8f0"}}>{p.name}</div>
                <div style={{fontSize:9,color:"#334155"}}>{p.pos}{p.kept?" · K":""}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{background:"#0b0d14",borderBottom:"1px solid #1e293b",display:"flex",alignItems:"center",padding:"0 10px",flexShrink:0}}>
            {[["board","Targets"],["cats","Categories"],["teams","Other Teams"],["log","Pick Log"]].map(([v,l])=>(
              <button key={v} className="tabn" onClick={()=>setTab(v)}
                style={{color:tab===v?"#f59e0b":"#334155",borderBottom:tab===v?"2px solid #f59e0b":"2px solid transparent"}}>
                {l}
              </button>
            ))}
            {tab==="board"&&(
              <div style={{marginLeft:"auto",display:"flex",gap:3,alignItems:"center"}}>
                <span style={{fontSize:8,color:"#334155",marginRight:4}}>sorted by DNS</span>
                {[["all","All"],["H","Hit"],["P","Pitch"]].map(([v,l])=>(
                  <button key={v} className="btn" onClick={()=>setTypeFilter(v)}
                    style={{background:typeFilter===v?"#f59e0b22":"#1e293b",color:typeFilter===v?"#f59e0b":"#475569",border:typeFilter===v?"1px solid #f59e0b44":"1px solid transparent"}}>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TARGET BOARD */}
          {tab==="board"&&(
            <div style={{flex:1,overflowY:"auto",padding:12}}>
              {/* Score legend */}
              <div style={{display:"flex",gap:12,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:9,color:"#334155"}}>DNS = Draft Now Score · </span>
                {[["≥8.0","#f59e0b","Elite"],["≥6.5","#22c55e","Strong"],["≥5.0","#60a5fa","Solid"],["<5.0","#475569","Stash"]].map(([r,c,l])=>(
                  <div key={r} style={{display:"flex",alignItems:"center",gap:4,fontSize:9}}>
                    <div style={{width:7,height:7,borderRadius:2,background:c}}/>
                    <span style={{color:"#475569"}}>{l} {r}</span>
                  </div>
                ))}
              </div>

              {filtered.length===0&&<div style={{textAlign:"center",color:"#1e293b",padding:40}}>All targets gone!</div>}
              {filtered.map((t,idx)=>{
                const isExpanded = showScoreBreakdown === t.name;
                return (
                  <div key={t.name} className="score-row" style={{background:"#0d0f16",border:`1px solid ${TIER_COLOR[t.tier]}22`,borderLeft:`3px solid ${TIER_COLOR[t.tier]}`,borderRadius:4,padding:"7px 10px",marginBottom:4,cursor:"pointer"}}
                    onClick={()=>setShowScoreBreakdown(isExpanded ? null : t.name)}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {/* Rank */}
                      <span style={{fontSize:10,color:"#334155",width:18,textAlign:"right",flexShrink:0}}>#{idx+1}</span>
                      {/* DNS score badge */}
                      <div style={{background:`${scoreColor(t.draftNowScore)}22`,border:`1px solid ${scoreColor(t.draftNowScore)}44`,borderRadius:4,padding:"1px 6px",minWidth:32,textAlign:"center",flexShrink:0}}>
                        <span style={{fontSize:12,fontWeight:700,color:scoreColor(t.draftNowScore)}}>{t.draftNowScore}</span>
                      </div>
                      {/* Name + meta */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                          <span style={{fontSize:13,color:"#f1f5f9",fontWeight:500}}>{t.name}</span>
                          {t.il&&<span style={{fontSize:8,color:"#f87171",background:"#7f1d1d33",padding:"1px 4px",borderRadius:3}}>IL</span>}
                          {t.est&&<span style={{fontSize:8,color:"#475569",background:"#1e293b",padding:"1px 4px",borderRadius:3}}>EST</span>}
                          <span style={{fontSize:9,color:"#334155"}}>{t.eligible.join("/")} · {t.org}</span>
                          <span style={{fontSize:8,padding:"1px 5px",borderRadius:8,background:`${TIER_COLOR[t.tier]}18`,color:TIER_COLOR[t.tier]}}>{TIER_LABEL[t.tier]}</span>
                        </div>
                        <div style={{fontSize:9,color:"#334155",marginTop:1}}>{playerNotes[t.name]||t.note}</div>
                      </div>
                      {/* Urgency + scarcity */}
                      <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
                        {t.urgency >= 50 && (
                          <span style={{fontSize:8,color:"#f87171",background:"#7f1d1d33",padding:"1px 5px",borderRadius:3}}>{t.urgency}% gone</span>
                        )}
                        <span style={{fontSize:8,color:"#334155"}}>VOR {t.scarcity.vor > 0 ? "+":""}{t.scarcity.vor}</span>
                        <span style={{fontSize:9,color:"#1e3a5f"}}>{t.type==="H"?"⚾":"⚡"}</span>
                      </div>
                    </div>

                    {/* Expanded score breakdown */}
                    {isExpanded&&(
                      <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #1e293b",display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                        <div style={{fontSize:10,color:"#475569"}}>
                          <div style={{color:"#64748b",marginBottom:3,fontSize:9,textTransform:"uppercase",letterSpacing:".06em"}}>Score Breakdown</div>
                          <div>Base: <span style={{color:"#94a3b8"}}>{t.baseScore}</span></div>
                          <div>2026 ({t.il?"IL-discounted":"full"}): <span style={{color:"#94a3b8"}}>{t.il ? Math.round(t.score2026*IL_2026_DISCOUNT*10)/10 : t.score2026}</span></div>
                          <div>Dynasty: <span style={{color:"#94a3b8"}}>{t.scoreDyn}</span></div>
                          <div>VOR @ {t.scarcity.scarcePos}: <span style={{color:t.scarcity.vor>0?"#22c55e":"#f87171"}}>{t.scarcity.vor>0?"+":""}{t.scarcity.vor}</span></div>
                          <div>Urgency bonus: <span style={{color:"#94a3b8"}}>+{Math.round(t.urgency/100*1.5*10)/10}</span></div>
                          <div style={{marginTop:4,fontWeight:600,color:scoreColor(t.draftNowScore)}}>DNS: {t.draftNowScore}</div>
                        </div>
                        <div style={{fontSize:10}}>
                          <div style={{color:"#64748b",marginBottom:3,fontSize:9,textTransform:"uppercase",letterSpacing:".06em"}}>Category Fit</div>
                          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                            {t.cats.map(c=>{
                              const orig = BASE_CAT_NEED[c]||0;
                              const curr = catNeed[c]??orig;
                              const decayed = curr < orig;
                              return (
                                <span key={c} style={{fontSize:8,padding:"1px 5px",borderRadius:8,background:`${CAT_NEED_COLOR[curr]||"#1e293b"}18`,color:CAT_NEED_COLOR[curr]||"#334155",border:decayed?"1px solid #f59e0b44":"none"}}>
                                  {c} {decayed?`(${orig}→${curr})`:`(${orig})`}
                                </span>
                              );
                            })}
                          </div>
                          <div style={{marginTop:6,fontSize:9,color:"#334155"}}>
                            Pos depth @ {t.scarcity.scarcePos}: {t.scarcity.depth} left
                          </div>
                          <div style={{marginTop:2,display:"flex",gap:4}}>
                            {editingNote===t.name?(
                              <input value={noteInput} onChange={e=>setNoteInput(e.target.value)}
                                onKeyDown={e=>{if(e.key==="Enter"){setPlayerNotes(p=>({...p,[t.name]:noteInput}));setEditingNote(null);}}}
                                style={{flex:1,fontSize:9}} onClick={e=>e.stopPropagation()}/>
                            ):(
                              <button className="btn" style={{background:"#1e293b",color:"#475569",fontSize:8}} onClick={e=>{e.stopPropagation();setEditingNote(t.name);setNoteInput(playerNotes[t.name]||t.note);}}>
                                edit note
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* CATEGORY TRACKER */}
          {tab==="cats"&&(
            <div style={{flex:1,overflowY:"auto",padding:14}}>
              <div style={{marginBottom:10,fontSize:10,color:"#334155"}}>
                Need weights update live as you draft. <span style={{color:"#f59e0b"}}>Amber = decayed by your picks.</span> Click to manually cycle status.
              </div>
              {[["HITTING",hitCats],["PITCHING",pitchCats]].map(([label,cats])=>(
                <div key={label} style={{marginBottom:18}}>
                  <div style={{fontSize:9,color:"#334155",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>{label}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {cats.map(c=>{
                      const statuses=["missing","thin","ok","strong"];
                      const cur=catStatus[c]||"ok";
                      const origNeed = BASE_CAT_NEED[c] || 0;
                      const currNeed = catNeed[c] ?? origNeed;
                      const decayed = currNeed < origNeed;
                      return (
                        <div key={c} onClick={()=>setCatStatus(prev=>({...prev,[c]:statuses[(statuses.indexOf(cur)+1)%statuses.length]}))}
                          style={{cursor:"pointer",padding:"8px 10px",borderRadius:4,background:`${CAT_STATUS_COLOR[cur]}15`,border:`1px solid ${decayed?"#f59e0b55":CAT_STATUS_COLOR[cur]+"44"}`,textAlign:"center",minWidth:64,position:"relative"}}>
                          {decayed&&<div style={{position:"absolute",top:3,right:4,width:5,height:5,borderRadius:"50%",background:"#f59e0b"}}/>}
                          <div style={{fontSize:12,fontWeight:600,color:CAT_STATUS_COLOR[cur]}}>{c}</div>
                          <div style={{fontSize:7,color:CAT_STATUS_COLOR[cur],opacity:0.7,marginTop:1,textTransform:"uppercase"}}>{cur}</div>
                          {/* Need weight: show original → current if decayed */}
                          <div style={{marginTop:3,display:"flex",justifyContent:"center",alignItems:"center",gap:3}}>
                            {decayed ? (
                              <>
                                <span style={{fontSize:8,color:"#334155",textDecoration:"line-through"}}>{origNeed}</span>
                                <span style={{fontSize:8,color:"#f59e0b"}}>→{currNeed}</span>
                              </>
                            ) : (
                              <span style={{fontSize:8,color:CAT_NEED_COLOR[origNeed]||"#334155"}}>need:{origNeed}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div style={{marginTop:4,padding:"8px 10px",background:"#0d0f16",borderRadius:4,border:"1px solid #1e293b"}}>
                <div style={{fontSize:9,color:"#334155",marginBottom:4,letterSpacing:".08em",textTransform:"uppercase"}}>Decay Log</div>
                {myDrafted.length === 0
                  ? <div style={{fontSize:10,color:"#1e293b"}}>No picks recorded yet.</div>
                  : myDrafted.map((name, i) => {
                    const t = TARGETS.find(x => x.name === name);
                    if (!t) return null;
                    return (
                      <div key={i} style={{fontSize:10,color:"#475569",marginBottom:2,display:"flex",gap:6}}>
                        <span style={{color:"#22c55e"}}>{name}</span>
                        <span style={{color:"#334155"}}>↓</span>
                        {t.cats.map(c => (
                          <span key={c} style={{color:CAT_NEED_COLOR[catNeed[c]]||"#334155",background:"#1e293b",padding:"0 4px",borderRadius:3,fontSize:9}}>{c}</span>
                        ))}
                      </div>
                    );
                  })
                }
              </div>
            </div>
          )}

          {/* OTHER TEAMS */}
          {tab==="teams"&&(
            <div style={{flex:1,overflowY:"auto",padding:12}}>
              <div style={{fontSize:9,color:"#334155",marginBottom:10}}>Keeper rosters R1-10. Use to assess positional pressure and SP scarcity.</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {DRAFT_ORDER.filter(t=>t!==MY_TEAM).map(team=>{
                  const roster = KEEPER_PICKS.filter(p=>p.team===team);
                  const spCount = roster.filter(p=>p.pos==="SP").length;
                  return (
                    <div key={team} style={{background:"#0d0f16",border:"1px solid #1e293b",borderRadius:4,padding:"8px 10px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                        <span style={{fontSize:10,color:"#94a3b8",fontWeight:600}}>{team}</span>
                        {spCount>0&&<span style={{fontSize:8,color:"#60a5fa",background:"#1e3a5f33",padding:"1px 5px",borderRadius:3}}>{spCount} SP</span>}
                      </div>
                      {roster.map((p,i)=>(
                        <div key={i} style={{display:"flex",gap:6,marginBottom:2,fontSize:10}}>
                          <span style={{color:"#334155",width:26,flexShrink:0}}>{p.pos}</span>
                          <span style={{color:"#64748b"}}>{p.player}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PICK LOG */}
          {tab==="log"&&(
            <div style={{flex:1,overflowY:"auto",padding:12}}>
              <div style={{fontSize:9,color:"#334155",marginBottom:8}}>Live picks only (R1-10 keepers not shown).</div>
              {Object.keys(livePicks).length===0&&<div style={{color:"#1e293b",textAlign:"center",padding:40}}>No picks recorded yet.</div>}
              {Object.entries(livePicks).sort((a,b)=>Number(b[0])-Number(a[0])).map(([pick,name])=>{
                const mine = myDrafted.includes(name);
                const t = TARGETS.find(x=>x.name===name);
                const owner = getPickOwner(Number(pick));
                return (
                  <div key={pick} style={{padding:"5px 8px",marginBottom:3,background:"#0d0f16",borderRadius:3,display:"flex",gap:8,fontSize:11,borderLeft:`2px solid ${mine?"#f59e0b":"#1e293b"}`}}>
                    <span style={{color:"#1e3a5f",width:52,flexShrink:0}}>R{getRound(Number(pick))} #{pick}</span>
                    <span style={{color:mine?"#f59e0b":"#94a3b8",flex:1}}>{name}</span>
                    {t&&<span style={{fontSize:8,color:TIER_COLOR[t.tier]}}>{TIER_LABEL[t.tier]}</span>}
                    <span style={{fontSize:8,color:mine?"#f59e0b":"#334155"}}>{mine?"MINE":owner}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: CHAT */}
        <div style={{width:295,background:"#09090e",borderLeft:"1px solid #1e293b",display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{padding:"9px 12px",borderBottom:"1px solid #1e293b",fontSize:9,color:"#334155",letterSpacing:".1em",textTransform:"uppercase"}}>
            AI Advisor · DNS-aware
          </div>
          <div style={{flex:1,overflowY:"auto",padding:8,display:"flex",flexDirection:"column",gap:7}}>
            {messages.map((m,i)=>(
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"92%",padding:"6px 9px",borderRadius:5,fontSize:11,lineHeight:1.6,background:m.role==="user"?"#1e293b":"#0c1525",border:`1px solid ${m.role==="user"?"#334155":"#1e3a5f"}`,color:m.role==="user"?"#cbd5e1":"#93c5fd",whiteSpace:"pre-wrap"}}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading&&<div style={{padding:"6px 9px",borderRadius:5,background:"#0c1525",border:"1px solid #1e3a5f",color:"#334155",fontSize:11}}>thinking...</div>}
            <div ref={endRef}/>
          </div>
          <div style={{padding:"8px",borderTop:"1px solid #1e293b"}}>
            <div style={{display:"flex",gap:4,marginBottom:5}}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}}
                placeholder="Ask anything..." style={{flex:1,fontSize:11}} disabled={loading}/>
              <button className="btn" style={{background:"#f59e0b22",color:"#f59e0b",border:"1px solid #f59e0b33"}} onClick={sendMsg} disabled={loading}>→</button>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
              {["Top pick now?","Best SP left?","Best hitter left?","Explain top score","Am I too SP heavy?"].map(q=>(
                <button key={q} className="btn" style={{background:"#1e293b",color:"#475569",fontSize:9,padding:"3px 7px"}} onClick={()=>setChatInput(q)}>{q}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

