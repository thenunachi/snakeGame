import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const LEVEL_ORDER = ['easy', 'medium', 'hard'];
const LEVEL_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export default function LeaderboardPage() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/leaderboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? data : data.filter(d => d.level === filter);

  // Group by position within each level
  const ranked = filtered.map((entry, i) => ({ ...entry, rank: i + 1 }));

  const medal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#f8fafc' }}>Leaderboard</h1>
          <p style={{ color: '#94a3b8', marginTop: 4 }}>Top scores across all players</p>
        </div>
        <Link to="/">
          <button className="btn btn-primary">Play Now</button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['all', ...LEVEL_ORDER].map(lvl => (
          <button
            key={lvl}
            onClick={() => setFilter(lvl)}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background: filter === lvl ? '#22c55e' : '#1e293b',
              color: filter === lvl ? '#0f172a' : '#94a3b8',
              transition: 'background 0.15s',
            }}
          >
            {lvl === 'all' ? 'All Levels' : LEVEL_LABEL[lvl]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Loading...</div>
      ) : ranked.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>
          <p style={{ fontSize: 16, marginBottom: 12 }}>No scores yet. Be the first!</p>
          <Link to="/">
            <button className="btn btn-primary">Play a Game</button>
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#263248', borderBottom: '1px solid #334155' }}>
                {['Rank', 'Player', 'Level', 'Best Score'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', color: '#64748b', fontSize: 12,
                    padding: '12px 16px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranked.map((entry, i) => (
                <tr
                  key={`${entry.username}-${entry.level}`}
                  style={{
                    borderBottom: '1px solid #1e293b',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  }}
                >
                  <td style={{ padding: '12px 16px', fontSize: 18 }}>
                    {medal(entry.rank)}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#f8fafc', fontWeight: 600 }}>
                    {entry.username}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge badge-${entry.level}`}>{LEVEL_LABEL[entry.level]}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700, fontSize: 17 }}>
                    {entry.best_score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
