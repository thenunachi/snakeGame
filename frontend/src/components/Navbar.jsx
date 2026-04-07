import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const PX = "'Press Start 2P', monospace";

  const navLinks = [
    { to: '/', label: 'PLAY' },
    { to: '/leaderboard', label: 'SCORES' },
    { to: '/customize', label: '🎨 SKINS' },
    ...(user ? [{ to: '/scores', label: 'MY STATS' }] : []),
  ];

  return (
    <nav style={{ background: '#000', borderBottom: '2px solid #00ff41', boxShadow: '0 2px 16px rgba(0,255,65,0.35)', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 4px)' }} />

      {/* ── Main row ── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 20 }}>🐍</span>
          <span style={{ fontFamily: PX, fontSize: 11, color: '#00ff41', textShadow: '0 0 8px #00ff41', letterSpacing: 1 }}>SNAKE</span>
        </Link>

        {/* Desktop nav links */}
        <div className="nav-desktop-links" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} style={{ fontFamily: PX, fontSize: 7, color: '#4dbb4d', textDecoration: 'none', padding: '6px 8px', border: '1px solid transparent', transition: 'color 0.1s' }}
              onMouseEnter={e => { e.currentTarget.style.color='#00ffff'; e.currentTarget.style.borderColor='#00ffff'; e.currentTarget.style.textShadow='0 0 6px #00ffff'; }}
              onMouseLeave={e => { e.currentTarget.style.color='#4dbb4d'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.textShadow='none'; }}>
              {label}
            </Link>
          ))}
        </div>

        {/* Auth + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Desktop auth */}
          <div className="nav-desktop-auth" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {user ? (
              <>
                <span style={{ fontFamily: PX, fontSize: 7, color: '#00ff41', textShadow: '0 0 6px #00ff41' }}>▶ {user.username}</span>
                <button onClick={() => { logout(); navigate('/'); }} className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '7px' }}>LOGOUT</button>
              </>
            ) : (
              <>
                <Link to="/login"><button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '7px' }}>LOGIN</button></Link>
                <Link to="/register"><button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: '7px' }}>REGISTER</button></Link>
              </>
            )}
          </div>

          {/* Hamburger (mobile only) */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            style={{ display: 'none', background: 'none', border: '1px solid #00ff41', color: '#00ff41', padding: '4px 8px', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown ── */}
      {menuOpen && (
        <div className="nav-mobile-menu" style={{ borderTop: '1px solid #00ff4133', padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 1 }}>
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)} style={{ fontFamily: PX, fontSize: 8, color: '#4dbb4d', textDecoration: 'none', padding: '6px 0' }}>{label}</Link>
          ))}
          <div style={{ borderTop: '1px solid #00ff4122', paddingTop: 8, display: 'flex', gap: 8 }}>
            {user ? (
              <>
                <span style={{ fontFamily: PX, fontSize: 7, color: '#00ff41', alignSelf: 'center' }}>▶ {user.username}</span>
                <button onClick={() => { logout(); navigate('/'); setMenuOpen(false); }} className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '7px' }}>LOGOUT</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}><button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '7px' }}>LOGIN</button></Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}><button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: '7px' }}>REGISTER</button></Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
