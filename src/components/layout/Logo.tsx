import { cn } from '../../lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ size = 'md', className }: LogoProps) {
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' }

  return (
    <span className={cn('font-display font-normal select-none', sizes[size], className)}>
      <span className="text-primary-light dark:text-primary-dark">Ri</span>
      <span className="text-blue-accent">Chord</span>
    </span>
  )
}

export function LogoIcon({ size = 40 }: { size?: number }) {
  return (
    <div
      className="bg-blue-primary flex items-center justify-center font-display font-normal text-white select-none shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.325),
        fontSize: size * 0.36,
      }}
    >
      Ri
    </div>
  )
}
