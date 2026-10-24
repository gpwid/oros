import React, { useState, useEffect, useMemo } from 'react'
import { TTRPGBattlemapEffect } from '@shared/types'
import { Flame, Cloud, Zap, Skull, Shield, Sparkles, Snowflake, Wind, Sparkle, Trash2 } from 'lucide-react'

// Helper to generate smooth multi-point starburst/corona polygons
const getStarPolygonPoints = (cx: number, cy: number, outerR: number, innerR: number, points: number): string => {
  const step = Math.PI / points
  const coords: string[] = []
  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = i * step - Math.PI / 2
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    coords.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return coords.join(' ')
}

interface AnimatedMapEffectProps {
  effect: TTRPGBattlemapEffect
  gridSize: number
  gridUnitFeet: number
  isSelected?: boolean
  isDragging?: boolean
  isPreview?: boolean
  onSelect?: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  onAutoDelete?: (effectId: string) => void
}

export const AnimatedMapEffect: React.FC<AnimatedMapEffectProps> = ({
  effect,
  gridSize,
  gridUnitFeet,
  isSelected = false,
  isDragging = false,
  isPreview = false,
  onSelect,
  onMouseDown,
  onAutoDelete
}) => {
  const pixelsPerFoot = (gridSize || 64) / (gridUnitFeet || 5)

  // Projectile flight phase: 'flight' -> 'impact'
  const isProjectile = effect.shape === 'projectile'
  const [projectilePhase, setProjectilePhase] = useState<'flight' | 'impact'>('flight')

  useEffect(() => {
    if (isProjectile && !isPreview) {
      // 500ms missile travel time before detonation
      const impactTimer = setTimeout(() => {
        setProjectilePhase('impact')
      }, 500)
      return () => clearTimeout(impactTimer)
    }
  }, [isProjectile, isPreview])

  // Auto-delete effect after animation completion (ephemeral VFX spellcasting)
  useEffect(() => {
    if (!isPreview && effect.isTemporary) {
      const deleteDuration = effect.durationMs || (isProjectile ? 3400 : 3000)
      const timer = setTimeout(() => {
        onAutoDelete?.(effect.id)
      }, deleteDuration)
      return () => clearTimeout(timer)
    }
  }, [effect.id, effect.durationMs, effect.isTemporary, isProjectile, isPreview, onAutoDelete])

  // Compute geometry in pixels
  const geometry = useMemo(() => {
    const shape = effect.shape || 'circle'
    if (shape === 'circle' || shape === 'projectile') {
      const radiusFeet = effect.radiusFeet || 20
      const radiusPx = radiusFeet * pixelsPerFoot
      const diameterPx = radiusPx * 2
      return {
        shape,
        width: diameterPx,
        height: diameterPx,
        radiusPx,
        diameterPx,
        lengthPx: diameterPx,
        widthPx: diameterPx,
        sizePx: diameterPx
      }
    } else if (shape === 'cone') {
      const lengthFeet = effect.lengthFeet || 30
      const lengthPx = lengthFeet * pixelsPerFoot
      const widthPx = lengthPx // In 5e, width at distance equals distance (60 deg cone)
      return {
        shape,
        width: widthPx,
        height: lengthPx,
        radiusPx: lengthPx / 2,
        diameterPx: lengthPx,
        lengthPx,
        widthPx,
        sizePx: lengthPx
      }
    } else if (shape === 'line') {
      const lengthFeet = effect.lengthFeet || 60
      const widthFeet = effect.widthFeet || 5
      const lengthPx = lengthFeet * pixelsPerFoot
      const widthPx = Math.max(16, widthFeet * pixelsPerFoot)
      return {
        shape,
        width: widthPx,
        height: lengthPx,
        radiusPx: lengthPx / 2,
        diameterPx: lengthPx,
        lengthPx,
        widthPx,
        sizePx: lengthPx
      }
    } else {
      // Square / Cube
      const widthFeet = effect.widthFeet || 20
      const sizePx = widthFeet * pixelsPerFoot
      return {
        shape,
        width: sizePx,
        height: sizePx,
        radiusPx: sizePx / 2,
        diameterPx: sizePx,
        lengthPx: sizePx,
        widthPx: sizePx,
        sizePx
      }
    }
  }, [effect, pixelsPerFoot])

  const opacity = effect.opacity ?? 0.85
  const rotation = effect.rotationDeg ?? 0
  const type = effect.type || 'fire'
  const filterId = `filter-${type}-${effect.id}`
  const gradId = `grad-${type}-${effect.id}`
  const coreGradId = `core-grad-${type}-${effect.id}`

  // Colors & Aesthetic Palettes for all 8 elements
  const palette = useMemo(() => {
    switch (type) {
      case 'fire':
        return {
          glow: 'rgba(249, 115, 22, 0.85)',
          deepGlow: 'rgba(239, 68, 68, 0.6)',
          accent: '#f97316',
          bright: '#fef08a',
          core: '#ffffff',
          dark: '#7f1d1d',
          smoke: '#1c0707',
          borderColor: '#f97316'
        }
      case 'lightning':
        return {
          glow: 'rgba(99, 102, 241, 0.9)',
          deepGlow: 'rgba(165, 243, 252, 0.7)',
          accent: '#818cf8',
          bright: '#c7d2fe',
          core: '#ffffff',
          dark: '#312e81',
          smoke: '#0f172a',
          borderColor: '#a5b4fc'
        }
      case 'ice':
        return {
          glow: 'rgba(56, 189, 248, 0.85)',
          deepGlow: 'rgba(224, 242, 254, 0.6)',
          accent: '#38bdf8',
          bright: '#bae6fd',
          core: '#ffffff',
          dark: '#0369a1',
          smoke: '#082f49',
          borderColor: '#38bdf8'
        }
      case 'poison':
        return {
          glow: 'rgba(132, 204, 22, 0.85)',
          deepGlow: 'rgba(34, 197, 94, 0.6)',
          accent: '#84cc16',
          bright: '#d9f99d',
          core: '#ffffff',
          dark: '#14532d',
          smoke: '#052e16',
          borderColor: '#84cc16'
        }
      case 'radiance':
        return {
          glow: 'rgba(245, 158, 11, 0.9)',
          deepGlow: 'rgba(254, 240, 138, 0.7)',
          accent: '#eab308',
          bright: '#fef08a',
          core: '#ffffff',
          dark: '#b45309',
          smoke: '#451a03',
          borderColor: '#fde047'
        }
      case 'darkness':
        return {
          glow: 'rgba(88, 28, 135, 0.8)',
          deepGlow: 'rgba(0, 0, 0, 0.95)',
          accent: '#9333ea',
          bright: '#3b0764',
          core: '#000000',
          dark: '#0f051d',
          smoke: '#000000',
          borderColor: '#a855f7'
        }
      case 'arcane':
        return {
          glow: 'rgba(192, 132, 252, 0.9)',
          deepGlow: 'rgba(244, 114, 182, 0.65)',
          accent: '#c084fc',
          bright: '#f5d0fe',
          core: '#ffffff',
          dark: '#6b21a8',
          smoke: '#2e1065',
          borderColor: '#e879f9'
        }
      case 'smoke':
      case 'web':
      default:
        return {
          glow: 'rgba(148, 163, 184, 0.5)',
          deepGlow: 'rgba(71, 85, 105, 0.4)',
          accent: '#94a3b8',
          bright: '#f1f5f9',
          core: '#ffffff',
          dark: '#334155',
          smoke: '#0f172a',
          borderColor: '#cbd5e1'
        }
    }
  }, [type])

  // Common SVG Gradients & Filters
  const renderDefs = () => (
    <defs>
      {/* Dynamic Base Gradient */}
      <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={palette.core} stopOpacity="0.98" />
        <stop offset="25%" stopColor={palette.bright} stopOpacity="0.9" />
        <stop offset="55%" stopColor={palette.accent} stopOpacity="0.78" />
        <stop offset="85%" stopColor={palette.dark} stopOpacity="0.55" />
        <stop offset="100%" stopColor={palette.smoke} stopOpacity="0.05" />
      </radialGradient>

      {/* High-Luminance Core Gradient */}
      <radialGradient id={coreGradId} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
        <stop offset="40%" stopColor={palette.bright} stopOpacity="0.85" />
        <stop offset="100%" stopColor={palette.accent} stopOpacity="0" />
      </radialGradient>

      {/* Multi-Octave Organic Displacement Filter */}
      <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency={type === 'smoke' ? '0.02 0.03' : type === 'lightning' ? '0.08 0.15' : '0.04 0.08'}
          numOctaves="4"
          result="noise"
        >
          <animate
            attributeName="baseFrequency"
            dur={type === 'smoke' ? '8s' : type === 'lightning' ? '0.8s' : '3s'}
            values={
              type === 'lightning'
                ? '0.08 0.15; 0.14 0.25; 0.08 0.15'
                : '0.04 0.08; 0.07 0.12; 0.04 0.08'
            }
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale={type === 'smoke' ? '18' : '14'} />
      </filter>
    </defs>
  )

  // ==============================================================
  // 1. PROJECTILE RENDERING: FLIGHT TRAJECTORY & DETONATION BURST
  // ==============================================================
  if (isProjectile) {
    const originX = effect.x
    const originY = effect.y
    const targetX = effect.targetX ?? effect.x
    const targetY = effect.targetY ?? effect.y

    // In flight phase: Show missile traveling from origin to target
    if (projectilePhase === 'flight' && !isPreview) {
      const dx = targetX - originX
      const dy = targetY - originY
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI

      return (
        <div className="absolute inset-0 pointer-events-none z-35 overflow-visible">
          {/* SVG Flight Trail Line */}
          <svg className="w-full h-full absolute inset-0 overflow-visible">
            <defs>
              <linearGradient id={`proj-trail-${effect.id}`} x1={`${originX}%`} y1={`${originY}%`} x2={`${targetX}%`} y2={`${targetY}%`}>
                <stop offset="0%" stopColor={palette.accent} stopOpacity="0.1" />
                <stop offset="70%" stopColor={palette.accent} stopOpacity="0.7" />
                <stop offset="100%" stopColor={palette.core} stopOpacity="1" />
              </linearGradient>
            </defs>
            <line
              x1={`${originX}%`}
              y1={`${originY}%`}
              x2={`${targetX}%`}
              y2={`${targetY}%`}
              stroke={`url(#proj-trail-${effect.id})`}
              strokeWidth="4"
              strokeDasharray="6 3"
              className="animate-pulse"
            />
          </svg>

          {/* Flying Missile Head with Particle Wake */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all ease-linear"
            style={{
              left: `${targetX}%`,
              top: `${targetY}%`,
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              filter: `drop-shadow(0 0 16px ${palette.glow})`
            }}
          >
            <div className="flex items-center">
              {/* Particle Wake Tail */}
              <div 
                className="w-16 h-2 rounded-l-full opacity-80"
                style={{
                  background: `linear-gradient(to right, transparent, ${palette.accent}, ${palette.core})`
                }}
              />
              {/* Missile Core Head */}
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow-2xl flex items-center justify-center animate-spin"
                style={{
                  backgroundColor: palette.bright,
                  boxShadow: `0 0 20px ${palette.glow}, inset 0 0 8px #ffffff`
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Impact Phase or Live Aiming Preview: Render High-Impact Detonation Explosion at Target
    const r = geometry.radiusPx
    const d = geometry.diameterPx

    return (
      <div
        className="absolute pointer-events-none select-none z-35 animate-fade-in"
        style={{
          left: `${targetX}%`,
          top: `${targetY}%`,
          width: `${d}px`,
          height: `${d}px`,
          transform: 'translate(-50%, -50%)',
          filter: `drop-shadow(0 0 28px ${palette.glow}) drop-shadow(0 0 55px ${palette.deepGlow})`
        }}
      >
        <svg
          width={d}
          height={d}
          viewBox={`0 0 ${d} ${d}`}
          className="w-full h-full overflow-visible pointer-events-none"
        >
          {renderDefs()}

          {/* Rapid Expanding Shockwave Wavefront */}
          <circle
            cx={r}
            cy={r}
            r={r * 0.95}
            fill="none"
            stroke={palette.bright}
            strokeWidth="3.5"
            opacity="0.9"
            className="animate-ping"
            style={{ animationDuration: '0.9s', animationIterationCount: '2' }}
          />

          {/* Base Atmospheric Detonation Sphere with Fractal Noise */}
          <circle
            cx={r}
            cy={r}
            r={r - 4}
            fill={`url(#${gradId})`}
            filter={`url(#${filterId})`}
            style={{ opacity }}
          />

          {/* Concentric Detonation Plasma Corona */}
          <g className="animate-spin" style={{ animationDuration: '8s', transformOrigin: `${r}px ${r}px` }}>
            <polygon
              points={getStarPolygonPoints(r, r, r * 0.72, r * 0.48, 10)}
              fill={`url(#${coreGradId})`}
              opacity="0.85"
              filter={`url(#${filterId})`}
            />
          </g>

          {/* Inner Counter-Rotating Blast Burst */}
          <g className="animate-spin" style={{ animationDuration: '5s', animationDirection: 'reverse', transformOrigin: `${r}px ${r}px` }}>
            <polygon
              points={getStarPolygonPoints(r, r, r * 0.52, r * 0.32, 8)}
              fill={palette.bright}
              opacity="0.75"
            />
          </g>

          {/* Leaping Explosive Shards & Embers */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, idx) => {
            const rad = (angle * Math.PI) / 180
            const ex = r + Math.cos(rad) * (r * 0.78)
            const ey = r + Math.sin(rad) * (r * 0.78)
            return (
              <circle
                key={`spark-${idx}`}
                cx={ex}
                cy={ey}
                r={Math.max(2, r * 0.03)}
                fill="#ffffff"
                className="animate-pulse"
                style={{ animationDuration: `${0.6 + (idx % 4) * 0.25}s` }}
              />
            )
          })}

          {/* Luminous Pulsating Core Energy Flash */}
          <circle cx={r} cy={r} r={r * 0.3} fill={`url(#${coreGradId})`} opacity="0.9" className="animate-pulse" />

          {/* High-Contrast Impact Perimeter Ring */}
          <circle
            cx={r}
            cy={r}
            r={r - 2}
            fill="none"
            stroke={palette.bright}
            strokeWidth="2"
            strokeDasharray="5 3"
            opacity="0.8"
          />
        </svg>
      </div>
    )
  }

  // ==============================================================
  // 2. GEOMETRIC SHAPES (CIRCLE, CONE, LINE, SQUARE)
  // ==============================================================
  const renderVisualContent = () => {
    if (geometry.shape === 'circle') {
      const r = geometry.radiusPx
      const d = geometry.diameterPx

      return (
        <svg
          width={d}
          height={d}
          viewBox={`0 0 ${d} ${d}`}
          className="w-full h-full overflow-visible pointer-events-none"
        >
          {renderDefs()}

          {/* Base Ambient Body with Turbulence */}
          <circle
            cx={r}
            cy={r}
            r={r - 4}
            fill={`url(#${gradId})`}
            filter={type !== 'darkness' ? `url(#${filterId})` : undefined}
            style={{ opacity }}
          />

          {/* ELEMENT-SPECIFIC HIGH FIDELITY LAYERS */}

          {/* 🔥 FIRE: High-Fidelity Tabletop Spell Template */}
          {type === 'fire' && (
            <>
              {/* Tactical Concentric Range Rings */}
              <circle
                cx={r}
                cy={r}
                r={r * 0.33}
                fill="none"
                stroke="#fef08a"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.35"
              />
              <circle
                cx={r}
                cy={r}
                r={r * 0.66}
                fill="none"
                stroke="#f97316"
                strokeWidth="1.2"
                strokeDasharray="6 4"
                opacity="0.45"
              />

              {/* 8-Point Compass Range Ticks */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, idx) => {
                const rad = (deg * Math.PI) / 180
                const x1 = r + Math.cos(rad) * (r * 0.88)
                const y1 = r + Math.sin(rad) * (r * 0.88)
                const x2 = r + Math.cos(rad) * (r * 0.98)
                const y2 = r + Math.sin(rad) * (r * 0.98)
                return (
                  <line
                    key={`fire-tick-${idx}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#fef08a"
                    strokeWidth="1.5"
                    opacity="0.6"
                  />
                )
              })}

              {/* Outer Solar Corona Flame Flaring Star (Rotating) */}
              <g className="animate-spin" style={{ animationDuration: '22s', transformOrigin: `${r}px ${r}px` }}>
                <polygon
                  points={getStarPolygonPoints(r, r, r * 0.82, r * 0.6, 12)}
                  fill={`url(#${coreGradId})`}
                  opacity="0.75"
                  filter={`url(#${filterId})`}
                />
              </g>

              {/* Inner Counter-Rotating Flame Tongue Corona */}
              <g className="animate-spin" style={{ animationDuration: '14s', animationDirection: 'reverse', transformOrigin: `${r}px ${r}px` }}>
                <polygon
                  points={getStarPolygonPoints(r, r, r * 0.6, r * 0.42, 8)}
                  fill="#fef08a"
                  opacity="0.65"
                  filter={`url(#${filterId})`}
                />
              </g>

              {/* Core Heat Shimmer Disc */}
              <circle
                cx={r}
                cy={r}
                r={r * 0.38}
                fill={`url(#${coreGradId})`}
                opacity="0.85"
                className="animate-pulse"
                style={{ animationDuration: '2s' }}
              />

              {/* Natural Drifting Embers */}
              {[0, 40, 85, 130, 175, 215, 260, 305, 345].map((angle, idx) => {
                const rad = (angle * Math.PI) / 180
                const distRatio = 0.45 + ((idx * 7) % 40) / 100
                const ex = r + Math.cos(rad) * (r * distRatio)
                const ey = r + Math.sin(rad) * (r * distRatio)
                return (
                  <circle
                    key={`fire-spark-${idx}`}
                    cx={ex}
                    cy={ey}
                    r={Math.max(1.8, r * 0.025)}
                    fill={idx % 2 === 0 ? '#fef08a' : '#f97316'}
                    opacity="0.85"
                    className="animate-pulse"
                    style={{ animationDuration: `${1.4 + (idx % 3) * 0.5}s` }}
                  />
                )
              })}
            </>
          )}

          {/* ⚡ LIGHTNING: Plasma Core & Crackling Multi-Branching Arcs */}
          {type === 'lightning' && (
            <>
              <circle cx={r} cy={r} r={r * 0.4} fill="#ffffff" opacity="0.9" className="animate-pulse" />
              {/* Crackling Multi-Branching Plasma Arcs */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
                const rad = (angle * Math.PI) / 180
                const midRad = rad + 0.2
                const mx = r + Math.cos(midRad) * (r * 0.5)
                const my = r + Math.sin(midRad) * (r * 0.5)
                const ex = r + Math.cos(rad) * (r * 0.88)
                const ey = r + Math.sin(rad) * (r * 0.88)
                return (
                  <polyline
                    key={`bolt-${idx}`}
                    points={`${r},${r} ${mx},${my} ${ex},${ey}`}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={idx % 2 === 0 ? '2.5' : '1.5'}
                    strokeDasharray="8 4"
                    opacity="0.9"
                    className="animate-pulse"
                    style={{ animationDuration: `${0.3 + (idx % 3) * 0.2}s` }}
                  />
                )
              })}
            </>
          )}

          {/* ❄️ ICE: Crystalline Snowflake Mandala & Swirling Frost Spikes */}
          {type === 'ice' && (
            <>
              <g className="animate-spin" style={{ animationDuration: '24s', transformOrigin: `${r}px ${r}px` }}>
                {/* 6-Sided Crystalline Frost Fractal Spikes */}
                {[0, 60, 120, 180, 240, 300].map((deg, idx) => {
                  const rad = (deg * Math.PI) / 180
                  const ex = r + Math.cos(rad) * (r * 0.85)
                  const ey = r + Math.sin(rad) * (r * 0.85)
                  return (
                    <g key={`ice-${idx}`}>
                      <line x1={r} y1={r} x2={ex} y2={ey} stroke="#ffffff" strokeWidth="2.5" opacity="0.85" />
                      <circle cx={ex} cy={ey} r={Math.max(3, r * 0.05)} fill="#bae6fd" />
                    </g>
                  )
                })}
                <circle cx={r} cy={r} r={r * 0.45} fill="none" stroke="#e0f2fe" strokeWidth="2" strokeDasharray="6 4" />
              </g>
              <circle cx={r} cy={r} r={r * 0.2} fill="#ffffff" opacity="0.9" />
            </>
          )}

          {/* ☠️ POISON: Bubbling Caustic Pustules & Toxic Vapors */}
          {type === 'poison' && (
            <g className="animate-pulse" style={{ animationDuration: '2.5s' }}>
              {[0.3, 0.55, 0.75].map((dist, idx) => {
                const angle = idx * 110
                const rad = (angle * Math.PI) / 180
                const px = r + Math.cos(rad) * (r * dist)
                const py = r + Math.sin(rad) * (r * dist)
                return (
                  <circle
                    key={`bubble-${idx}`}
                    cx={px}
                    cy={py}
                    r={Math.max(6, r * 0.12)}
                    fill="#d9f99d"
                    opacity="0.75"
                    stroke="#15803d"
                    strokeWidth="1.5"
                    className="animate-ping"
                    style={{ animationDuration: `${1.5 + idx * 0.5}s` }}
                  />
                )
              })}
            </g>
          )}

          {/* ✨ RADIANCE: Divine Sunburst Rays & Celestial Glyphs */}
          {type === 'radiance' && (
            <g className="animate-spin" style={{ animationDuration: '30s', transformOrigin: `${r}px ${r}px` }}>
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, idx) => {
                const rad = (deg * Math.PI) / 180
                return (
                  <line
                    key={`sunbeam-${idx}`}
                    x1={r + Math.cos(rad) * (r * 0.25)}
                    y1={r + Math.sin(rad) * (r * 0.25)}
                    x2={r + Math.cos(rad) * (r * 0.92)}
                    y2={r + Math.sin(rad) * (r * 0.92)}
                    stroke="#ffffff"
                    strokeWidth={idx % 2 === 0 ? '2.5' : '1.5'}
                    opacity="0.8"
                  />
                )
              })}
              <circle cx={r} cy={r} r={r * 0.55} fill="none" stroke="#fef08a" strokeWidth="2" strokeDasharray="8 4" />
              <circle cx={r} cy={r} r={r * 0.25} fill="#ffffff" opacity="0.95" />
            </g>
          )}

          {/* 🌑 DARKNESS: Gravitational Singularity & Writhing Shadows */}
          {type === 'darkness' && (
            <>
              <circle cx={r} cy={r} r={r * 0.7} fill="#000000" opacity="0.98" />
              <circle cx={r} cy={r} r={r * 0.45} fill="#050508" opacity="1" />
              {/* Writhing Void Tendrils */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, idx) => {
                const rad = (deg * Math.PI) / 180
                const ex = r + Math.cos(rad) * (r * 0.9)
                const ey = r + Math.sin(rad) * (r * 0.9)
                return (
                  <path
                    key={`tendril-${idx}`}
                    d={`M ${r} ${r} Q ${r + Math.cos(rad + 0.3) * (r * 0.6)} ${r + Math.sin(rad + 0.3) * (r * 0.6)} ${ex} ${ey}`}
                    fill="none"
                    stroke="#9333ea"
                    strokeWidth="2"
                    opacity="0.6"
                    className="animate-pulse"
                    style={{ animationDuration: `${2 + (idx % 3)}s` }}
                  />
                )
              })}
            </>
          )}

          {/* 🔮 ARCANE: Concentric Runic Circles & Orbiting Energy Orbs */}
          {type === 'arcane' && (
            <>
              <g className="animate-spin" style={{ animationDuration: '16s', transformOrigin: `${r}px ${r}px` }}>
                <polygon
                  points={`${r},${r - r * 0.75} ${r + r * 0.65},${r + r * 0.4} ${r - r * 0.65},${r + r * 0.4}`}
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="2"
                  opacity="0.75"
                />
                <polygon
                  points={`${r},${r + r * 0.75} ${r + r * 0.65},${r - r * 0.4} ${r - r * 0.65},${r - r * 0.4}`}
                  fill="none"
                  stroke="#f472b6"
                  strokeWidth="2"
                  opacity="0.75"
                />
              </g>
              <circle cx={r} cy={r} r={r * 0.28} fill="#ffffff" opacity="0.95" />
            </>
          )}

          {/* 💨 SMOKE / MIST: Volumetric Swirling Fog Discs */}
          {type === 'smoke' && (
            <g className="animate-spin" style={{ animationDuration: '35s', transformOrigin: `${r}px ${r}px` }}>
              <circle cx={r * 0.8} cy={r * 0.75} r={r * 0.42} fill="#cbd5e1" opacity="0.4" filter={`url(#${filterId})`} />
              <circle cx={r * 1.2} cy={r * 1.15} r={r * 0.48} fill="#94a3b8" opacity="0.35" filter={`url(#${filterId})`} />
              <circle cx={r * 1.1} cy={r * 0.7} r={r * 0.38} fill="#f1f5f9" opacity="0.3" filter={`url(#${filterId})`} />
            </g>
          )}

          {/* Outer Boundary Ring */}
          <circle
            cx={r}
            cy={r}
            r={r - 2}
            fill="none"
            stroke={palette.borderColor}
            strokeWidth={isSelected ? '2.5' : '1.5'}
            strokeDasharray="5 3"
            opacity={isSelected ? 1 : 0.75}
          />
        </svg>
      )
    }

    // CONE SHAPE (Directional 60° Breath / Blast)
    if (geometry.shape === 'cone') {
      const len = geometry.lengthPx || 100
      const halfWidth = (geometry.widthPx || 100) / 2

      return (
        <svg
          width={geometry.widthPx}
          height={len}
          viewBox={`0 0 ${geometry.widthPx} ${len}`}
          className="w-full h-full overflow-visible pointer-events-none"
        >
          {renderDefs()}
          <defs>
            <linearGradient id={`cone-${gradId}`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="25%" stopColor={palette.bright} stopOpacity="0.88" />
              <stop offset="65%" stopColor={palette.accent} stopOpacity="0.65" />
              <stop offset="100%" stopColor={palette.dark} stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* 60° Cone Path radiating downwards from apex at (halfWidth, 0) */}
          <path
            d={`M ${halfWidth} 0 L 0 ${len} A ${len} ${len} 0 0 0 ${geometry.widthPx} ${len} Z`}
            fill={`url(#cone-${gradId})`}
            filter={`url(#${filterId})`}
            style={{ opacity }}
            stroke={palette.borderColor}
            strokeWidth={isSelected ? '2' : '1'}
            strokeDasharray="4 3"
          />

          {/* Directional Wave Fronts */}
          <path
            d={`M ${halfWidth - halfWidth * 0.5} ${len * 0.5} A ${len * 0.5} ${len * 0.5} 0 0 0 ${halfWidth + halfWidth * 0.5} ${len * 0.5}`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.8"
            className="animate-pulse"
          />
        </svg>
      )
    }

    // LINE SHAPE (Ray, Beam, Wall)
    if (geometry.shape === 'line') {
      const len = geometry.lengthPx || 120
      const w = geometry.widthPx || 16

      return (
        <svg
          width={w}
          height={len}
          viewBox={`0 0 ${w} ${len}`}
          className="w-full h-full overflow-visible pointer-events-none"
        >
          {renderDefs()}
          <defs>
            <linearGradient id={`line-${gradId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={palette.accent} stopOpacity="0.3" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor={palette.accent} stopOpacity="0.3" />
            </linearGradient>
          </defs>

          <rect
            x="0"
            y="0"
            width={w}
            height={len}
            rx={w / 2}
            fill={`url(#line-${gradId})`}
            stroke={palette.borderColor}
            strokeWidth={isSelected ? '2' : '1'}
            strokeDasharray="4 2"
            style={{ opacity }}
            className={type === 'lightning' ? 'animate-pulse' : ''}
          />

          {/* Intense Core Energy Beam */}
          <line
            x1={w / 2}
            y1={0}
            x2={w / 2}
            y2={len}
            stroke="#ffffff"
            strokeWidth={Math.max(2, w * 0.25)}
            opacity="0.9"
          />
        </svg>
      )
    }

    // SQUARE / CUBE (Area Zone / Wall)
    const size = geometry.sizePx || 80
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full overflow-visible pointer-events-none"
      >
        {renderDefs()}
        <rect
          x="2"
          y="2"
          width={size - 4}
          height={size - 4}
          rx="6"
          fill={`url(#${gradId})`}
          filter={`url(#${filterId})`}
          stroke={palette.borderColor}
          strokeWidth={isSelected ? '2.5' : '1.5'}
          strokeDasharray="4 3"
          style={{ opacity }}
        />
        <rect
          x={size * 0.25}
          y={size * 0.25}
          width={size * 0.5}
          height={size * 0.5}
          rx="4"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
          opacity="0.6"
          className="animate-pulse"
        />
      </svg>
    )
  }

  const isDirectional = geometry.shape === 'cone' || geometry.shape === 'line'

  return (
    <div
      onClick={(e) => {
        if (!isPreview && onSelect) {
          e.stopPropagation()
          onSelect()
        }
      }}
      className={`absolute transition-transform select-none group ${
        isPreview
          ? 'z-35 opacity-90 pointer-events-none'
          : 'z-25 pointer-events-none'
      }`}
      style={{
        left: `${effect.x}%`,
        top: `${effect.y}%`,
        width: `${geometry.width}px`,
        height: `${geometry.height}px`,
        transformOrigin: isDirectional ? '50% 0%' : 'center center',
        transform: isDirectional
          ? `translate(-50%, 0%) rotate(${rotation}deg)`
          : `translate(-50%, -50%) rotate(${rotation}deg)`,
        filter: isSelected
          ? `drop-shadow(0 0 28px ${palette.bright}) drop-shadow(0 0 12px #ffffff)`
          : `drop-shadow(0 0 20px ${palette.glow})`
      }}
    >
      {/* Visual Content Layer */}
      {renderVisualContent()}

      {/* Interactive GM Overlay Pill on Hover */}
      {!isPreview && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-auto transition-opacity z-50 flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] bg-oros-950/95 border border-oros-750 shadow-2xl text-[10px] font-mono text-white whitespace-nowrap">
          <span className="font-semibold text-accent">{effect.name || effect.type.toUpperCase()}</span>
          <span className="text-oros-400">({effect.radiusFeet || effect.lengthFeet || 20}ft)</span>
          {onAutoDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAutoDelete(effect.id)
              }}
              title="Dismiss / Remove this effect"
              className="p-0.5 text-oros-400 hover:text-rose-400 transition-colors ml-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
