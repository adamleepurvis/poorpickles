import { useState } from 'react'
import DraftAssistant from './DraftAssistant.jsx'
import { POOR_PICKLES_CONFIG } from '../leagues/poor_pickles.js'
// import { OTHER_LEAGUE_CONFIG } from '../leagues/other_league.js'  // add more leagues here

const LEAGUES = [
  { id: 'poor_pickles', label: 'Poor Pickles (12-team)', config: POOR_PICKLES_CONFIG },
  // { id: 'other', label: 'Other League', config: OTHER_LEAGUE_CONFIG },
]

export default function App() {
  const [selectedLeague, setSelectedLeague] = useState(LEAGUES[0].id)
  const league = LEAGUES.find(l => l.id === selectedLeague)

  // If only one league, skip the selector entirely
  if (LEAGUES.length === 1) {
    return <DraftAssistant config={LEAGUES[0].config} />
  }

  return (
    <div style={{ background: '#08090d', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#0b0d14', borderBottom: '1px solid #1e293b', padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#334155', letterSpacing: '.08em', textTransform: 'uppercase' }}>League:</span>
        {LEAGUES.map(l => (
          <button key={l.id}
            onClick={() => setSelectedLeague(l.id)}
            style={{
              cursor: 'pointer', border: 'none', fontFamily: 'monospace',
              fontSize: 11, padding: '4px 10px', borderRadius: 3,
              background: selectedLeague === l.id ? '#f59e0b22' : '#1e293b',
              color: selectedLeague === l.id ? '#f59e0b' : '#64748b',
              borderBottom: selectedLeague === l.id ? '2px solid #f59e0b' : '2px solid transparent',
            }}>
            {l.label}
          </button>
        ))}
      </div>
      <DraftAssistant config={league.config} />
    </div>
  )
}
