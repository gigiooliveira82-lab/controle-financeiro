// Cabeçalho leve reaproveitado nas páginas de CRUD (Despesas, Cartões, Sonhos)
// pra trazer um pouco da identidade visual do login/landing (verde profundo,
// serifada) pro miolo do app, sem virar um hero pesado numa tela de lista.
export default function CabecalhoPagina({ icone, titulo, subtitulo }) {
  return (
    <div style={s.wrap}>
      <span style={s.icone} aria-hidden="true">{icone}</span>
      <div style={s.textos}>
        <h1 style={s.titulo}>{titulo}</h1>
        {subtitulo && <p style={s.subtitulo}>{subtitulo}</p>}
      </div>
    </div>
  )
}

const s = {
  wrap: { display: 'flex', alignItems: 'center', gap: 12 },
  icone: {
    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
    background: 'var(--verde-profundo)', color: '#E3A008',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
  },
  textos: { minWidth: 0 },
  titulo: {
    margin: 0, fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 22, fontWeight: 700, color: '#1a1a2e', letterSpacing: '-0.01em',
  },
  subtitulo: { margin: '2px 0 0', fontSize: 13, color: '#64748b' },
}
