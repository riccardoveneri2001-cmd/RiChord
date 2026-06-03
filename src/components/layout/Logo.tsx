interface LogoProps {
  size?: 'sm' | 'lg'
}

const SIZE = { sm: 22, lg: 32 } as const

export function Logo({ size = 'sm' }: LogoProps) {
  const px = SIZE[size]
  return (
    <span
      className="select-none font-bold"
      style={{ fontSize: px, letterSpacing: '-0.5px', lineHeight: 1 }}
    >
      <span style={{ color: '#1C2333' }}>Ri</span>
      <span style={{ color: '#2176AE' }}>Chord</span>
    </span>
  )
}
