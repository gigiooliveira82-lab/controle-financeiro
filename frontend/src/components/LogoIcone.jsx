import { useId } from 'react'

/**
 * Versão simplificada do símbolo Contas Claras — contorno único, sem as
 * dobras internas do cérebro, traços mais grossos. Feita para tamanhos
 * pequenos (menu lateral, favicon), onde a versão completa (LogoMarca)
 * borra.
 */
export default function LogoIcone({ size = 40 }) {
  const uid = useId()
  const glyphId = `cc-glyph-${uid}`

  return (
    <svg
      width={size} height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Contas Claras"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={glyphId} x1="8" y1="88" x2="92" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0F6B4F" />
          <stop offset="0.55" stopColor="#6EE7B7" />
          <stop offset="1" stopColor="#D9C48A" />
        </linearGradient>
      </defs>

      {/* silhueta mínima do cérebro: um único contorno fechado, sem dobras internas */}
      <path
        d="M46 14C34 8 20 16 20 28c-9 3-13 14-6 22-6 8-2 19 8 22
           2 9 12 15 21 12"
        fill="none" stroke={`url(#${glyphId})`} strokeWidth="9"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.9"
      />

      {/* seta ascendente: o elemento que carrega a marca em miniatura */}
      <path
        d="M12 82C30 82 34 52 50 52s16-16 36-30"
        fill="none" stroke={`url(#${glyphId})`} strokeWidth="11"
        strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M74 16h16v16" fill="none" stroke={`url(#${glyphId})`}
        strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}
