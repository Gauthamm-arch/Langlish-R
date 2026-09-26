'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

type NeuformMode = 'dark' | 'light'
type NeuformModePreference = NeuformMode | 'auto'

type FocusTarget = {
  selector: string
  role: 'background' | 'ui'
  width?: string
}

type BakeKnobs = {
  size: number
  gap: number
  length: number
  density: number
  strokeWidth: number
  mode: NeuformMode
}

type EffectDefinition = {
  title: string
  source: string
  background: string | ((mode: NeuformMode) => string)
  defaultMode?: NeuformModePreference
  supportsMode?: boolean
  targets: readonly FocusTarget[]
  focusCss?: string
  patch?: (source: string, knobs: BakeKnobs) => string
}

export type ParticleDriftProps = {
  mode?: NeuformModePreference
  speed?: number
  size?: number
  gap?: number
  length?: number
  density?: number
  strokeWidth?: number
  opacity?: number
  hue?: number
  saturation?: number
  brightness?: number
  className?: string
  style?: CSSProperties
}

const PARTICLE_DRIFT_DEFAULTS = {
  mode: 'dark' as NeuformMode,
  speed: 1,
  size: 1,
  gap: 2,
  length: 1,
  density: 1,
  strokeWidth: 1,
  opacity: 1,
  hue: 0,
  saturation: 1,
  brightness: 1,
} as const

const LIGHT_PAPER = '#eef1f6'

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function scaleCount(base: number, density: number, minimum = 1) {
  return Math.max(minimum, Math.round(base * density))
}

function resolveMode(
  mode: NeuformMode | number | string | undefined,
  fallback: NeuformMode = 'dark',
): NeuformMode {
  if (mode === undefined || mode === null) return fallback
  if (mode === 'light' || mode === 1 || mode === '1') return 'light'
  return 'dark'
}

function readAutomaticMode(): NeuformMode {
  if (typeof document === 'undefined' || typeof window === 'undefined')
    return 'dark'
  const root = document.documentElement
  const declared = root.dataset.scheme ?? root.dataset.theme
  if (declared === 'light' || declared === 'dark') return declared
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function useAutomaticMode(enabled: boolean) {
  const [mode, setMode] = useState<NeuformMode>(readAutomaticMode)

  useEffect(() => {
    if (
      !enabled ||
      typeof document === 'undefined' ||
      typeof window === 'undefined'
    )
      return undefined
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setMode(readAutomaticMode())
    const observer = new MutationObserver(update)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-scheme', 'data-theme'],
    })
    media.addEventListener('change', update)
    update()
    return () => {
      observer.disconnect()
      media.removeEventListener('change', update)
    }
  }, [enabled])

  return mode
}

function resolveBackground(
  background: EffectDefinition['background'],
  mode: NeuformMode,
) {
  return typeof background === 'function' ? background(mode) : background
}

// Verbatim content of particle-drift.html (self-contained hero markup + canvas particle script),
// re-encoded as a template literal so it can be embedded without a build-time raw loader.
// Rendered inside a sandboxed iframe via srcDoc; only the canvas element is kept visible.
const PARTICLE_DRIFT_SOURCE = `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Particle Field</title>
    <style>
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #030509;
        }
        #particle-canvas {
            display: block;
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <canvas id="particle-canvas"></canvas>

    <script>
        document.addEventListener("DOMContentLoaded", () => {
            const canvas = document.getElementById('particle-canvas');
            const ctx = canvas.getContext('2d');

            let width, height;
            let nodes = [];
            let beams = [];
            const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*()'.split('');
            let mouse = { x: -1000, y: -1000 };

            function resize() {
                width = canvas.clientWidth;
                height = canvas.clientHeight;
                const dpr = window.devicePixelRatio || 1;
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                ctx.scale(dpr, dpr);
            }

            window.addEventListener('resize', () => {
                resize();
                initParticles();
            });

            window.addEventListener('mousemove', e => {
                const rect = canvas.getBoundingClientRect();
                mouse.x = e.clientX - rect.left;
                mouse.y = e.clientY - rect.top;
            });

            function initParticles() {
                nodes = Array.from({ length: 90 }).map(() => ({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vy: (Math.random() * 0.4) + 0.1,
                    char: chars[Math.floor(Math.random() * chars.length)]
                }));

                beams = Array.from({ length: 25 }).map(() => ({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    length: Math.random() * 100 + 50,
                    speed: (Math.random() * 6) + 3,
                    opacity: Math.random() * 0.5 + 0.3
                }));
            }

            resize();
            initParticles();

            function draw() {
                ctx.clearRect(0, 0, width, height);

                beams.forEach(b => {
                    b.y -= b.speed * ((window.__SF_CONTROLS&&window.__SF_CONTROLS.speed)||1);
                    if (b.y + b.length < 0) {
                        b.y = height + 100;
                        b.x = Math.random() * width;
                    }
                    let g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.length);
                    g.addColorStop(0, \`rgba(96, 165, 250, \${b.opacity})\`);
                    g.addColorStop(1, 'transparent');
                    ctx.strokeStyle = g;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(b.x, b.y);
                    ctx.lineTo(b.x, b.y + b.length);
                    ctx.stroke();
                });

                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.lineWidth = 0.5;
                for (let i = 0; i < nodes.length; i++) {
                    let n1 = nodes[i];
                    for (let j = i + 1; j < nodes.length; j++) {
                        let n2 = nodes[j];
                        let d = Math.hypot(n1.x - n2.x, n1.y - n2.y);
                        if (d < 120) {
                            ctx.strokeStyle = \`rgba(156, 163, 175, \${0.15 * (1 - d / 120)})\`;
                            ctx.beginPath();
                            ctx.moveTo(n1.x, n1.y);
                            ctx.lineTo(n2.x, n2.y);
                            ctx.stroke();
                        }
                    }
                }

                nodes.forEach(n => {
                    n.y += n.vy * ((window.__SF_CONTROLS&&window.__SF_CONTROLS.speed)||1);
                    if (n.y > height + 20) {
                        n.y = -20;
                        n.x = Math.random() * width;
                    }

                    let dist = Math.hypot(mouse.x - n.x, mouse.y - n.y);

                    if (dist < 180 || Math.random() > 0.98) n.char = chars[Math.floor(Math.random() * chars.length)];

                    if (dist < 180) {
                        ctx.strokeStyle = \`rgba(96, 165, 250, \${0.5 * (1 - dist / 180)})\`;
                        ctx.beginPath();
                        ctx.moveTo(n.x, n.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                    }

                    ctx.fillStyle = dist < 180 ? '#60A5FA' : 'rgba(156, 163, 175, 0.4)';
                    ctx.fillText(n.char, n.x, n.y);
                });

                requestAnimationFrame(draw);
            }
            draw();
        });
    </script>
</body>
</html>`

const PARTICLE_DRIFT_DEFINITION: EffectDefinition = {
  title: 'Particle Drift',
  source: PARTICLE_DRIFT_SOURCE,
  supportsMode: true,
  background: (mode) => (mode === 'light' ? LIGHT_PAPER : '#030509'),
  targets: [{ selector: '#particle-canvas', role: 'background' }],
  patch(source, { size, length, density, mode }) {
    const link = Math.round(120 * length)
    const proximityAlpha = mode === 'light' ? 0.22 : 0.15
    let next = source
      .replace(
        "Array.from({ length: 90 })",
        `Array.from({ length: ${scaleCount(90, density, 12)} })`,
      )
      .replace(
        "Array.from({ length: 25 })",
        `Array.from({ length: ${scaleCount(25, density, 4)} })`,
      )
      .replace(
        'length: Math.random() * 100 + 50,',
        `length: (Math.random() * 100 + 50) * ${length},`,
      )
      .replace('if (d < 120) {', `if (d < ${link}) {`)
      .replace('0.15 * (1 - d / 120)', `${proximityAlpha} * (1 - d / ${link})`)
      .replace(
        'ctx.lineWidth = 1.5;',
        `ctx.lineWidth = ${Number((1.5 * size).toFixed(2))};`,
      )
    if (mode === 'light') {
      next = next
        .replaceAll('rgba(96, 165, 250,', 'rgba(37, 99, 235,')
        .replaceAll('rgba(156, 163, 175,', 'rgba(36, 48, 68,')
        .replace(
          "ctx.fillStyle = dist < 180 ? '#60A5FA' : 'rgba(156, 163, 175, 0.4)';",
          "ctx.fillStyle = dist < 180 ? '#2563EB' : 'rgba(36, 48, 68, 0.55)';",
        )
    }
    return next
  },
}

function buildFocusedDocument(
  definition: EffectDefinition,
  knobs: BakeKnobs & {
    speed: number
    opacity: number
  },
) {
  const mode = knobs.mode
  const background = resolveBackground(definition.background, mode)
  const controlsJson = JSON.stringify({
    mode,
    speed: knobs.speed,
    size: knobs.size,
    gap: knobs.gap,
    length: knobs.length,
    density: knobs.density,
    strokeWidth: knobs.strokeWidth,
    opacity: knobs.opacity,
  }).replace(/</g, '\\u003c')
  const patchedSource = definition.patch
    ? definition.patch(definition.source, {
        size: knobs.size,
        gap: knobs.gap,
        length: knobs.length,
        density: knobs.density,
        strokeWidth: knobs.strokeWidth,
        mode,
      })
    : definition.source
  const backgroundOverride = `<style data-threeui-bg>html, body { background: ${background} !important; }</style>`
  const controlScript = `<script data-threeui-controls>
(function () {
  var controls = ${controlsJson};
  window.__SF_CONTROLS = controls;
  function applyVisual() {
    var canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    var opacity = controls.opacity == null ? 1 : controls.opacity;
    canvas.style.opacity = String(opacity);
  }
  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'threeui-controls') return;
    var next = event.data.controls || {};
    Object.keys(next).forEach(function (key) { controls[key] = next[key]; });
    applyVisual();
  });
  window.__SF_APPLY_CONTROLS = applyVisual;
  applyVisual();
})();
</script>`
  return patchedSource.replace(
    /<head([^>]*)>/i,
    `<head$1>${controlScript}${backgroundOverride}`,
  )
}

export default function ParticleDrift({
  mode,
  speed = PARTICLE_DRIFT_DEFAULTS.speed,
  size = PARTICLE_DRIFT_DEFAULTS.size,
  gap = PARTICLE_DRIFT_DEFAULTS.gap,
  length = PARTICLE_DRIFT_DEFAULTS.length,
  density = PARTICLE_DRIFT_DEFAULTS.density,
  strokeWidth = PARTICLE_DRIFT_DEFAULTS.strokeWidth,
  opacity = PARTICLE_DRIFT_DEFAULTS.opacity,
  hue = PARTICLE_DRIFT_DEFAULTS.hue,
  saturation = PARTICLE_DRIFT_DEFAULTS.saturation,
  brightness = PARTICLE_DRIFT_DEFAULTS.brightness,
  className,
  style,
}: ParticleDriftProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const requestedMode =
    mode ?? PARTICLE_DRIFT_DEFINITION.defaultMode ?? PARTICLE_DRIFT_DEFAULTS.mode
  const automaticMode = useAutomaticMode(requestedMode === 'auto')
  const resolvedMode =
    requestedMode === 'auto'
      ? automaticMode
      : resolveMode(requestedMode, PARTICLE_DRIFT_DEFAULTS.mode)
  const background = resolveBackground(
    PARTICLE_DRIFT_DEFINITION.background,
    resolvedMode,
  )
  const safeSpeed = clamp(speed, 0, 3)
  const safeSize = clamp(size, 0.05, 200)
  const safeGap = clamp(gap, 0, 64)
  const safeLength = clamp(length, 0.35, 2.5)
  const safeDensity = clamp(density, 0.25, 2.5)
  const safeStrokeWidth = clamp(strokeWidth, 0.25, 8)
  const safeOpacity = clamp(opacity, 0.05, 1)
  const safeHue = clamp(hue, -180, 180)
  const safeSaturation = clamp(saturation, 0, 2)
  const safeBrightness = clamp(brightness, 0.35, 1.65)

  const source = useMemo(
    () =>
      buildFocusedDocument(PARTICLE_DRIFT_DEFINITION, {
        mode: resolvedMode,
        speed: PARTICLE_DRIFT_DEFAULTS.speed,
        size: safeSize,
        gap: safeGap,
        length: safeLength,
        density: safeDensity,
        strokeWidth: safeStrokeWidth,
        opacity: PARTICLE_DRIFT_DEFAULTS.opacity,
      }),
    [resolvedMode, safeDensity, safeGap, safeLength, safeSize, safeStrokeWidth],
  )

  useEffect(() => {
    const frame = iframeRef.current?.contentWindow
    if (!frame) return
    frame.postMessage(
      {
        type: 'threeui-controls',
        controls: {
          mode: resolvedMode,
          speed: safeSpeed,
          size: safeSize,
          gap: safeGap,
          length: safeLength,
          density: safeDensity,
          strokeWidth: safeStrokeWidth,
          opacity: safeOpacity,
        },
      },
      '*',
    )
  }, [
    resolvedMode,
    safeDensity,
    safeGap,
    safeLength,
    safeOpacity,
    safeSize,
    safeSpeed,
    safeStrokeWidth,
    source,
  ])

  const filter =
    safeHue === 0 && safeSaturation === 1 && safeBrightness === 1
      ? undefined
      : `hue-rotate(${safeHue}deg) saturate(${safeSaturation}) brightness(${safeBrightness})`

  return (
    <iframe
      ref={iframeRef}
      className={className}
      title={PARTICLE_DRIFT_DEFINITION.title}
      srcDoc={source}
      sandbox="allow-scripts"
      loading="eager"
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        border: 0,
        background,
        filter,
        ...style,
      }}
    />
  )
}
