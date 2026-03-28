import React, { useState, useEffect, useMemo, useRef } from 'react'

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 640)
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return mobile
}

// ─── Styles ────────────────────────────────────────────────────────────────

const S = {
  app: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: '1px solid #1e293b',
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: '#84cc16',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    margin: 0,
    color: '#475569',
    fontSize: 12,
  },
  tabs: {
    display: 'flex',
    gap: 4,
    marginBottom: 20,
    borderBottom: '1px solid #1e293b',
    paddingBottom: 0,
  },
  tab: (active) => ({
    padding: '8px 18px',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #84cc16' : '2px solid transparent',
    color: active ? '#84cc16' : '#94a3b8',
    cursor: 'pointer',
    fontWeight: active ? 700 : 400,
    marginBottom: -1,
    transition: 'color 0.15s',
  }),
  input: {
    background: '#0d0f16',
    border: '1px solid #1e293b',
    borderRadius: 6,
    color: '#f1f5f9',
    padding: '8px 12px',
    outline: 'none',
    width: '100%',
  },
  select: {
    background: '#0d0f16',
    border: '1px solid #1e293b',
    borderRadius: 6,
    color: '#f1f5f9',
    padding: '8px 12px',
    outline: 'none',
    cursor: 'pointer',
  },
  card: {
    background: '#0d0f16',
    border: '1px solid #1e293b',
    borderRadius: 8,
    padding: '12px 16px',
    marginBottom: 8,
  },
  playerRow: (selected) => ({
    background: selected ? '#111827' : '#0d0f16',
    border: `1px solid ${selected ? '#84cc16' : '#1e293b'}`,
    borderRadius: 8,
    padding: '10px 14px',
    marginBottom: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    transition: 'border-color 0.15s',
  }),
  playerName: {
    fontWeight: 700,
    color: '#f1f5f9',
  },
  meta: {
    color: '#475569',
    fontSize: 12,
  },
  secondary: {
    color: '#94a3b8',
    fontSize: 12,
  },
  muted: {
    color: '#475569',
    fontSize: 12,
  },
  badge: (type) => {
    const colors = {
      TRADE: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
      ADD:   { bg: 'rgba(34,197,94,0.15)',  color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
      DROP:  { bg: 'rgba(248,113,113,0.15)', color: '#f87171', border: 'rgba(248,113,113,0.3)' },
      KEPT:  { bg: 'rgba(132,204,22,0.12)',  color: '#84cc16', border: 'rgba(132,204,22,0.25)' },
      DRAFT: { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
    }
    const c = colors[type] || colors.DRAFT
    return {
      display: 'inline-block',
      padding: '1px 7px',
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.05em',
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
    }
  },
  accentText: {
    color: '#84cc16',
    fontWeight: 700,
  },
  loadingWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    color: '#475569',
    flexDirection: 'column',
    gap: 12,
  },
  filterRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  panelWrap: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: 16,
    alignItems: 'start',
  },
  listScroll: {
    maxHeight: 'calc(100vh - 220px)',
    overflowY: 'auto',
    paddingRight: 4,
  },
  sectionLabel: {
    color: '#475569',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
  },
  timelineRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    padding: '8px 0',
    borderBottom: '1px solid #1a2133',
  },
  yearLabel: {
    width: 36,
    color: '#475569',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
    paddingTop: 2,
  },
  teamCard: {
    background: '#0d0f16',
    border: '1px solid #1e293b',
    borderRadius: 8,
    padding: '12px 14px',
    minWidth: 180,
  },
  teamGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 12,
  },
  txRow: {
    background: '#0d0f16',
    border: '1px solid #1e293b',
    borderRadius: 8,
    padding: '10px 14px',
    marginBottom: 6,
  },
  txDate: {
    color: '#475569',
    fontSize: 11,
    marginBottom: 4,
  },
  txDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  arrow: {
    color: '#475569',
  },
}

// ─── Franchise Aliases ─────────────────────────────────────────────────────

const FRANCHISE_ALIASES = {
  // Bay of Papi
  "Boston Three Party": "Bay of Papi",
  "Boston Four Party": "Bay of Papi",
  "Anxious Vottos": "Bay of Papi",
  "Napoli Headed Hoes": "Bay of Papi",
  "Bay of Puigs": "Bay of Papi",
  // Nighthawks
  "RedHawks": "Nighthawks",
  // JP Licks
  "Pennsylvania Posse": "JP Licks",
  "The Champion Posse": "JP Licks",
  "Newton Figs": "JP Licks",
  "Somerville Union": "JP Licks",
  "Paw Paw Tunnel of JP": "JP Licks",
  "Hoo Doo u love": "StickyBanditz",
  // Poor Pickles
  "Jeter Sucks A-ROD": "Poor Pickles",
  "Jeter Sucks A-Rod": "Poor Pickles",
  "Pickle Riiiiiiick": "Poor Pickles",
  // Toms River
  "Headshavers": "Toms River",
  "Dead Horses": "Toms River",
  "Tom's Wondrous Team": "Toms River",
  "PC Principal": "Toms River",
  // StickyBanditz
  "Badnews Bears": "StickyBanditz",
  "PaigeVanZant#1Fan": "StickyBanditz",
  "Space Jam": "StickyBanditz",
  "T-Baggers": "StickyBanditz",
  "Sticky Bandits": "StickyBanditz",
  // Hideo Lobo
  "Fieldgoal Kickers": "Hideo Lobo",
  "Alcantara's Assasins": "Hideo Lobo",
  "Blood and Semien": "Hideo Lobo",
  "-71.14° to Freedom": "Hideo Lobo",
  "Close Shave Barbasol": "Hideo Lobo",
  "The Lusty Lobos": "Hideo Lobo",
  // gamma's Team
  "Rice & Beans": "gamma's Team",
  "Miggy's Niggys": "gamma's Team",
  // SouthOssetian franchises
  "ALP": "Dangerous Nights Crew",
  "🎯 David Tabor's Aim": "🍆I'm Beaned Up Right Now🍆",
  "💸 Ohtani's Best Bet": "🐶 Decoy Fan Club",
  "🌟 Edward's TeamToBeNamedLater": "🏝️ Let\u2019s Get Tropical 🏝️",
  "Hot Dog Heaven": "Magnum Kwandoms",
}

function normTeam(name) {
  return name ? (FRANCHISE_ALIASES[name] || name) : name
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return null
  const d = new Date(parseInt(ts, 10) * 1000)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isOffseasonAdd(entry) {
  if (entry.how !== 'add' || !entry.timestamp) return false
  const seasonStart = new Date(`${entry.season}-04-01`).getTime() / 1000
  return Number(entry.timestamp) < seasonStart
}

function howLabel(entry) {
  if (entry.how === 'drafted') {
    return `Drafted R${entry.round}P${entry.pick}`
  }
  if (entry.how === 'trade') {
    return `Traded from ${normTeam(entry.from_team) || '?'}`
  }
  if (entry.how === 'add') {
    if (isOffseasonAdd(entry)) return `Off-season trade from ${normTeam(entry.from_team) || 'FA'}`
    return 'Added (waivers/FA)'
  }
  if (entry.how === 'drop') {
    return 'Dropped'
  }
  return entry.how
}

// Build per-player, per-league season summaries
// Each season: { season, entries, startTeam, endTeam, events }
function buildPlayerSeasons(leagueEntries, playerName, leagueName, keepers) {
  // Group by season
  const bySeason = {}
  for (const entry of leagueEntries) {
    if (!bySeason[entry.season]) bySeason[entry.season] = []
    bySeason[entry.season].push(entry)
  }
  const seasons = Object.keys(bySeason).map(Number).sort()
  const result = []
  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i]
    const entries = bySeason[season]
    const prevSeason = i > 0 ? result[i - 1] : null
    const firstEntry = entries[0]
    const lastTeam = entries[entries.length - 1].team
    const team = normTeam(firstEntry.team)

    // Use keepers.json as authoritative source; fall back to heuristic
    const keeperList = keepers?.[leagueName]?.[season]?.[team] || []
    let kept = false
    if (playerName && keeperList.includes(playerName)) {
      kept = true
    } else if (
      firstEntry.how === 'drafted' &&
      prevSeason &&
      prevSeason.endTeam === team
    ) {
      kept = true
    }

    result.push({
      season,
      entries,
      startTeam: team,
      endTeam: normTeam(lastTeam),
      kept,
    })
  }
  return result
}

// Compute team roster for a given season in a league
function computeTeamRosters(leagueData, season) {
  // rosters: { teamName: Set<playerName> }
  const rosters = {}

  for (const [playerName, leagues] of Object.entries(leagueData)) {
    const entries = leagues[Object.keys(leagues)[0]] // shouldn't be called this way
    // This function is called per-league from outside
    void playerName; void entries
  }
  return rosters
}

// Actually compute rosters for a specific league
function computeRostersForLeague(allData, leagueName, season) {
  const rosters = {}
  for (const [playerName, leagues] of Object.entries(allData)) {
    if (!leagues[leagueName]) continue
    const entries = leagues[leagueName].filter(e => e.season === season)
    if (entries.length === 0) continue

    for (const entry of entries) {
      if (entry.how === 'drop') {
        // Remove from any team
        for (const t of Object.keys(rosters)) {
          rosters[t]?.delete(playerName)
        }
      } else {
        const team = normTeam(entry.team)
        if (!rosters[team]) rosters[team] = new Set()
        // If traded, remove from previous team
        if (entry.how === 'trade' && entry.from_team) {
          rosters[normTeam(entry.from_team)]?.delete(playerName)
        }
        rosters[team].add(playerName)
      }
    }
  }
  return rosters
}

// Flatten all transactions for the Transactions tab
function buildTransactions(allData) {
  const txMap = {} // timestamp -> { ts, players: [{name, entry, league}] }
  const noTsList = [] // entries without timestamp

  for (const [playerName, leagues] of Object.entries(allData)) {
    for (const [leagueName, entries] of Object.entries(leagues)) {
      for (const entry of entries) {
        if (entry.how === 'drafted') continue // skip drafts from tx tab
        if (!entry.timestamp) {
          noTsList.push({ playerName, leagueName, entry })
          continue
        }
        const key = `${entry.timestamp}_${leagueName}`
        if (!txMap[key]) txMap[key] = { ts: entry.timestamp, league: leagueName, items: [] }
        txMap[key].items.push({ playerName, entry })
      }
    }
  }

  const grouped = Object.values(txMap).sort((a, b) => parseInt(b.ts) - parseInt(a.ts))
  return grouped
}

// All unique team names in a league across all seasons
function getTeamsInLeague(allData, leagueName) {
  const teams = new Set()
  for (const leagues of Object.values(allData)) {
    if (!leagues[leagueName]) continue
    for (const entry of leagues[leagueName]) {
      if (entry.team) teams.add(normTeam(entry.team))
      if (entry.from_team) teams.add(normTeam(entry.from_team))
    }
  }
  return Array.from(teams).sort()
}

// Build name-change runs per franchise for the lineage view
function buildFranchiseLineage(allData, leagueName) {
  const seasonTeams = {}
  for (const leagues of Object.values(allData)) {
    if (!leagues[leagueName]) continue
    for (const entry of leagues[leagueName]) {
      const s = entry.season
      if (!seasonTeams[s]) seasonTeams[s] = new Set()
      if (entry.team) seasonTeams[s].add(entry.team)
      if (entry.from_team) seasonTeams[s].add(entry.from_team)
    }
  }
  const seasons = Object.keys(seasonTeams).map(Number).sort()

  // canonical -> { season: rawName }
  const rawByFranchise = {}
  for (const season of seasons) {
    for (const rawName of seasonTeams[season]) {
      const canonical = normTeam(rawName)
      if (!rawByFranchise[canonical]) rawByFranchise[canonical] = {}
      rawByFranchise[canonical][season] = rawName
    }
  }

  // Convert to consecutive runs: [{ name, from, to }]
  const franchises = {}
  for (const [canonical, seasonMap] of Object.entries(rawByFranchise)) {
    const active = Object.keys(seasonMap).map(Number).sort()
    const runs = []
    let curName = null, runStart = null
    for (const s of active) {
      const name = seasonMap[s]
      if (name !== curName) {
        if (curName !== null) runs.push({ name: curName, from: runStart, to: s - 1 })
        curName = name
        runStart = s
      }
    }
    if (curName !== null) runs.push({ name: curName, from: runStart, to: active[active.length - 1] })
    franchises[canonical] = { runs, firstSeason: active[0] }
  }

  return { seasons, franchises }
}

// Season-by-season activity for a franchise
function buildFranchiseData(allData, leagueName, teamName) {
  const seasons = {}
  for (const [playerName, leagues] of Object.entries(allData)) {
    if (!leagues[leagueName]) continue
    for (const entry of leagues[leagueName]) {
      const s = entry.season
      const team = normTeam(entry.team)
      const fromTeam = normTeam(entry.from_team)
      if (!seasons[s]) seasons[s] = { drafted: [], added: [], tradedIn: [], tradedOut: [], dropped: [] }
      if (team === teamName) {
        if (entry.how === 'drafted') seasons[s].drafted.push(playerName)
        else if (entry.how === 'add') seasons[s].added.push(playerName)
        else if (entry.how === 'trade') seasons[s].tradedIn.push({ player: playerName, from: fromTeam })
        else if (entry.how === 'drop') seasons[s].dropped.push(playerName)
      }
      if (fromTeam === teamName && entry.how === 'trade') {
        seasons[s].tradedOut.push({ player: playerName, to: team })
      }
    }
  }
  return Object.entries(seasons)
    .sort(([a], [b]) => b - a)
    .map(([season, d]) => ({ season: parseInt(season), ...d }))
}

// ─── computeDraftGrades ─────────────────────────────────────────────────────

function computeDraftGrades(data, keepers, leagueName) {
  // Collect all drafted entries per franchise+season
  // structure: { `${franchise}_${season}`: { franchise, season, picks: [{player, round, pick}] } }
  const buckets = {}

  for (const [playerName, leagues] of Object.entries(data)) {
    const entries = leagues[leagueName]
    if (!entries) continue
    for (const e of entries) {
      if (e.how !== 'drafted') continue
      const franchise = normTeam(e.team)
      const season = e.season
      const key = `${franchise}_${season}`
      if (!buckets[key]) buckets[key] = { franchise, season, picks: [] }
      buckets[key].picks.push({ player: playerName, round: e.round, pick: e.pick })
    }
  }

  const grades = []

  for (const { franchise, season, picks } of Object.values(buckets)) {
    // Skip 2026 (can't evaluate future keepers)
    if (season >= 2026) continue

    // Determine which picks are keepers (in current season's keeper list)
    const keeperListThisSeason = keepers?.[leagueName]?.[String(season)]?.[franchise] || []
    const keeperSetThisSeason = new Set(keeperListThisSeason)

    // True draft picks = drafted but NOT in keeper list for this season
    const trueDraftPicks = picks.filter(p => !keeperSetThisSeason.has(p.player))

    if (trueDraftPicks.length < 5) continue

    // Check which were kept next year (for binary keepRate + steals/misses)
    const keeperSetNextSeason = new Set(keepers?.[leagueName]?.[String(season + 1)]?.[franchise] || [])
    const keptPlayers = trueDraftPicks.filter(p => keeperSetNextSeason.has(p.player))
    const keptCount = keptPlayers.length
    const totalPicks = trueDraftPicks.length
    const keepRate = keptCount / totalPicks

    // Keeper constraint: how many slots were actually available for new draft picks?
    // retainedOldKeepers = keepers from this season who were also kept next season
    const retainedOldKeepers = [...keeperSetThisSeason].filter(p => keeperSetNextSeason.has(p)).length
    const availableSlots = Math.max(0, keeperSetNextSeason.size - retainedOldKeepers)
    // Constrained = fewer than 3 open slots (shrinking keeper pool crowded out new picks)
    const constrained = availableSlots < 3

    // Quality: for each true pick, count how many subsequent seasons it stayed as a keeper
    // (up to 4 years out, for same franchise only)
    let totalQualityPoints = 0
    for (const pick of trueDraftPicks) {
      let keeperYears = 0
      for (let yr = season + 1; yr <= season + 4; yr++) {
        const nextSet = new Set(keepers?.[leagueName]?.[String(yr)]?.[franchise] || [])
        if (nextSet.has(pick.player)) keeperYears++
      }
      totalQualityPoints += Math.min(keeperYears, 4)
    }
    const avgQuality = totalQualityPoints / totalPicks // 0–4 scale

    // Composite: breadth (keepRate) + depth (avgQuality normalized to 0–1 where 3 avg yrs = 1.0)
    // availableSlots/constrained only affects filtering in Worst Drafts, not grading
    const compositeScore = keepRate * 0.5 + Math.min(avgQuality / 3, 1) * 0.5

    // Steals: round >= 10, kept next year
    const steals = keptPlayers.filter(p => p.round >= 10)
    // Misses: round <= 5, NOT kept next year
    const misses = trueDraftPicks.filter(p => p.round <= 5 && !keeperSetNextSeason.has(p.player))

    // Grade on composite score
    let grade
    if (compositeScore >= 0.35) grade = 'A+'
    else if (compositeScore >= 0.27) grade = 'A'
    else if (compositeScore >= 0.19) grade = 'B'
    else if (compositeScore >= 0.12) grade = 'C'
    else if (compositeScore >= 0.06) grade = 'D'
    else grade = 'F'

    grades.push({
      franchise, season, league: leagueName,
      totalPicks, keptCount, keepRate,
      availableSlots, constrained,
      avgQuality, compositeScore,
      steals, misses, grade,
      keptPlayers,
    })
  }

  return grades
}

function gradeColor(grade) {
  if (grade === 'A+' || grade === 'A') return '#84cc16'
  if (grade === 'B') return '#60a5fa'
  if (grade === 'C') return '#f59e0b'
  return '#f87171'
}

// ─── Components ────────────────────────────────────────────────────────────

function Loading() {
  return (
    <div style={S.loadingWrap}>
      <div style={{ fontSize: 24 }}>⏳</div>
      <div>Loading ownership history...</div>
    </div>
  )
}

function Badge({ type }) {
  return <span style={S.badge(type)}>{type}</span>
}

// ─── Players Tab ───────────────────────────────────────────────────────────

function PlayerTimeline({ playerName, leagues, keepers }) {
  return (
    <div style={S.card}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14, color: '#f1f5f9' }}>
        {playerName}
      </div>
      {Object.entries(leagues).map(([leagueName, entries]) => {
        const seasons = buildPlayerSeasons(entries, playerName, leagueName, keepers)
        return (
          <div key={leagueName} style={{ marginBottom: 20 }}>
            <div style={{ ...S.sectionLabel, marginTop: 0 }}>{leagueName}</div>
            {seasons.map(({ season, entries: sEntries, startTeam, endTeam, kept }) => {
              // Build display rows for this season
              const rows = []

              if (kept) {
                // Show "Kept by team" as first event
                rows.push(
                  <div key="kept" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <Badge type="KEPT" />
                    <span style={{ color: '#84cc16', fontWeight: 700 }}>{startTeam}</span>
                  </div>
                )
                // Show rest of events (trades, adds, drops within season)
                for (const entry of sEntries.slice(1)) {
                  rows.push(
                    <div key={entry.timestamp || entry.how} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <Badge type={entry.how === 'trade' || isOffseasonAdd(entry) ? 'TRADE' : entry.how === 'add' ? 'ADD' : 'DROP'} />
                      <span style={S.secondary}>{howLabel(entry)}</span>
                      {entry.timestamp && <span style={S.muted}>{formatDate(entry.timestamp)}</span>}
                    </div>
                  )
                }
              } else {
                for (const entry of sEntries) {
                  let badgeType = 'DRAFT'
                  if (entry.how === 'trade' || isOffseasonAdd(entry)) badgeType = 'TRADE'
                  else if (entry.how === 'add') badgeType = 'ADD'
                  else if (entry.how === 'drop') badgeType = 'DROP'

                  rows.push(
                    <div key={entry.timestamp || `${entry.how}-${entry.round}`} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                      <Badge type={badgeType} />
                      {entry.how !== 'drop' && (
                        <span style={{ fontWeight: entry.how === 'drafted' ? 600 : 400, color: '#f1f5f9' }}>
                          {normTeam(entry.team)}
                        </span>
                      )}
                      {entry.how === 'drop' && (
                        <span style={{ color: '#f87171' }}>Dropped by {normTeam(entry.team)}</span>
                      )}
                      <span style={S.secondary}>{howLabel(entry)}</span>
                      {entry.timestamp && <span style={S.muted}>{formatDate(entry.timestamp)}</span>}
                    </div>
                  )
                }
              }

              // If traded mid-season (multiple teams), show the team flow
              const teams = [...new Set(sEntries.filter(e => e.how !== 'drop').map(e => normTeam(e.team)))]
              const showFlow = teams.length > 1

              return (
                <div key={season} style={S.timelineRow}>
                  <div style={S.yearLabel}>{season}</div>
                  <div style={{ flex: 1 }}>
                    {showFlow && (
                      <div style={{ marginBottom: 6, color: '#94a3b8', fontSize: 12 }}>
                        {teams.map((t, i) => (
                          <span key={t}>
                            {i > 0 && <span style={{ color: '#475569', margin: '0 6px' }}>→</span>}
                            <span style={{ fontWeight: i === teams.length - 1 ? 700 : 400, color: i === teams.length - 1 ? '#f1f5f9' : '#94a3b8' }}>{t}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {rows}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function PlayersTab({ data, isMobile, keepers }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const allPlayers = useMemo(() => {
    return Object.keys(data).sort((a, b) => a.localeCompare(b))
  }, [data])

  const filtered = useMemo(() => {
    const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const q = normalize(search.trim())
    if (!q) return allPlayers
    return allPlayers.filter(p => normalize(p).includes(q))
  }, [allPlayers, search])

  // Get current team for a player (most recent season, last entry)
  function getCurrentInfo(playerName) {
    const leagues = data[playerName]
    let latestSeason = -1
    let currentTeam = null
    let leagueNames = Object.keys(leagues)

    for (const [league, entries] of Object.entries(leagues)) {
      const maxSeason = Math.max(...entries.map(e => e.season))
      if (maxSeason > latestSeason) {
        latestSeason = maxSeason
        const seasonEntries = entries.filter(e => e.season === maxSeason)
        const last = seasonEntries[seasonEntries.length - 1]
        currentTeam = last.how === 'drop' ? null : normTeam(last.team)
      }
    }

    return { leagueNames, currentTeam, latestSeason }
  }

  // Mobile: drill-down — show list or detail, not both
  if (isMobile && selected) {
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          style={{ background: 'none', border: 'none', color: '#84cc16', cursor: 'pointer', padding: '0 0 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ← Back
        </button>
        <PlayerTimeline playerName={selected} leagues={data[selected]} keepers={keepers} />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <input
          style={S.input}
          placeholder="Search players..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus={!isMobile}
        />
      </div>
      <div style={isMobile ? {} : S.panelWrap}>
        {/* Player list */}
        <div style={isMobile ? {} : S.listScroll}>
          <div style={S.muted}>{filtered.length} player{filtered.length !== 1 ? 's' : ''}</div>
          <div style={{ marginTop: 8 }}>
            {filtered.map(name => {
              const { leagueNames, currentTeam, latestSeason } = getCurrentInfo(name)
              return (
                <div
                  key={name}
                  style={S.playerRow(selected === name)}
                  onClick={() => setSelected(selected === name ? null : name)}
                >
                  <div>
                    <div style={S.playerName}>{name}</div>
                    <div style={S.meta}>
                      {leagueNames.join(' · ')} &middot; {latestSeason}
                    </div>
                  </div>
                  {currentTeam && (
                    <div style={{ color: '#84cc16', fontSize: 11, fontWeight: 600, textAlign: 'right', maxWidth: 100, lineHeight: 1.3 }}>
                      {currentTeam}
                    </div>
                  )}
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ color: '#475569', marginTop: 20, textAlign: 'center' }}>No players found</div>
            )}
          </div>
        </div>

        {/* Detail panel — desktop only (mobile uses drill-down above) */}
        {!isMobile && (
          <div>
            {selected ? (
              <PlayerTimeline playerName={selected} leagues={data[selected]} keepers={keepers} />
            ) : (
              <div style={{ color: '#475569', marginTop: 40, textAlign: 'center' }}>
                Select a player to view their history
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Transactions Tab ──────────────────────────────────────────────────────

function TransactionsTab({ data, activeLeague }) {
  const seasons = useMemo(() => {
    const s = new Set()
    for (const leagues of Object.values(data)) {
      for (const entries of Object.values(leagues)) {
        for (const e of entries) s.add(e.season)
      }
    }
    return ['All', ...Array.from(s).sort((a, b) => b - a)]
  }, [data])

  const [seasonFilter, setSeasonFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')

  const transactions = useMemo(() => buildTransactions(data), [data])

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (activeLeague !== 'All' && tx.league !== activeLeague) return false
      if (seasonFilter !== 'All') {
        const s = parseInt(seasonFilter)
        if (!tx.items.some(item => item.entry.season === s)) return false
      }
      if (typeFilter !== 'All') {
        const type = typeFilter.toLowerCase()
        if (!tx.items.some(item => item.entry.how === type)) return false
      }
      return true
    })
  }, [transactions, activeLeague, seasonFilter, typeFilter])

  // Group items within a tx by type
  function renderTx(tx) {
    const trades = tx.items.filter(i => i.entry.how === 'trade')
    const adds = tx.items.filter(i => i.entry.how === 'add')
    const drops = tx.items.filter(i => i.entry.how === 'drop')

    const date = tx.ts ? formatDate(tx.ts) : null

    return (
      <div key={`${tx.ts}_${tx.league}`} style={S.txRow}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
          <div style={S.txDate}>
            {date || 'Unknown date'} &middot; <span style={{ color: '#84cc16' }}>{tx.league}</span>
          </div>
        </div>

        {trades.length > 0 && (
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {trades.map((item, idx) => (
                <div key={idx} style={S.txDetail}>
                  <Badge type="TRADE" />
                  <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.playerName}</span>
                  <span style={S.arrow}>{normTeam(item.entry.from_team) || '?'}</span>
                  <span style={S.arrow}>→</span>
                  <span style={{ color: '#84cc16' }}>{normTeam(item.entry.team)}</span>
                  {item.entry.season && <span style={S.muted}>({item.entry.season})</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {adds.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            {adds.map((item, idx) => (
              <div key={idx} style={{ ...S.txDetail, marginBottom: 3 }}>
                <Badge type="ADD" />
                <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.playerName}</span>
                <span style={S.arrow}>→</span>
                <span style={{ color: '#22c55e' }}>{item.entry.team}</span>
                {item.entry.season && <span style={S.muted}>({item.entry.season})</span>}
              </div>
            ))}
          </div>
        )}

        {drops.length > 0 && (
          <div>
            {drops.map((item, idx) => (
              <div key={idx} style={{ ...S.txDetail, marginBottom: 3 }}>
                <Badge type="DROP" />
                <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.playerName}</span>
                <span style={S.arrow}>dropped by</span>
                <span style={{ color: '#f87171' }}>{item.entry.team}</span>
                {item.entry.season && <span style={S.muted}>({item.entry.season})</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={S.filterRow}>
        <select style={S.select} value={seasonFilter} onChange={e => setSeasonFilter(e.target.value)}>
          {seasons.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select style={S.select} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {['All', 'TRADE', 'ADD', 'DROP'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span style={S.muted}>{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={{ maxHeight: 'calc(100vh - 230px)', overflowY: 'auto', paddingRight: 4 }}>
        {filtered.length === 0 && (
          <div style={{ color: '#475569', marginTop: 40, textAlign: 'center' }}>No transactions match filters</div>
        )}
        {filtered.map(tx => renderTx(tx))}
      </div>
    </div>
  )
}

// ─── Lineage Tab ───────────────────────────────────────────────────────────

function LineageTab({ data, activeLeague }) {
  const leagues = useMemo(() => {
    const s = new Set()
    for (const leagues of Object.values(data)) for (const l of Object.keys(leagues)) s.add(l)
    return Array.from(s).sort()
  }, [data])

  const [selectedLeagueLocal, setSelectedLeagueLocal] = useState(leagues[0] || '')
  const selectedLeague = activeLeague !== 'All' ? activeLeague : selectedLeagueLocal
  const [tooltip, setTooltip] = useState(null) // { text, x, y }
  const containerRef = useRef(null)
  const [colWidth, setColWidth] = useState(44)

  const { seasons, franchises } = useMemo(
    () => buildFranchiseLineage(data, selectedLeague),
    [data, selectedLeague]
  )

  useEffect(() => {
    const LABEL_WIDTH = 140
    const update = () => {
      if (!containerRef.current) return
      const available = containerRef.current.offsetWidth - LABEL_WIDTH
      setColWidth(Math.max(44, Math.floor(available / seasons.length)))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [seasons.length])

  // Sort franchises: still-active ones first (by current name), then departed
  const sortedFranchises = useMemo(() => {
    const lastSeason = seasons[seasons.length - 1]
    return Object.entries(franchises).sort(([a, aData], [b, bData]) => {
      const aActive = aData.runs[aData.runs.length - 1].to === lastSeason
      const bActive = bData.runs[bData.runs.length - 1].to === lastSeason
      if (aActive !== bActive) return aActive ? -1 : 1
      return a.localeCompare(b)
    })
  }, [franchises, seasons])

  const totalSpan = seasons.length > 0 ? seasons[seasons.length - 1] - seasons[0] + 1 : 1

  return (
    <div>
      {activeLeague === 'All' && (
        <div style={{ ...S.filterRow, marginBottom: 16 }}>
          <select style={S.select} value={selectedLeagueLocal} onChange={e => setSelectedLeagueLocal(e.target.value)}>
            {leagues.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      )}

      <div ref={containerRef} style={{ paddingBottom: 8 }}>
        {/* Year header */}
        <div style={{ display: 'flex', marginBottom: 6, paddingLeft: 140 }}>
          {seasons.map(s => (
            <div key={s} style={{ width: colWidth, flexShrink: 0, fontSize: 10, color: '#475569', textAlign: 'center', fontWeight: 700 }}>
              {s}
            </div>
          ))}
        </div>

        {sortedFranchises.map(([canonical, { runs, firstSeason }]) => {
          const lastRun = runs[runs.length - 1]
          const isActive = lastRun.to === seasons[seasons.length - 1]
          return (
            <div key={canonical} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              {/* Franchise label */}
              <div style={{
                width: 136, flexShrink: 0, fontSize: 11, fontWeight: 700,
                color: isActive ? '#84cc16' : '#475569',
                textAlign: 'right', paddingRight: 8, lineHeight: 1.2,
              }}>
                {canonical}
              </div>

              {/* Timeline bar */}
              <div style={{ display: 'flex', position: 'relative' }}>
                {/* Gap before franchise started */}
                {firstSeason > seasons[0] && (
                  <div style={{ width: (firstSeason - seasons[0]) * colWidth }} />
                )}
                {runs.map((run, i) => {
                  const spanYears = run.to - run.from + 1
                  const isCurrentName = run.name === canonical
                  return (
                    <div
                      key={i}
                      onMouseEnter={e => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setTooltip({ text: `${run.name}  ${run.from}${run.from !== run.to ? `–${run.to}` : ''}`, x: rect.left + rect.width / 2, y: rect.top - 8 })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        width: spanYears * colWidth - 2,
                        marginRight: 2,
                        height: 28,
                        borderRadius: 4,
                        background: isCurrentName
                          ? (isActive ? 'rgba(132,204,22,0.2)' : 'rgba(132,204,22,0.08)')
                          : 'rgba(148,163,184,0.1)',
                        border: `1px solid ${isCurrentName
                          ? (isActive ? 'rgba(132,204,22,0.4)' : 'rgba(132,204,22,0.2)')
                          : '#1e293b'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        cursor: 'default',
                      }}
                    >
                      <span style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: isCurrentName ? (isActive ? '#84cc16' : '#64748b') : '#475569',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        padding: '0 4px',
                        maxWidth: spanYears * colWidth - 8,
                        pointerEvents: 'none',
                      }}>
                        {run.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#475569' }}>
          <div style={{ width: 16, height: 10, borderRadius: 2, background: 'rgba(132,204,22,0.2)', border: '1px solid rgba(132,204,22,0.4)' }} />
          Current name
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#475569' }}>
          <div style={{ width: 16, height: 10, borderRadius: 2, background: 'rgba(148,163,184,0.1)', border: '1px solid #1e293b' }} />
          Previous name
        </div>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translate(-50%, -100%)',
          background: '#1e293b',
          color: '#f1f5f9',
          fontSize: 12,
          fontWeight: 600,
          padding: '5px 10px',
          borderRadius: 6,
          border: '1px solid #334155',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 1000,
        }}>
          {tooltip.text}
        </div>
      )}
    </div>
  )
}

// ─── Trades Tab ────────────────────────────────────────────────────────────

function TradesTab({ data, activeLeague }) {
  const allTrades = useMemo(() => {
    return buildTransactions(data)
      .map(tx => ({ ...tx, tradeItems: tx.items.filter(i => i.entry.how === 'trade') }))
      .filter(tx => tx.tradeItems.length > 0)
  }, [data])

  const seasons = useMemo(() => {
    const s = new Set()
    for (const tx of allTrades) for (const i of tx.tradeItems) s.add(i.entry.season)
    return ['All', ...Array.from(s).sort((a, b) => b - a)]
  }, [allTrades])

  const [seasonFilter, setSeasonFilter] = useState('All')

  const filtered = useMemo(() => {
    if (seasonFilter === 'All') return allTrades
    const s = parseInt(seasonFilter)
    return allTrades.filter(tx => tx.tradeItems.some(i => i.entry.season === s))
  }, [allTrades, seasonFilter])

  function renderTrade(tx) {
    // Group players by receiving team
    const received = {}
    for (const { playerName, entry } of tx.tradeItems) {
      const team = normTeam(entry.team)
      if (!received[team]) received[team] = []
      received[team].push({ player: playerName, from: normTeam(entry.from_team) })
    }
    const teams = Object.keys(received)
    const season = tx.tradeItems[0]?.entry.season

    return (
      <div key={`${tx.ts}_${tx.league}`} style={S.txRow}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 4 }}>
          <span style={S.txDate}>{tx.ts ? formatDate(tx.ts) : 'Unknown date'} · <span style={{ color: '#84cc16' }}>{tx.league}</span></span>
          {season && <span style={S.muted}>{season}</span>}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {teams.map((team, idx) => (
            <div key={team} style={{ flex: 1, minWidth: 140 }}>
              <div style={{ color: '#84cc16', fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{team} received</div>
              {received[team].map(({ player, from }) => (
                <div key={player} style={{ fontSize: 13, color: '#f1f5f9', padding: '3px 0', borderBottom: '1px solid #1a2133' }}>
                  {player}
                  {from && <div style={{ color: '#475569', fontSize: 11 }}>from {from}</div>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={S.filterRow}>
        <select style={S.select} value={seasonFilter} onChange={e => setSeasonFilter(e.target.value)}>
          {seasons.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={S.muted}>{filtered.length} trade{filtered.length !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ maxHeight: 'calc(100vh - 230px)', overflowY: 'auto', paddingRight: 4 }}>
        {filtered.length === 0 && <div style={{ color: '#475569', marginTop: 40, textAlign: 'center' }}>No trades found</div>}
        {filtered.map(tx => renderTrade(tx))}
      </div>
    </div>
  )
}

// ─── Teams Tab ─────────────────────────────────────────────────────────────

function TeamsTab({ data, activeLeague, keepers, onFranchiseClick }) {
  const leagues = useMemo(() => {
    const s = new Set()
    for (const leagues of Object.values(data)) {
      for (const l of Object.keys(leagues)) s.add(l)
    }
    return Array.from(s).sort()
  }, [data])

  const [mode, setMode] = useState('rosters') // 'rosters' | 'franchise'
  const [selectedLeagueLocal, setSelectedLeagueLocal] = useState(leagues[0] || '')
  const [selectedSeason, setSelectedSeason] = useState('All')
  const [selectedTeam, setSelectedTeam] = useState('')

  const selectedLeague = activeLeague !== 'All' ? activeLeague : selectedLeagueLocal

  const seasons = useMemo(() => {
    const s = new Set()
    for (const leagues of Object.values(data)) {
      for (const [lName, entries] of Object.entries(leagues)) {
        if (lName === selectedLeague) for (const e of entries) s.add(e.season)
      }
    }
    return Array.from(s).sort((a, b) => b - a)
  }, [data, selectedLeague])

  const allTeamNames = useMemo(() => getTeamsInLeague(data, selectedLeague), [data, selectedLeague])

  // Rosters mode
  const displaySeason = selectedSeason === 'All' ? (seasons[0] || null) : parseInt(selectedSeason)
  const rosters = useMemo(() => {
    if (mode !== 'rosters' || !displaySeason || !selectedLeague) return {}
    return computeRostersForLeague(data, selectedLeague, displaySeason)
  }, [data, selectedLeague, displaySeason, mode])
  const rosterTeamNames = Object.keys(rosters).sort()

  // Franchise mode
  const franchiseHistory = useMemo(() => {
    if (mode !== 'franchise' || !selectedTeam || !selectedLeague) return []
    return buildFranchiseData(data, selectedLeague, selectedTeam)
  }, [data, selectedLeague, selectedTeam, mode])

  const ModeBtn = ({ m, label }) => (
    <button
      onClick={() => setMode(m)}
      style={{
        padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
        border: `1px solid ${mode === m ? '#84cc16' : '#1e293b'}`,
        background: mode === m ? 'rgba(132,204,22,0.1)' : 'transparent',
        color: mode === m ? '#84cc16' : '#94a3b8',
        fontWeight: mode === m ? 700 : 400,
      }}
    >{label}</button>
  )

  return (
    <div>
      <div style={{ ...S.filterRow, marginBottom: 12 }}>
        {activeLeague === 'All' && (
          <select style={S.select} value={selectedLeagueLocal} onChange={e => { setSelectedLeagueLocal(e.target.value); setSelectedSeason('All'); setSelectedTeam('') }}>
            {leagues.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        )}
        <ModeBtn m="rosters" label="Rosters" />
        <ModeBtn m="franchise" label="Franchise" />
      </div>

      {/* Rosters mode */}
      {mode === 'rosters' && (
        <>
          <div style={{ ...S.filterRow, marginBottom: 16 }}>
            <select style={S.select} value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)}>
              <option value="All">Latest ({seasons[0]})</option>
              {seasons.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {displaySeason && (
              <span style={S.muted}>{rosterTeamNames.length} team{rosterTeamNames.length !== 1 ? 's' : ''} · {displaySeason}</span>
            )}
          </div>
          {rosterTeamNames.length === 0 && (
            <div style={{ color: '#475569', marginTop: 40, textAlign: 'center' }}>No roster data</div>
          )}
          <div style={{ maxHeight: 'calc(100vh - 270px)', overflowY: 'auto', paddingRight: 4 }}>
            <div style={S.teamGrid}>
              {rosterTeamNames.map(team => {
                const players = Array.from(rosters[team]).sort()
                return (
                  <div key={team} style={S.teamCard}>
                    <div
                      style={{ fontWeight: 700, color: '#84cc16', marginBottom: 10, fontSize: 13, cursor: onFranchiseClick ? 'pointer' : 'default', textDecoration: onFranchiseClick ? 'underline dotted' : 'none' }}
                      onClick={() => onFranchiseClick && onFranchiseClick(team)}
                    >{team}</div>
                    <div style={S.muted}>{players.length} player{players.length !== 1 ? 's' : ''}</div>
                    <div style={{ marginTop: 8 }}>
                      {players.map(p => (
                        <div key={p} style={{ padding: '3px 0', borderBottom: '1px solid #1a2133', color: '#f1f5f9', fontSize: 12 }}>{p}</div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Franchise mode */}
      {mode === 'franchise' && (
        <>
          <div style={{ ...S.filterRow, marginBottom: 16 }}>
            <select style={S.select} value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}>
              <option value="">Select a team...</option>
              {allTeamNames.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {!selectedTeam && (
            <div style={{ color: '#475569', marginTop: 40, textAlign: 'center' }}>Select a team to view their history</div>
          )}

          {selectedTeam && (
            <div style={{ maxHeight: 'calc(100vh - 270px)', overflowY: 'auto', paddingRight: 4 }}>
              {franchiseHistory.length === 0 && (
                <div style={{ color: '#475569', marginTop: 40, textAlign: 'center' }}>No history found</div>
              )}
              {franchiseHistory.map(({ season, drafted, tradedIn, tradedOut, added, dropped }) => {
                const keeperSet = new Set(keepers?.[selectedLeague]?.[season]?.[selectedTeam] || [])
                const kept = drafted.filter(p => keeperSet.has(p))
                const newDraft = drafted.filter(p => !keeperSet.has(p))
                return (
                <div key={season} style={{ ...S.card, marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, color: '#84cc16', fontSize: 15, marginBottom: 10 }}>{season}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                    {kept.length > 0 && (
                      <div>
                        <div style={{ ...S.sectionLabel, marginTop: 0 }}>Kept ({kept.length})</div>
                        {kept.map(p => <div key={p} style={{ fontSize: 12, color: '#84cc16', padding: '2px 0' }}>{p}</div>)}
                      </div>
                    )}
                    {newDraft.length > 0 && (
                      <div>
                        <div style={{ ...S.sectionLabel, marginTop: 0 }}>New Draft ({newDraft.length})</div>
                        {newDraft.map(p => <div key={p} style={{ fontSize: 12, color: '#94a3b8', padding: '2px 0' }}>{p}</div>)}
                      </div>
                    )}
                    {tradedIn.length > 0 && (
                      <div>
                        <div style={{ ...S.sectionLabel, marginTop: 0 }}>Traded In</div>
                        {tradedIn.map(({ player, from }) => (
                          <div key={player} style={{ fontSize: 12, color: '#f1f5f9', padding: '2px 0' }}>
                            {player} <span style={{ color: '#475569' }}>← {from}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {tradedOut.length > 0 && (
                      <div>
                        <div style={{ ...S.sectionLabel, marginTop: 0 }}>Traded Out</div>
                        {tradedOut.map(({ player, to }) => (
                          <div key={player} style={{ fontSize: 12, color: '#f87171', padding: '2px 0' }}>
                            {player} <span style={{ color: '#475569' }}>→ {to}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {added.length > 0 && (
                      <div>
                        <div style={{ ...S.sectionLabel, marginTop: 0 }}>Added</div>
                        {added.map(p => <div key={p} style={{ fontSize: 12, color: '#22c55e', padding: '2px 0' }}>{p}</div>)}
                      </div>
                    )}
                    {dropped.length > 0 && (
                      <div>
                        <div style={{ ...S.sectionLabel, marginTop: 0 }}>Dropped</div>
                        {dropped.map(p => <div key={p} style={{ fontSize: 12, color: '#475569', padding: '2px 0' }}>{p}</div>)}
                      </div>
                    )}
                  </div>
                </div>
              )})}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── computeRecords ─────────────────────────────────────────────────────────

function computeRecords(data, leagueName, keepers) {
  const draftedCount = {}
  const tradedCount = {}
  const txCount = {}
  const teamsSet = {}
  const seasonsCount = {}
  const keeperSeasons = {}
  const droppedCount = {}
  const numberOneCount = {}
  const loyaltyBest = {}  // playerName -> { count, team, league }
  const tradeGroups = {}  // `${timestamp}_${lg}` -> { players: Set, season, league, teams: Set }
  let firstEverDrafted = null
  let neverKeptBest = null    // { playerName, seasons, league }
  let oneSeasonWonderBest = null  // { playerName, season, team, round, pick, league }

  for (const [playerName, leagues] of Object.entries(data)) {
    for (const [lg, entries] of Object.entries(leagues)) {
      if (leagueName && lg !== leagueName) continue

      for (const e of entries) {
        if (e.how === 'drafted') {
          draftedCount[playerName] = (draftedCount[playerName] || 0) + 1
          if (e.pick === 1) numberOneCount[playerName] = (numberOneCount[playerName] || 0) + 1
          if (
            firstEverDrafted === null ||
            e.season < firstEverDrafted.season ||
            (e.season === firstEverDrafted.season &&
              (e.round * 1000 + e.pick) < (firstEverDrafted.round * 1000 + firstEverDrafted.pick))
          ) {
            firstEverDrafted = { playerName, season: e.season, team: normTeam(e.team), round: e.round, pick: e.pick, league: lg }
          }
        }
        if (e.how === 'trade') {
          tradedCount[playerName] = (tradedCount[playerName] || 0) + 1
          if (e.timestamp) {
            const key = `${e.timestamp}_${lg}`
            if (!tradeGroups[key]) tradeGroups[key] = { players: new Set(), season: e.season, league: lg, teams: new Set() }
            tradeGroups[key].players.add(playerName)
            if (e.team) tradeGroups[key].teams.add(normTeam(e.team))
            if (e.from_team) tradeGroups[key].teams.add(normTeam(e.from_team))
          }
        }
        if (e.how === 'drop') droppedCount[playerName] = (droppedCount[playerName] || 0) + 1
        if (e.how !== 'drafted') txCount[playerName] = (txCount[playerName] || 0) + 1
        if (e.team && e.how !== 'drop') {
          if (!teamsSet[playerName]) teamsSet[playerName] = new Set()
          teamsSet[playerName].add(normTeam(e.team))
        }
      }

      const seasons = buildPlayerSeasons(entries, playerName, lg, keepers)
      if (seasons.length > 0) {
        const prev = seasonsCount[playerName]
        if (!prev || seasons.length > prev.count) {
          seasonsCount[playerName] = { count: seasons.length, first: seasons[0].season, last: seasons[seasons.length - 1].season, league: lg }
        }
        const kCount = seasons.filter(s => s.kept).length
        if (kCount > 0) {
          const prevK = keeperSeasons[playerName]
          if (!prevK || kCount > prevK.count) keeperSeasons[playerName] = { count: kCount, league: lg }
        }

        // mostLoyalPlayer: longest run of same startTeam across consecutive seasons
        let curRun = 1, curTeam = seasons[0].startTeam
        let best = 1, bestTeam = curTeam
        for (let i = 1; i < seasons.length; i++) {
          if (seasons[i].startTeam === curTeam) {
            curRun++
            if (curRun > best) { best = curRun; bestTeam = curTeam }
          } else {
            curRun = 1; curTeam = seasons[i].startTeam
          }
        }
        const prevL = loyaltyBest[playerName]
        if (!prevL || best > prevL.count) loyaltyBest[playerName] = { count: best, team: bestTeam, league: lg }

        // neverKept: 3+ seasons, never kept
        if (seasons.length >= 3 && kCount === 0) {
          if (!neverKeptBest || seasons.length > neverKeptBest.seasons) {
            neverKeptBest = { playerName, seasons: seasons.length, league: lg }
          }
        }

        // oneSeasonWonder: exactly 1 season, drafted (not just added), must have 2+ entries (exclude manual single-entry injections)
        if (seasons.length === 1 && entries.length >= 2) {
          const draft = entries.find(e => e.how === 'drafted')
          if (draft) {
            const score = draft.round * 1000 + draft.pick
            if (!oneSeasonWonderBest || score < (oneSeasonWonderBest.round * 1000 + oneSeasonWonderBest.pick)) {
              oneSeasonWonderBest = { playerName, season: seasons[0].season, team: seasons[0].endTeam, round: draft.round, pick: draft.pick, league: lg }
            }
          }
        }
      }
    }
  }

  function maxEntry(obj, keyFn) {
    let best = null, bestVal = -1
    for (const [k, v] of Object.entries(obj)) {
      const val = keyFn ? keyFn(v) : v
      if (val > bestVal) { bestVal = val; best = { key: k, val: v } }
    }
    return best
  }

  const mt = maxEntry(tradedCount)
  const mTx = maxEntry(txCount)
  const mTeams = maxEntry(teamsSet, s => s.size)
  const mTenured = maxEntry(seasonsCount, s => s.count)
  const mKeeper = maxEntry(keeperSeasons, s => s.count)
  const mDropped = maxEntry(droppedCount)
  const mNo1 = maxEntry(numberOneCount)
  const mLoyal = maxEntry(loyaltyBest, v => v.count)

  // Biggest trade: most players in a single trade group
  let biggestTrade = null
  for (const g of Object.values(tradeGroups)) {
    if (!biggestTrade || g.players.size > biggestTrade.count) {
      const pArr = Array.from(g.players)
      biggestTrade = {
        count: g.players.size,
        season: g.season,
        league: g.league,
        teams: Array.from(g.teams).join(' ↔ '),
        playerName: pArr.slice(0, 3).join(', ') + (pArr.length > 3 ? ` +${pArr.length - 3} more` : ''),
      }
    }
  }

  return {
    mostTraded: mt ? { playerName: mt.key, count: mt.val, league: leagueName || 'All' } : null,
    mostTransactions: mTx ? { playerName: mTx.key, count: mTx.val, league: leagueName || 'All' } : null,
    mostTeams: mTeams ? { playerName: mTeams.key, count: mTeams.val.size, teams: Array.from(mTeams.val).join(', '), league: leagueName || 'All' } : null,
    longestInLeague: mTenured ? { playerName: mTenured.key, seasons: mTenured.val.count, first: mTenured.val.first, last: mTenured.val.last, league: mTenured.val.league } : null,
    firstEverDrafted,
    mostKeeperSeasons: mKeeper ? { playerName: mKeeper.key, count: mKeeper.val.count, league: mKeeper.val.league } : null,
    mostDropped: mDropped ? { playerName: mDropped.key, count: mDropped.val, league: leagueName || 'All' } : null,
    mostNumberOnePick: mNo1 ? { playerName: mNo1.key, count: mNo1.val, league: leagueName || 'All' } : null,
    mostLoyal: mLoyal ? { playerName: mLoyal.key, count: mLoyal.val.count, team: mLoyal.val.team, league: mLoyal.val.league } : null,
    biggestTrade,
    neverKept: neverKeptBest,
    oneSeasonWonder: oneSeasonWonderBest,
  }
}

// ─── Leaderboard Tab ────────────────────────────────────────────────────────

function LeaderboardTab({ data, activeLeague, keepers }) {
  const leagueName = activeLeague === 'All' ? null : activeLeague
  const [sub, setSub] = useState('alltime')

  const playerStats = useMemo(() => {
    const results = []
    for (const [playerName, leagues] of Object.entries(data)) {
      for (const [lg, entries] of Object.entries(leagues)) {
        if (leagueName && lg !== leagueName) continue
        const seasons = buildPlayerSeasons(entries, playerName, lg, keepers)
        if (seasons.length === 0) continue

        const firstSeason = seasons[0].season
        const lastSeason = seasons[seasons.length - 1].season

        let maxStreak = 0, curStreak = 0
        let bestStreakYears = [], curStreakYears = [], bestStreakTeam = null
        for (const s of seasons) {
          if (s.kept) {
            curStreak++
            curStreakYears.push(s.season)
            if (curStreak > maxStreak) {
              maxStreak = curStreak
              bestStreakYears = [...curStreakYears]
              bestStreakTeam = s.endTeam
            }
          } else {
            curStreak = 0
            curStreakYears = []
          }
        }
        const lastKept = seasons[seasons.length - 1].kept
        const activeStreak = lastKept ? curStreak : 0
        const activeStreakYears = lastKept ? [...curStreakYears] : []

        results.push({
          playerName,
          league: lg,
          totalSeasons: seasons.length,
          firstSeason,
          lastSeason,
          maxStreak,
          bestStreakYears,
          bestStreakTeam,
          activeStreak,
          activeStreakYears,
          currentTeam: seasons[seasons.length - 1].endTeam,
        })
      }
    }
    return results
  }, [data, leagueName, keepers])

  const topAllTime = useMemo(() =>
    [...playerStats].filter(s => s.maxStreak >= 2)
      .sort((a, b) => b.maxStreak - a.maxStreak || b.totalSeasons - a.totalSeasons)
      .slice(0, 30),
    [playerStats]
  )
  const topActive = useMemo(() =>
    [...playerStats].filter(s => s.activeStreak >= 2)
      .sort((a, b) => b.activeStreak - a.activeStreak || b.totalSeasons - a.totalSeasons)
      .slice(0, 30),
    [playerStats]
  )
  const topTenured = useMemo(() =>
    [...playerStats].sort((a, b) => b.totalSeasons - a.totalSeasons || a.firstSeason - b.firstSeason)
      .slice(0, 30),
    [playerStats]
  )

  const rows = sub === 'alltime' ? topAllTime : sub === 'active' ? topActive : topTenured

  const records = useMemo(() => {
    if (sub !== 'records') return null
    return computeRecords(data, leagueName, keepers)
  }, [sub, data, leagueName, keepers])

  const subBtns = [
    ['alltime', '🏆 All-Time Streaks'],
    ['active', '🔥 Active Streaks'],
    ['tenured', '📅 Longest Tenured'],
    ...(leagueName !== 'SouthOssetian' ? [['records', '📋 Records']] : []),
  ]

  const RECORD_CARDS = records ? [
    {
      label: 'Most Transactions',
      rec: records.mostTransactions,
      stat: r => `${r.count} transaction${r.count !== 1 ? 's' : ''}`,
    },
    {
      label: 'Most Traded',
      rec: records.mostTraded,
      stat: r => `traded ${r.count} time${r.count !== 1 ? 's' : ''}`,
    },
    {
      label: 'Most Teams Owned By',
      rec: records.mostTeams,
      stat: r => `${r.count} distinct team${r.count !== 1 ? 's' : ''}`,
      sub: r => r.teams,
    },
    {
      label: 'Longest in League',
      rec: records.longestInLeague,
      stat: r => `${r.seasons} season${r.seasons !== 1 ? 's' : ''}`,
      sub: r => `${r.first}–${r.last}`,
    },
    {
      label: 'First Ever Drafted',
      rec: records.firstEverDrafted,
      stat: r => `${r.season} · R${r.round}P${r.pick}`,
      sub: r => `by ${r.team}`,
    },
    {
      label: 'Most Keeper Seasons',
      rec: records.mostKeeperSeasons,
      stat: r => `kept ${r.count} season${r.count !== 1 ? 's' : ''}`,
    },
    {
      label: 'Most Loyal',
      rec: records.mostLoyal,
      stat: r => `${r.count} season${r.count !== 1 ? 's' : ''} on one team`,
      sub: r => r.team,
    },
    {
      label: 'Biggest Trade',
      rec: records.biggestTrade,
      stat: r => `${r.count} players · ${r.season}`,
      sub: r => r.teams,
    },
    {
      label: 'Never Kept (3+ seasons)',
      rec: records.neverKept,
      stat: r => `${r.seasons} seasons, never retained`,
    },
    {
      label: 'Best One-Season Wonder',
      rec: records.oneSeasonWonder,
      stat: r => `${r.season} · R${r.round}P${r.pick}`,
      sub: r => `by ${r.team}`,
    },
  ] : []

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {subBtns.map(([id, label]) => (
          <button key={id} onClick={() => setSub(id)} style={{
            padding: '6px 14px', fontSize: 12, borderRadius: 6,
            border: `1px solid ${sub === id ? '#84cc16' : '#1e293b'}`,
            background: sub === id ? 'rgba(132,204,22,0.1)' : 'transparent',
            color: sub === id ? '#84cc16' : '#64748b',
            cursor: 'pointer', fontWeight: sub === id ? 700 : 400,
          }}>
            {label}
          </button>
        ))}
      </div>

      {sub === 'records' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {RECORD_CARDS.map(({ label, rec, stat, sub: subLine }) => (
            <div key={label} style={{ background: '#0d0f16', border: '1px solid #1e293b', borderRadius: 8, padding: 16 }}>
              <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
              {rec ? (
                <>
                  <div style={{ color: '#84cc16', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{rec.playerName}</div>
                  <div style={{ color: '#f1f5f9', fontSize: 13 }}>{stat(rec)}</div>
                  {subLine && <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{subLine(rec)}</div>}
                  <div style={{ color: '#475569', fontSize: 11, marginTop: 6 }}>{rec.league}</div>
                </>
              ) : (
                <div style={{ color: '#475569', fontSize: 13 }}>No data</div>
              )}
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div style={{ color: '#475569', textAlign: 'center', padding: 40 }}>No data</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: '#475569', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
              <th style={{ padding: '6px 8px', width: 32 }}>#</th>
              <th style={{ padding: '6px 8px' }}>Player</th>
              <th style={{ padding: '6px 8px', textAlign: 'center' }}>
                {sub === 'tenured' ? 'Seasons' : 'Streak'}
              </th>
              <th style={{ padding: '6px 8px' }}>Years</th>
              <th style={{ padding: '6px 8px' }}>
                {sub === 'alltime' ? 'Streak Team' : 'Current Team'}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isActiveBadge = sub === 'active' || (sub === 'alltime' && r.activeStreak === r.maxStreak && r.maxStreak > 0)
              let stat, yearsStr
              if (sub === 'tenured') {
                stat = r.totalSeasons
                yearsStr = r.firstSeason === r.lastSeason ? `${r.firstSeason}` : `${r.firstSeason}–${r.lastSeason}`
              } else if (sub === 'active') {
                stat = r.activeStreak
                const ay = r.activeStreakYears
                yearsStr = ay.length > 1 ? `${ay[0]}–${ay[ay.length - 1]}` : `${ay[0] ?? ''}`
              } else {
                stat = r.maxStreak
                const by = r.bestStreakYears
                yearsStr = by.length > 1 ? `${by[0]}–${by[by.length - 1]}` : `${by[0] ?? ''}`
              }
              return (
                <tr key={`${r.playerName}-${r.league}`} style={{ borderBottom: '1px solid #0f172a', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                  <td style={{ padding: '8px', color: '#475569', fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ padding: '8px', color: '#f1f5f9', fontWeight: 600 }}>{r.playerName}</td>
                  <td style={{ padding: '8px', textAlign: 'center', color: isActiveBadge ? '#84cc16' : '#cbd5e1', fontWeight: 700, fontSize: 17 }}>{stat}</td>
                  <td style={{ padding: '8px', color: '#64748b', fontSize: 11 }}>
                    {yearsStr}
                    {isActiveBadge && sub !== 'tenured' && (
                      <span style={{ marginLeft: 6, color: '#84cc16', fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>ACTIVE</span>
                    )}
                  </td>
                  <td style={{ padding: '8px', color: '#94a3b8', fontSize: 12 }}>
                    {sub === 'alltime' ? (r.bestStreakTeam || '—') : (r.currentTeam || '—')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── H2H Tab ────────────────────────────────────────────────────────────────

function H2HTab({ data, activeLeague }) {
  const leagueName = activeLeague === 'All' ? null : activeLeague

  const allLeagues = useMemo(() => {
    const s = new Set()
    for (const leagues of Object.values(data)) for (const l of Object.keys(leagues)) s.add(l)
    return Array.from(s).sort()
  }, [data])

  const [selectedLeagueLocal, setSelectedLeagueLocal] = useState(allLeagues[0] || '')
  const selectedLeague = leagueName || selectedLeagueLocal

  const teamNames = useMemo(() => getTeamsInLeague(data, selectedLeague), [data, selectedLeague])

  const [teamA, setTeamA] = useState('')
  const [teamB, setTeamB] = useState('')

  // All trades between teamA and teamB
  const h2hTrades = useMemo(() => {
    if (!teamA || !teamB) return []
    const allTxs = buildTransactions(data)
    return allTxs
      .map(tx => ({
        ...tx,
        tradeItems: tx.items.filter(i => {
          if (i.entry.how !== 'trade') return false
          if (leagueName && tx.league !== leagueName) return false
          if (!leagueName && tx.league !== selectedLeague) return false
          const to = normTeam(i.entry.team)
          const from = normTeam(i.entry.from_team)
          return (to === teamA && from === teamB) || (to === teamB && from === teamA)
        }),
      }))
      .filter(tx => tx.tradeItems.length > 0)
  }, [data, teamA, teamB, leagueName, selectedLeague])

  const tradeCount = h2hTrades.length
  const playerCount = h2hTrades.reduce((sum, tx) => sum + tx.tradeItems.length, 0)

  function renderH2HTrade(tx) {
    const receivedA = tx.tradeItems.filter(i => normTeam(i.entry.team) === teamA)
    const receivedB = tx.tradeItems.filter(i => normTeam(i.entry.team) === teamB)
    const season = tx.tradeItems[0]?.entry.season

    return (
      <div key={`${tx.ts}_${tx.league}`} style={S.txRow}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 4 }}>
          <span style={S.txDate}>{tx.ts ? formatDate(tx.ts) : 'Unknown date'} · <span style={{ color: '#84cc16' }}>{tx.league}</span></span>
          {season && <span style={S.muted}>{season}</span>}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[{ team: teamA, items: receivedA }, { team: teamB, items: receivedB }].map(({ team, items }) => (
            <div key={team} style={{ flex: 1, minWidth: 140 }}>
              <div style={{ color: '#84cc16', fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{team} received</div>
              {items.length === 0
                ? <div style={{ color: '#475569', fontSize: 12 }}>—</div>
                : items.map(({ playerName, entry }) => (
                  <div key={playerName} style={{ fontSize: 13, color: '#f1f5f9', padding: '3px 0', borderBottom: '1px solid #1a2133' }}>
                    {playerName}
                    {entry.from_team && <div style={{ color: '#475569', fontSize: 11 }}>from {normTeam(entry.from_team)}</div>}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {activeLeague === 'All' && (
        <div style={{ ...S.filterRow, marginBottom: 12 }}>
          <select style={S.select} value={selectedLeagueLocal} onChange={e => { setSelectedLeagueLocal(e.target.value); setTeamA(''); setTeamB('') }}>
            {allLeagues.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      )}
      <div style={{ ...S.filterRow, marginBottom: 16 }}>
        <select style={S.select} value={teamA} onChange={e => setTeamA(e.target.value)}>
          <option value="">Team A...</option>
          {teamNames.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{ color: '#475569', fontWeight: 700 }}>vs</span>
        <select style={S.select} value={teamB} onChange={e => setTeamB(e.target.value)}>
          <option value="">Team B...</option>
          {teamNames.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {teamA && teamB && (
        <div style={{ marginBottom: 12, color: '#64748b', fontSize: 13 }}>
          {tradeCount === 0
            ? 'No trades found between these teams.'
            : `${tradeCount} trade${tradeCount !== 1 ? 's' : ''} · ${playerCount} player${playerCount !== 1 ? 's' : ''} exchanged`}
        </div>
      )}

      {!teamA || !teamB ? (
        <div style={{ color: '#475569', marginTop: 40, textAlign: 'center' }}>Select two teams to see their trade history</div>
      ) : (
        <div style={{ maxHeight: 'calc(100vh - 270px)', overflowY: 'auto', paddingRight: 4 }}>
          {h2hTrades.map(tx => renderH2HTrade(tx))}
        </div>
      )}
    </div>
  )
}

// ─── ResultsTab helpers ─────────────────────────────────────────────────────

function computeChampions(results, leagueName) {
  const leagueData = results[leagueName]
  if (!leagueData) return []
  return Object.entries(leagueData)
    .map(([season, d]) => {
      const rank1 = d.standings.find(s => s.rank === 1) || d.standings[0]
      if (!rank1) return null
      return {
        season: parseInt(season),
        champion: normTeam(rank1.team),
        wins: rank1.wins,
        losses: rank1.losses,
        ties: rank1.ties,
        points_for: rank1.points_for,
        format: d.format || 'h2h',
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.season - a.season)
}

function computeAllTimeRecords(results, leagueName) {
  const leagueData = results[leagueName]
  if (!leagueData) return []
  const agg = {}
  for (const [, d] of Object.entries(leagueData)) {
    if ((d.format || 'h2h') !== 'h2h') continue
    for (const s of d.standings) {
      const team = normTeam(s.team)
      if (!agg[team]) agg[team] = { wins: 0, losses: 0, ties: 0, seasons: 0 }
      agg[team].wins += s.wins || 0
      agg[team].losses += s.losses || 0
      agg[team].ties += s.ties || 0
      agg[team].seasons += 1
    }
  }
  return Object.entries(agg)
    .map(([team, r]) => {
      const total = r.wins + r.losses + r.ties
      const winPct = total > 0 ? r.wins / total : 0
      const pct = '.' + String(Math.round(winPct * 1000)).padStart(3, '0')
      return { team, wins: r.wins, losses: r.losses, ties: r.ties, seasons: r.seasons, winPct, pct }
    })
    .sort((a, b) => b.winPct - a.winPct)
}

function getTeamsFromResults(results, leagueName) {
  const leagueData = results[leagueName]
  if (!leagueData) return []
  const teams = new Set()
  for (const d of Object.values(leagueData)) {
    for (const s of d.standings) teams.add(normTeam(s.team))
    for (const m of (d.matchups || [])) {
      if (m.home) teams.add(normTeam(m.home))
      if (m.away) teams.add(normTeam(m.away))
    }
  }
  return Array.from(teams).sort()
}

function computeH2HMatchups(results, leagueName, teamA, teamB) {
  const leagueData = results[leagueName]
  if (!leagueData || !teamA || !teamB) return []
  const rows = []
  for (const [season, d] of Object.entries(leagueData)) {
    for (const m of (d.matchups || [])) {
      const home = normTeam(m.home)
      const away = normTeam(m.away)
      const aIsHome = home === teamA && away === teamB
      const aIsAway = away === teamA && home === teamB
      if (!aIsHome && !aIsAway) continue
      const winner = normTeam(m.winner)
      rows.push({
        season: parseInt(season),
        week: m.week,
        winner,
        homeTeam: home,
        awayTeam: away,
        homeScore: m.home_score,
        awayScore: m.away_score,
      })
    }
  }
  return rows.sort((a, b) => b.season - a.season || b.week - a.week)
}

// ─── Results helpers: Category Kings, Playoffs, Best Seasons ────────────────

const STAT_NAMES = {
  "7": "R", "8": "H", "12": "HR", "13": "RBI", "16": "SB",
  "23": "TB", "3": "AVG", "4": "OBP", "5": "SLG",
  "28": "W", "42": "K", "26": "ERA", "27": "WHIP",
  "57": "K/9", "78": "BB/9", "90": "NSVH",
  "32": "SV", "50": "IP", "37": "ER", "56": "QS"
}

function computeCategoryKings(results, leagueName) {
  const leagueData = results[leagueName]
  if (!leagueData) return []

  // statId -> { teamWins: { franchise: count }, total: count }
  const statAgg = {}

  for (const [season, d] of Object.entries(leagueData)) {
    if (parseInt(season) >= 2026) continue
    for (const m of (d.matchups || [])) {
      if (!m.stat_winners) continue
      for (const [statId, winner] of Object.entries(m.stat_winners)) {
        if (!STAT_NAMES[statId]) continue
        if (!statAgg[statId]) statAgg[statId] = { teamWins: {}, total: 0 }
        statAgg[statId].total += 1
        const franchise = normTeam(winner)
        statAgg[statId].teamWins[franchise] = (statAgg[statId].teamWins[franchise] || 0) + 1
      }
    }
  }

  const result = []
  for (const [statId, agg] of Object.entries(statAgg)) {
    if (agg.total < 50) continue
    let leader = null, leaderWins = -1
    for (const [franchise, wins] of Object.entries(agg.teamWins)) {
      if (wins > leaderWins) { leaderWins = wins; leader = franchise }
    }
    if (!leader) continue
    result.push({
      statId,
      statName: STAT_NAMES[statId],
      leader,
      wins: leaderWins,
      total: agg.total,
      pct: (leaderWins / agg.total * 100).toFixed(1) + '%',
    })
  }

  return result.sort((a, b) => a.statName.localeCompare(b.statName))
}

function computePlayoffStats(results, leagueName) {
  const leagueData = results[leagueName]
  if (!leagueData) return { rows: [] }

  // franchise -> { playoffSeasons: Set, postW, postL, regW, regL }
  const agg = {}

  function ensure(name) {
    if (!agg[name]) agg[name] = { playoffSeasons: new Set(), postW: 0, postL: 0, regW: 0, regL: 0 }
    return agg[name]
  }

  for (const [season, d] of Object.entries(leagueData)) {
    if (parseInt(season) >= 2026) continue
    if ((d.format || 'h2h') !== 'h2h') continue
    const matchups = d.matchups || []
    if (matchups.length === 0) continue
    const endWeek = Math.max(...matchups.map(m => m.week))
    const playoffStartWeek = endWeek - 2

    for (const m of matchups) {
      const home = normTeam(m.home)
      const away = normTeam(m.away)
      const winner = normTeam(m.winner)
      const isPost = m.week >= playoffStartWeek

      ensure(home)
      ensure(away)

      if (isPost) {
        agg[home].playoffSeasons.add(String(d.season || m.week))
        agg[away].playoffSeasons.add(String(d.season || m.week))
        if (winner === home) { agg[home].postW++; agg[away].postL++ }
        else if (winner === away) { agg[away].postW++; agg[home].postL++ }
      } else {
        if (winner === home) { agg[home].regW++; agg[away].regL++ }
        else if (winner === away) { agg[away].regW++; agg[home].regL++ }
      }
    }
  }

  // Re-compute playoff appearances by season properly
  // Reset playoffSeasons and recount per season
  const appCount = {}
  for (const name of Object.keys(agg)) appCount[name] = new Set()

  for (const [season, d] of Object.entries(leagueData)) {
    if (parseInt(season) >= 2026) continue
    if ((d.format || 'h2h') !== 'h2h') continue
    const matchups = d.matchups || []
    if (matchups.length === 0) continue
    const endWeek = Math.max(...matchups.map(m => m.week))
    const playoffStartWeek = endWeek - 2
    for (const m of matchups) {
      if (m.week < playoffStartWeek) continue
      const home = normTeam(m.home)
      const away = normTeam(m.away)
      if (!appCount[home]) appCount[home] = new Set()
      if (!appCount[away]) appCount[away] = new Set()
      appCount[home].add(season)
      appCount[away].add(season)
    }
  }

  const rows = Object.entries(agg).map(([franchise, d]) => {
    const apps = (appCount[franchise] || new Set()).size
    const postTotal = d.postW + d.postL
    const regTotal = d.regW + d.regL
    const postWinPct = postTotal > 0 ? (d.postW / postTotal * 100).toFixed(1) : '—'
    const regWinPct = regTotal > 0 ? (d.regW / regTotal * 100).toFixed(1) : '—'
    return { franchise, apps, postW: d.postW, postL: d.postL, regW: d.regW, regL: d.regL, postWinPct, regWinPct }
  }).sort((a, b) => b.apps - a.apps || b.postW - a.postW)

  return { rows }
}

function computeSeasonRecords(results, leagueName) {
  const leagueData = results[leagueName]
  if (!leagueData) return []

  const allSeasons = []
  for (const [season, d] of Object.entries(leagueData)) {
    if (parseInt(season) >= 2026) continue
    if ((d.format || 'h2h') !== 'h2h') continue
    for (const s of d.standings) {
      const franchise = normTeam(s.team)
      const wins = s.wins || 0
      const losses = s.losses || 0
      const ties = s.ties || 0
      const total = wins + losses + ties
      const winPct = total > 0 ? wins / total : 0
      allSeasons.push({ franchise, season: parseInt(season), wins, losses, ties, winPct, rank: s.rank })
    }
  }

  return allSeasons.sort((a, b) => b.winPct - a.winPct)
}

// ─── ResultsTab ─────────────────────────────────────────────────────────────

function ResultsTab({ results, activeLeague, onFranchiseClick }) {
  const [sub, setSub] = useState('champions')
  const [selectedLeagueLocal, setSelectedLeagueLocal] = useState('LXG')
  const selectedLeague = activeLeague !== 'All' ? activeLeague : selectedLeagueLocal

  const availableLeagues = Object.keys(results || {}).sort()

  const champions = useMemo(() => computeChampions(results, selectedLeague), [results, selectedLeague])
  const records = useMemo(() => computeAllTimeRecords(results, selectedLeague), [results, selectedLeague])
  const teamNames = useMemo(() => getTeamsFromResults(results, selectedLeague), [results, selectedLeague])

  const [teamA, setTeamA] = useState('')
  const [teamB, setTeamB] = useState('')

  const h2hRows = useMemo(
    () => computeH2HMatchups(results, selectedLeague, teamA, teamB),
    [results, selectedLeague, teamA, teamB]
  )

  const categoryKings = useMemo(() => computeCategoryKings(results, selectedLeague), [results, selectedLeague])
  const playoffStats = useMemo(() => computePlayoffStats(results, selectedLeague), [results, selectedLeague])
  const seasonRecords = useMemo(() => computeSeasonRecords(results, selectedLeague), [results, selectedLeague])

  // Champions summary stats
  const uniqueChampions = useMemo(() => new Set(champions.map(c => c.champion)), [champions])
  const titleCounts = useMemo(() => {
    const counts = {}
    for (const c of champions) counts[c.champion] = (counts[c.champion] || 0) + 1
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [champions])

  // H2H summary
  const h2hSummary = useMemo(() => {
    if (!teamA || !teamB || h2hRows.length === 0) return null
    let aWins = 0, bWins = 0, ties = 0
    for (const r of h2hRows) {
      if (r.winner === teamA) aWins++
      else if (r.winner === teamB) bWins++
      else ties++
    }
    return { aWins, bWins, ties }
  }, [h2hRows, teamA, teamB])

  const rankColor = (i) => {
    if (i === 0) return '#f59e0b'  // gold
    if (i === 1) return '#94a3b8'  // silver
    if (i === 2) return '#b45309'  // bronze
    return '#475569'
  }

  const subBtns = [
    ['champions', '🏆 Champions'],
    ['records', '📊 W/L Records'],
    ['h2h', '⚔️ Head to Head'],
    ['cats', '🎯 Category Kings'],
    ['playoffs', '🏅 Playoffs'],
    ['seasons', '📈 Best Seasons'],
  ]

  if (!results) return <div style={{ color: '#475569', padding: 40, textAlign: 'center' }}>No results data</div>

  return (
    <div>
      {/* League selector when activeLeague is All */}
      {activeLeague === 'All' && (
        <div style={{ ...S.filterRow, marginBottom: 16 }}>
          <select style={S.select} value={selectedLeagueLocal} onChange={e => setSelectedLeagueLocal(e.target.value)}>
            {availableLeagues.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      )}

      {/* Sub-tab buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {subBtns.map(([id, label]) => (
          <button key={id} onClick={() => setSub(id)} style={{
            padding: '6px 14px', fontSize: 12, borderRadius: 6,
            border: `1px solid ${sub === id ? '#84cc16' : '#1e293b'}`,
            background: sub === id ? 'rgba(132,204,22,0.1)' : 'transparent',
            color: sub === id ? '#84cc16' : '#64748b',
            cursor: 'pointer', fontWeight: sub === id ? 700 : 400,
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Champions sub-tab */}
      {sub === 'champions' && (
        <div>
          <div style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
            {champions.length} season{champions.length !== 1 ? 's' : ''} · {uniqueChampions.size} unique champion{uniqueChampions.size !== 1 ? 's' : ''}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#475569', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
                <th style={{ padding: '6px 8px', width: 60 }}>Season</th>
                <th style={{ padding: '6px 8px' }}>Champion</th>
                <th style={{ padding: '6px 8px' }}>Record</th>
              </tr>
            </thead>
            <tbody>
              {champions.map((c, i) => (
                <tr key={c.season} style={{ borderBottom: '1px solid #0f172a', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                  <td style={{ padding: '8px', color: '#64748b', fontWeight: 700 }}>{c.season}</td>
                  <td style={{ padding: '8px' }}>
                    <span
                      style={{ color: '#84cc16', fontWeight: 700, cursor: onFranchiseClick ? 'pointer' : 'default', textDecoration: onFranchiseClick ? 'underline dotted' : 'none' }}
                      onClick={() => onFranchiseClick && onFranchiseClick(c.champion)}
                    >{c.champion}</span>
                    {c.champion === 'Dynasty' && (
                      <span style={{
                        marginLeft: 8, display: 'inline-block', padding: '1px 6px',
                        borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                        background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)',
                      }}>DYNASTY</span>
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {c.format === 'roto'
                      ? <span style={{ color: '#64748b' }}>Roto · {c.points_for}pts</span>
                      : <span style={{ color: '#94a3b8' }}>{c.wins}-{c.losses}{c.ties > 0 ? `-${c.ties}` : ''}</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Titles count mini-leaderboard */}
          {titleCounts.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={S.sectionLabel}>Titles</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                {titleCounts.map(([name, count]) => (
                  <div key={name} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: '#0d0f16', border: '1px solid #1e293b',
                    borderRadius: 20, padding: '5px 12px', fontSize: 13,
                  }}>
                    <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{name}</span>
                    <span style={{
                      background: 'rgba(132,204,22,0.15)', color: '#84cc16',
                      border: '1px solid rgba(132,204,22,0.3)',
                      borderRadius: 10, padding: '0 7px', fontSize: 11, fontWeight: 700,
                    }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* W/L Records sub-tab */}
      {sub === 'records' && (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#475569', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
                <th style={{ padding: '6px 8px', width: 32 }}>#</th>
                <th style={{ padding: '6px 8px' }}>Franchise</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>W</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>L</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>T</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Win%</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Seasons</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={r.team} style={{ borderBottom: '1px solid #0f172a', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                  <td style={{ padding: '8px', fontWeight: 700, color: rankColor(i) }}>{i + 1}</td>
                  <td style={{ padding: '8px', fontWeight: i < 3 ? 700 : 400 }}>
                    <span
                      style={{ color: '#f1f5f9', cursor: onFranchiseClick ? 'pointer' : 'default', textDecoration: onFranchiseClick ? 'underline dotted' : 'none' }}
                      onClick={() => onFranchiseClick && onFranchiseClick(r.team)}
                    >{r.team}</span>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{r.wins}</td>
                  <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{r.losses}</td>
                  <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{r.ties}</td>
                  <td style={{ padding: '8px', textAlign: 'center', color: i < 3 ? rankColor(i) : '#cbd5e1', fontWeight: 700 }}>{r.pct}</td>
                  <td style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>{r.seasons}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Head to Head sub-tab */}
      {sub === 'h2h' && (
        <div>
          <div style={{ ...S.filterRow, marginBottom: 16 }}>
            <select style={S.select} value={teamA} onChange={e => setTeamA(e.target.value)}>
              <option value="">Team A...</option>
              {teamNames.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <span style={{ color: '#475569', fontWeight: 700 }}>vs</span>
            <select style={S.select} value={teamB} onChange={e => setTeamB(e.target.value)}>
              <option value="">Team B...</option>
              {teamNames.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {teamA && teamB && h2hSummary && (
            <div style={{ marginBottom: 16, padding: '10px 16px', background: '#0d0f16', border: '1px solid #1e293b', borderRadius: 8 }}>
              {h2hSummary.aWins === h2hSummary.bWins
                ? <span style={{ color: '#94a3b8', fontWeight: 700 }}>All tied {h2hSummary.aWins}–{h2hSummary.bWins}</span>
                : (
                  <span style={{ color: '#84cc16', fontWeight: 700 }}>
                    {h2hSummary.aWins > h2hSummary.bWins ? teamA : teamB} leads{' '}
                    {Math.max(h2hSummary.aWins, h2hSummary.bWins)}–{Math.min(h2hSummary.aWins, h2hSummary.bWins)}
                  </span>
                )
              }
              {h2hSummary.ties > 0 && <span style={{ color: '#64748b', marginLeft: 8 }}>({h2hSummary.ties} tie{h2hSummary.ties !== 1 ? 's' : ''})</span>}
              <span style={{ color: '#64748b', marginLeft: 12, fontSize: 12 }}>{h2hRows.length} matchup{h2hRows.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {teamA && teamB && h2hRows.length === 0 && (
            <div style={{ color: '#475569', marginTop: 20, textAlign: 'center' }}>No head-to-head matchups found</div>
          )}

          {!teamA || !teamB ? (
            <div style={{ color: '#475569', marginTop: 40, textAlign: 'center' }}>Select two teams to see their head-to-head record</div>
          ) : h2hRows.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#475569', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
                  <th style={{ padding: '6px 8px' }}>Season</th>
                  <th style={{ padding: '6px 8px' }}>Week</th>
                  <th style={{ padding: '6px 8px' }}>Winner</th>
                  <th style={{ padding: '6px 8px' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {h2hRows.map((r, i) => (
                  <tr key={`${r.season}-${r.week}`} style={{ borderBottom: '1px solid #0f172a', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                    <td style={{ padding: '8px', color: '#64748b', fontWeight: 700 }}>{r.season}</td>
                    <td style={{ padding: '8px', color: '#64748b' }}>{r.week}</td>
                    <td style={{ padding: '8px', color: r.winner === teamA ? '#84cc16' : '#f1f5f9', fontWeight: 600 }}>{r.winner}</td>
                    <td style={{ padding: '8px', color: '#94a3b8' }}>
                      {r.homeTeam === teamA
                        ? `${r.homeScore}-${r.awayScore}`
                        : `${r.awayScore}-${r.homeScore}`
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      )}

      {/* Category Kings sub-tab */}
      {sub === 'cats' && (
        <div>
          {categoryKings.length === 0 ? (
            <div style={{ color: '#475569', textAlign: 'center', padding: 40 }}>No category data available</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {categoryKings.map(({ statId, statName, leader, wins, total, pct }) => (
                <div key={statId} style={{ background: '#0d0f16', border: '1px solid #1e293b', borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ color: '#84cc16', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{statName}</div>
                  <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{leader}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>{wins} wins ({pct})</div>
                  <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>of {total} matchups</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Playoffs sub-tab */}
      {sub === 'playoffs' && (
        <div>
          {playoffStats.rows.length === 0 ? (
            <div style={{ color: '#475569', textAlign: 'center', padding: 40 }}>No playoff data available</div>
          ) : (
            <>
              <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Playoff Appearance Leaderboard
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 32 }}>
                <thead>
                  <tr style={{ color: '#475569', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
                    <th style={{ padding: '6px 8px', width: 32 }}>#</th>
                    <th style={{ padding: '6px 8px' }}>Franchise</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Playoff Apps</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Post W-L</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Post Win%</th>
                  </tr>
                </thead>
                <tbody>
                  {playoffStats.rows.map((r, i) => (
                    <tr key={r.franchise} style={{ borderBottom: '1px solid #0f172a', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                      <td style={{ padding: '8px', color: '#475569', fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: '8px', color: '#f1f5f9', fontWeight: i < 3 ? 700 : 400 }}>{r.franchise}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#84cc16', fontWeight: 700 }}>{r.apps}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{r.postW}-{r.postL}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#cbd5e1', fontWeight: 700 }}>
                        {r.postWinPct !== '—' ? `${r.postWinPct}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, marginTop: 20 }}>
                Regular Season vs Postseason (Top 8)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ color: '#475569', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
                    <th style={{ padding: '6px 8px' }}>Franchise</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Reg Win%</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Post Win%</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {playoffStats.rows.slice(0, 8).map((r, i) => {
                    const regPct = r.regWinPct !== '—' ? parseFloat(r.regWinPct) : null
                    const postPct = r.postWinPct !== '—' ? parseFloat(r.postWinPct) : null
                    const diff = regPct !== null && postPct !== null ? (postPct - regPct).toFixed(1) : null
                    const diffColor = diff === null ? '#475569' : parseFloat(diff) > 0 ? '#84cc16' : parseFloat(diff) < 0 ? '#f87171' : '#94a3b8'
                    return (
                      <tr key={r.franchise} style={{ borderBottom: '1px solid #0f172a', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                        <td style={{ padding: '8px', color: '#f1f5f9', fontWeight: i < 3 ? 700 : 400 }}>{r.franchise}</td>
                        <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{r.regWinPct !== '—' ? `${r.regWinPct}%` : '—'}</td>
                        <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{r.postWinPct !== '—' ? `${r.postWinPct}%` : '—'}</td>
                        <td style={{ padding: '8px', textAlign: 'center', color: diffColor, fontWeight: 700 }}>
                          {diff !== null ? (parseFloat(diff) > 0 ? `+${diff}%` : `${diff}%`) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* Best Seasons sub-tab */}
      {sub === 'seasons' && (() => {
        const top10 = seasonRecords.slice(0, 10)
        const bottom10 = [...seasonRecords].sort((a, b) => a.winPct - b.winPct).slice(0, 10)

        // Most improved: franchise -> best YoY winPct jump
        const byFranchise = {}
        for (const row of seasonRecords) {
          if (!byFranchise[row.franchise]) byFranchise[row.franchise] = []
          byFranchise[row.franchise].push(row)
        }
        const mostImproved = []
        for (const [franchise, seasons] of Object.entries(byFranchise)) {
          const sorted = [...seasons].sort((a, b) => a.season - b.season)
          let bestJump = -Infinity, bestFrom = null, bestTo = null
          for (let i = 1; i < sorted.length; i++) {
            const jump = sorted[i].winPct - sorted[i - 1].winPct
            if (jump > bestJump) {
              bestJump = jump
              bestFrom = sorted[i - 1].season
              bestTo = sorted[i].season
            }
          }
          if (bestFrom !== null && bestJump > 0) {
            mostImproved.push({ franchise, jump: bestJump, fromSeason: bestFrom, toSeason: bestTo })
          }
        }
        mostImproved.sort((a, b) => b.jump - a.jump)
        const top5Improved = mostImproved.slice(0, 5)

        const leastImproved = []
        for (const [franchise, seasons] of Object.entries(byFranchise)) {
          const sorted = [...seasons].sort((a, b) => a.season - b.season)
          let worstDrop = Infinity, worstFrom = null, worstTo = null
          for (let i = 1; i < sorted.length; i++) {
            const jump = sorted[i].winPct - sorted[i - 1].winPct
            if (jump < worstDrop) {
              worstDrop = jump
              worstFrom = sorted[i - 1].season
              worstTo = sorted[i].season
            }
          }
          if (worstFrom !== null && worstDrop < 0) {
            leastImproved.push({ franchise, jump: worstDrop, fromSeason: worstFrom, toSeason: worstTo })
          }
        }
        leastImproved.sort((a, b) => a.jump - b.jump)
        const top5LeastImproved = leastImproved.slice(0, 5)

        const sectionHeaderStyle = { color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, marginTop: 20 }

        const SeasonTable = ({ rows, highlightFirst, highlightLast }) => (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 8 }}>
            <thead>
              <tr style={{ color: '#475569', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
                <th style={{ padding: '6px 8px', width: 32 }}>#</th>
                <th style={{ padding: '6px 8px' }}>Franchise</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Season</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>W</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>L</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Win%</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Final Rank</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isHighlight = (highlightFirst && i === 0) || (highlightLast && i === rows.length - 1)
                const rowColor = highlightFirst && i === 0 ? '#f59e0b' : highlightLast && i === rows.length - 1 ? '#f87171' : '#f1f5f9'
                const pct = '.' + String(Math.round(r.winPct * 1000)).padStart(3, '0')
                return (
                  <tr key={`${r.franchise}-${r.season}`} style={{ borderBottom: '1px solid #0f172a', background: isHighlight ? 'rgba(255,255,255,0.03)' : i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                    <td style={{ padding: '8px', color: '#475569', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ padding: '8px', color: rowColor, fontWeight: isHighlight ? 700 : 400 }}>{r.franchise}</td>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>{r.season}</td>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{r.wins}</td>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{r.losses}</td>
                    <td style={{ padding: '8px', textAlign: 'center', color: isHighlight ? rowColor : '#cbd5e1', fontWeight: 700 }}>{pct}</td>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>{r.rank || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )

        return (
          <div>
            {seasonRecords.length === 0 ? (
              <div style={{ color: '#475569', textAlign: 'center', padding: 40 }}>No season data available</div>
            ) : (
              <>
                <div style={{ ...sectionHeaderStyle, marginTop: 0 }}>Best Single Seasons</div>
                <SeasonTable rows={top10} highlightFirst={true} highlightLast={false} />

                <div style={sectionHeaderStyle}>Worst Single Seasons</div>
                <SeasonTable rows={bottom10} highlightFirst={false} highlightLast={true} />

                <div style={sectionHeaderStyle}>Most Improved (Year-over-Year)</div>
                {top5Improved.length === 0 ? (
                  <div style={{ color: '#475569', fontSize: 13 }}>Not enough data</div>
                ) : (
                  <div>
                    {top5Improved.map((r) => (
                      <div key={r.franchise} style={{ background: '#0d0f16', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{r.franchise}</span>
                          <span style={{ color: '#64748b', fontSize: 12, marginLeft: 10 }}>{r.fromSeason} → {r.toSeason}</span>
                        </div>
                        <div style={{ color: '#84cc16', fontWeight: 700, fontSize: 15 }}>+{(r.jump * 100).toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={sectionHeaderStyle}>Least Improved (Year-over-Year)</div>
                {top5LeastImproved.length === 0 ? (
                  <div style={{ color: '#475569', fontSize: 13 }}>Not enough data</div>
                ) : (
                  <div>
                    {top5LeastImproved.map((r) => (
                      <div key={r.franchise} style={{ background: '#0d0f16', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{r.franchise}</span>
                          <span style={{ color: '#64748b', fontSize: 12, marginLeft: 10 }}>{r.fromSeason} → {r.toSeason}</span>
                        </div>
                        <div style={{ color: '#f87171', fontWeight: 700, fontSize: 15 }}>{(r.jump * 100).toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )
      })()}
    </div>
  )
}

// ─── FranchisesTab ──────────────────────────────────────────────────────────

function FranchisesTab({ data, results, keepers, activeLeague, selectedFranchise, setSelectedFranchise }) {
  const isMobile = useIsMobile()

  // Build list of all canonical franchise names for the active league(s)
  const allFranchises = useMemo(() => {
    const names = new Set()
    for (const leagues of Object.values(data)) {
      for (const [lg, entries] of Object.entries(leagues)) {
        if (activeLeague !== 'All' && lg !== activeLeague) continue
        for (const e of entries) {
          if (e.team) names.add(normTeam(e.team))
          if (e.from_team) names.add(normTeam(e.from_team))
        }
      }
    }
    return Array.from(names).filter(Boolean).sort()
  }, [data, activeLeague])

  // Sync local select with selectedFranchise prop
  const [localName, setLocalName] = useState(() => selectedFranchise?.name || allFranchises[0] || '')

  useEffect(() => {
    if (selectedFranchise?.name) setLocalName(selectedFranchise.name)
  }, [selectedFranchise])

  useEffect(() => {
    if (!localName && allFranchises.length > 0) setLocalName(allFranchises[0])
  }, [allFranchises, localName])

  const franchise = localName

  // Derive league context: use activeLeague if not 'All', else infer from data
  const franchiseLeague = useMemo(() => {
    if (activeLeague !== 'All') return activeLeague
    if (selectedFranchise?.league && selectedFranchise.league !== 'All') return selectedFranchise.league
    // Find all leagues this franchise appears in
    const leagues = new Set()
    for (const leagueEntries of Object.values(data)) {
      for (const [lg, entries] of Object.entries(leagueEntries)) {
        if (entries.some(e => normTeam(e.team) === franchise || normTeam(e.from_team) === franchise)) {
          leagues.add(lg)
        }
      }
    }
    if (leagues.size === 1) return Array.from(leagues)[0]
    return null // multiple leagues — show all
  }, [data, franchise, activeLeague, selectedFranchise])

  // ── A. Header: all-time W/L record + titles ──────────────────────────────

  const headerStats = useMemo(() => {
    if (!franchise) return null
    let wins = 0, losses = 0, ties = 0, titles = 0, seasons = new Set()
    for (const [lg, leagueYears] of Object.entries(results || {})) {
      if (franchiseLeague && lg !== franchiseLeague) continue
      for (const [season, d] of Object.entries(leagueYears)) {
        if (parseInt(season) >= 2026) continue
        if ((d.format || 'h2h') !== 'h2h') continue
        for (const s of d.standings) {
          if (normTeam(s.team) !== franchise) continue
          seasons.add(`${lg}_${season}`)
          wins += s.wins || 0
          losses += s.losses || 0
          ties += s.ties || 0
          if (s.rank === 1) titles++
        }
      }
    }
    const total = wins + losses + ties
    const winPct = total > 0 ? wins / total : 0
    const pct = '.' + String(Math.round(winPct * 1000)).padStart(3, '0')
    return { wins, losses, ties, pct, titles, seasonCount: seasons.size }
  }, [franchise, results, franchiseLeague])

  // Historical aliases for this franchise
  const aliases = useMemo(() => {
    if (!franchise) return []
    return Object.entries(FRANCHISE_ALIASES)
      .filter(([, canonical]) => canonical === franchise)
      .map(([alias]) => alias)
  }, [franchise])

  // ── B. Season-by-season table ─────────────────────────────────────────────

  const seasonRows = useMemo(() => {
    if (!franchise || !results) return []
    const rows = []
    for (const [lg, leagueYears] of Object.entries(results)) {
      if (franchiseLeague && lg !== franchiseLeague) continue
      for (const [season, d] of Object.entries(leagueYears)) {
        const s = parseInt(season)
        const standing = d.standings.find(st => normTeam(st.team) === franchise)
        if (!standing) continue
        const numTeams = d.standings.length
        const isRoto = (d.format || 'h2h') === 'roto'
        let note = ''
        if (s < 2026) {
          if (standing.rank === 1) note = '🏆 Champion'
          else if (numTeams >= 10 && standing.rank <= 6) note = 'Playoffs'
          else if (numTeams < 10 && standing.rank <= 4) note = 'Playoffs'
        }
        rows.push({
          season: s,
          rank: standing.rank,
          wins: standing.wins,
          losses: standing.losses,
          ties: standing.ties || 0,
          points_for: standing.points_for,
          isRoto,
          note,
          league: lg,
        })
      }
    }
    return rows.sort((a, b) => b.season - a.season)
  }, [franchise, results, franchiseLeague])

  // ── C. Keeper streaks ────────────────────────────────────────────────────

  const keeperStreaks = useMemo(() => {
    if (!franchise || !data) return []
    const streakMap = {}
    for (const [playerName, leagues] of Object.entries(data)) {
      for (const [lg, entries] of Object.entries(leagues)) {
        if (franchiseLeague && lg !== franchiseLeague) continue
        const seasons = buildPlayerSeasons(entries, playerName, lg, keepers)
        // Find longest consecutive kept streak while on this franchise
        let best = 0, bestYears = []
        let cur = 0, curYears = []
        for (const s of seasons) {
          if (s.startTeam === franchise && s.kept) {
            cur++
            curYears.push(s.season)
            if (cur > best) { best = cur; bestYears = [...curYears] }
          } else {
            cur = 0; curYears = []
          }
        }
        if (best >= 2) {
          const key = playerName
          if (!streakMap[key] || best > streakMap[key].streak) {
            streakMap[key] = { player: playerName, streak: best, years: bestYears, league: lg }
          }
        }
      }
    }
    return Object.values(streakMap).sort((a, b) => b.streak - a.streak).slice(0, 10)
  }, [franchise, data, keepers, franchiseLeague])

  // ── D. Top draft picks ────────────────────────────────────────────────────

  const topDraftPicks = useMemo(() => {
    if (!franchise || !data) return []
    const picks = []
    for (const [playerName, leagues] of Object.entries(data)) {
      for (const [lg, entries] of Object.entries(leagues)) {
        if (franchiseLeague && lg !== franchiseLeague) continue
        for (const e of entries) {
          if (e.how === 'drafted' && normTeam(e.team) === franchise) {
            picks.push({ playerName, season: e.season, round: e.round, pick: e.pick, league: lg, score: e.round * 1000 + e.pick })
          }
        }
      }
    }
    return picks.sort((a, b) => a.score - b.score).slice(0, 10)
  }, [franchise, data, franchiseLeague])

  // ── E. Trade history ──────────────────────────────────────────────────────

  const tradeHistory = useMemo(() => {
    if (!franchise || !data) return []
    // Build trade groups same logic as TradesTab
    const txMap = {}
    for (const [playerName, leagues] of Object.entries(data)) {
      for (const [lg, entries] of Object.entries(leagues)) {
        if (franchiseLeague && lg !== franchiseLeague) continue
        for (const e of entries) {
          if (e.how !== 'trade') continue
          const to = normTeam(e.team)
          const from = normTeam(e.from_team)
          if (to !== franchise && from !== franchise) continue
          const key = e.timestamp ? `${e.timestamp}_${lg}` : `notimestamp_${playerName}_${e.season}`
          if (!txMap[key]) txMap[key] = { ts: e.timestamp, league: lg, season: e.season, items: [] }
          txMap[key].items.push({ playerName, entry: e })
        }
      }
    }
    return Object.values(txMap)
      .sort((a, b) => parseInt(b.ts || 0) - parseInt(a.ts || 0))
      .slice(0, 20)
  }, [franchise, data, franchiseLeague])

  // ── F. Head-to-head summary ────────────────────────────────────────────────

  const h2hSummary = useMemo(() => {
    if (!franchise || !results) return []
    const opp = {}
    for (const [lg, leagueYears] of Object.entries(results)) {
      if (franchiseLeague && lg !== franchiseLeague) continue
      for (const [season, d] of Object.entries(leagueYears)) {
        if (parseInt(season) >= 2026) continue
        if ((d.format || 'h2h') !== 'h2h') continue
        for (const m of (d.matchups || [])) {
          const home = normTeam(m.home)
          const away = normTeam(m.away)
          const winner = normTeam(m.winner)
          let opponent = null
          if (home === franchise) opponent = away
          else if (away === franchise) opponent = home
          if (!opponent) continue
          if (!opp[opponent]) opp[opponent] = { w: 0, l: 0 }
          if (winner === franchise) opp[opponent].w++
          else opp[opponent].l++
        }
      }
    }
    return Object.entries(opp)
      .map(([name, r]) => {
        const total = r.w + r.l
        const pct = total > 0 ? (r.w / total * 100).toFixed(1) : '0.0'
        return { name, w: r.w, l: r.l, total, pct }
      })
      .sort((a, b) => b.total - a.total)
  }, [franchise, results, franchiseLeague])

  const cardStyle = {
    background: '#0d0f16',
    border: '1px solid #1e293b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  }
  const sectionTitle = {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 12,
  }

  function formatMonthYear(ts) {
    if (!ts) return null
    const d = new Date(parseInt(ts, 10) * 1000)
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  if (!franchise) return <div style={{ color: '#475569', padding: 40, textAlign: 'center' }}>No franchises found</div>

  return (
    <div>
      {/* Franchise selector */}
      <div style={{ ...S.filterRow, marginBottom: 20 }}>
        <select
          style={{ ...S.select, fontSize: 15, fontWeight: 700 }}
          value={localName}
          onChange={e => { setLocalName(e.target.value); setSelectedFranchise({ name: e.target.value, league: activeLeague }) }}
        >
          {allFranchises.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {/* A. Header card */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#84cc16', marginBottom: 6 }}>{franchise}</div>
        {aliases.length > 0 && (
          <div style={{ color: '#475569', fontSize: 12, marginBottom: 10 }}>
            Also known as: {aliases.join(', ')}
          </div>
        )}
        {headerStats && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ color: '#94a3b8', fontSize: 14 }}>
              <span style={{ fontWeight: 700, color: '#f1f5f9' }}>
                {headerStats.wins}–{headerStats.losses}{headerStats.ties > 0 ? `–${headerStats.ties}` : ''}
              </span>
              {' '}
              <span style={{ color: '#64748b' }}>{headerStats.pct}</span>
            </div>
            {headerStats.titles >= 1 && (
              <div style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '3px 10px', color: '#f59e0b', fontWeight: 700, fontSize: 13 }}>
                🏆 {headerStats.titles} title{headerStats.titles !== 1 ? 's' : ''}
              </div>
            )}
            <div style={{ color: '#64748b', fontSize: 13 }}>{headerStats.seasonCount} season{headerStats.seasonCount !== 1 ? 's' : ''}</div>
          </div>
        )}
      </div>

      {/* B. Season-by-season table */}
      {seasonRows.length > 0 && (
        <div style={cardStyle}>
          <div style={sectionTitle}>Season by Season</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#475569', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
                <th style={{ padding: '4px 8px' }}>Season</th>
                {!franchiseLeague && <th style={{ padding: '4px 8px' }}>League</th>}
                <th style={{ padding: '4px 8px' }}>Record</th>
                <th style={{ padding: '4px 8px', textAlign: 'center' }}>Win%</th>
                <th style={{ padding: '4px 8px', textAlign: 'center' }}>Rank</th>
                <th style={{ padding: '4px 8px' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {seasonRows.map(r => {
                const isChamp = r.note === '🏆 Champion'
                const total = r.wins + r.losses + r.ties
                const winPct = total > 0 ? r.wins / total : 0
                const pct = '.' + String(Math.round(winPct * 1000)).padStart(3, '0')
                return (
                  <tr key={`${r.league}_${r.season}`} style={{ borderBottom: '1px solid #0f172a', background: isChamp ? 'rgba(245,158,11,0.08)' : 'transparent' }}>
                    <td style={{ padding: '6px 8px', color: '#64748b', fontWeight: 700 }}>{r.season}</td>
                    {!franchiseLeague && <td style={{ padding: '6px 8px', color: '#475569', fontSize: 11 }}>{r.league}</td>}
                    <td style={{ padding: '6px 8px', color: '#94a3b8' }}>
                      {r.isRoto ? <span style={{ color: '#64748b' }}>Roto{r.points_for ? ` · ${r.points_for}pts` : ''}</span> : `${r.wins}-${r.losses}${r.ties > 0 ? `-${r.ties}` : ''}`}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', color: '#cbd5e1' }}>{r.isRoto ? '—' : pct}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', color: r.rank === 1 ? '#f59e0b' : '#94a3b8', fontWeight: r.rank === 1 ? 700 : 400 }}>{r.rank}</td>
                    <td style={{ padding: '6px 8px', color: isChamp ? '#f59e0b' : r.note === 'Playoffs' ? '#84cc16' : '#475569', fontSize: 12 }}>{r.note || (r.season >= 2026 ? '—' : '')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* C + D: two-column grid on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 0 }}>
        {/* C. Keeper history */}
        <div style={{ ...cardStyle, marginBottom: 0 }}>
          <div style={sectionTitle}>Longest-Kept Players</div>
          {keeperStreaks.length === 0 ? (
            <div style={{ color: '#475569', fontSize: 13 }}>No keeper streak data</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#475569', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
                  <th style={{ padding: '4px 8px' }}>Player</th>
                  <th style={{ padding: '4px 8px', textAlign: 'center' }}>Streak</th>
                  <th style={{ padding: '4px 8px' }}>Years</th>
                </tr>
              </thead>
              <tbody>
                {keeperStreaks.map((r, i) => (
                  <tr key={r.player} style={{ borderBottom: '1px solid #0f172a', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                    <td style={{ padding: '6px 8px', color: '#f1f5f9' }}>{r.player}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', color: '#84cc16', fontWeight: 700 }}>{r.streak}</td>
                    <td style={{ padding: '6px 8px', color: '#64748b', fontSize: 11 }}>
                      {r.years.length > 1 ? `${r.years[0]}–${r.years[r.years.length - 1]}` : r.years[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* D. Top draft picks */}
        <div style={{ ...cardStyle, marginBottom: 0 }}>
          <div style={sectionTitle}>Notable Draft Picks</div>
          {topDraftPicks.length === 0 ? (
            <div style={{ color: '#475569', fontSize: 13 }}>No draft data</div>
          ) : (
            <div>
              {topDraftPicks.map((p, i) => (
                <div key={`${p.playerName}_${p.season}`} style={{ padding: '5px 0', borderBottom: '1px solid #0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#f1f5f9', fontSize: 13 }}>{p.playerName}</span>
                  <span style={{ color: '#64748b', fontSize: 11, textAlign: 'right' }}>
                    {p.season} · R{p.round}P{p.pick}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* E. Trade history */}
      <div style={{ ...cardStyle, marginTop: 16 }}>
        <div style={sectionTitle}>Trade History</div>
        {tradeHistory.length === 0 ? (
          <div style={{ color: '#475569', fontSize: 13 }}>No trades found</div>
        ) : (
          <div>
            {tradeHistory.map((tx, ti) => {
              const inItems = tx.items.filter(i => normTeam(i.entry.team) === franchise)
              const outItems = tx.items.filter(i => normTeam(i.entry.from_team) === franchise)
              return (
                <div key={`${tx.ts}_${ti}`} style={{ padding: '8px 0', borderBottom: '1px solid #0f172a' }}>
                  <div style={{ color: '#475569', fontSize: 11, marginBottom: 4 }}>
                    {tx.season}{tx.ts ? ` · ${formatMonthYear(tx.ts)}` : ''}{!franchiseLeague ? ` · ${tx.league}` : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {inItems.length > 0 && (
                      <div style={{ fontSize: 13 }}>
                        <span style={{ color: '#84cc16', fontWeight: 700 }}>IN: </span>
                        <span style={{ color: '#f1f5f9' }}>{inItems.map(i => i.playerName).join(', ')}</span>
                      </div>
                    )}
                    {outItems.length > 0 && (
                      <div style={{ fontSize: 13 }}>
                        <span style={{ color: '#f87171', fontWeight: 700 }}>OUT: </span>
                        <span style={{ color: '#f1f5f9' }}>{outItems.map(i => i.playerName).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* F. Head-to-head summary */}
      {h2hSummary.length > 0 && (
        <div style={cardStyle}>
          <div style={sectionTitle}>All-Time vs. Each Franchise</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#475569', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
                <th style={{ padding: '4px 8px' }}>Opponent</th>
                <th style={{ padding: '4px 8px', textAlign: 'center' }}>W</th>
                <th style={{ padding: '4px 8px', textAlign: 'center' }}>L</th>
                <th style={{ padding: '4px 8px', textAlign: 'center' }}>Win%</th>
              </tr>
            </thead>
            <tbody>
              {h2hSummary.map((r, i) => (
                <tr key={r.name} style={{ borderBottom: '1px solid #0f172a', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                  <td style={{ padding: '6px 8px', color: '#f1f5f9' }}>{r.name}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', color: '#84cc16', fontWeight: 700 }}>{r.w}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', color: '#f87171' }}>{r.l}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', color: parseFloat(r.pct) >= 50 ? '#84cc16' : '#f87171', fontWeight: 700 }}>{r.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* G. Draft Grades */}
      {franchiseLeague && (() => {
        const allGrades = computeDraftGrades(data, keepers, franchiseLeague)
        const myGrades = allGrades
          .filter(g => g.franchise === franchise)
          .sort((a, b) => b.season - a.season)

        if (myGrades.length === 0) return null

        const bestGrade = [...myGrades].sort((a, b) => {
          const gradeOrder = { 'A+': 6, 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1 }
          return (gradeOrder[b.grade] - gradeOrder[a.grade]) || b.compositeScore - a.compositeScore
        })[0]

        return (
          <div style={cardStyle}>
            <div style={sectionTitle}>Draft Grades</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 }}>
              <thead>
                <tr style={{ color: '#475569', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
                  <th style={{ padding: '4px 8px' }}>Season</th>
                  <th style={{ padding: '4px 8px', textAlign: 'center' }}>Picks</th>
                  <th style={{ padding: '4px 8px', textAlign: 'center' }}>Kept</th>
                  <th style={{ padding: '4px 8px', textAlign: 'center' }}>Keep%</th>
                  <th style={{ padding: '4px 8px', textAlign: 'center' }}>Avg Yrs</th>
                  <th style={{ padding: '4px 8px', textAlign: 'center' }}>Grade</th>
                  <th style={{ padding: '4px 8px', textAlign: 'center' }}>Steals</th>
                </tr>
              </thead>
              <tbody>
                {myGrades.map(g => {
                  const isBest = g === bestGrade
                  return (
                    <tr key={g.season} style={{ borderBottom: '1px solid #0f172a', background: isBest ? 'rgba(132,204,22,0.04)' : 'transparent', opacity: g.constrained ? 0.55 : 1 }}>
                      <td style={{ padding: '6px 8px', color: '#64748b', fontWeight: 700 }}>
                        {g.season}
                        {g.constrained && <span title={`Only ${g.availableSlots} open keeper slot(s)`} style={{ marginLeft: 4, fontSize: 10, color: '#475569' }}>⚠️</span>}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#94a3b8' }}>{g.totalPicks}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#94a3b8' }}>{g.keptCount}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#cbd5e1' }}>{(g.keepRate * 100).toFixed(0)}%</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: g.avgQuality >= 1.5 ? '#84cc16' : g.avgQuality >= 0.5 ? '#f59e0b' : '#475569', fontWeight: 700 }}>{g.avgQuality.toFixed(1)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: gradeColor(g.grade), fontSize: 16, fontWeight: 700 }}>{g.constrained ? '—' : g.grade}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: g.steals.length > 0 ? '#84cc16' : '#475569', fontWeight: g.steals.length > 0 ? 700 : 400 }}>{g.steals.length}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {bestGrade && (
              <div style={{ color: '#64748b', fontSize: 12 }}>
                Best: <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{bestGrade.season}</span>
                {' · '}
                <span style={{ color: gradeColor(bestGrade.grade), fontWeight: 700 }}>{bestGrade.grade}</span>
                {' · '}
                {bestGrade.steals.length} steal{bestGrade.steals.length !== 1 ? 's' : ''}
                {bestGrade.steals.length > 0 && (
                  <span> including {bestGrade.steals.slice(0, 2).map(s => `${s.player} R${s.round}P${s.pick}`).join(', ')}</span>
                )}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}

// ─── DraftTab ───────────────────────────────────────────────────────────────

function DraftTab({ data, keepers, activeLeague }) {
  const leagueName = activeLeague === 'All' ? 'LXG' : activeLeague
  const [sub, setSub] = useState('best')
  const [yearFilter, setYearFilter] = useState('all')

  const allGrades = useMemo(
    () => computeDraftGrades(data, keepers, leagueName),
    [data, keepers, leagueName]
  )

  const availableYears = useMemo(
    () => [...new Set(allGrades.map(g => g.season))].sort((a, b) => a - b),
    [allGrades]
  )

  const filtered = useMemo(
    () => yearFilter === 'all' ? allGrades : allGrades.filter(g => g.season === parseInt(yearFilter)),
    [allGrades, yearFilter]
  )

  const topBest = useMemo(
    () => [...filtered].sort((a, b) => b.compositeScore - a.compositeScore || b.keptCount - a.keptCount).slice(0, 20),
    [filtered]
  )

  const topWorst = useMemo(
    () => [...filtered]
      .filter(g => !g.constrained)
      .sort((a, b) => a.compositeScore - b.compositeScore || a.keptCount - b.keptCount)
      .slice(0, 20),
    [filtered]
  )

  const franchiseRankings = useMemo(() => {
    const agg = {}
    for (const g of allGrades) {
      if (!agg[g.franchise]) agg[g.franchise] = { franchise: g.franchise, totalPicks: 0, totalKept: 0, seasons: 0, bestGrade: null, bestGradeOrder: -1 }
      agg[g.franchise].totalPicks += g.totalPicks
      agg[g.franchise].totalKept += g.keptCount
      agg[g.franchise].seasons += 1
      const gradeOrder = { 'A+': 6, 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1 }
      const go = gradeOrder[g.grade] || 0
      if (go > agg[g.franchise].bestGradeOrder) {
        agg[g.franchise].bestGradeOrder = go
        agg[g.franchise].bestGrade = g.grade
        agg[g.franchise].bestSeason = g.season
      }
    }
    return Object.values(agg)
      .map(r => ({ ...r, avgKeepRate: r.totalPicks > 0 ? r.totalKept / r.totalPicks : 0 }))
      .sort((a, b) => b.avgKeepRate - a.avgKeepRate)
  }, [allGrades])

  const subBtns = [
    ['best', '🏆 Best Drafts'],
    ['worst', '💀 Worst Drafts'],
    ['rankings', '📊 Franchise Rankings'],
  ]

  const yearFilterEl = sub !== 'rankings' && (
    <select
      value={yearFilter}
      onChange={e => setYearFilter(e.target.value)}
      style={{
        marginLeft: 'auto', padding: '5px 10px', fontSize: 12, borderRadius: 6,
        border: '1px solid #1e293b', background: '#0f172a', color: '#94a3b8',
        cursor: 'pointer',
      }}
    >
      <option value="all">All Years</option>
      {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
    </select>
  )

  function DraftTable({ rows, highlightFirst, highlightLast }) {
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ color: '#475569', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
            <th style={{ padding: '6px 8px', width: 32 }}>#</th>
            <th style={{ padding: '6px 8px' }}>Franchise</th>
            <th style={{ padding: '6px 8px', textAlign: 'center' }}>Season</th>
            <th style={{ padding: '6px 8px', textAlign: 'center' }}>Picks</th>
            <th style={{ padding: '6px 8px', textAlign: 'center' }}>Kept</th>
            <th style={{ padding: '6px 8px', textAlign: 'center' }}>Keep%</th>
            <th style={{ padding: '6px 8px', textAlign: 'center' }}>Avg Yrs</th>
            <th style={{ padding: '6px 8px', textAlign: 'center' }}>Grade</th>
            <th style={{ padding: '6px 8px', textAlign: 'center' }}>Steals</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((g, i) => {
            const isFirst = highlightFirst && i === 0
            const isLast = highlightLast && i === rows.length - 1
            const rowBg = isFirst
              ? 'rgba(245,158,11,0.08)'
              : isLast
              ? 'rgba(248,113,113,0.06)'
              : i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent'
            return (
              <React.Fragment key={`${g.franchise}_${g.season}`}>
                <tr style={{ borderBottom: g.steals.length > 0 ? 'none' : '1px solid #0f172a', background: rowBg }}>
                  <td style={{ padding: '8px', color: isFirst ? '#f59e0b' : '#475569', fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ padding: '8px', color: '#f1f5f9', fontWeight: isFirst ? 700 : 400 }}>{g.franchise}</td>
                  <td style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>{g.season}</td>
                  <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{g.totalPicks}</td>
                  <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{g.keptCount}</td>
                  <td style={{ padding: '8px', textAlign: 'center', color: '#cbd5e1', fontWeight: 700 }}>{(g.keepRate * 100).toFixed(0)}%</td>
                  <td style={{ padding: '8px', textAlign: 'center', color: g.avgQuality >= 1.5 ? '#84cc16' : g.avgQuality >= 0.5 ? '#f59e0b' : '#475569', fontWeight: 700 }}>{g.avgQuality.toFixed(1)}</td>
                  <td style={{ padding: '8px', textAlign: 'center', color: gradeColor(g.grade), fontSize: 16, fontWeight: 700 }}>{g.grade}</td>
                  <td style={{ padding: '8px', textAlign: 'center', color: g.steals.length > 0 ? '#84cc16' : '#475569', fontWeight: g.steals.length > 0 ? 700 : 400 }}>{g.steals.length}</td>
                </tr>
                {g.steals.length > 0 && (
                  <tr style={{ borderBottom: '1px solid #0f172a', background: rowBg }}>
                    <td colSpan={9} style={{ padding: '2px 8px 8px 32px', color: '#64748b', fontSize: 11 }}>
                      Steals: {g.steals.map(s => `${s.player} (R${s.round})`).join(', ')}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {subBtns.map(([id, label]) => (
          <button key={id} onClick={() => setSub(id)} style={{
            padding: '6px 14px', fontSize: 12, borderRadius: 6,
            border: `1px solid ${sub === id ? '#84cc16' : '#1e293b'}`,
            background: sub === id ? 'rgba(132,204,22,0.1)' : 'transparent',
            color: sub === id ? '#84cc16' : '#64748b',
            cursor: 'pointer', fontWeight: sub === id ? 700 : 400,
          }}>
            {label}
          </button>
        ))}
        {yearFilterEl}
      </div>

      {sub === 'best' && (
        allGrades.length === 0
          ? <div style={{ color: '#475569', textAlign: 'center', padding: 40 }}>No draft grade data</div>
          : <DraftTable rows={topBest} highlightFirst={true} highlightLast={false} />
      )}

      {sub === 'worst' && (
        allGrades.length === 0
          ? <div style={{ color: '#475569', textAlign: 'center', padding: 40 }}>No draft grade data</div>
          : <DraftTable rows={topWorst} highlightFirst={false} highlightLast={true} />
      )}

      {sub === 'rankings' && (
        franchiseRankings.length === 0
          ? <div style={{ color: '#475569', textAlign: 'center', padding: 40 }}>No data</div>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#475569', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
                  <th style={{ padding: '6px 8px', width: 32 }}>#</th>
                  <th style={{ padding: '6px 8px' }}>Franchise</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Avg Keep%</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Best Season</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Total Picks</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Total Kept</th>
                </tr>
              </thead>
              <tbody>
                {franchiseRankings.map((r, i) => (
                  <tr key={r.franchise} style={{ borderBottom: '1px solid #0f172a', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                    <td style={{ padding: '8px', color: '#475569', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ padding: '8px', color: '#f1f5f9', fontWeight: i < 3 ? 700 : 400 }}>{r.franchise}</td>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#cbd5e1', fontWeight: 700 }}>{(r.avgKeepRate * 100).toFixed(0)}%</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {r.bestGrade
                        ? <span><span style={{ color: gradeColor(r.bestGrade), fontWeight: 700 }}>{r.bestGrade}</span><span style={{ color: '#64748b', marginLeft: 6, fontSize: 11 }}>{r.bestSeason}</span></span>
                        : '—'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{r.totalPicks}</td>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>{r.totalKept}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
      )}
    </div>
  )
}

// ─── App ───────────────────────────────────────────────────────────────────

export default function App() {
  const isMobile = useIsMobile()
  const [data, setData] = useState(null)
  const [keepers, setKeepers] = useState({})
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('players')
  const [activeLeague, setActiveLeague] = useState('LXG')
  const [selectedFranchise, setSelectedFranchise] = useState(null)

  const handleFranchiseClick = (name, league) => {
    setSelectedFranchise({ name, league: league || activeLeague })
    setTab('franchises')
  }

  useEffect(() => {
    fetch('/ownership_history.json')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(setData)
      .catch(e => setError(e.message))
    fetch('/keepers.json')
      .then(r => r.ok ? r.json() : {})
      .then(setKeepers)
      .catch(() => {})
    fetch('/results_history.json')
      .then(r => r.ok ? r.json() : null)
      .then(setResults)
      .catch(() => {})
  }, [])

  const leagueNames = useMemo(() => {
    if (!data) return []
    const s = new Set()
    for (const leagues of Object.values(data)) {
      for (const l of Object.keys(leagues)) s.add(l)
    }
    return Array.from(s).sort()
  }, [data])

  const filteredData = useMemo(() => {
    if (!data || activeLeague === 'All') return data
    const result = {}
    for (const [playerName, leagues] of Object.entries(data)) {
      if (leagues[activeLeague]) {
        result[playerName] = { [activeLeague]: leagues[activeLeague] }
      }
    }
    return result
  }, [data, activeLeague])

  const playerCount = filteredData ? Object.keys(filteredData).length : 0

  return (
    <div style={{ ...S.app, padding: isMobile ? '12px' : '16px' }}>
      <div style={{ ...S.header, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 10 : 16 }}>
        <div style={{ flex: 1 }}>
          <h1 style={S.title}>League History</h1>
          <p style={S.subtitle}>
            {data
              ? `${playerCount} players · ${activeLeague === 'All' ? leagueNames.join(', ') : activeLeague}`
              : 'Loading...'}
          </p>
        </div>
        {leagueNames.length > 0 && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {['All', ...leagueNames].map(lg => (
              <label
                key={lg}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: `1px solid ${activeLeague === lg ? '#84cc16' : '#1e293b'}`,
                  background: activeLeague === lg ? 'rgba(132,204,22,0.1)' : 'transparent',
                  color: activeLeague === lg ? '#84cc16' : '#94a3b8',
                  fontSize: 13,
                  fontWeight: activeLeague === lg ? 700 : 400,
                  transition: 'all 0.15s',
                  userSelect: 'none',
                }}
              >
                <input
                  type="radio"
                  name="league"
                  value={lg}
                  checked={activeLeague === lg}
                  onChange={() => setActiveLeague(lg)}
                  style={{ display: 'none' }}
                />
                {lg}
              </label>
            ))}
          </div>
        )}
      </div>

      <div style={S.tabs}>
        {['players', 'transactions', 'trades', 'teams', 'lineage', 'leaderboard', 'h2h', 'results', 'franchises', 'draft'].map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {t === 'h2h' ? 'H2H' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ color: '#f87171', padding: 20, background: '#1a0a0a', borderRadius: 8, border: '1px solid #7f1d1d' }}>
          Failed to load data: {error}
        </div>
      )}

      {!data && !error && <Loading />}

      {filteredData && tab === 'players' && <PlayersTab data={filteredData} isMobile={isMobile} keepers={keepers} />}
      {filteredData && tab === 'transactions' && <TransactionsTab data={filteredData} activeLeague={activeLeague} />}
      {filteredData && tab === 'trades' && <TradesTab data={filteredData} activeLeague={activeLeague} />}
      {filteredData && tab === 'teams' && <TeamsTab data={filteredData} activeLeague={activeLeague} keepers={keepers} onFranchiseClick={(name) => handleFranchiseClick(name)} />}
      {filteredData && tab === 'lineage' && <LineageTab data={filteredData} activeLeague={activeLeague} />}
      {filteredData && tab === 'leaderboard' && <LeaderboardTab data={filteredData} activeLeague={activeLeague} keepers={keepers} />}
      {filteredData && tab === 'h2h' && <H2HTab data={filteredData} activeLeague={activeLeague} />}
      {filteredData && results && tab === 'results' && <ResultsTab results={results} activeLeague={activeLeague} onFranchiseClick={(name) => handleFranchiseClick(name)} />}
      {data && tab === 'franchises' && <FranchisesTab data={data} results={results || {}} keepers={keepers} activeLeague={activeLeague} selectedFranchise={selectedFranchise} setSelectedFranchise={setSelectedFranchise} />}
      {data && tab === 'draft' && <DraftTab data={data} keepers={keepers} activeLeague={activeLeague} />}
    </div>
  )
}
