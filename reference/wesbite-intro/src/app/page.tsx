"use client"

import { useState } from "react"
import { IntroAnimation } from "@/components/ui/intro-animation"
import { CTASection } from "@/components/ui/hero-dithering-card"

export default function Home() {
  const [introDone, setIntroDone] = useState(false)

  return (
    <main>
      {!introDone && <IntroAnimation onComplete={() => setIntroDone(true)} />}
      <CTASection />
    </main>
  )
}
