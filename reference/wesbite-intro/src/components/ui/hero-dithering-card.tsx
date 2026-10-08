"use client"

import { useState, Suspense, lazy } from "react"
import { TextScramble } from "@/components/ui/text-scramble"

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
)

export function CTASection() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <section
      className="w-full h-dvh min-h-screen relative overflow-hidden bg-card flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
          <Suspense fallback={<div className="absolute inset-0 bg-muted/20" />}>
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen">
              <Dithering
                colorBack="#00000000"
                colorFront="#EC4E02"
                shape="warp"
                type="4x4"
                speed={isHovered ? 0.6 : 0.2}
                className="size-full"
                minPixelRatio={1}
              />
            </div>
          </Suspense>

          <div className="relative z-10 px-6 max-w-2xl mx-auto text-center flex flex-col items-center" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </span>
              <span className="text-xs tracking-wide text-primary">Spatial Intelligence</span>
            </div>

            <div className="mb-6">
              <TextScramble text="EXPLORE SPACES," className="text-3xl md:text-4xl lg:text-5xl" autoPlay autoPlayDelay={200} />
              <br />
              <TextScramble text="SENSE EVERYTHING." className="text-3xl md:text-4xl lg:text-5xl text-foreground/80" autoPlay autoPlayDelay={500} />
            </div>

            <p className="text-muted-foreground text-sm md:text-base max-w-lg mb-10 leading-relaxed">
              Wesbite is Ye&apos;s realtime orchestration layer for autonomous infrastructure &mdash; sensing, coordination, and execution across intelligent spaces.
            </p>

            <TextScramble text="ENTER WESBITE" autoPlay autoPlayDelay={800} />
          </div>
    </section>
  )
}
