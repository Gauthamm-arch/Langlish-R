import { Languages, Type, ListTree, MapPin, Clock, Target } from 'lucide-react'
import type { DecodeResult } from '@/lib/types'

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
      {children}
    </span>
  )
}

function CardShell({
  icon,
  title,
  accent,
  children,
}: {
  icon: React.ReactNode
  title: string
  accent: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-white/15 bg-white/[0.07] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl">
      <div className="-ml-1 flex items-center gap-2.5">
        <span className={`flex size-10 items-center justify-center ${accent}`} aria-hidden="true">
          {icon}
        </span>
        <h3 className="text-base font-semibold tracking-tight text-card-foreground">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function DetailRow({
  icon,
  label,
  items,
}: {
  icon: React.ReactNode
  label: string
  items: string[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </span>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <Tag key={`${label}-${i}`}>{item}</Tag>
          ))}
        </div>
      ) : (
        <span className="text-sm text-muted-foreground/60">—</span>
      )}
    </div>
  )
}

export function ResultCards({ result }: { result: DecodeResult }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <CardShell
        title="Normalized English"
        accent="text-violet-300"
        icon={<Languages className="size-5" />}
      >
        <p className="text-sm leading-relaxed text-card-foreground">
          {result.normalizedEnglish}
        </p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {result.detectedLanguages.map((lang, i) => (
            <Tag key={`lang-${i}`}>{lang}</Tag>
          ))}
        </div>
      </CardShell>

      <CardShell
        title="Native Script"
        accent="text-cyan-300"
        icon={<Type className="size-5" />}
      >
        <p className="text-lg leading-relaxed text-card-foreground" lang="und">
          {result.nativeScript}
        </p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {result.scriptNames.map((s, i) => (
            <Tag key={`script-${i}`}>{s}</Tag>
          ))}
        </div>
      </CardShell>

      <CardShell
        title="Extracted Data"
        accent="text-emerald-300"
        icon={<ListTree className="size-5" />}
      >
        <div className="flex flex-col gap-3">
          <DetailRow
            icon={<Target className="size-3.5" />}
            label="Intent"
            items={result.intent ? [result.intent] : []}
          />
          <DetailRow
            icon={<MapPin className="size-3.5" />}
            label="Locations"
            items={result.locations}
          />
          <DetailRow
            icon={<Clock className="size-3.5" />}
            label="Times"
            items={result.times}
          />
        </div>
      </CardShell>
    </div>
  )
}
