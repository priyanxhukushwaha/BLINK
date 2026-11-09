export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

const NEON_COLORS = [
  '#C084FC', // Violet
  '#A855F7', // Electric Purple
  '#E9D5FF', // Soft Purple
  '#22D3EE', // Cyan glance
  '#06B6D4', // Deep Cyan
  '#F472B6', // Subtle Pink
];

export function createParticlesAt(
  x: number,
  y: number,
  width: number,
  height: number,
  count = 90
): Particle[] {
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const pX = x + Math.random() * width;
    const pY = y + Math.random() * height;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.8 + Math.random() * 2.8;

    particles.push({
      x: pX,
      y: pY,
      vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 1.2,
      vy: Math.sin(angle) * speed - Math.random() * 1.8, // slight upward float
      size: 1.5 + Math.random() * 3,
      color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
      alpha: 0.9 + Math.random() * 0.1,
      decay: 0.012 + Math.random() * 0.02,
    });
  }

  return particles;
}

export function updateAndRenderParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
): boolean {
  let anyAlive = false;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (p.alpha <= 0) continue;

    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96; // drag
    p.vy *= 0.96;
    p.alpha -= p.decay;

    if (p.alpha > 0) {
      anyAlive = true;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  return anyAlive;
}

