import { useState, type FormEvent } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { isSupabaseConfigured } from '../../lib/supabase'
import { sfx } from '../../lib/sfx'

type Panel = 'start' | 'email'
type EmailMode = 'login' | 'signup'

export function EntryScreen() {
  const busy = useAuthStore((s) => s.busy)
  const error = useAuthStore((s) => s.error)
  const signInGuest = useAuthStore((s) => s.signInGuest)
  const signInEmail = useAuthStore((s) => s.signInEmail)
  const signUpEmail = useAuthStore((s) => s.signUpEmail)
  const clearError = useAuthStore((s) => s.clearError)

  const [panel, setPanel] = useState<Panel>('start')
  const [emailMode, setEmailMode] = useState<EmailMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const startGuest = (e: FormEvent) => {
    e.preventDefault()
    sfx.blip()
    void signInGuest(name)
  }

  const submitEmail = (e: FormEvent) => {
    e.preventDefault()
    sfx.blip()
    if (emailMode === 'login') void signInEmail(email, password)
    else void signUpEmail(name, email, password)
  }

  return (
    <div className="min-h-screen overworld-bg font-body flex flex-col items-center justify-center px-4 py-10">
      {/* Title */}
      <div className="text-center mb-8 select-none">
        <h1 className="font-pixel text-3xl sm:text-4xl text-coin-gold pixel-shadow tracking-wider">
          SELORA
        </h1>
        <p className="font-pixel text-[0.5rem] text-ink/70 mt-3 tracking-widest">
          YOUR MONEY. YOUR SOUL.
        </p>
      </div>

      <div className="retro-panel retro-panel--gold w-full max-w-xs">
        {panel === 'start' && (
          <form onSubmit={startGuest} className="space-y-4">
            <label className="block font-pixel text-[0.5rem] text-wood-dark mb-1">
              ENTER YOUR NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) clearError()
              }}
              maxLength={16}
              placeholder="Player"
              autoFocus
              className="w-full px-3 py-2 text-lg"
            />

            <button
              type="submit"
              disabled={busy}
              className="retro-btn retro-btn--green w-full disabled:opacity-60"
            >
              {busy ? 'LOADING…' : 'PRESS START'}
            </button>

            {isSupabaseConfigured ? (
              <button
                type="button"
                onClick={() => {
                  sfx.blip()
                  clearError()
                  setPanel('email')
                }}
                className="w-full font-pixel text-[0.45rem] text-wood-dark/80 underline underline-offset-4 py-1"
              >
                SIGN IN WITH EMAIL
              </button>
            ) : (
              <p className="font-body text-sm text-ink/60 text-center leading-snug">
                Offline demo — progress saves on this device.
              </p>
            )}

            {error && (
              <p className="font-body text-sm text-danger-red text-center leading-snug">{error}</p>
            )}
          </form>
        )}

        {panel === 'email' && (
          <form onSubmit={submitEmail} className="space-y-3">
            {/* Login / Signup switch */}
            <div className="flex gap-1">
              {(['login', 'signup'] as EmailMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    sfx.blip()
                    clearError()
                    setEmailMode(m)
                  }}
                  className={`flex-1 font-pixel text-[0.45rem] py-2 shadow-[0_0_0_2px_#3a2410] ${
                    emailMode === m
                      ? 'bg-coin-gold text-[#4a3319]'
                      : 'bg-[#8a5a2b] text-[#fff7e0]/80'
                  }`}
                >
                  {m === 'login' ? 'LOG IN' : 'SIGN UP'}
                </button>
              ))}
            </div>

            {emailMode === 'signup' && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={16}
                placeholder="Display name"
                className="w-full px-3 py-2 text-base"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="w-full px-3 py-2 text-base"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={emailMode === 'login' ? 'current-password' : 'new-password'}
              className="w-full px-3 py-2 text-base"
            />

            <button
              type="submit"
              disabled={busy}
              className="retro-btn retro-btn--green w-full disabled:opacity-60"
            >
              {busy ? 'LOADING…' : emailMode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}
            </button>

            {error && (
              <p className="font-body text-sm text-danger-red text-center leading-snug">{error}</p>
            )}

            <button
              type="button"
              onClick={() => {
                sfx.blip()
                clearError()
                setPanel('start')
              }}
              className="w-full font-pixel text-[0.45rem] text-wood-dark/80 underline underline-offset-4 py-1"
            >
              ← BACK TO GUEST START
            </button>
          </form>
        )}
      </div>

      <p className="font-body text-sm text-ink/50 mt-6 text-center max-w-xs">
        Guest play starts instantly. Add email later to keep your soul safe across devices.
      </p>
    </div>
  )
}
