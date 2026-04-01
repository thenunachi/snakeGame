// ── Fruit Types ──────────────────────────────────────────────────────────────
export const FRUIT_TYPES = {
  normal: {
    colors: ['#ff8080', '#e81212'],
    glowColor: '#e81212',
    points: 10,
    ability: null,
    weight: 70,
    icon: '🍎',
    label: null,
  },
  ghost: {
    colors: ['#e0e7ff', '#818cf8'],
    glowColor: '#818cf8',
    sparkleColor: '#c7d2fe',
    points: 20,
    ability: 'ghost',
    duration: 5000,
    weight: 15,
    icon: '👻',
    label: 'GHOST MODE',
  },
  snail: {
    colors: ['#fef9c3', '#eab308'],
    glowColor: '#eab308',
    sparkleColor: '#fef08a',
    points: 20,
    ability: 'snail',
    duration: 5000,
    weight: 15,
    icon: '🐌',
    label: 'SLOW MODE',
  },
};

export function pickFruitType() {
  const r = Math.random() * 100;
  if (r < 70) return 'normal';
  if (r < 85) return 'ghost';
  return 'snail';
}

// ── Snake Skins ──────────────────────────────────────────────────────────────
export const SKINS = {
  classic: {
    name: 'Classic',
    emoji: '🐍',
    headColor: '#4ade80',
    bodyRGB: [22, 163, 74],
    eyeColor: '#0f172a',
    glowRGB: null,
    pixel: false,
    unlockScore: 0,
    description: 'The original green snake',
  },
  neon: {
    name: 'Neon Glow',
    emoji: '⚡',
    headColor: '#00f5ff',
    bodyRGB: [0, 195, 215],
    eyeColor: '#001a1a',
    glowRGB: [0, 245, 255],
    pixel: false,
    unlockScore: 0,
    description: 'Electric cyan with glow',
  },
  pixel: {
    name: 'Classic Pixel',
    emoji: '🎮',
    headColor: '#00dd00',
    bodyRGB: [0, 160, 0],
    eyeColor: '#000',
    glowRGB: null,
    pixel: true,
    unlockScore: 0,
    description: 'Retro blocky style',
  },
  fire: {
    name: 'Fire Snake',
    emoji: '🔥',
    headColor: '#ff6b35',
    bodyRGB: [210, 50, 0],
    eyeColor: '#1a0000',
    glowRGB: [255, 90, 0],
    pixel: false,
    unlockScore: 30,
    description: 'Unlock at 30 pts',
  },
  ice: {
    name: 'Ice Crystal',
    emoji: '❄️',
    headColor: '#a5f3fc',
    bodyRGB: [100, 190, 230],
    eyeColor: '#001a2e',
    glowRGB: [165, 243, 252],
    pixel: false,
    unlockScore: 50,
    description: 'Unlock at 50 pts',
  },
  golden: {
    name: 'Golden',
    emoji: '✨',
    headColor: '#ffd700',
    bodyRGB: [185, 140, 0],
    eyeColor: '#1a1200',
    glowRGB: [255, 215, 0],
    pixel: false,
    unlockScore: 100,
    description: 'Unlock at 100 pts',
  },
};

// ── Environment Themes ───────────────────────────────────────────────────────
export const THEMES = {
  dark: {
    name: 'Dark',
    emoji: '🌑',
    bg: '#000008',
    gridColor: '#0d0d22',
    description: 'Starfield classic',
  },
  pnw: {
    name: 'Pacific NW',
    emoji: '🌲',
    bg: '#010801',
    gridColor: '#071407',
    description: 'Whales & pine forest',
  },
  neonCity: {
    name: 'Neon City',
    emoji: '🏙️',
    bg: '#000000',
    gridColor: '#080810',
    gridAccentColor: '#00ffff',
    description: 'Cyber arcade grid',
  },
  desert: {
    name: 'Desert',
    emoji: '🏜️',
    bg: '#060200',
    gridColor: '#160c00',
    description: 'Night desert & camels',
  },
  ocean: {
    name: 'Ocean Deep',
    emoji: '🌊',
    bg: '#000510',
    gridColor: '#000e20',
    description: 'Waves & deep sea',
  },
};
