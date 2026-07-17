export default function LogoMarca({ size = 28, rayColor = 'rgba(255,255,255,0.82)' }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <circle cx="16" cy="16" r="5" fill="#F2C84B" />
      <g stroke={rayColor} strokeWidth="2.2" strokeLinecap="round">
        <line x1="16"   y1="3.5"  x2="16"   y2="8.5"  />
        <line x1="16"   y1="23.5" x2="16"   y2="28.5" />
        <line x1="3.5"  y1="16"   x2="8.5"  y2="16"   />
        <line x1="23.5" y1="16"   x2="28.5" y2="16"   />
        <line x1="10.7" y1="10.7" x2="7.2"  y2="7.2"  />
        <line x1="21.3" y1="10.7" x2="24.8" y2="7.2"  />
        <line x1="10.7" y1="21.3" x2="7.2"  y2="24.8" />
        <line x1="21.3" y1="21.3" x2="24.8" y2="24.8" />
      </g>
    </svg>
  )
}
