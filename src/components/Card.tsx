import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  glow?: 'gold' | 'violet' | 'green' | 'none'
}

export function Card({ children, className = '', glow = 'none' }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12 }}
      className={`retro-panel retro-panel--${glow} ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}
