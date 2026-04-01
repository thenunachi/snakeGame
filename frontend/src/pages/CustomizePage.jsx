import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SKINS, THEMES } from '../constants/gameConfig';

export default function CustomizePage() {
  const [selectedSkin,  setSelectedSkin]  = useState(localStorage.getItem('snake_skin')  || 'classic');
  const [selectedTheme, setSelectedTheme] = useState(localStorage.getItem('snake_theme') || 'dark');
  const bestScore = parseInt(localStorage.getItem('snake_best_score') || '0', 10);

  const selectSkin = (id) => {
    setSelectedSkin(id);
    localStorage.setItem('snake_skin', id);
  };

  const selectTheme = (id) => {
    setSelectedTheme(id);
    localStorage.setItem('snake_theme', id);
  };

  const isUnlocked = (unlockScore) => bestScore >= unlockScore;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Customize</h1>
        <p style={{ color: '#94a3b8', marginTop: 6 }}>
          Your best score:{' '}
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>{bestScore} pts</span>
          {bestScore < 100 && (
            <span style={{ color: '#475569', fontSize: 13 }}>
              {' '}· Reach higher scores to unlock more skins
            </span>
          )}
        </p>
      </div>

      {/* ── Snake Skins ── */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>
          Snake Skins
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
          {Object.entries(SKINS).map(([id, skin]) => {
            const unlocked = isUnlocked(skin.unlockScore);
            const active   = selectedSkin === id;
            return (
              <button
                key={id}
                onClick={() => unlocked && selectSkin(id)}
                style={{
                  background: active ? 'rgba(34,197,94,0.12)' : '#1e293b',
                  border: `2px solid ${active ? '#22c55e' : '#334155'}`,
                  borderRadius: 12,
                  padding: '18px 12px',
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  textAlign: 'center',
                  opacity: unlocked ? 1 : 0.55,
                  position: 'relative',
                  transition: 'border-color 0.15s, background 0.15s',
                  color: 'inherit',
                }}
                onMouseEnter={e => { if (unlocked && !active) e.currentTarget.style.borderColor = '#22c55e55'; }}
                onMouseLeave={e => { if (unlocked && !active) e.currentTarget.style.borderColor = '#334155'; }}
              >
                {/* Lock overlay */}
                {!unlocked && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 10,
                    background: 'rgba(0,0,0,0.52)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    zIndex: 1,
                  }}>
                    <span style={{ fontSize: 22 }}>🔒</span>
                    <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700, marginTop: 4 }}>
                      {skin.unlockScore} pts
                    </span>
                  </div>
                )}

                {/* Snake segment preview */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3, marginBottom: 10 }}>
                  {/* Head */}
                  <div style={{
                    width: 18, height: 18,
                    background: skin.headColor,
                    borderRadius: skin.pixel ? 2 : 5,
                    boxShadow: skin.glowRGB
                      ? `0 0 8px rgba(${skin.glowRGB[0]},${skin.glowRGB[1]},${skin.glowRGB[2]},0.7)`
                      : 'none',
                  }} />
                  {/* Body x3 */}
                  {[0.85, 0.7, 0.55].map((a, i) => (
                    <div key={i} style={{
                      width: 13, height: 13,
                      background: `rgba(${skin.bodyRGB[0]},${skin.bodyRGB[1]},${skin.bodyRGB[2]},${a})`,
                      borderRadius: skin.pixel ? 1 : 3,
                    }} />
                  ))}
                </div>

                <div style={{ fontSize: 22, marginBottom: 6 }}>{skin.emoji}</div>
                <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600 }}>{skin.name}</div>
                <div style={{ color: '#64748b', fontSize: 11, marginTop: 3 }}>{skin.description}</div>
                {active && (
                  <div style={{ color: '#22c55e', fontSize: 11, fontWeight: 700, marginTop: 6 }}>✓ Active</div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Environments ── */}
      <section>
        <h2 style={{ fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>
          Environments
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 }}>
          {Object.entries(THEMES).map(([id, theme]) => {
            const active = selectedTheme === id;
            return (
              <button
                key={id}
                onClick={() => selectTheme(id)}
                style={{
                  background: active ? 'rgba(34,197,94,0.1)' : '#1e293b',
                  border: `2px solid ${active ? '#22c55e' : '#334155'}`,
                  borderRadius: 12,
                  padding: '16px 12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'border-color 0.15s',
                  color: 'inherit',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#22c55e55'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = '#334155'; }}
              >
                {/* Mini grid preview */}
                <ThemePreview theme={theme} themeId={id} />

                <div style={{ fontSize: 22, margin: '8px 0 4px' }}>{theme.emoji}</div>
                <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600 }}>{theme.name}</div>
                <div style={{ color: '#64748b', fontSize: 11, marginTop: 3 }}>{theme.description}</div>
                {active && (
                  <div style={{ color: '#22c55e', fontSize: 11, fontWeight: 700, marginTop: 6 }}>✓ Active</div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <div style={{ marginTop: 40, display: 'flex', gap: 10 }}>
        <Link to="/">
          <button className="btn btn-primary">Play Now</button>
        </Link>
      </div>
    </div>
  );
}

// ── Mini theme preview ────────────────────────────────────────────────────────
function ThemePreview({ theme, themeId }) {
  const w = 64, h = 44;
  const gridColor = theme.gridColor;
  const accent    = theme.gridAccentColor;

  // Inline SVG grid preview so no canvas needed
  const cols = 5, rows = 3;
  const cw = w / cols, ch = h / rows;

  const lines = [];
  for (let c = 0; c <= cols; c++) {
    const isAccent = accent && c % 5 === 0;
    lines.push(
      <line key={`v${c}`} x1={c * cw} y1={0} x2={c * cw} y2={h}
        stroke={isAccent ? accent : gridColor} strokeWidth={0.8} />
    );
  }
  for (let r = 0; r <= rows; r++) {
    lines.push(
      <line key={`h${r}`} x1={0} y1={r * ch} x2={w} y2={r * ch}
        stroke={gridColor} strokeWidth={0.8} />
    );
  }

  return (
    <div style={{
      width: w, height: h,
      background: theme.bg,
      borderRadius: 6,
      margin: '0 auto',
      overflow: 'hidden',
      border: '1px solid #334155',
      position: 'relative',
    }}>
      <svg width={w} height={h} style={{ display: 'block' }}>
        {lines}
        {/* Mini snake */}
        {[[2,1],[1,1],[0,1]].map(([c, r], i) => (
          <rect key={i} x={c * cw + 1} y={r * ch + 1} width={cw - 2} height={ch - 2}
            fill={i === 0 ? '#22c55e' : `rgba(22,163,74,${0.8 - i * 0.2})`}
            rx={1} />
        ))}
        {/* Mini fruit */}
        <circle cx={4 * cw + cw / 2} cy={1 * ch + ch / 2} r={Math.min(cw, ch) / 2 - 1} fill="#e81212" />
        {/* PNW: tiny tree hint */}
        {themeId === 'pnw' && (
          <>
            <polygon points={`${0.5 * cw},${0.1 * ch} ${0.9 * cw},${0.9 * ch} ${0.1 * cw},${0.9 * ch}`} fill="#1c4a1c" opacity="0.7" />
            <polygon points={`${4.5 * cw},${0.1 * ch} ${4.9 * cw},${0.9 * ch} ${4.1 * cw},${0.9 * ch}`} fill="#1c4a1c" opacity="0.7" />
          </>
        )}
        {/* Neon city: bright accent lines */}
        {themeId === 'neonCity' && (
          <line x1={0} y1={h} x2={w} y2={h} stroke="rgba(100,40,180,0.5)" strokeWidth={2} />
        )}
      </svg>
    </div>
  );
}
