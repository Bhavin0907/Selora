import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PixelIcon, type NavIconName } from './PixelIcon'
import { sfx } from '../lib/sfx'

const tabs: { to: string; label: string; icon: NavIconName }[] = [
  { to: '/', label: 'Soul', icon: 'soul' },
  { to: '/log', label: 'Log', icon: 'log' },
  { to: '/map', label: 'Map', icon: 'map' },
  { to: '/insights', label: 'Insights', icon: 'insights' },
  { to: '/advisor', label: 'Advisor', icon: 'advisor' },
  { to: '/pact', label: 'Pact', icon: 'pact' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f] safe-area-bottom shadow-[inset_0_3px_0_#9b5de5,inset_0_5px_0_#000]">
      <div className="max-w-lg mx-auto flex justify-around items-stretch px-1 py-1.5">
        {tabs.map((tab) => {
          const isActive =
            tab.to === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.to)
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              onClick={() => {
                if (!isActive) sfx.blip()
              }}
              className={`relative flex flex-col items-center gap-1 px-1.5 py-1.5 min-w-0 transition-colors ${
                isActive ? 'text-coin-gold' : 'text-white/45 hover:text-white/80'
              }`}
            >
              {/* Sliding glowing box cursor (RPG menu style) */}
              {isActive && (
                <motion.div
                  layoutId="hud-cursor"
                  transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                  className="absolute inset-0 bg-coin-gold/10"
                  style={{ boxShadow: 'inset 0 0 0 2px #f5c518' }}
                />
              )}

              <motion.span
                animate={isActive ? { y: [0, -3, 0] } : {}}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                <PixelIcon name={tab.icon} size={22} />
              </motion.span>

              <span className="relative z-10 flex items-center gap-0.5">
                {isActive && (
                  <span className="font-pixel text-[0.4rem] text-coin-gold animate-blink">▶</span>
                )}
                <span className="font-pixel text-[0.38rem] truncate">{tab.label}</span>
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
