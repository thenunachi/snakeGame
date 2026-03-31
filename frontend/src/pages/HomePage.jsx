import { useNavigate } from 'react-router-dom';

const LEVELS = [
  {
    id: 'easy',
    label: 'Easy',
    emoji: '🟢',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.4)',
    description: 'Slow snake, sparse fruits',
    details: ['Snake speed: Relaxed', 'Fruits: Appear slowly', '1 fruit on board'],
  },
  {
    id: 'medium',
    label: 'Medium',
    emoji: '🟡',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.1)',
    border: 'rgba(251,191,36,0.4)',
    description: 'Moderate speed, more fruits',
    details: ['Snake speed: Moderate', 'Fruits: Appear frequently', '2 fruits on board'],
  },
  {
    id: 'hard',
    label: 'Hard',
    emoji: '🔴',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.4)',
    description: 'Fast snake, fruits everywhere',
    details: ['Snake speed: Fast', 'Fruits: Appear rapidly', '3 fruits on board'],
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 16px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🐍</div>
        <h1 style={{ fontSize: 42, fontWeight: 800, color: '#22c55e', marginBottom: 12 }}>
          Snake Game
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 18 }}>
          Classic snake, 3 difficulty levels. Eat fruits, grow longer, don't crash!
        </p>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>
          Use <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: 4, color: '#e2e8f0' }}>Arrow Keys</kbd> or{' '}
          <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: 4, color: '#e2e8f0' }}>WASD</kbd> to control
        </p>
      </div>

      {/* Level cards */}
      <h2 style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
        Choose Your Level
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {LEVELS.map((lvl) => (
          <button
            key={lvl.id}
            onClick={() => navigate(`/game/${lvl.id}`)}
            style={{
              background: lvl.bg,
              border: `2px solid ${lvl.border}`,
              borderRadius: 12,
              padding: '24px 20px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'transform 0.15s, border-color 0.15s',
              color: 'inherit',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = lvl.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.borderColor = lvl.border;
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>{lvl.emoji}</div>
            <div style={{ color: lvl.color, fontWeight: 700, fontSize: 22, marginBottom: 4 }}>
              {lvl.label}
            </div>
            <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
              {lvl.description}
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {lvl.details.map((d) => (
                <li key={d} style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>
                  • {d}
                </li>
              ))}
            </ul>
            <div style={{
              marginTop: 16,
              background: lvl.color,
              color: '#0f172a',
              fontWeight: 700,
              fontSize: 14,
              padding: '8px 0',
              borderRadius: 8,
              textAlign: 'center',
            }}>
              Play {lvl.label}
            </div>
          </button>
        ))}
      </div>

      {/* How to play */}
      <div style={{
        marginTop: 48,
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 12,
        padding: 24,
      }}>
        <h3 style={{ color: '#f8fafc', marginBottom: 16 }}>How to Play</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { icon: '🕹️', text: 'Arrow Keys or WASD to move' },
            { icon: '🍎', text: 'Eat fruits to grow and score' },
            { icon: '💀', text: 'Avoid walls and your own tail' },
            { icon: '🏆', text: 'Login to save your high scores' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: 14 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
