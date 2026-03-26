import React, { useState, useEffect, useMemo, useCallback } from 'react'

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

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return null
  const d = new Date(parseInt(ts, 10) * 1000)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function howLabel(entry) {
  if (entry.how === 'drafted') {
    return `Drafted R${entry.round}P${entry.pick}`
  }
  if (entry.how === 'trade') {
    return `Traded from ${entry.from_team || '?'}`
  }
  if (entry.how === 'add') {
    return 'Added (waivers/FA)'
  }
  if (entry.how === 'drop') {
    return 'Dropped'
  }
  return entry.how
}

// Build per-player, per-league season summaries
// Each season: { season, entries, startTeam, endTeam, events }
function buildPlayerSeasons(leagueEntries) {
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

    // Detect "kept": first entry is drafted AND team matches prev season end team
    let kept = false
    if (
      firstEntry.how === 'drafted' &&
      prevSeason &&
      prevSeason.endTeam === firstEntry.team
    ) {
      kept = true
    }

    result.push({
      season,
      entries,
      startTeam: firstEntry.team,
      endTeam: lastTeam,
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
        const team = entry.team
        if (!rosters[team]) rosters[team] = new Set()
        // If traded, remove from previous team
        if (entry.how === 'trade' && entry.from_team) {
          rosters[entry.from_team]?.delete(playerName)
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

function PlayerTimeline({ playerName, leagues }) {
  return (
    <div style={S.card}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14, color: '#f1f5f9' }}>
        {playerName}
      </div>
      {Object.entries(leagues).map(([leagueName, entries]) => {
        const seasons = buildPlayerSeasons(entries)
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
                      <Badge type={entry.how === 'trade' ? 'TRADE' : entry.how === 'add' ? 'ADD' : 'DROP'} />
                      <span style={S.secondary}>{howLabel(entry)}</span>
                      {entry.timestamp && <span style={S.muted}>{formatDate(entry.timestamp)}</span>}
                    </div>
                  )
                }
              } else {
                for (const entry of sEntries) {
                  let badgeType = 'DRAFT'
                  if (entry.how === 'trade') badgeType = 'TRADE'
                  else if (entry.how === 'add') badgeType = 'ADD'
                  else if (entry.how === 'drop') badgeType = 'DROP'

                  rows.push(
                    <div key={entry.timestamp || `${entry.how}-${entry.round}`} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                      <Badge type={badgeType} />
                      {entry.how !== 'drop' && (
                        <span style={{ fontWeight: entry.how === 'drafted' ? 600 : 400, color: '#f1f5f9' }}>
                          {entry.team}
                        </span>
                      )}
                      {entry.how === 'drop' && (
                        <span style={{ color: '#f87171' }}>Dropped by {entry.team}</span>
                      )}
                      <span style={S.secondary}>{howLabel(entry)}</span>
                      {entry.timestamp && <span style={S.muted}>{formatDate(entry.timestamp)}</span>}
                    </div>
                  )
                }
              }

              // If traded mid-season (multiple teams), show the team flow
              const teams = [...new Set(sEntries.filter(e => e.how !== 'drop').map(e => e.team))]
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

function PlayersTab({ data, isMobile }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const allPlayers = useMemo(() => {
    return Object.keys(data).sort((a, b) => a.localeCompare(b))
  }, [data])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return allPlayers
    return allPlayers.filter(p => p.toLowerCase().includes(q))
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
        currentTeam = last.how === 'drop' ? null : last.team
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
        <PlayerTimeline playerName={selected} leagues={data[selected]} />
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
              <PlayerTimeline playerName={selected} leagues={data[selected]} />
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
                  <span style={S.arrow}>{item.entry.from_team || '?'}</span>
                  <span style={S.arrow}>→</span>
                  <span style={{ color: '#84cc16' }}>{item.entry.team}</span>
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

// ─── Teams Tab ─────────────────────────────────────────────────────────────

function TeamsTab({ data, activeLeague }) {
  const leagues = useMemo(() => {
    const s = new Set()
    for (const leagues of Object.values(data)) {
      for (const l of Object.keys(leagues)) s.add(l)
    }
    return Array.from(s).sort()
  }, [data])

  const [selectedLeagueLocal, setSelectedLeagueLocal] = useState(leagues[0] || '')
  const [selectedSeason, setSelectedSeason] = useState('All')

  const selectedLeague = activeLeague !== 'All' ? activeLeague : selectedLeagueLocal

  const seasons = useMemo(() => {
    const s = new Set()
    for (const leagues of Object.values(data)) {
      for (const [lName, entries] of Object.entries(leagues)) {
        if (lName === selectedLeague) {
          for (const e of entries) s.add(e.season)
        }
      }
    }
    return Array.from(s).sort((a, b) => b - a)
  }, [data, selectedLeague])

  const displaySeason = selectedSeason === 'All' ? (seasons[0] || null) : parseInt(selectedSeason)

  const rosters = useMemo(() => {
    if (!displaySeason || !selectedLeague) return {}
    return computeRostersForLeague(data, selectedLeague, displaySeason)
  }, [data, selectedLeague, displaySeason])

  const teamNames = Object.keys(rosters).sort()

  return (
    <div>
      <div style={S.filterRow}>
        {activeLeague === 'All' && (
          <select style={S.select} value={selectedLeagueLocal} onChange={e => { setSelectedLeagueLocal(e.target.value); setSelectedSeason('All') }}>
            {leagues.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        )}
        <select style={S.select} value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)}>
          <option value="All">Latest ({seasons[0]})</option>
          {seasons.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {displaySeason && (
          <span style={S.muted}>{teamNames.length} team{teamNames.length !== 1 ? 's' : ''} &middot; {displaySeason}</span>
        )}
      </div>

      {teamNames.length === 0 && (
        <div style={{ color: '#475569', marginTop: 40, textAlign: 'center' }}>No roster data for this selection</div>
      )}

      <div style={{ maxHeight: 'calc(100vh - 230px)', overflowY: 'auto', paddingRight: 4 }}>
        <div style={S.teamGrid}>
          {teamNames.map(team => {
            const players = Array.from(rosters[team]).sort()
            return (
              <div key={team} style={S.teamCard}>
                <div style={{ fontWeight: 700, color: '#84cc16', marginBottom: 10, fontSize: 13 }}>
                  {team}
                </div>
                <div style={S.muted}>{players.length} player{players.length !== 1 ? 's' : ''}</div>
                <div style={{ marginTop: 8 }}>
                  {players.map(p => (
                    <div key={p} style={{ padding: '3px 0', borderBottom: '1px solid #1a2133', color: '#f1f5f9', fontSize: 12 }}>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── App ───────────────────────────────────────────────────────────────────

export default function App() {
  const isMobile = useIsMobile()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('players')
  const [activeLeague, setActiveLeague] = useState('LXG')

  useEffect(() => {
    fetch('/ownership_history.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
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
        {['players', 'transactions', 'teams'].map(t => (
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

      {filteredData && tab === 'players' && <PlayersTab data={filteredData} isMobile={isMobile} />}
      {filteredData && tab === 'transactions' && <TransactionsTab data={filteredData} activeLeague={activeLeague} />}
      {filteredData && tab === 'teams' && <TeamsTab data={filteredData} activeLeague={activeLeague} />}
    </div>
  )
}
