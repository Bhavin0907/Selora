export function MapLoadingShell({ label = 'LOADING MAP…' }: { label?: string }) {
  return (
    <div className="h-[340px] flex items-center justify-center">
      <div className="retro-panel retro-panel--blue text-center">
        <p className="font-pixel text-[0.55rem] text-ink animate-blink">{label}</p>
      </div>
    </div>
  )
}
