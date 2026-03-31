import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const GRID = 30;
const CELL = 20;
const W = GRID * CELL;
const H = GRID * CELL;

const LEVEL_CONFIG = {
  easy:   { tickMs: 200,  maxFruits: 1, fruitInterval: 8000,  label: 'Easy',   color: '#22c55e' },
  medium: { tickMs: 130,  maxFruits: 2, fruitInterval: 4000,  label: 'Medium', color: '#fbbf24' },
  hard:   { tickMs: 70,   maxFruits: 3, fruitInterval: 2000,  label: 'Hard',   color: '#ef4444' },
};

export default function GamePage() {
  const { level } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | running | over
  const [gameKey, setGameKey] = useState(0);
  const [scoreSaved, setScoreSaved] = useState(false);

  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.easy;

  // ── Game loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameKey === 0) {
      // Draw idle screen on first mount
      drawIdle(canvas, cfg);
      return;
    }

    const ctx = canvas.getContext('2d');
    let snake = [
      { x: 15, y: 15 },
      { x: 14, y: 15 },
      { x: 13, y: 15 },
    ];
    let dir = { dx: 1, dy: 0 };
    let pendingDir = null;
    let fruits = [];
    let score = 0;
    let alive = true;

    setDisplayScore(0);
    setPhase('running');
    setScoreSaved(false);

    // ── helpers ──
    function randCell() {
      let pos, tries = 0;
      do {
        pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
        tries++;
      } while (
        tries < 500 &&
        (snake.some(s => s.x === pos.x && s.y === pos.y) ||
         fruits.some(f => f.x === pos.x && f.y === pos.y))
      );
      return pos;
    }

    function spawnFruit() {
      if (!alive) return;
      if (fruits.length < cfg.maxFruits) {
        fruits.push(randCell());
      }
    }

    function draw() {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= GRID; i++) {
        ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(W, i * CELL); ctx.stroke();
      }

      // Fruits (animated glow)
      fruits.forEach(f => {
        const cx = f.x * CELL + CELL / 2;
        const cy = f.y * CELL + CELL / 2;
        const r = CELL / 2 - 2;
        const grad = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, r);
        grad.addColorStop(0, '#fca5a5');
        grad.addColorStop(1, '#ef4444');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Snake body
      snake.forEach((seg, i) => {
        if (i === 0) {
          // Head: gradient
          const hx = seg.x * CELL + 1;
          const hy = seg.y * CELL + 1;
          ctx.fillStyle = '#4ade80';
          ctx.beginPath();
          ctx.roundRect(hx, hy, CELL - 2, CELL - 2, 4);
          ctx.fill();
          // Eyes
          ctx.fillStyle = '#0f172a';
          const ex = seg.x * CELL + CELL / 2;
          const ey = seg.y * CELL + CELL / 2;
          const e1x = ex + dir.dy * 5 - dir.dx * 2;
          const e1y = ey - dir.dx * 5 - dir.dy * 2;
          const e2x = ex - dir.dy * 5 - dir.dx * 2;
          const e2y = ey + dir.dx * 5 - dir.dy * 2;
          ctx.beginPath(); ctx.arc(e1x, e1y, 2, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(e2x, e2y, 2, 0, Math.PI * 2); ctx.fill();
        } else {
          const alpha = Math.max(0.4, 1 - i * 0.015);
          ctx.fillStyle = `rgba(22,163,74,${alpha})`;
          ctx.beginPath();
          ctx.roundRect(seg.x * CELL + 2, seg.y * CELL + 2, CELL - 4, CELL - 4, 3);
          ctx.fill();
        }
      });
    }

    function drawOver() {
      draw();
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 38px monospace';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 40);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 26px monospace';
      ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 4);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px monospace';
      ctx.fillText('Press Space or click "Play Again"', W / 2, H / 2 + 44);
    }

    function endGame() {
      if (!alive) return;
      alive = false;
      clearInterval(tickTimer);
      clearInterval(fruitTimer);
      setDisplayScore(score);
      setPhase('over');
      drawOver();
      if (user) {
        api.post('/api/scores', { score, level })
          .then(() => setScoreSaved(true))
          .catch(console.error);
      }
    }

    function tick() {
      if (!alive) return;
      if (pendingDir) { dir = pendingDir; pendingDir = null; }

      const head = snake[0];
      const nh = { x: head.x + dir.dx, y: head.y + dir.dy };

      if (nh.x < 0 || nh.x >= GRID || nh.y < 0 || nh.y >= GRID) { endGame(); return; }
      if (snake.some(s => s.x === nh.x && s.y === nh.y)) { endGame(); return; }

      const fi = fruits.findIndex(f => f.x === nh.x && f.y === nh.y);
      if (fi !== -1) {
        fruits.splice(fi, 1);
        snake = [nh, ...snake]; // grow
        score += 10;
        setDisplayScore(score);
      } else {
        snake = [nh, ...snake.slice(0, -1)]; // move
      }
      draw();
    }

    function handleKey(e) {
      if (!alive) return;
      const MAP = {
        ArrowUp: { dx: 0, dy: -1 }, ArrowDown: { dx: 0, dy: 1 },
        ArrowLeft: { dx: -1, dy: 0 }, ArrowRight: { dx: 1, dy: 0 },
        w: { dx: 0, dy: -1 }, s: { dx: 0, dy: 1 },
        a: { dx: -1, dy: 0 }, d: { dx: 1, dy: 0 },
      };
      const nd = MAP[e.key];
      if (!nd) return;
      if (nd.dx === -dir.dx && nd.dy === -dir.dy) return; // no 180
      pendingDir = nd;
      e.preventDefault();
    }

    spawnFruit();
    draw();

    const tickTimer = setInterval(tick, cfg.tickMs);
    const fruitTimer = setInterval(spawnFruit, cfg.fruitInterval);
    window.addEventListener('keydown', handleKey);

    return () => {
      alive = false;
      clearInterval(tickTimer);
      clearInterval(fruitTimer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [gameKey]); // eslint-disable-line

  // Space bar to start/restart
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (phase === 'idle' || phase === 'over') {
          e.preventDefault();
          setGameKey(k => k + 1);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  // Draw idle on initial mount
  useEffect(() => {
    if (canvasRef.current && gameKey === 0) {
      drawIdle(canvasRef.current, cfg);
    }
  }, []); // eslint-disable-line

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        width: W, marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            background: cfg.color, color: '#0f172a',
            fontSize: 12, fontWeight: 700, padding: '3px 10px',
            borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1,
          }}>
            {cfg.label}
          </span>
          {phase === 'running' && (
            <span style={{ color: '#22c55e', fontSize: 12, fontFamily: 'monospace' }}>● LIVE</span>
          )}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 20, color: '#f8fafc' }}>
          Score: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{displayScore}</span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{
          border: `2px solid ${phase === 'over' ? '#ef4444' : '#334155'}`,
          borderRadius: 8,
          cursor: phase !== 'running' ? 'pointer' : 'default',
          display: 'block',
        }}
        onClick={() => {
          if (phase === 'idle' || phase === 'over') setGameKey(k => k + 1);
        }}
      />

      {/* Controls below canvas */}
      <div style={{ width: W, marginTop: 14 }}>
        {phase === 'over' && (
          <div style={{ marginBottom: 12 }}>
            {user ? (
              scoreSaved ? (
                <div style={{ color: '#22c55e', fontSize: 13, fontFamily: 'monospace', marginBottom: 8 }}>
                  ✓ Score saved!{' '}
                  <Link to="/scores" style={{ color: '#4ade80' }}>View My Scores</Link>
                </div>
              ) : (
                <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>Saving score...</div>
              )
            ) : (
              <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>
                <Link to="/login">Log in</Link> to save your scores!
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setGameKey(k => k + 1)}
                className="btn btn-primary"
              >
                Play Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn btn-secondary"
              >
                Change Level
              </button>
            </div>
          </div>
        )}

        {phase === 'idle' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setGameKey(k => k + 1)} className="btn btn-primary">
              Start Game
            </button>
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              Back
            </button>
          </div>
        )}

        <div style={{ color: '#475569', fontSize: 12, fontFamily: 'monospace', marginTop: 10 }}>
          Arrow keys / WASD to move &nbsp;|&nbsp; Space to start
        </div>
      </div>
    </div>
  );
}

// ── Helper: draw idle screen outside component ───────────────────────────
function drawIdle(canvas, cfg) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(W, i * CELL); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 48px monospace';
  ctx.fillText('🐍 SNAKE', W / 2, H / 2 - 40);
  ctx.fillStyle = cfg.color;
  ctx.font = 'bold 22px monospace';
  ctx.fillText(cfg.label + ' Mode', W / 2, H / 2 + 4);
  ctx.fillStyle = '#64748b';
  ctx.font = '15px monospace';
  ctx.fillText('Press Space or click to start', W / 2, H / 2 + 44);
}
