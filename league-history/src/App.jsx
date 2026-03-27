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

function TeamsTab({ data, activeLeague, keepers }) {
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
                    <div style={{ fontWeight: 700, color: '#84cc16', marginBottom: 10, fontSize: 13 }}>{team}</div>
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

  const subBtns = [
    ['alltime', '🏆 All-Time Streaks'],
    ['active', '🔥 Active Streaks'],
    ['tenured', '📅 Longest Tenured'],
  ]

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

      {rows.length === 0 ? (
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

// ─── App ───────────────────────────────────────────────────────────────────

export default function App() {
  const isMobile = useIsMobile()
  const [data, setData] = useState(null)
  const [keepers, setKeepers] = useState({})
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('players')
  const [activeLeague, setActiveLeague] = useState('LXG')

  useEffect(() => {
    fetch('/ownership_history.json')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(setData)
      .catch(e => setError(e.message))
    fetch('/keepers.json')
      .then(r => r.ok ? r.json() : {})
      .then(setKeepers)
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
        {['players', 'transactions', 'trades', 'teams', 'lineage', 'leaderboard'].map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
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
      {filteredData && tab === 'teams' && <TeamsTab data={filteredData} activeLeague={activeLeague} keepers={keepers} />}
      {filteredData && tab === 'lineage' && <LineageTab data={filteredData} activeLeague={activeLeague} />}
      {filteredData && tab === 'leaderboard' && <LeaderboardTab data={filteredData} activeLeague={activeLeague} keepers={keepers} />}
    </div>
  )
}
