import { useUiStore } from '../store/useUiStore'

export function CrtOverlay() {
  const crtEnabled = useUiStore((s) => s.crtEnabled)
  if (!crtEnabled) return null
  return <div className="crt-overlay" aria-hidden="true" />
}
