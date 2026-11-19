"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"

/**
 * ARS-BG PRO Brand Mark:
 * A precision geometric vector prism with multi-stop procedural mesh gradients,
 * faceted volumetric refraction, and an illuminated vector control node.
 */
export function Mark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "")
  const g = (n: string) => `${id}-${n}`

  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-7 select-none transition-transform duration-200 hover:scale-105", className)}
      aria-hidden
    >
      <defs>
        {/* Background Squircle Gradient */}
        <linearGradient id={g("bg")} x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0B0F19" />
          <stop offset="100%" stopColor="#030712" />
        </linearGradient>

        {/* Facet 1: Electric Cyan to Hyper Blue */}
        <linearGradient id={g("facet1")} x1="6" y1="6" x2="22" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00F5D4" />
          <stop offset="50%" stopColor="#00BAF2" />
          <stop offset="100%" stopColor="#4361EE" />
        </linearGradient>

        {/* Facet 2: Ultra Violet to Radiant Magenta */}
        <linearGradient id={g("facet2")} x1="16" y1="12" x2="32" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7928CA" />
          <stop offset="50%" stopColor="#B5179E" />
          <stop offset="100%" stopColor="#FF007A" />
        </linearGradient>

        {/* Facet 3: Ambient Glow Highlight */}
        <radialGradient id={g("glow")} cx="0.5" cy="0.2" r="0.8">
          <stop offset="0%" stopColor="#00F5D4" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#7928CA" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Crisp Border Stroke */}
        <linearGradient id={g("border")} x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Outer Obsidian Squircle Tile */}
      <rect x="1" y="1" width="34" height="34" rx="10" fill={`url(#${g("bg")})`} />
      <rect x="1" y="1" width="34" height="34" rx="10" stroke={`url(#${g("border")})`} strokeWidth="1.2" />

      {/* Ambient Mesh Glow Behind Geometric Shape */}
      <circle cx="18" cy="18" r="14" fill={`url(#${g("glow")})`} filter="blur(3px)" opacity="0.6" />

      {/* Precision Geometric Prism Facet A (Hex-Fold Left) */}
      <path
        d="M7 14L18 8L20 19L9 25L7 14Z"
        fill={`url(#${g("facet1")})`}
        fillOpacity="0.95"
      />

      {/* Precision Geometric Prism Facet B (Hex-Fold Right) */}
      <path
        d="M18 8L29 14L27 25L18 30L20 19Z"
        fill={`url(#${g("facet2")})`}
        fillOpacity="0.92"
      />

      {/* Center Bevel Line */}
      <path
        d="M18 8L20 19L18 30"
        stroke="#FFFFFF"
        strokeOpacity="0.4"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Vector Handle Coordinate Ring */}
      <circle cx="20" cy="19" r="4.2" fill="#030712" stroke="#FFFFFF" strokeWidth="1.6" />
      <circle cx="20" cy="19" r="2.2" fill="#00F5D4" />
    </svg>
  )
}

/**
 * ARS-BG PRO Official Brand Logo with Typography
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 group select-none", className)}>
      <Mark className="size-7 shrink-0 drop-shadow-[0_2px_8px_rgba(0,245,212,0.25)]" />
      <span className="flex items-center gap-1.5">
        <span className="text-[17px] font-black tracking-tight leading-none text-ink flex items-baseline">
          <span className="bg-gradient-to-r from-ink via-ink to-ink/80 bg-clip-text">ARS</span>
          <span className="text-accent/90 font-bold ml-0.5">·</span>
          <span className="text-ink font-semibold ml-0.5">BG</span>
        </span>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-mono font-bold tracking-widest uppercase bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/35 shadow-[0_0_10px_rgba(245,158,11,0.18)]">
          PRO
        </span>
      </span>
    </span>
  )
}
