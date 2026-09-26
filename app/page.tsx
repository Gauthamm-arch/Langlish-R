import { LinguaHeader } from '@/components/lingua-header'
import { DecodePanel } from '@/components/decode-panel'
import ParticleDrift from '@/components/ui/particle-drift'
import { AuroraBackground } from '@/components/aurora-background'

export default function Page() {
  return (
    <main className="relative min-h-dvh overflow-hidden text-foreground">
      <div className="fixed inset-0 -z-20" aria-hidden="true">
        <ParticleDrift
          className="h-full w-full"
          mode="dark"
          opacity={1.00}
          density={0.50}
          speed={0.9}
          hue={+10}
          saturation={1.1}
        />
      </div>
      <AuroraBackground />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(139,92,246,0.18),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-12 sm:py-16">
        <LinguaHeader />
        <DecodePanel />
      </div>
    </main>
  )
}
