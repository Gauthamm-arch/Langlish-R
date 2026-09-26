'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Globe, AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BorderBeam } from '@/components/ui/border-beam'
import { ResultCards } from '@/components/result-cards'
import { decodeMessage } from '@/app/actions'
import { PRESETS, type DecodeResult } from '@/lib/types'

export function DecodePanel() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<DecodeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function run(input: string) {
    setError(null)
    startTransition(async () => {
      const res = await decodeMessage(input)
      if (res.ok) {
        setResult(res.data)
      } else {
        setResult(null)
        setError(res.error)
      }
    })
  }

  function handlePreset(preset: string) {
    setText(preset)
    run(preset)
  }

  function renderQuickExamples(label: string) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium uppercase tracking-wide text-zinc-200">
          {label}
        </span>
        <div className="grid gap-3 sm:grid-cols-3">
          {PRESETS.map((preset, index) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePreset(preset)}
              disabled={isPending}
              className="group flex flex-col gap-2 rounded-lg border border-white/10 bg-zinc-950/35 px-3 pt-3 pb-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-zinc-950/55 hover:shadow-lg hover:shadow-cyan-950/25 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <span className="flex items-center gap-2 font-mono text-sm tabular-nums text-cyan-200/75">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span className="h-px flex-1 bg-white/10 transition-colors group-hover:bg-cyan-200/40" />
              </span>
              <span className="text-sm leading-relaxed text-zinc-200 transition-colors group-hover:text-white">
                {preset}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <BorderBeam size="md" colorVariant="ice" theme="dark" duration={5}>
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/70 p-4 backdrop-blur sm:p-5">
          <label htmlFor="message" className="sr-only">
            Mixed-language message
          </label>
          <textarea
            id="message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (
                (e.metaKey || e.ctrlKey) &&
                e.key === 'Enter' &&
                !e.nativeEvent.isComposing &&
                e.keyCode !== 229
              ) {
                e.preventDefault()
                run(text)
              }
            }}
            placeholder="Type or paste a mixed-language message… e.g. bhai 5 baje milte hai near the cafe"
            rows={4}
            className="w-full resize-y rounded-xl border border-input bg-background/60 px-4 py-3 text-base leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-cyan-400/60 focus-visible:ring-2 focus-visible:ring-cyan-400/30"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Press{' '}
              <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px]">
                Ctrl/⌘ + Enter
              </kbd>{' '}
              to decode
            </p>

            <BorderBeam
              size="sm"
              colorVariant="ice"
              theme="dark"
              duration={2.2}
              active={!isPending}
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                onClick={() => run(text)}
                disabled={isPending || !text.trim()}
                className={`group/decode relative w-full overflow-hidden text-white transition-all duration-300 disabled:opacity-80 sm:w-auto ${
                  isPending
                    ? 'bg-zinc-900 shadow-md shadow-black/30 hover:bg-zinc-900'
                    : 'bg-teal-500 shadow-md shadow-teal-950/30 hover:-translate-y-0.5 hover:bg-teal-400 hover:shadow-lg hover:shadow-teal-300/30 active:translate-y-0'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {isPending ? (
                    <>
                      <Globe className="size-4 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4 beam-pulse" />
                      Decode Message
                      <ArrowRight className="size-4 transition-transform duration-300 ease-out group-hover/decode:translate-x-1.5" />
                    </>
                  )}
                </span>
              </Button>
            </BorderBeam>
          </div>
        </div>
      </BorderBeam>

      {!result && !isPending && renderQuickExamples('QUICK EXAMPLES')}

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {isPending && <ResultsSkeleton />}
      {isPending && renderQuickExamples('QUICK EXAMPLES')}

      {result && !isPending && (
        <>
          <ResultCards result={result} />
          {renderQuickExamples('MORE QUICK EXAMPLES')}
        </>
      )}
    </div>
  )
}

function ResultsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card/70 p-5"
        >
          <div className="flex items-center gap-2.5">
            <div className="size-8 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
