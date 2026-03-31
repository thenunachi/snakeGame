import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const LEVEL_ORDER = ['easy', 'medium', 'hard'];
const LEVEL_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export default function ScoresPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/scores/me'),
      api.get('/api/scores/history'),
    ])
      .then(([sumRes, histRes]) => {
        setSummary(sumRes.data);
        setHistory(histRes.data);
      })
      .catch(() => setError('Failed to load scores'))
      .finally(() => setLoading(false));
  }, []);

  const levelsCrossed = summary.map(s => s.level);
  const totalGames = summary.reduce((acc, s) => acc + s.games_played, 0);
  const bestEver = summary.reduce((acc, s) => Math.max(acc, s.best_score), 0);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
        Loading scores...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 16px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#f8fafc' }}>
          My Stats
        </h1>
        <p style={{ color: '#94a3b8', marginTop: 4 }}>
          Hey <span style={{ color: '#22c55e', fontWeight: 600 }}>{user?.username}</span>! Here are your scores.
        </p>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 32 }}>
        <StatCard label="Total Games" value={totalGames} color="#3b82f6" />
        <StatCard label="Best Score" value={bestEver} color="#fbbf24" />
        <StatCard label="Levels Played" value={`${levelsCrossed.length} / 3`} color="#22c55e" />
      </div>

      {/* Levels crossed */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
          Levels Crossed
        </h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {LEVEL_ORDER.map(lvl => {
            const done = levelsCrossed.includes(lvl);
            const colors = { easy: '#22c55e', medium: '#fbbf24', hard: '#ef4444' };
            return (
              <div
                key={lvl}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 8,
                  background: done ? `rgba(${lvl === 'easy' ? '34,197,94' : lvl === 'medium' ? '251,191,36' : '239,68,68'},0.15)` : '#1e293b',
                  border: `1px solid ${done ? colors[lvl] + '60' : '#334155'}`,
                }}
              >
                <span style={{ fontSize: 18 }}>{done ? '✅' : '🔒'}</span>
                <span style={{ color: done ? colors[lvl] : '#64748b', fontWeight: 600 }}>
                  {LEVEL_LABEL[lvl]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-level best scores */}
      {summary.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
            Best Scores by Level
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['Level', 'Best Score', 'Games Played'].map(h => (
                  <th key={h} style={{ textAlign: 'left', color: '#64748b', fontSize: 12, padding: '6px 12px', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LEVEL_ORDER.filter(l => summary.find(s => s.level === l)).map(lvl => {
                const s = summary.find(x => x.level === lvl);
                return (
                  <tr key={lvl} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`badge badge-${lvl}`}>{LEVEL_LABEL[lvl]}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700 }}>
                      {s.best_score}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {s.games_played}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent history */}
      {history.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
            Recent Games
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((h, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', background: '#0f172a', borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge badge-${h.level}`}>{LEVEL_LABEL[h.level]}</span>
                  <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700 }}>{h.score} pts</span>
                </div>
                <span style={{ color: '#475569', fontSize: 12 }}>
                  {new Date(h.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
          <p style={{ fontSize: 18, marginBottom: 8 }}>No scores yet!</p>
          <p style={{ marginBottom: 20 }}>Play your first game to see your stats here.</p>
          <Link to="/">
            <button className="btn btn-primary">Play Now</button>
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: '#1e293b', border: '1px solid #334155',
      borderRadius: 12, padding: '16px 20px',
    }}>
      <div style={{ color: '#64748b', fontSize: 12, marginBottom: 6 }}>{label}</div>
      <div style={{ color, fontSize: 28, fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}
