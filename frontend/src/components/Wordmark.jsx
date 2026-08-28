/**
 * Wordmark "CONTAS CLARAS" — texto HTML (não SVG) para a webfont carregar
 * corretamente e o texto continuar selecionável/acessível.
 *
 * tone: 'onDark' (fundo verde/escuro, ex.: menu lateral) | 'onLight' (fundo
 * claro, ex.: tela de login).
 */
export default function Wordmark({ tone = 'onDark', size = 17, showSubtitulo = true }) {
  const cores = tone === 'onLight'
    ? { titulo: '#0F6B4F', subtitulo: '#5B6B64' }
    : { titulo: '#7DF0C0', subtitulo: 'rgba(232,240,236,0.62)' }

  return (
    <div style={{ lineHeight: 1 }}>
      <p style={{
        margin: 0,
        fontFamily: "'Archivo Black', 'Inter', system-ui, sans-serif",
        fontWeight: 900,
        fontSize: size,
        letterSpacing: '0.01em',
        lineHeight: 1.12,
        color: cores.titulo,
        textTransform: 'uppercase',
      }}>
        Contas<br />Claras
      </p>
      {showSubtitulo && (
        <p style={{
          margin: `${Math.round(size * 0.32)}px 0 0`,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontWeight: 500,
          fontSize: Math.round(size * 0.42),
          letterSpacing: '0.01em',
          color: cores.subtitulo,
        }}>
          Inteligência Financeira
        </p>
      )}
    </div>
  )
}
