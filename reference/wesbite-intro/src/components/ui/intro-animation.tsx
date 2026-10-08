"use client"

import { useState, useEffect, useRef, Suspense, lazy } from "react"

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
)

const WORDS = ["WE", "EXPERIENCE", "SPACE"]
const ENTER_MS = 700
const HOLD_MS = 500
const EXIT_MS = 600
const WORD_TOTAL = ENTER_MS + HOLD_MS + EXIT_MS
const FADE_OUT_MS = 500

export function IntroAnimation({ onComplete }: { onComplete?: () => void }) {
  const [wordIndex, setWordIndex] = useState(0)
  const [phase, setPhase] = useState<"before" | "center" | "after">("before")
  const [done, setDone] = useState(false)
  const [fading, setFading] = useState(false)
  const wordTimers = useRef<NodeJS.Timeout[]>([])
  const fadeTimer = useRef<NodeJS.Timeout | null>(null)

  // Handle fade-out completion separately so it's never cleared by word effect
  useEffect(() => {
    if (!fading) return
    fadeTimer.current = setTimeout(() => {
      setDone(true)
      onComplete?.()
    }, FADE_OUT_MS)
    return () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current)
    }
  }, [fading, onComplete])

  // Word sequencing
  useEffect(() => {
    if (done || fading) return

    setPhase("before")

    const t1 = setTimeout(() => setPhase("center"), 30)
    const t2 = setTimeout(() => setPhase("after"), 30 + ENTER_MS + HOLD_MS)
    const t3 = setTimeout(() => {
      const next = wordIndex + 1
      if (next >= WORDS.length) {
        setFading(true)
      } else {
        setWordIndex(next)
      }
    }, 30 + WORD_TOTAL)

    wordTimers.current = [t1, t2, t3]

    return () => {
      wordTimers.current.forEach(clearTimeout)
    }
  }, [wordIndex, done, fading])

  if (done) return null

  const word = WORDS[wordIndex]
  const inlineScale = word === "EXPERIENCE" ? "scaleX(0.55)" : "scaleX(1)"

  const yTransform =
    phase === "before"
      ? "translateY(100vh) scaleY(1)"
      : phase === "center"
        ? "translateY(0) scaleY(1)"
        : "translateY(-50vh) scaleY(3)"

  const transition =
    phase === "before"
      ? "none"
      : phase === "center"
        ? `transform ${ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`
        : `transform ${EXIT_MS}ms cubic-bezier(0.7, 0, 0.84, 0)`

  return (
    <div
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <Suspense fallback={null}>
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30 mix-blend-screen">
          <Dithering
            colorBack="#00000000"
            colorFront="#EC4E02"
            shape="warp"
            type="4x4"
            speed={0.3}
            className="size-full"
            minPixelRatio={1}
          />
        </div>
      </Suspense>

      <span
        className="relative z-10 uppercase text-[24vw] md:text-[26vw] leading-none font-bold tracking-tight select-none whitespace-nowrap"
        style={{
          fontFamily:
            "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
          color: "#EC4E02",
          transform: `${inlineScale} ${yTransform}`,
          transition,
          transformOrigin: "center top",
        }}
      >
        {word}
      </span>
    </div>
  )
}
