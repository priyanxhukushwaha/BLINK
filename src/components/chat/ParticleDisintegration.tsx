import React, { useEffect, useRef } from 'react';
import { Particle, createParticlesAt, updateAndRenderParticles } from '../../utils/particlePhysics';

interface ParticleDisintegrationProps {
  active: boolean;
  onComplete?: () => void;
  width?: number;
  height?: number;
}

export const ParticleDisintegration: React.FC<ParticleDisintegrationProps> = ({
  active,
  onComplete,
  width = 240,
  height = 80,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create particles across the area
    const particles = createParticlesAt(10, 10, width - 20, height - 20, 85);
    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isAlive = updateAndRenderParticles(ctx, particles);

      if (isAlive) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (onComplete) onComplete();
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, onComplete, width, height]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-30"
    />
  );
};

