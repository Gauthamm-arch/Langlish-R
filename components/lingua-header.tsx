import { Languages } from 'lucide-react'
import { IBM_Plex_Serif } from 'next/font/google'

const ibmPlexSerif = IBM_Plex_Serif({ subsets: ['latin'], weight: '700' })

export function LinguaHeader() {
  return (
    <header className="flex flex-col items-center gap-4 text-center">

      <div className="flex items-center gap-3">
        <span
          
        >
          <Languages className="size-8" />
        </span>
        <h1 className={`${ibmPlexSerif.className} text-4xl font-bold tracking-tight text-cyan-200 sm:text-5xl`}>
         Langlisch-<span>R</span>
        </h1>
      </div>

      <p className="max-w-xl text-balance text-sm leading-relaxed text-zinc-300 sm:text-base">
        May it be slang, phonetic or just romanized language. Paste any 'Langlisch' and get a
        clean read on what it is actually supposed to mean.
      </p>
    </header>
  )
}
