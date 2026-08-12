import React from 'react';
import { BodyType, CoreType, RuneType } from '../types';
import { BODIES, CORES, RUNES } from '../data/gameData';

interface GolemVisualProps {
  body: BodyType;
  core: CoreType;
  rune: RuneType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animationState?: 'idle' | 'attacking' | 'damaged' | 'victory';
  isFlipped?: boolean; // True when facing left (e.g. enemy in battle)
  className?: string;
}

export const GolemVisual: React.FC<GolemVisualProps> = ({
  body,
  core,
  rune,
  size = 'md',
  animationState = 'idle',
  isFlipped = false,
  className = '',
}) => {
  const bodyInfo = BODIES[body];
  const coreInfo = CORES[core];
  const runeInfo = RUNES[rune];

  // Dimension scaling
  const sizeMap = {
    sm: { w: 120, h: 140 },
    md: { w: 180, h: 210 },
    lg: { w: 260, h: 300 },
    xl: { w: 340, h: 380 },
  };

  const dims = sizeMap[size];

  // Material specific styling rules
  const getMaterialFill = () => {
    switch (body) {
      case 'stone':
        return '#57534e'; // Stone slate
      case 'iron':
        return '#475569'; // Steel blue grey
      case 'wood':
        return '#854d0e'; // Warm dark wood
      case 'clay':
        return '#ea580c'; // Clay terracotta
      default:
        return '#64748b';
    }
  };

  const getMaterialStroke = () => {
    switch (body) {
      case 'stone':
        return '#292524';
      case 'iron':
        return '#1e293b';
      case 'wood':
        return '#451a03';
      case 'clay':
        return '#7c2d12';
      default:
        return '#0f172a';
    }
  };

  // Animation CSS classes
  const getAnimationClass = () => {
    switch (animationState) {
      case 'attacking':
        return isFlipped ? '-translate-x-12 scale-110' : 'translate-x-12 scale-110';
      case 'damaged':
        return 'animate-bounce brightness-150 red-flash';
      case 'victory':
        return '-translate-y-4 scale-105';
      case 'idle':
      default:
        return 'animate-pulse-slow';
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center transition-all duration-300 ${getAnimationClass()} ${className}`}
      style={{
        width: dims.w,
        height: dims.h,
        transform: `${isFlipped ? 'scaleX(-1)' : ''}`,
      }}
    >
      <svg
        viewBox="0 0 200 240"
        className="w-full h-full drop-shadow-2xl overflow-visible"
      >
        <defs>
          {/* Core Glow Filter */}
          <filter id={`coreGlow-${core}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Rune Glow Filter */}
          <filter id={`runeGlow-${rune}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Linear Gradient for Body Materials */}
          <linearGradient id={`bodyGrad-${body}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={bodyInfo.color} />
            <stop offset="100%" stopColor={getMaterialFill()} />
          </linearGradient>
        </defs>

        {/* Aura particle ring for Rune */}
        <circle
          cx="100"
          cy="120"
          r="90"
          fill="none"
          stroke={runeInfo.symbolColor}
          strokeWidth="1.5"
          strokeDasharray="6, 8"
          opacity="0.4"
          className="animate-spin-slow origin-center"
        />

        {/* LEGS */}
        {body === 'stone' && (
          <g fill={`url(#bodyGrad-${body})`} stroke={getMaterialStroke()} strokeWidth="3">
            {/* Left Blocky Leg */}
            <path d="M 60 160 L 50 215 L 80 220 L 85 160 Z" rx="2" />
            {/* Right Blocky Leg */}
            <path d="M 115 160 L 120 220 L 150 215 L 140 160 Z" rx="2" />
          </g>
        )}

        {body === 'iron' && (
          <g fill={`url(#bodyGrad-${body})`} stroke={getMaterialStroke()} strokeWidth="3">
            {/* Sleek Armor Legs */}
            <rect x="55" y="160" width="30" height="55" rx="6" />
            <rect x="115" y="160" width="30" height="55" rx="6" />
            {/* Foot Plating */}
            <path d="M 45 210 L 88 210 L 88 222 L 45 222 Z" rx="3" />
            <path d="M 112 210 L 155 210 L 155 222 L 112 222 Z" rx="3" />
          </g>
        )}

        {body === 'wood' && (
          <g fill={`url(#bodyGrad-${body})`} stroke={getMaterialStroke()} strokeWidth="3">
            {/* Branch Legs */}
            <path d="M 65 160 Q 55 190 50 220 L 70 220 Q 75 190 80 160 Z" />
            <path d="M 120 160 Q 125 190 130 220 L 150 220 Q 145 190 135 160 Z" />
          </g>
        )}

        {body === 'clay' && (
          <g fill={`url(#bodyGrad-${body})`} stroke={getMaterialStroke()} strokeWidth="3">
            {/* Rounded Clay Legs */}
            <ellipse cx="68" cy="190" rx="16" ry="30" />
            <ellipse cx="132" cy="190" rx="16" ry="30" />
          </g>
        )}

        {/* TORSO / CHEST */}
        <g stroke={getMaterialStroke()} strokeWidth="3">
          {body === 'stone' && (
            <path
              d="M 50 85 L 150 85 L 135 165 L 65 165 Z"
              fill={`url(#bodyGrad-${body})`}
            />
          )}

          {body === 'iron' && (
            <path
              d="M 45 80 Q 100 70 155 80 L 140 165 C 100 175 100 175 60 165 Z"
              fill={`url(#bodyGrad-${body})`}
            />
          )}

          {body === 'wood' && (
            <path
              d="M 55 80 L 145 80 L 130 160 C 100 168 100 168 70 160 Z"
              fill={`url(#bodyGrad-${body})`}
            />
          )}

          {body === 'clay' && (
            <rect
              x="52"
              y="80"
              width="96"
              height="80"
              rx="24"
              fill={`url(#bodyGrad-${body})`}
            />
          )}
        </g>

        {/* ARMS */}
        <g fill={`url(#bodyGrad-${body})`} stroke={getMaterialStroke()} strokeWidth="3">
          {/* Left Arm */}
          <path d="M 20 90 L 48 90 L 40 150 L 15 145 Z" rx="4" />
          {/* Right Arm */}
          <path d="M 152 90 L 180 90 L 185 145 L 160 150 Z" rx="4" />

          {/* Fist / Gauntlet */}
          <circle cx="25" cy="155" r="14" fill={bodyInfo.color} />
          <circle cx="175" cy="155" r="14" fill={bodyInfo.color} />
        </g>

        {/* HEAD */}
        <g stroke={getMaterialStroke()} strokeWidth="3">
          {body === 'stone' && (
            <rect x="68" y="32" width="64" height="50" rx="6" fill={`url(#bodyGrad-${body})`} />
          )}
          {body === 'iron' && (
            <path
              d="M 70 30 L 130 30 L 125 78 L 75 78 Z"
              fill={`url(#bodyGrad-${body})`}
            />
          )}
          {body === 'wood' && (
            <g>
              <ellipse cx="100" cy="55" rx="30" ry="24" fill={`url(#bodyGrad-${body})`} />
              {/* Branch horns */}
              <path d="M 75 40 Q 60 20 50 22" stroke={getMaterialStroke()} strokeWidth="4" fill="none" />
              <path d="M 125 40 Q 140 20 150 22" stroke={getMaterialStroke()} strokeWidth="4" fill="none" />
            </g>
          )}
          {body === 'clay' && (
            <ellipse cx="100" cy="52" rx="32" ry="26" fill={`url(#bodyGrad-${body})`} />
          )}

          {/* Visor / Eye Slots */}
          <rect x="80" y="48" width="40" height="10" rx="3" fill="#0f172a" />
          <circle cx="90" cy="53" r="3" fill={coreInfo.glowColor} />
          <circle cx="110" cy="53" r="3" fill={coreInfo.glowColor} />
        </g>

        {/* CORE REACTOR IN CHEST */}
        <g filter={`url(#coreGlow-${core})`}>
          {/* Outer Ring */}
          <circle cx="100" cy="120" r="22" fill="#0f172a" stroke={coreInfo.glowColor} strokeWidth="3" />

          {/* Elemental Core Core */}
          <circle cx="100" cy="120" r="15" fill={coreInfo.glowColor} opacity="0.9" />

          {/* Elemental Core Symbols */}
          {core === 'fire' && (
            <path d="M 100 110 Q 106 118 100 128 Q 94 118 100 110 Z" fill="#fef08a" />
          )}
          {core === 'water' && (
            <circle cx="100" cy="120" r="8" fill="#e0f2fe" />
          )}
          {core === 'wind' && (
            <path d="M 94 120 Q 100 112 106 120 Q 100 128 94 120 Z" fill="#dcfce7" />
          )}
          {core === 'earth' && (
            <polygon points="100,111 107,120 100,129 93,120" fill="#fef9c3" />
          )}
        </g>

        {/* RUNE MARKINGS ON SHOULDERS AND CHEST */}
        <g filter={`url(#runeGlow-${rune})`} stroke={runeInfo.symbolColor} strokeWidth="2" fill="none">
          {/* Shoulder Runes */}
          <circle cx="50" cy="92" r="6" stroke={runeInfo.symbolColor} strokeWidth="2" />
          <circle cx="150" cy="92" r="6" stroke={runeInfo.symbolColor} strokeWidth="2" />

          {rune === 'attack' && (
            <>
              {/* Flame/Blade Runes on Chest */}
              <path d="M 80 105 L 88 120 L 78 135" />
              <path d="M 120 105 L 112 120 L 122 135" />
            </>
          )}

          {rune === 'defense' && (
            <>
              {/* Shield Hex Runes */}
              <polygon points="75,120 82,112 90,120 82,128" />
              <polygon points="125,120 118,112 110,120 118,128" />
            </>
          )}

          {rune === 'speed' && (
            <>
              {/* Lightning Speed Arrows */}
              <path d="M 72 110 L 85 120 L 75 130" />
              <path d="M 128 110 L 115 120 L 125 130" />
            </>
          )}

          {rune === 'regen' && (
            <>
              {/* Life Flower Glyph */}
              <circle cx="75" cy="120" r="5" fill={runeInfo.symbolColor} />
              <circle cx="125" cy="120" r="5" fill={runeInfo.symbolColor} />
            </>
          )}
        </g>
      </svg>
    </div>
  );
};
