import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logoImg from '../assets/logomarca.svg'

export default function PaginaTermosPrivacidade() {
  const navigate = useNavigate()
  const [abaAtiva, setAbaAtiva] = useState('todos') // 'todos' | 'termos' | 'privacidade'

  return (
    <div style={s.pagina} data-theme="dark" data-theme-locked="dark" className="theme-dark-locked">
      {/* Header Superior */}
      <header style={s.nav}>
        <div style={s.navContainer}>
          <Link to="/" style={s.navLogo}>
            <div style={s.logoAvatar}>
              <img src={logoImg} alt="Contas Claras" style={s.logoImg} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={s.navLogoTexto}>Contas Claras</span>
              <span style={s.navLogoSub}>Inteligência Financeira</span>
            </div>
          </Link>

          <div style={s.navAcoes}>
            <button onClick={() => navigate(-1)} style={s.btnVoltar}>
              ← Voltar
            </button>
            <Link to="/login" style={s.btnEntrar}>
              Acessar Conta
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main style={s.main}>
        <div style={s.cartaoPrincipal}>
          {/* Cabeçalho do Documento */}
          <div style={s.documentHeader}>
            <div style={s.badge}>Jurídico &amp; Privacidade</div>
            <h1 style={s.tituloPrincipal}>Termos de Uso e Política de Privacidade</h1>
            <div style={s.metaInfo}>
              Aplicativo: <strong style={{ color: 'var(--text-pure)' }}>Contas Claras</strong> &bull; Última atualização: <span>30 de agosto de 2026</span>
            </div>

            {/* Abas de Navegação Rápida */}
            <div style={s.abasContainer}>
              <button
                type="button"
                onClick={() => setAbaAtiva('todos')}
                style={{
                  ...s.abaBtn,
                  ...(abaAtiva === 'todos' ? s.abaBtnAtiva : {}),
                }}
              >
                Documento Completo
              </button>
              <button
                type="button"
                onClick={() => setAbaAtiva('termos')}
                style={{
                  ...s.abaBtn,
                  ...(abaAtiva === 'termos' ? s.abaBtnAtiva : {}),
                }}
              >
                Parte I: Termos de Uso
              </button>
              <button
                type="button"
                onClick={() => setAbaAtiva('privacidade')}
                style={{
                  ...s.abaBtn,
                  ...(abaAtiva === 'privacidade' ? s.abaBtnAtiva : {}),
                }}
              >
                Parte II: Política de Privacidade (LGPD)
              </button>
            </div>
          </div>

          <div style={s.introBox}>
            Bem-vindo ao <strong>Contas Claras</strong>, uma aplicação desenhada para apoiar sua organização financeira pessoal. Ao se cadastrar ou utilizar nossa plataforma, você concorda plenamente com as regras e condições aqui descritas. Caso não concorde, recomendamos a descontinuação do uso do serviço.
          </div>

          {/* PARTE I — TERMOS DE USO */}
          {(abaAtiva === 'todos' || abaAtiva === 'termos') && (
            <section style={s.secaoDoc}>
              <div style={s.secaoTituloWrap}>
                <span style={s.secaoNumeroBadge}>I</span>
                <h2 style={s.secaoTitulo}>Parte I — Termos de Uso</h2>
              </div>

              <div style={s.topico}>
                <h3 style={s.topicoTitulo}>1. Definições Principais</h3>
                <ul style={s.lista}>
                  <li>
                    <strong style={s.destaqueTexto}>Aplicativo/Plataforma:</strong> O software móvel e/ou web denominado &quot;Contas Claras&quot;, sob gestão da equipe desenvolvedora e mantenedores do Contas Claras.
                  </li>
                  <li>
                    <strong style={s.destaqueTexto}>Usuário:</strong> Pessoa física plenamente capaz ou devidamente assistida que utiliza os serviços da plataforma.
                  </li>
                  <li>
                    <strong style={s.destaqueTexto}>Serviços:</strong> Ferramentas de registro, controle, conciliação, planejamento orçamentário e emissão de relatórios financeiros pessoais.
                  </li>
                </ul>
              </div>

              <div style={s.topico}>
                <h3 style={s.topicoTitulo}>2. Cadastro e Responsabilidades de Acesso</h3>
                <p style={s.paragrafo}>
                  <strong>2.1.</strong> Para usufruir dos recursos do Contas Claras, o Usuário deve fornecer informações completas, exatas e atualizadas.
                </p>
                <p style={s.paragrafo}>
                  <strong>2.2.</strong> A segurança e o sigilo das credenciais de acesso (e-mail, senha e PIN) são de responsabilidade exclusiva do Usuário. Qualquer operação realizada mediante autenticação válida será imputada ao titular da conta.
                </p>
                <p style={s.paragrafo}>
                  <strong>2.3.</strong> Em caso de acesso não autorizado ou perda de credenciais, o Usuário deve acionar o suporte imediatamente via <span style={s.tagContato}>suporte@contasclaras.com.br</span>.
                </p>
              </div>

              <div style={s.topico}>
                <h3 style={s.topicoTitulo}>3. Escopo do Serviço e Limitação de Responsabilidade</h3>
                <p style={s.paragrafo}>
                  <strong>3.1. Natureza Informativa:</strong> O Contas Claras atua unicamente como organizador e gerenciador de despesas e receitas. O aplicativo <strong>não fornece consultoria de investimentos, contábil, jurídica ou bancária</strong>.
                </p>
                <p style={s.paragrafo}>
                  <strong>3.2. Autonomia do Usuário:</strong> Todas as decisões orçamentárias, financeiras e contratações de crédito são tomadas de forma autônoma pelo Usuário.
                </p>
                <p style={s.paragrafo}>
                  <strong>3.3. Integridade dos Dados:</strong> A acurácia dos relatórios e projeções depende estritamente das informações imputadas pelo Usuário ou consolidadas via integrações consentidas.
                </p>

                <div style={s.alertaBox}>
                  <div style={s.alertaIcone}>⚠️</div>
                  <div>
                    <strong style={s.alertaTitulo}>Atenção:</strong> O Contas Claras não realiza transações bancárias, transferências, saques ou pagamentos em nome do Usuário, salvo módulos específicos explicitamente autorizados e regulamentados por entidades competentes (como o Banco Central do Brasil).
                  </div>
                </div>
              </div>

              <div style={s.topico}>
                <h3 style={s.topicoTitulo}>4. Regras de Conduta</h3>
                <p style={s.paragrafo}>O Usuário compromete-se a utilizar a plataforma de boa-fé, abstendo-se de:</p>
                <ul style={s.lista}>
                  <li>Tentar burlar sistemas de autenticação ou violar mecanismos de segurança;</li>
                  <li>Praticar engenharia reversa, descompilação ou cópia indevida do software;</li>
                  <li>Utilizar mecanismos automatizados (bots, scrapers) sem prévia e formal autorização;</li>
                  <li>Inserir arquivos maliciosos, vírus ou códigos nocivos ao ambiente da aplicação.</li>
                </ul>
              </div>

              <div style={s.topico}>
                <h3 style={s.topicoTitulo}>5. Propriedade Intelectual</h3>
                <p style={s.paragrafo}>
                  Todos os direitos relativos a marcas, interfaces visuais, logotipos, arquitetura de software e código-fonte pertencem exclusivamente ao <strong>Contas Claras</strong>. É concedida ao Usuário apenas uma licença revogável, intransferível e não exclusiva de uso pessoal.
                </p>
              </div>
            </section>
          )}

          {/* PARTE II — POLÍTICA DE PRIVACIDADE */}
          {(abaAtiva === 'todos' || abaAtiva === 'privacidade') && (
            <section style={s.secaoDoc}>
              <div style={s.secaoTituloWrap}>
                <span style={s.secaoNumeroBadge}>II</span>
                <h2 style={s.secaoTitulo}>Parte II — Política de Privacidade (LGPD)</h2>
              </div>

              <p style={s.paragrafo}>
                Esta Política foi elaborada em estrita conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD)</strong> e o <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong>.
              </p>

              <div style={s.topico}>
                <h3 style={s.topicoTitulo}>1. Agentes de Tratamento</h3>
                <ul style={s.lista}>
                  <li>
                    <strong style={s.destaqueTexto}>Controlador:</strong> Contas Claras Inteligência Financeira.
                  </li>
                  <li>
                    <strong style={s.destaqueTexto}>Encarregado pelo Tratamento de Dados (DPO):</strong> Equipe de Segurança e Privacidade Contas Claras.
                  </li>
                  <li>
                    <strong style={s.destaqueTexto}>Canal Direto de Privacidade:</strong> <span style={s.tagContato}>privacidade@contasclaras.com.br</span>.
                  </li>
                </ul>
              </div>

              <div style={s.topico}>
                <h3 style={s.topicoTitulo}>2. Dados Coletados e Hipóteses Legais de Tratamento</h3>
                <div style={s.tabelaContainer}>
                  <table style={s.tabela}>
                    <thead>
                      <tr>
                        <th style={s.th}>Categoria</th>
                        <th style={s.th}>Dados Coletados</th>
                        <th style={s.th}>Finalidade do Uso</th>
                        <th style={s.th}>Base Legal (LGPD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={s.td}><strong style={s.destaqueTexto}>Dados Cadastrais</strong></td>
                        <td style={s.td}>Nome completo, e-mail, telefone e senha criptografada.</td>
                        <td style={s.td}>Identificação, criação de conta e suporte ao cliente.</td>
                        <td style={s.td}><span style={s.baseLegalBadge}>Execução de Contrato (Art. 7º, V)</span></td>
                      </tr>
                      <tr>
                        <td style={s.td}><strong style={s.destaqueTexto}>Dados Financeiros</strong></td>
                        <td style={s.td}>Receitas, despesas, saldos declarados, datas de vencimento e categorias.</td>
                        <td style={s.td}>Processamento de relatórios, gráficos e cálculos orçamentários.</td>
                        <td style={s.td}><span style={s.baseLegalBadge}>Execução de Contrato (Art. 7º, V)</span></td>
                      </tr>
                      <tr>
                        <td style={s.td}><strong style={s.destaqueTexto}>Conexão Bancária (Open Finance)</strong></td>
                        <td style={s.td}>Extratos e lançamentos via API parceira (modo leitura).</td>
                        <td style={s.td}>Automação de lançamentos e conciliação bancária automática.</td>
                        <td style={s.td}><span style={s.baseLegalBadge}>Consentimento Específico (Art. 7º, I)</span></td>
                      </tr>
                      <tr>
                        <td style={s.td}><strong style={s.destaqueTexto}>Dados Técnicos</strong></td>
                        <td style={s.td}>IP de conexão, modelo de aparelho, logs de data/hora e versão do app.</td>
                        <td style={s.td}>Segurança operacional, diagnóstico de falhas e auditoria legal.</td>
                        <td style={s.td}><span style={s.baseLegalBadge}>Obrigação Legal (Art. 7º, II) / Legítimo Interesse (Art. 7º, IX)</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={s.topico}>
                <h3 style={s.topicoTitulo}>3. Compartilhamento com Terceiros</h3>
                <p style={s.paragrafo}>
                  O Contas Claras <strong style={{ color: 'var(--primary)' }}>não comercializa dados pessoais</strong> sob nenhuma circunstância. O compartilhamento pontual ocorre exclusivamente com:
                </p>
                <ul style={s.lista}>
                  <li>
                    <strong style={s.destaqueTexto}>Provedores de Nuvem e Servidores:</strong> Infraestrutura moderna com altos padrões de segurança, criptografia em trânsito (HTTPS/TLS) e repouso (AES-256);
                  </li>
                  <li>
                    <strong style={s.destaqueTexto}>Parceiros de Conectividade Financeira:</strong> Agregadores de Open Finance autorizados pelo BACEN (somente com consentimento explícito do Usuário);
                  </li>
                  <li>
                    <strong style={s.destaqueTexto}>Autoridades Governamentais:</strong> Exclusivamente em caso de requisição judicial fundamentada ou exigência regulatória estrita.
                  </li>
                </ul>
              </div>

              <div style={s.topico}>
                <h3 style={s.topicoTitulo}>4. Medidas de Segurança da Informação</h3>
                <p style={s.paragrafo}>Adotamos práticas técnicas e organizacionais compatíveis com o mercado para salvaguardar seus registros:</p>
                <div style={s.gridSeguranca}>
                  <div style={s.cardSeguranca}>
                    <span style={s.iconeSeguranca}>🔒</span>
                    <div>
                      <strong style={s.tituloSeguranca}>Tráfego Criptografado</strong>
                      <p style={s.descSeguranca}>Conexão protegida por TLS 1.3 e HTTPS em todas as comunicações.</p>
                    </div>
                  </div>
                  <div style={s.cardSeguranca}>
                    <span style={s.iconeSeguranca}>🛡️</span>
                    <div>
                      <strong style={s.tituloSeguranca}>Dados em Repouso</strong>
                      <p style={s.descSeguranca}>Bases de dados seguras com criptografia padrão AES-256.</p>
                    </div>
                  </div>
                  <div style={s.cardSeguranca}>
                    <span style={s.iconeSeguranca}>🔑</span>
                    <div>
                      <strong style={s.tituloSeguranca}>Senhas com Hash Forte</strong>
                      <p style={s.descSeguranca}>Hash criptográfico com salt seguro (nunca em texto simples).</p>
                    </div>
                  </div>
                  <div style={s.cardSeguranca}>
                    <span style={s.iconeSeguranca}>🛡️</span>
                    <div>
                      <strong style={s.tituloSeguranca}>Isolamento de Dados</strong>
                      <p style={s.descSeguranca}>Isolamento lógico estrito por usuário (Row Level Security) e controle com MFA.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={s.topico}>
                <h3 style={s.topicoTitulo}>5. Retenção e Descarte de Dados</h3>
                <p style={s.paragrafo}>Os dados permanecem armazenados enquanto durar a relação contratual (conta ativa). Havendo solicitação de cancelamento e exclusão:</p>
                <ul style={s.lista}>
                  <li>Os registros financeiros e cadastrais operacionais serão anonimizados ou deletados definitivamente em até <strong>30 dias</strong>;</li>
                  <li><strong>Logs de Autenticação e Acesso:</strong> Os registros estritos de autenticação (eventos de entrada e saída, data/hora e endereço IP) são mantidos em arquivo seguro exclusivamente para fins de auditoria e segurança operacional pelo prazo rotativo de <strong>60 (sessenta) dias</strong>, sendo automaticamente e definitivamente expurgados após esse período;</li>
                  <li>Demais registros legais de conexão a aplicações de internet são mantidos sob sigilo pelo prazo estrito de 6 (seis) meses, em estrita obediência ao Art. 15 da Lei nº 12.965/2014 (Marco Civil da Internet).</li>
                </ul>
              </div>

              <div style={s.topico}>
                <h3 style={s.topicoTitulo}>6. Direitos do Titular (Art. 18 da LGPD)</h3>
                <p style={s.paragrafo}>O Usuário titular dos dados pode a qualquer tempo:</p>
                <div style={s.direitosGrid}>
                  <div style={s.direitoItem}>
                    <span style={s.direitoNum}>1</span>
                    <span>Confirmar a existência do tratamento e solicitar cópia dos seus dados (acesso);</span>
                  </div>
                  <div style={s.direitoItem}>
                    <span style={s.direitoNum}>2</span>
                    <span>Requerer retificação de dados incorretos, inexatos ou desatualizados;</span>
                  </div>
                  <div style={s.direitoItem}>
                    <span style={s.direitoNum}>3</span>
                    <span>Solicitar anonimização, bloqueio ou eliminação de informações excedentes;</span>
                  </div>
                  <div style={s.direitoItem}>
                    <span style={s.direitoNum}>4</span>
                    <span>Requisitar a portabilidade dos dados financeiros para outro serviço em formato interoperável;</span>
                  </div>
                  <div style={s.direitoItem}>
                    <span style={s.direitoNum}>5</span>
                    <span>Revogar consentimentos concedidos anteriormente;</span>
                  </div>
                  <div style={s.direitoItem}>
                    <span style={s.direitoNum}>6</span>
                    <span>Solicitar a exclusão definitiva de sua conta e informações vinculadas.</span>
                  </div>
                </div>
                <p style={{ ...s.paragrafo, marginTop: 16 }}>
                  Tais requisições podem ser acionadas via configurações do próprio aplicativo ou por mensagem para <span style={s.tagContato}>privacidade@contasclaras.com.br</span>.
                </p>
              </div>

              <div style={s.topico}>
                <h3 style={s.topicoTitulo}>7. Atualizações Deste Instrumento</h3>
                <p style={s.paragrafo}>
                  Reservamo-nos o direito de aprimorar ou adequar estes Termos e Políticas periodicamente. Sempre que ocorrerem modificações relevantes nas finalidades de tratamento, enviaremos aviso formal com antecedência cabível por notificação no app ou e-mail cadastrado.
                </p>
              </div>

              <div style={s.topico}>
                <h3 style={s.topicoTitulo}>8. Legislação e Foro</h3>
                <p style={s.paragrafo}>
                  Estes Termos de Uso e Política de Privacidade são regidos pelas leis da República Federativa do Brasil. Para resolução de eventuais litígios oriundos deste instrumento, elege-se o foro competente, com expressa renúncia a qualquer outro.
                </p>
              </div>
            </section>
          )}

          {/* Rodapé Interno do Documento */}
          <div style={s.docFooter}>
            <span>&copy; {new Date().getFullYear()} Contas Claras &bull; Todos os direitos reservados.</span>
            <div style={s.docFooterAcoes}>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                style={s.btnTopo}
              >
                ↑ Voltar ao topo
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé Global */}
      <footer style={s.rodapeGlobal}>
        <div style={s.navLogo}>
          <div style={{ ...s.logoAvatar, width: 28, height: 28 }}>
            <img src={logoImg} alt="Contas Claras" style={{ width: 17, height: 17, objectFit: 'contain', display: 'block' }} />
          </div>
          <span style={s.rodapeLogoTexto}>Contas Claras</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/" style={s.rodapeLink}>Início</Link>
          <Link to="/login" style={s.rodapeLink}>Acessar Conta</Link>
        </div>
        <span style={s.rodapeAno}>© {new Date().getFullYear()} Contas Claras · Todos os direitos reservados</span>
      </footer>
    </div>
  )
}

const s = {
  pagina: {
    minHeight: '100vh',
    width: '100%',
    background: 'var(--bg-deep)',
    color: 'var(--text)',
    fontFamily: 'var(--font-body)',
    display: 'flex',
    flexDirection: 'column',
  },
  nav: {
    background: 'rgba(10, 15, 13, 0.85)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    padding: '14px 24px',
    boxSizing: 'border-box',
  },
  navContainer: {
    maxWidth: 960,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  navLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textDecoration: 'none',
  },
  logoAvatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #153E32, #0A1E17)',
    border: '1.5px solid rgba(16, 185, 129, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 14px rgba(16, 185, 129, 0.2)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  logoImg: {
    width: 22,
    height: 22,
    objectFit: 'contain',
    display: 'block',
  },
  navLogoTexto: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
    letterSpacing: '-0.01em',
    lineHeight: 1.2,
  },
  navLogoSub: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  navAcoes: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  btnVoltar: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 13.5,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  btnEntrar: {
    background: 'var(--primary)',
    color: '#0A0F0D',
    border: 'none',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13.5,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    textDecoration: 'none',
    cursor: 'pointer',
    boxShadow: '0 0 14px rgba(16, 185, 129, 0.2)',
  },

  main: {
    flex: 1,
    maxWidth: 960,
    width: '100%',
    margin: '0 auto',
    padding: '36px 20px 60px',
    boxSizing: 'border-box',
  },
  cartaoPrincipal: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 18,
    padding: '40px 36px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
    boxSizing: 'border-box',
  },
  documentHeader: {
    borderBottom: '1px solid var(--border)',
    paddingBottom: 24,
    marginBottom: 28,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(16, 185, 129, 0.12)',
    color: 'var(--primary)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: 99,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 14,
  },
  tituloPrincipal: {
    margin: '0 0 10px',
    fontSize: 28,
    fontWeight: 800,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
    letterSpacing: '-0.02em',
    lineHeight: 1.25,
  },
  metaInfo: {
    fontSize: 13.5,
    color: 'var(--text-muted)',
    marginBottom: 20,
  },

  abasContainer: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 18,
  },
  abaBtn: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '8px 16px',
    color: 'var(--text-muted)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  abaBtnAtiva: {
    background: 'rgba(16, 185, 129, 0.14)',
    borderColor: 'var(--primary)',
    color: 'var(--primary)',
    boxShadow: '0 0 12px rgba(16, 185, 129, 0.18)',
  },

  introBox: {
    background: 'radial-gradient(ellipse at top left, rgba(16, 185, 129, 0.08), transparent 70%), var(--surface-raised)',
    borderLeft: '4px solid var(--primary)',
    borderTop: '1px solid var(--border)',
    borderRight: '1px solid var(--border)',
    borderBottom: '1px solid var(--border)',
    borderRadius: '0 12px 12px 0',
    padding: '18px 22px',
    fontSize: 14.5,
    lineHeight: 1.65,
    color: 'var(--text)',
    marginBottom: 36,
  },

  secaoDoc: {
    marginBottom: 44,
  },
  secaoTituloWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderBottom: '2px solid var(--border)',
    paddingBottom: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  secaoNumeroBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 14,
  },
  secaoTitulo: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
    letterSpacing: '-0.01em',
  },

  topico: {
    marginBottom: 26,
  },
  topicoTitulo: {
    margin: '0 0 10px',
    fontSize: 16,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--primary)',
  },
  paragrafo: {
    margin: '0 0 12px',
    fontSize: 14,
    lineHeight: 1.65,
    color: 'var(--text)',
  },
  destaqueTexto: {
    color: 'var(--text-pure)',
  },
  lista: {
    margin: '0 0 16px',
    paddingLeft: 22,
    fontSize: 14,
    lineHeight: 1.65,
    color: 'var(--text)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  tagContato: {
    background: 'rgba(16, 185, 129, 0.12)',
    color: 'var(--primary)',
    padding: '2px 8px',
    borderRadius: 6,
    fontFamily: 'monospace',
    fontSize: 13,
    border: '1px solid rgba(16, 185, 129, 0.25)',
  },

  alertaBox: {
    background: 'rgba(245, 158, 11, 0.08)',
    borderLeft: '4px solid #F59E0B',
    borderTop: '1px solid rgba(245, 158, 11, 0.2)',
    borderRight: '1px solid rgba(245, 158, 11, 0.2)',
    borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
    borderRadius: '0 10px 10px 0',
    padding: '16px 18px',
    margin: '18px 0',
    fontSize: 13.5,
    lineHeight: 1.6,
    color: 'var(--text)',
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  alertaIcone: {
    fontSize: 18,
    lineHeight: 1,
  },
  alertaTitulo: {
    color: '#F59E0B',
  },

  tabelaContainer: {
    overflowX: 'auto',
    margin: '20px 0',
    borderRadius: 12,
    border: '1px solid var(--border)',
  },
  tabela: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: 13.5,
  },
  th: {
    background: 'var(--surface-raised)',
    color: 'var(--primary)',
    fontWeight: 700,
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'top',
    lineHeight: 1.5,
  },
  baseLegalBadge: {
    display: 'inline-block',
    background: 'rgba(16, 185, 129, 0.1)',
    color: 'var(--primary)',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
  },

  gridSeguranca: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 14,
    marginTop: 14,
  },
  cardSeguranca: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconeSeguranca: {
    fontSize: 20,
    lineHeight: 1,
  },
  tituloSeguranca: {
    display: 'block',
    fontSize: 13.5,
    fontWeight: 700,
    color: 'var(--text-pure)',
    marginBottom: 4,
  },
  descSeguranca: {
    margin: 0,
    fontSize: 12.5,
    color: 'var(--text-muted)',
    lineHeight: 1.45,
  },

  direitosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 10,
    marginTop: 12,
  },
  direitoItem: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '12px 14px',
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    fontSize: 13,
    lineHeight: 1.45,
    color: 'var(--text)',
  },
  direitoNum: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.15)',
    color: 'var(--primary)',
    fontSize: 11.5,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },

  docFooter: {
    marginTop: 36,
    paddingTop: 20,
    borderTop: '1px solid var(--border)',
    fontSize: 13,
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  docFooterAcoes: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  btnTopo: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },

  rodapeGlobal: {
    background: '#050807',
    borderTop: '1px solid var(--border)',
    padding: '24px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    flexWrap: 'wrap',
    boxSizing: 'border-box',
  },
  rodapeLogoTexto: {
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
  },
  rodapeLink: {
    color: 'var(--text-muted)',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 600,
    transition: 'color 0.15s ease',
  },
  rodapeAno: {
    fontSize: 12,
    color: 'var(--text-dim)',
  },
}
