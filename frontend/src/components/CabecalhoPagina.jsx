export default function CabecalhoPagina({ icone, titulo, subtitulo, acao }) {
  return (
    <div style={s.wrap}>
      <div style={s.esquerda}>
        {icone && <span style={s.icone} aria-hidden="true">{icone}</span>}
        <div style={s.textos}>
          <h1 style={s.titulo}>{titulo}</h1>
          {subtitulo && <p style={s.subtitulo}>{subtitulo}</p>}
        </div>
      </div>
      {acao && <div style={s.acao}>{acao}</div>}
    </div>
  )
}

const s = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  esquerda: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  icone: {
    width: 40,
    height: 40,
    borderRadius: 10,
    flexShrink: 0,
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    color: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
  },
  textos: { minWidth: 0 },
  titulo: {
    margin: 0,
    fontFamily: 'var(--font-headline)',
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--text-pure)',
    letterSpacing: '-0.02em',
  },
  subtitulo: {
    margin: '3px 0 0',
    fontSize: 13,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-body)',
  },
  acao: {
    marginLeft: 'auto',
  },
}
