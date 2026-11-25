import React from 'react'

interface VectorIconProps {
  className?: string
  glow?: boolean
}

// Premium Stone / Meteorite Vector Icon
export const StoneVector: React.FC<VectorIconProps> = ({ className = 'w-12 h-12', glow = false }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} ${glow ? 'drop-shadow-[0_0_12px_rgba(34,197,94,0.7)]' : 'drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]'} transition-transform`}
  >
    <defs>
      <linearGradient id="stoneGrad" x1="8" y1="10" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4ade80" offset="0%" />
        <stop stopColor="#15803d" offset="45%" />
        <stop stopColor="#052e16" offset="100%" />
      </linearGradient>
      <linearGradient id="facetHighlight" x1="15" y1="12" x2="35" y2="35" gradientUnits="userSpaceOnUse">
        <stop stopColor="#86efac" stopOpacity="0.8" />
        <stop stopColor="#22c55e" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    {/* Rock Body */}
    <path
      d="M24 8L44 11L56 26L52 48L36 57L14 52L8 34L15 16L24 8Z"
      fill="url(#stoneGrad)"
      stroke="#4ade80"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Facet Cuts */}
    <path
      d="M24 8L28 27L44 11M28 27L56 26M28 27L36 57M28 27L14 52M28 27L8 34"
      stroke="#86efac"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.85"
    />
    {/* Top Highlight Facet */}
    <polygon points="24,8 28,27 15,16" fill="url(#facetHighlight)" />
    {/* Core Sparkle */}
    <circle cx="28" cy="27" r="2.5" fill="#ffffff" className="animate-pulse" />
  </svg>
)

// Premium Paper / Cyber Scroll Vector Icon
export const PaperVector: React.FC<VectorIconProps> = ({ className = 'w-12 h-12', glow = false }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} ${glow ? 'drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]' : 'drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]'} transition-transform`}
  >
    <defs>
      <linearGradient id="paperGrad" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#c084fc" offset="0%" />
        <stop stopColor="#7e22ce" offset="50%" />
        <stop stopColor="#3b0764" offset="100%" />
      </linearGradient>
      <linearGradient id="foldGrad" x1="38" y1="8" x2="52" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f3e8ff" />
        <stop stopColor="#a855f7" />
      </linearGradient>
    </defs>
    {/* Main Sheet with folded corner */}
    <path
      d="M14 12C14 9.79086 15.7909 8 18 8H38L52 22V52C52 54.2091 50.2091 56 48 56H18C15.7909 56 14 54.2091 14 52V12Z"
      fill="url(#paperGrad)"
      stroke="#c084fc"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Folded Corner Triangle */}
    <path
      d="M38 8V20C38 21.1046 38.8954 22 40 22H52"
      fill="url(#foldGrad)"
      stroke="#e9d5ff"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Cyber Data Lines */}
    <line x1="22" y1="28" x2="44" y2="28" stroke="#f3e8ff" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
    <line x1="22" y1="36" x2="44" y2="36" stroke="#e9d5ff" strokeWidth="2.2" strokeLinecap="round" opacity="0.75" />
    <line x1="22" y1="44" x2="34" y2="44" stroke="#d8b4fe" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
    {/* Quantum node */}
    <circle cx="44" cy="44" r="2.5" fill="#f43f5e" className="animate-pulse" />
  </svg>
)

// Premium Scissor / Plasma Blade Vector Icon
export const ScissorVector: React.FC<VectorIconProps> = ({ className = 'w-12 h-12', glow = false }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} ${glow ? 'drop-shadow-[0_0_12px_rgba(6,182,212,0.7)]' : 'drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]'} transition-transform`}
  >
    <defs>
      <linearGradient id="bladeGrad" x1="16" y1="12" x2="52" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" offset="0%" />
        <stop stopColor="#0284c7" offset="60%" />
        <stop stopColor="#082f49" offset="100%" />
      </linearGradient>
      <linearGradient id="handleGrad" x1="10" y1="40" x2="30" y2="58" gradientUnits="userSpaceOnUse">
        <stop stopColor="#06b6d4" offset="0%" />
        <stop stopColor="#0e7490" offset="100%" />
      </linearGradient>
    </defs>
    {/* Blade 1 */}
    <path
      d="M32 30L51 11C52.5 9.5 54.5 11.5 53 13L36 34"
      stroke="#38bdf8"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M36 34L53 13C54.5 11.5 52.5 9.5 51 11L32 30"
      fill="url(#bladeGrad)"
    />
    {/* Blade 2 */}
    <path
      d="M32 34L53 51C54.5 52.5 52.5 54.5 51 53L36 30"
      stroke="#38bdf8"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Cross Pivot Joint */}
    <circle cx="32" cy="32" r="4.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
    <circle cx="32" cy="32" r="1.5" fill="#082f49" />

    {/* Handle Loop Left */}
    <path
      d="M26 27L16 20C12 17 8 21 11 25L23 33"
      stroke="#22d3ee"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <circle cx="15" cy="22" r="6" stroke="#22d3ee" strokeWidth="2.5" fill="none" opacity="0.9" />

    {/* Handle Loop Right */}
    <path
      d="M26 37L16 44C12 47 8 43 11 39L23 31"
      stroke="#22d3ee"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <circle cx="15" cy="42" r="6" stroke="#22d3ee" strokeWidth="2.5" fill="none" opacity="0.9" />
  </svg>
)
