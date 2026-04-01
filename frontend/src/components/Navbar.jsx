import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav style={{
      background: '#000',
      borderBottom: '2px solid #00ff41',
      boxShadow: '0 2px 16px rgba(0,255,65,0.35)',
      padding: '0 16px',
      position: 'relative',
    }}>
      {/* Scanline overlay on nav */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 4px)',
      }} />

      <div style={{
        maxWidth: 960, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56, position: 'relative', zIndex: 1,
      }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🐍</span>
          <span style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 13,
            color: '#00ff41',
            textShadow: '0 0 8px #00ff41, 0 0 20px rgba(0,255,65,0.4)',
            letterSpacing: 1,
          }}>
            SNAKE
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { to: '/', label: 'PLAY' },
            { to: '/leaderboard', label: 'SCORES' },
            { to: '/customize', label: '🎨 SKINS' },
            ...(user ? [{ to: '/scores', label: 'MY STATS' }] : []),
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 7,
              color: '#4dbb4d',
              textDecoration: 'none',
              padding: '6px 10px',
              border: '1px solid transparent',
              transition: 'color 0.1s, border-color 0.1s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#00ffff';
                e.currentTarget.style.borderColor = '#00ffff';
                e.currentTarget.style.textShadow = '0 0 6px #00ffff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#4dbb4d';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.textShadow = 'none';
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <>
              <span style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                color: '#00ff41',
                textShadow: '0 0 6px #00ff41',
              }}>
                ▶ {user.username}
              </span>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="btn btn-danger"
                style={{ padding: '5px 12px', fontSize: '7px' }}
              >
                LOGOUT
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '7px' }}>
                  LOGIN
                </button>
              </Link>
              <Link to="/register">
                <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '7px' }}>
                  REGISTER
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
