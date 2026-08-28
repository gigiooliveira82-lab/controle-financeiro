import { useId } from 'react'

export default function LogoMarca({ size = 28 }) {
  const uid = useId()
  const brainId = `cc-brain-${uid}`
  const arrowId = `cc-arrow-${uid}`

  return (
    <svg
      width={size} height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Contas Claras"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={brainId} x1="10" y1="100" x2="100" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0F6B4F" />
          <stop offset="0.45" stopColor="#6EE7B7" />
          <stop offset="1" stopColor="#D9C48A" />
        </linearGradient>
        <linearGradient id={arrowId} x1="14" y1="92" x2="104" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0F6B4F" />
          <stop offset="0.5" stopColor="#8FF2C8" />
          <stop offset="1" stopColor="#EBD9A6" />
        </linearGradient>
      </defs>

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* silhueta do cérebro */}
        <g stroke={`url(#${brainId})`} strokeWidth="6.5" opacity="0.95">
          <path d="M60 24C50 15 34 17 30 29 19 31 13 42 18 52 9 60 11 75 22 81 25 93 39 99 50 94" />
          <path d="M60 24c9-8 24-6 28 6 10 3 15 14 10 24" />
          <path d="M60 24v72" />
          {/* dobras internas */}
          <path d="M30 29c7 2 10 8 9 14" opacity="0.75" />
          <path d="M18 52c8-2 14 2 16 8" opacity="0.75" />
          <path d="M22 81c6-5 14-5 19 1" opacity="0.75" />
          <path d="M88 30c-7 3-11 9-10 16" opacity="0.75" />
        </g>

        {/* seta de crescimento */}
        <path d="M13 88C35 88 39 54 58 54s21-20 44-34" stroke={`url(#${arrowId})`} strokeWidth="10" />
        <path d="M84 18h20v20" stroke={`url(#${arrowId})`} strokeWidth="10" />
      </g>
    </svg>
  )
}
