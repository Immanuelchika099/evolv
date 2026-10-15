import { useEffect, useRef } from 'react';
import './GradientASCII.css';

const DEFAULT_CHARACTERS = ' =+xX0S8#@';

function hexToRgb(hex) {
  const value = String(hex).replace('#', '');
  const normalized = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  const number = Number.parseInt(normalized, 16);
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
}

function mixColor(a, b, amount) {
  return a.map((channel, index) => Math.round(channel + (b[index] - channel) * amount));
}

function GradientASCII({
  colors = ['#B8F34A', '#F6F8F0', '#B8F34A'],
  shape = 'horizon',
  characters = DEFAULT_CHARACTERS,
  cellSize = 18,
  density = 0.8,
  glyphOpacity = 0.72,
  gradientOpacity = 0.46,
  glow = 0.18,
  depthOfField = 0,
  flicker = 0.12,
  softness = 0.5,
  scale = 1,
  flow = 0.5,
  speed = 0.45,
  grain = 0.04,
  variation = 0,
  mouseInteraction = true,
  scrambleRadius = 0.1,
  clickEffect = 'none',
  intro = true,
  lightMode = false,
  fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  dpr,
  className = '',
  style,
  ...rest
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!container || !canvas || !ctx) return undefined;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let width = 1;
    let height = 1;
    let ratio = 1;
    let raf = 0;
    let start = performance.now();
    let pointer = null;
    let click = null;
    let visible = true;
    let disposed = false;
    let frame = 0;
    const palette = (Array.isArray(colors) && colors.length ? colors : ['#B8F34A', '#F6F8F0']).slice(0, 8).map(hexToRgb);
    const glyphs = [...new Set([...(characters || DEFAULT_CHARACTERS)])].filter((char) => char !== '\n' && char !== '\r');
    const safeGlyphs = glyphs.length ? glyphs : [...DEFAULT_CHARACTERS];

    function colorAt(amount) {
      const scaled = Math.max(0, Math.min(0.9999, amount)) * (palette.length - 1);
      const index = Math.floor(scaled);
      return mixColor(palette[index], palette[Math.min(index + 1, palette.length - 1)], scaled - index);
    }

    function fieldAt(x, y, time) {
      const nx = (x / width - 0.5) * Math.max(0.7, width / height);
      const ny = y / height;
      const wobble = Math.sin(nx * 2.7 + time * 0.32 + variation) * flow * 0.018;
      const arch = 0.24 + 0.17 * Math.pow(nx / Math.max(0.6, width / height * 0.5), 2) + wobble;
      let strength = 0;

      if (shape === 'pinch') {
        const band = Math.abs(ny - 0.22 - wobble) / (0.035 + Math.abs(nx) * 0.12);
        strength = Math.exp(-band * band * (1.2 + softness));
      } else if (shape === 'rise') {
        const distance = Math.sqrt(Math.pow(nx / (0.9 * scale), 2) + Math.pow((ny - 0.92) / (0.75 * scale), 2));
        strength = Math.pow(Math.max(0, 1 - distance), 1.3 + softness);
      } else if (shape === 'eclipse') {
        const distance = Math.abs(Math.hypot(nx, ny - 0.27) - 0.19 * scale);
        strength = Math.exp(-distance * distance / (0.003 + softness * 0.003));
      } else {
        const edge = ny - arch;
        const rim = Math.exp(-Math.pow(edge / (0.055 + softness * 0.06), 2));
        const sky = Math.max(0, 1 - Math.abs(ny - 0.16) / (0.34 * scale));
        strength = Math.max(rim * 0.95, sky * 0.42);
      }
      const fade = Math.max(0, 1 - ny / 0.92);
      return Math.max(0, Math.min(1, strength * fade * 1.35));
    }

    function draw(now = performance.now()) {
      if (disposed || !visible || document.hidden) return;
      const time = reducedMotion ? 0 : (now - start) / 1000 * Math.max(0, speed);
      ctx.clearRect(0, 0, width, height);
      const size = Math.max(8, Math.min(64, cellSize));
      const cellW = size * 0.62;
      const cols = Math.ceil(width / cellW) + 1;
      const rows = Math.ceil(height / size) + 1;
      const introAmount = intro && !reducedMotion ? Math.min(1, (now - start) / 1800) : 1;

      if (gradientOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, gradientOpacity)) * introAmount;
        for (let y = 0; y < height; y += Math.max(3, size / 3)) {
          for (let x = 0; x < width; x += Math.max(3, size / 3)) {
            const strength = fieldAt(x, y, time);
            if (strength < 0.04) continue;
            const [r, g, b] = colorAt(strength);
            ctx.fillStyle = `rgba(${r},${g},${b},${strength * 0.16})`;
            ctx.fillRect(x, y, Math.max(3, size / 3), Math.max(3, size / 3));
          }
        }
        ctx.restore();
      }

      ctx.save();
      ctx.font = `300 ${Math.round(size * 0.78)}px ${fontFamily}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.max(0, Math.min(1, glyphOpacity)) * introAmount;
      if (glow > 0) {
        ctx.shadowBlur = Math.min(18, glow * size * 1.6);
        ctx.shadowColor = colors?.[1] || '#B8F34A';
      }

      for (let row = 0; row < rows; row++) {
        const y = row * size + size * 0.5;
        for (let col = 0; col < cols; col++) {
          const x = col * cellW + cellW * 0.5;
          const strength = fieldAt(x, y, time);
          const hash = Math.abs(Math.sin((col + 1) * 127.1 + (row + 1) * 311.7 + variation * 41.3) * 43758.5453) % 1;
          if (strength < 0.12 || hash > density * Math.min(1, 0.35 + strength * 1.2)) continue;
          let value = strength;
          if (mouseInteraction && pointer && !reducedMotion) {
            const distance = Math.hypot((x - pointer.x) / width, (y - pointer.y) / height);
            if (distance < scrambleRadius) value = Math.min(1, value + (1 - distance / scrambleRadius) * 0.4);
          }
          if (click && clickEffect !== 'none' && !reducedMotion) {
            const distance = Math.hypot(x - click.x, y - click.y);
            const age = (now - click.time) / 1000;
            if (age < 1.2 && (clickEffect === 'burst' ? distance < 100 * age + 24 : Math.abs(distance - age * 180) < 12)) value = Math.min(1, value + 0.45);
          }
          if (flicker > 0 && !reducedMotion && hash < flicker * 0.08 && frame % 3 === 0) value = Math.max(0, value * (0.65 + hash));
          const [r, g, b] = colorAt(Math.min(1, value));
          const characterIndex = Math.min(safeGlyphs.length - 1, Math.floor(value * (safeGlyphs.length - 1)));
          ctx.fillStyle = lightMode ? `rgba(20,24,14,${0.35 + value * 0.55})` : `rgba(${r},${g},${b},${Math.min(1, value * 1.5)})`;
          if (depthOfField > 0 && hash < depthOfField * 0.12) ctx.globalAlpha = Math.max(0.15, glyphOpacity * 0.45);
          else ctx.globalAlpha = Math.max(0, Math.min(1, glyphOpacity)) * introAmount;
          ctx.fillText(safeGlyphs[characterIndex] || '@', x, y);
        }
      }
      ctx.restore();

      if (grain > 0 && frame % 3 === 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.08, grain * 0.25);
        for (let i = 0; i < Math.floor(width * height / 5000); i++) {
          ctx.fillStyle = i % 2 ? '#fff' : '#000';
          ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
        }
        ctx.restore();
      }
      frame++;
      if (!reducedMotion || (intro && introAmount < 1)) raf = requestAnimationFrame(draw);
    }

    function resize() {
      const bounds = container.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      ratio = Math.min(dpr || window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      cancelAnimationFrame(raf);
      draw();
    }

    function onPointerMove(event) {
      if (!mouseInteraction) return;
      const bounds = container.getBoundingClientRect();
      pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    }

    function onPointerDown(event) {
      if (clickEffect === 'none') return;
      const bounds = container.getBoundingClientRect();
      click = { x: event.clientX - bounds.left, y: event.clientY - bounds.top, time: performance.now() };
    }

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    const intersection = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) {
        start = performance.now();
        cancelAnimationFrame(raf);
        draw();
      } else cancelAnimationFrame(raf);
    });
    intersection.observe(container);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('visibilitychange', resize);
    resize();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('visibilitychange', resize);
    };
  }, [colors?.join(','), shape, characters, cellSize, density, glyphOpacity, gradientOpacity, glow, depthOfField, flicker, softness, scale, flow, speed, grain, variation, mouseInteraction, scrambleRadius, clickEffect, intro, lightMode, fontFamily, dpr]);

  return (
    <div ref={containerRef} className={`gradient-ascii-container${className ? ` ${className}` : ''}`} style={style} {...rest}>
      <canvas ref={canvasRef} className="gradient-ascii-canvas" aria-hidden="true" />
    </div>
  );
}

export default GradientASCII;
