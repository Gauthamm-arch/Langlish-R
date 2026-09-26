export function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="aurora-layer aurora-blob-cyan" />
      <div className="aurora-layer aurora-blob-violet" />
      <div className="aurora-layer aurora-blob-emerald" />
    </div>
  )
}