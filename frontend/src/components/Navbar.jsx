import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      background: '#1e293b',
      borderBottom: '1px solid #334155',
      padding: '0 16px',
    }}>
      <div style={{
        maxWidth: 960,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontSize: 24 }}>🐍</span>
          <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>
            SnakeGame
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/" style={{ color: '#94a3b8', fontSize: 14, textDecoration: 'none' }}>
            Play
          </Link>
          <Link to="/leaderboard" style={{ color: '#94a3b8', fontSize: 14, textDecoration: 'none' }}>
            Leaderboard
          </Link>
          {user && (
            <Link to="/scores" style={{ color: '#94a3b8', fontSize: 14, textDecoration: 'none' }}>
              My Scores
            </Link>
          )}
        </div>

        {/* Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <span style={{ color: '#22c55e', fontSize: 14, fontWeight: 600 }}>
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ padding: '6px 16px', fontSize: 13 }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: 13 }}>
                  Login
                </button>
              </Link>
              <Link to="/register">
                <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 13 }}>
                  Register
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
