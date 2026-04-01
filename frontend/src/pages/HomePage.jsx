import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PX = "'Press Start 2P', monospace";

const LEVELS = [
  {
    id: 'easy',
    label: 'EASY',
    color: '#00ff41',
    border: 'rgba(0,255,65,0.3)',
    bg: 'rgba(0,255,65,0.05)',
    details: ['Speed: Slow', 'Fruits: Sparse', '1 fruit on board'],
  },
  {
    id: 'medium',
    label: 'MEDIUM',
    color: '#ffdd00',
    border: 'rgba(255,221,0,0.3)',
    bg: 'rgba(255,221,0,0.05)',
    details: ['Speed: Moderate', 'Fruits: Regular', '2 fruits on board'],
  },
  {
    id: 'hard',
    label: 'HARD',
    color: '#ff2255',
    border: 'rgba(255,34,85,0.3)',
    bg: 'rgba(255,34,85,0.05)',
    details: ['Speed: Fast', 'Fruits: Frequent', '3 fruits on board'],
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px' }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          fontFamily: PX, fontSize: 28,
          color: '#00ff41',
          textShadow: '0 0 10px #00ff41, 0 0 24px rgba(0,255,65,0.4)',
          marginBottom: 8,
          letterSpacing: 3,
        }}>
          🐍 SNAKE
        </div>
        <div style={{ fontFamily: PX, fontSize: 9, color: '#2a6e2a', letterSpacing: 2, marginBottom: 20 }}>
          INSERT COIN TO PLAY
        </div>

        {/* Guest / logged-in banner */}
        {user ? (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(0,255,65,0.08)', border: '1px solid #00ff4144',
            padding: '8px 20px', fontFamily: PX, fontSize: 8,
          }}>
            <span style={{ color: '#00ff41' }}>▶ {user.username}</span>
            <span style={{ color: '#2a6e2a' }}>SCORES WILL BE SAVED</span>
          </div>
        ) : (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 14,
            background: 'rgba(255,221,0,0.06)', border: '1px solid #ffdd0044',
            padding: '10px 20px',
          }}>
            <span style={{ fontFamily: PX, fontSize: 7, color: '#ffdd00' }}>
              GUEST MODE
            </span>
            <span style={{ fontFamily: PX, fontSize: 7, color: '#4a4a00' }}>
              SCORES NOT SAVED
            </span>
            <span style={{ fontFamily: PX, fontSize: 7, color: '#2a6e2a' }}>|</span>
            <Link to="/login" style={{ fontFamily: PX, fontSize: 7, color: '#00ffff' }}>LOGIN</Link>
            <span style={{ fontFamily: PX, fontSize: 7, color: '#2a6e2a' }}>or</span>
            <Link to="/register" style={{ fontFamily: PX, fontSize: 7, color: '#00ff41' }}>REGISTER</Link>
            <span style={{ fontFamily: PX, fontSize: 7, color: '#2a6e2a' }}>to save</span>
          </div>
        )}
      </div>

      {/* ── Level select ── */}
      <div style={{ fontFamily: PX, fontSize: 8, color: '#2a6e2a', letterSpacing: 2, marginBottom: 16 }}>
        SELECT LEVEL
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {LEVELS.map((lvl) => (
          <button
            key={lvl.id}
            onClick={() => navigate(`/game/${lvl.id}`)}
            style={{
              background: lvl.bg,
              border: `2px solid ${lvl.border}`,
              padding: '22px 18px',
              cursor: 'pointer',
              textAlign: 'left',
              color: 'inherit',
              transition: 'border-color 0.1s, box-shadow 0.1s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = lvl.color;
              e.currentTarget.style.boxShadow = `0 0 14px ${lvl.color}44`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = lvl.border;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              fontFamily: PX, fontSize: 13, color: lvl.color,
              textShadow: `0 0 8px ${lvl.color}`,
              marginBottom: 14,
            }}>
              {lvl.label}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: 18 }}>
              {lvl.details.map(d => (
                <li key={d} style={{ fontFamily: PX, fontSize: 7, color: '#2a6e2a', marginBottom: 7 }}>
                  › {d}
                </li>
              ))}
            </ul>
            <div style={{
              background: lvl.color, color: '#000',
              fontFamily: PX, fontSize: 8,
              padding: '9px 0', textAlign: 'center',
              boxShadow: `3px 3px 0 ${lvl.color}88`,
            }}>
              ▶ PLAY
            </div>
          </button>
        ))}
      </div>

      {/* ── Guest callout (only for non-logged-in) ── */}
      {!user && (
        <div style={{
          marginTop: 24,
          background: '#000',
          border: '2px solid #00ff4133',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <div style={{ fontFamily: PX, fontSize: 8, color: '#00ff41', marginBottom: 8 }}>
              WANT TO SAVE YOUR SCORES?
            </div>
            <div style={{ fontFamily: PX, fontSize: 7, color: '#2a6e2a', lineHeight: 2 }}>
              CREATE A FREE ACCOUNT TO TRACK YOUR<br />HIGH SCORES AND CLIMB THE LEADERBOARD
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/register">
              <button className="btn btn-primary" style={{ fontSize: '8px' }}>REGISTER FREE</button>
            </Link>
            <Link to="/login">
              <button className="btn btn-secondary" style={{ fontSize: '8px' }}>LOGIN</button>
            </Link>
          </div>
        </div>
      )}

      {/* ── How to play ── */}
      <div style={{
        marginTop: 24, background: '#000',
        border: '1px solid #1a4d1a', padding: '18px 20px',
      }}>
        <div style={{ fontFamily: PX, fontSize: 8, color: '#2a6e2a', marginBottom: 14 }}>
          HOW TO PLAY
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            ['🕹️', 'ARROW KEYS / WASD'],
            ['🍎', 'EAT FRUITS TO GROW'],
            ['💀', 'AVOID WALLS + TAIL'],
            ['👻', 'RARE FRUITS = POWERS'],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ fontFamily: PX, fontSize: 7, color: '#2a6e2a' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
