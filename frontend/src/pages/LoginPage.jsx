import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: 'calc(100vh - 56px)', padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🐍</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f8fafc' }}>Welcome Back</h1>
          <p style={{ color: '#94a3b8', marginTop: 6 }}>Sign in to track your scores</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && <div className="error-msg">{error}</div>}

            <div>
              <label className="label">Username</label>
              <input
                className="input-field"
                type="text"
                placeholder="Your username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="Your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 20 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#22c55e' }}>Register here</Link>
          </p>

          <div style={{ borderTop: '1px solid #1a4d1a', marginTop: 20, paddingTop: 20, textAlign: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: '1px solid #1a4d1a',
                  color: '#2a6e2a',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 8,
                  padding: '10px 20px',
                  cursor: 'pointer',
                  width: '100%',
                  letterSpacing: 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ff41'; e.currentTarget.style.color = '#00ff41'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a4d1a'; e.currentTarget.style.color = '#2a6e2a'; }}
              >
                ▶ PLAY AS GUEST (no account needed)
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
