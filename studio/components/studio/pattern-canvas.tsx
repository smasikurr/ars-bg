"use client"

import { useMemo } from "react"
import { useStudio } from "@/store/studio"
import {
  buildPatternSVG,
  DEFAULT_PATTERN_STATE,
  type PatternState,
} from "@/lib/engine/pattern-engine"

export function PatternCanvas({
  width,
  height,
}: {
  width: number
  height: number
}) {
  const pattern = useStudio(
    (s) => (s.doc as any).patternState || DEFAULT_PATTERN_STATE
  ) as PatternState

  const svgMarkup = useMemo(() => {
    return buildPatternSVG(pattern, width, height)
  }, [pattern, width, height])

  return (
    <div
      className="absolute inset-0 size-full overflow-hidden select-none pointer-events-none [&>svg]:size-full [&>svg]:block"
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  )
}
