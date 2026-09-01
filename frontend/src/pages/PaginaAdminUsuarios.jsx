import { useState, useEffect } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { isUsuarioAdmin, gerarHashAdmin } from '../utils/hashAdmin'
import {
  buscarUsuariosAdmin,
  atualizarUsuarioAdmin,
  excluirUsuarioAdmin,
  alternarAdminUsuario,
} from '../services/api'
import {
  IconUsuarios,
  IconEditar,
  IconLixeira,
  IconBusca,
  IconAtualizar,
  IconVoltar,
  IconCheck,
  IconOlho,
  IconOlhoFechado,
} from '../components/Icones'

export default function PaginaAdminUsuarios({ usuario }) {
  const { hash } = useParams()
  const navigate = useNavigate()

  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [sucessoMsg, setSucessoMsg] = useState(null)

  // Paginação e busca
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const [busca, setBusca] = useState('')
  const [buscaDebounced, setBuscaDebounced] = useState('')

  // Modal de edição do usuário
  const [usuarioEditando, setUsuarioEditando] = useState(null)
  const [formNome, setFormNome] = useState('')
  const [formTelefone, setFormTelefone] = useState('')
  const [formSenha, setFormSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erroModal, setErroModal] = useState(null)

  // Modal de confirmação de exclusão
  const [usuarioExcluindo, setUsuarioExcluindo] = useState(null)
  const [excluindo, setExcluindo] = useState(false)

  // Validação de segurança
  const emailLogado = usuario?.email || ''
  const ehAdmin = isUsuarioAdmin(emailLogado)
  const hashEsperado = ehAdmin ? gerarHashAdmin(emailLogado) : ''

  if (!ehAdmin || !hash || hash !== hashEsperado) {
    return <Navigate to="/dashboard" replace />
  }

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca)
      setPagina(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [busca])

  async function carregarUsuarios() {
    setCarregando(true)
    setErro(null)
    try {
      const resp = await buscarUsuariosAdmin(pagina, 10, buscaDebounced)
      setUsuarios(resp.usuarios || [])
      setTotal(resp.total || 0)
      setTotalPaginas(resp.totalPaginas || 1)
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
      setErro(err.message || 'Erro ao buscar lista de usuários')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarUsuarios()
  }, [pagina, buscaDebounced])

  function exibirSucesso(msg) {
    setSucessoMsg(msg)
    setTimeout(() => setSucessoMsg(null), 4000)
  }

  async function handleToggleAdmin(user) {
    const novoStatus = !user.is_admin
    const confirmar = window.confirm(
      novoStatus
        ? `Deseja conceder privilégios de ADMINISTRADOR para "${user.email}"?`
        : `Deseja remover os privilégios de administrador de "${user.email}"?`
    )
    if (!confirmar) return

    try {
      await alternarAdminUsuario(user.id, novoStatus)
      setUsuarios(prev =>
        prev.map(u => (u.id === user.id ? { ...u, is_admin: novoStatus } : u))
      )
      exibirSucesso(
        novoStatus
          ? `"${user.email}" agora é um Administrador!`
          : `Privilégio de administrador revogado para "${user.email}".`
      )
    } catch (err) {
      alert(err.message || 'Erro ao alterar privilégios do usuário.')
    }
  }

  function abrirModalEditar(u) {
    setUsuarioEditando(u)
    setFormNome(u.nome || '')
    setFormTelefone(u.telefone || '')
    setFormSenha('')
    setMostrarSenha(false)
    setErroModal(null)
  }

  function fecharModalEditar() {
    setUsuarioEditando(null)
    setFormNome('')
    setFormTelefone('')
    setFormSenha('')
    setMostrarSenha(false)
    setErroModal(null)
    setSalvando(false)
  }

  async function handleSalvarUsuario(e) {
    e.preventDefault()
    setSalvando(true)
    setErroModal(null)

    try {
      const payload = {
        nome: formNome.trim(),
        telefone: formTelefone.trim(),
      }

      if (formSenha.trim()) {
        if (formSenha.trim().length < 6) {
          setErroModal('A nova senha deve conter pelo menos 6 caracteres.')
          setSalvando(false)
          return
        }
        payload.senha = formSenha.trim()
      }

      const resp = await atualizarUsuarioAdmin(usuarioEditando.id, payload)
      setUsuarios(prev =>
        prev.map(u =>
          u.id === usuarioEditando.id ? { ...u, ...resp.usuario } : u
        )
      )
      exibirSucesso(`Dados do usuário "${usuarioEditando.email}" atualizados com sucesso!`)
      fecharModalEditar()
    } catch (err) {
      setErroModal(err.message || 'Erro ao atualizar dados do usuário.')
    } finally {
      setSalvando(false)
    }
  }

  async function handleConfirmarExclusao() {
    if (!usuarioExcluindo) return
    setExcluindo(true)

    try {
      await excluirUsuarioAdmin(usuarioExcluindo.id)
      setUsuarios(prev => prev.filter(u => u.id !== usuarioExcluindo.id))
      setTotal(t => Math.max(0, t - 1))
      exibirSucesso(`Usuário "${usuarioExcluindo.email}" foi excluído com sucesso.`)
      setUsuarioExcluindo(null)
      if (usuarioEditando?.id === usuarioExcluindo.id) {
        fecharModalEditar()
      }
    } catch (err) {
      alert(err.message || 'Erro ao excluir usuário.')
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <div style={estilos.container}>
      {/* Top Header */}
      <div style={estilos.headerRow}>
        <div>
          <h1 style={estilos.titulo}>
            Gestão de Usuários
          </h1>
          <p style={estilos.subtitulo}>
            Listagem e controle de contas ({total} {total === 1 ? 'usuário cadastrado' : 'usuários cadastrados'})
          </p>
        </div>

        <div style={estilos.acoesHeader}>
          <button
            type="button"
            onClick={carregarUsuarios}
            disabled={carregando}
            style={estilos.botaoAtualizar}
            title="Atualizar lista"
          >
            <IconAtualizar size={16} color="var(--text-muted)" />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={estilos.botaoVoltar}
          >
            <IconVoltar size={16} color="var(--primary)" />
            <span>Voltar ao Sistema</span>
          </button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {sucessoMsg && (
        <div style={estilos.alertaSucesso}>
          <IconCheck size={16} color="var(--primary)" />
          <span>{sucessoMsg}</span>
        </div>
      )}

      {erro && (
        <div style={estilos.alertaErro}>
          <span>⚠️ {erro}</span>
          <button onClick={carregarUsuarios} style={estilos.btnTentar}>Tentar novamente</button>
        </div>
      )}

      {/* Barra de Filtro / Busca */}
      <div style={estilos.filtroCard}>
        <div style={estilos.buscaWrap}>
          <IconBusca size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={estilos.inputBusca}
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              style={estilos.btnLimparBusca}
              title="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>

        <div style={estilos.contadorRegistros}>
          Mostrando <strong>{usuarios.length}</strong> de <strong>{total}</strong>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div style={estilos.tabelaWrapper}>
        <table style={estilos.tabela}>
          <thead>
            <tr>
              <th style={estilos.th}>Usuário / E-mail</th>
              <th style={estilos.th}>Telefone</th>
              <th style={estilos.th}>Data de Cadastro</th>
              <th style={estilos.th}>Último Login</th>
              <th style={estilos.th}>Administrador</th>
              <th style={{ ...estilos.th, textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={6} style={estilos.tdVazio}>
                  <div style={estilos.loadingRow}>
                    <IconAtualizar size={20} color="var(--primary)" />
                    <span>Carregando usuários...</span>
                  </div>
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={6} style={estilos.tdVazio}>
                  Nenhum usuário encontrado {busca ? `com o termo "${busca}"` : ''}.
                </td>
              </tr>
            ) : (
              usuarios.map(u => {
                const letra = (u.nome || u.email || 'U')[0].toUpperCase()
                const dataCriacaoFormatada = u.criado_em
                  ? new Date(u.criado_em).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '-'

                const ultimoLoginFormatado = u.ultimo_acesso
                  ? new Date(u.ultimo_acesso).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Nunca acessou'

                const ehUsuarioAtual = u.id === usuario?.id

                return (
                  <tr key={u.id} style={estilos.tr}>
                    {/* Nome / E-mail */}
                    <td style={estilos.td}>
                      <div style={estilos.userCell}>
                        <div style={estilos.avatarBadge}>{letra}</div>
                        <div style={estilos.userTextWrap}>
                          {u.nome && (
                            <span style={estilos.nomeTexto}>{u.nome}</span>
                          )}
                          <span style={estilos.emailTexto}>{u.email}</span>
                          <span style={estilos.idSub}>ID: {u.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>

                    {/* Telefone */}
                    <td style={estilos.td}>
                      <span style={estilos.textoTelefone}>
                        {u.telefone || '—'}
                      </span>
                    </td>

                    {/* Data Cadastro */}
                    <td style={estilos.td}>
                      <span style={estilos.textoData}>{dataCriacaoFormatada}</span>
                    </td>

                    {/* Último Login */}
                    <td style={estilos.td}>
                      <span style={{
                        ...estilos.textoData,
                        color: u.ultimo_acesso ? 'var(--text-pure)' : 'var(--text-muted)',
                      }}>
                        {ultimoLoginFormatado}
                      </span>
                    </td>

                    {/* Checkbox / Toggle Administrador */}
                    <td style={estilos.td}>
                      <label style={estilos.adminCheckboxWrap}>
                        <input
                          type="checkbox"
                          checked={Boolean(u.is_admin)}
                          onChange={() => handleToggleAdmin(u)}
                          style={estilos.checkboxInput}
                        />
                        <span style={{
                          ...estilos.adminStatusLabel,
                          color: u.is_admin ? 'var(--primary)' : 'var(--text-muted)',
                          fontWeight: u.is_admin ? 700 : 500,
                        }}>
                          {u.is_admin ? 'Sim (Admin)' : 'Não'}
                        </span>
                      </label>
                    </td>

                    {/* Ações (Editar e Excluir) */}
                    <td style={{ ...estilos.td, textAlign: 'center' }}>
                      <div style={estilos.acoesRow}>
                        <button
                          type="button"
                          onClick={() => abrirModalEditar(u)}
                          style={estilos.btnEditarIcone}
                          title="Editar usuário (Nome, Telefone, Senha)"
                          aria-label="Editar usuário"
                        >
                          <IconEditar size={15} color="var(--primary)" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setUsuarioExcluindo(u)}
                          disabled={ehUsuarioAtual}
                          style={{
                            ...estilos.btnExcluirIcone,
                            opacity: ehUsuarioAtual ? 0.3 : 1,
                            cursor: ehUsuarioAtual ? 'not-allowed' : 'pointer',
                          }}
                          title={
                            ehUsuarioAtual
                              ? 'Você não pode excluir sua própria conta conectada'
                              : 'Excluir usuário'
                          }
                          aria-label="Excluir usuário"
                        >
                          <IconLixeira size={15} color="#EF4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Barra de Paginação */}
      {totalPaginas > 1 && (
        <div style={estilos.paginacaoBar}>
          <button
            type="button"
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina <= 1 || carregando}
            style={{
              ...estilos.btnPaginacao,
              opacity: pagina <= 1 ? 0.5 : 1,
              cursor: pagina <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ‹ Anterior
          </button>

          <span style={estilos.textoPaginacao}>
            Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
          </span>

          <button
            type="button"
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina >= totalPaginas || carregando}
            style={{
              ...estilos.btnPaginacao,
              opacity: pagina >= totalPaginas ? 0.5 : 1,
              cursor: pagina >= totalPaginas ? 'not-allowed' : 'pointer',
            }}
          >
            Próxima ›
          </button>
        </div>
      )}

      {/* Modal de Edição de Usuário */}
      {usuarioEditando && (
        <div style={estilos.modalOverlay} onClick={fecharModalEditar}>
          <div style={estilos.modalBox} onClick={e => e.stopPropagation()}>
            <div style={estilos.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconEditar size={20} color="var(--primary)" />
                <h3 style={estilos.modalTitulo}>Editar Usuário</h3>
              </div>
              <button onClick={fecharModalEditar} style={estilos.btnFecharModal}>✕</button>
            </div>

            {/* Painel Somente Leitura: Data de Criação e Último Login */}
            <div style={estilos.painelLeitura}>
              <div style={estilos.itemLeitura}>
                <span style={estilos.labelLeitura}>Data de Criação:</span>
                <span style={estilos.valorLeitura}>
                  {usuarioEditando.criado_em
                    ? new Date(usuarioEditando.criado_em).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </span>
              </div>

              <div style={estilos.itemLeitura}>
                <span style={estilos.labelLeitura}>Último Login:</span>
                <span style={estilos.valorLeitura}>
                  {usuarioEditando.ultimo_acesso
                    ? new Date(usuarioEditando.ultimo_acesso).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Nunca acessou'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSalvarUsuario} style={estilos.modalForm}>
              {/* E-mail (Nunca pode ser alterado) */}
              <div style={estilos.modalField}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={estilos.modalLabel}>E-mail:</label>
                  <span style={estilos.badgeEmailFixo}>🔒 Não pode ser alterado</span>
                </div>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={usuarioEditando.email || ''}
                  style={estilos.modalInputDisabled}
                />
              </div>

              {/* Nome */}
              <div style={estilos.modalField}>
                <label style={estilos.modalLabel}>Nome Completo:</label>
                <input
                  type="text"
                  value={formNome}
                  onChange={e => setFormNome(e.target.value)}
                  style={estilos.modalInput}
                  placeholder="Nome do usuário"
                />
              </div>

              {/* Telefone */}
              <div style={estilos.modalField}>
                <label style={estilos.modalLabel}>Telefone:</label>
                <input
                  type="tel"
                  value={formTelefone}
                  onChange={e => setFormTelefone(e.target.value)}
                  style={estilos.modalInput}
                  placeholder="(11) 98765-4321"
                />
              </div>

              {/* Senha */}
              <div style={estilos.modalField}>
                <label style={estilos.modalLabel}>Nova Senha (opcional):</label>
                <div style={estilos.inputSenhaWrap}>
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={formSenha}
                    onChange={e => setFormSenha(e.target.value)}
                    style={estilos.modalInputSenha}
                    placeholder="Deixe em branco para manter a senha atual"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(v => !v)}
                    style={estilos.btnMostrarSenha}
                    title={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {mostrarSenha ? (
                      <IconOlhoFechado size={16} color="var(--text-muted)" />
                    ) : (
                      <IconOlho size={16} color="var(--text-muted)" />
                    )}
                  </button>
                </div>
                <span style={estilos.dicaCampo}>
                  Mínimo de 6 caracteres. Só preencha se desejar redefinir a senha do usuário.
                </span>
              </div>

              {erroModal && (
                <div style={estilos.erroModal}>{erroModal}</div>
              )}

              <div style={estilos.modalBotoes}>
                <button
                  type="button"
                  onClick={fecharModalEditar}
                  disabled={salvando}
                  style={estilos.btnCancelarModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  style={estilos.btnSalvarModal}
                >
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {usuarioExcluindo && (
        <div style={estilos.modalOverlay} onClick={() => setUsuarioExcluindo(null)}>
          <div style={estilos.modalBoxExcluir} onClick={e => e.stopPropagation()}>
            <div style={estilos.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={estilos.iconeAlertaExcluir}>
                  <IconLixeira size={22} color="#EF4444" />
                </div>
                <h3 style={{ ...estilos.modalTitulo, color: '#EF4444' }}>Excluir Usuário</h3>
              </div>
              <button onClick={() => setUsuarioExcluindo(null)} style={estilos.btnFecharModal}>✕</button>
            </div>

            <div style={estilos.modalExcluirCorpo}>
              <p style={{ margin: 0, color: 'var(--text-pure)', fontSize: 14.5 }}>
                Tem certeza que deseja excluir o usuário <strong>{usuarioExcluindo.email}</strong>?
              </p>
              <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.4 }}>
                ⚠️ Esta ação é irreversível. Todos os dados vinculados a este usuário (transações, cartões, sonhos e contas) serão permanentemente removidos.
              </p>
            </div>

            <div style={estilos.modalBotoes}>
              <button
                type="button"
                onClick={() => setUsuarioExcluindo(null)}
                disabled={excluindo}
                style={estilos.btnCancelarModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
                disabled={excluindo}
                style={estilos.btnConfirmarExcluir}
              >
                {excluindo ? 'Excluindo...' : 'Sim, Excluir Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const estilos = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
    width: '100%',
    maxWidth: 1100,
    margin: '0 auto',
    padding: '8px 0 32px',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  titulo: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
    letterSpacing: '-0.02em',
  },
  subtitulo: {
    margin: '4px 0 0',
    fontSize: 14,
    color: 'var(--text-muted)',
  },
  acoesHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  botaoAtualizar: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  botaoVoltar: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--surface-hover)',
    color: 'var(--text-pure)',
    border: '1px solid var(--border)',
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  alertaSucesso: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    color: 'var(--primary)',
    padding: '10px 16px',
    borderRadius: 10,
    fontSize: 13.5,
    fontWeight: 600,
  },
  alertaErro: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#EF4444',
    padding: '10px 16px',
    borderRadius: 10,
    fontSize: 13.5,
  },
  btnTentar: {
    background: 'none',
    border: '1px solid #EF4444',
    color: '#EF4444',
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
  },
  filtroCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 14,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '12px 18px',
    borderRadius: 14,
  },
  buscaWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 260,
    background: 'var(--surface-hover)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    padding: '6px 12px',
  },
  inputBusca: {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--text-pure)',
    fontSize: 13.5,
    width: '100%',
  },
  btnLimparBusca: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: 0,
    fontSize: 13,
  },
  contadorRegistros: {
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  tabelaWrapper: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: 'var(--card-shadow-sm)',
  },
  tabela: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '14px 18px',
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface-hover)',
  },
  tr: {
    borderBottom: '1px solid var(--border-subtle)',
    transition: 'background-color 0.12s ease',
  },
  td: {
    padding: '14px 18px',
    fontSize: 13.5,
    color: 'var(--text)',
    verticalAlign: 'middle',
  },
  tdVazio: {
    padding: '36px 18px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: 14,
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  avatarBadge: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    color: 'var(--primary)',
    fontSize: 13,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontFamily: 'var(--font-headline)',
  },
  userTextWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  nomeTexto: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text-pure)',
  },
  emailTexto: {
    fontWeight: 500,
    color: 'var(--text)',
    fontSize: 13.5,
  },
  idSub: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'monospace',
  },
  textoTelefone: {
    fontSize: 13,
    color: 'var(--text)',
  },
  textoData: {
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  adminCheckboxWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkboxInput: {
    accentColor: 'var(--primary)',
    width: 17,
    height: 17,
    cursor: 'pointer',
  },
  adminStatusLabel: {
    fontSize: 13,
  },
  acoesRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnEditarIcone: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: 6,
    width: 30,
    height: 30,
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.15s ease',
  },
  btnExcluirIcone: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: 6,
    width: 30,
    height: 30,
    padding: 0,
    transition: 'all 0.15s ease',
  },
  paginacaoBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: '12px',
  },
  btnPaginacao: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-pure)',
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.15s ease',
  },
  textoPaginacao: {
    fontSize: 13.5,
    color: 'var(--text-muted)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modalBox: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: 18,
    width: '100%',
    maxWidth: 480,
    padding: '24px',
    boxShadow: 'var(--dropdown-shadow)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalBoxExcluir: {
    background: 'var(--surface-raised)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    borderRadius: 18,
    width: '100%',
    maxWidth: 440,
    padding: '24px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  iconeAlertaExcluir: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'rgba(239, 68, 68, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalExcluirCorpo: {
    padding: '12px 0',
  },
  btnConfirmarExcluir: {
    background: '#EF4444',
    border: 'none',
    color: '#FFFFFF',
    padding: '9px 18px',
    borderRadius: 8,
    fontSize: 13.5,
    fontWeight: 700,
    cursor: 'pointer',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitulo: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    fontFamily: 'var(--font-headline)',
    color: 'var(--text-pure)',
  },
  btnFecharModal: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 18,
    cursor: 'pointer',
  },
  painelLeitura: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    background: 'var(--surface-hover)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 12,
    padding: '10px 14px',
  },
  itemLeitura: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  labelLeitura: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  valorLeitura: {
    fontSize: 12.5,
    fontWeight: 600,
    color: 'var(--text-pure)',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  modalField: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  modalLabel: {
    fontSize: 12.5,
    fontWeight: 600,
    color: 'var(--text-pure)',
  },
  badgeEmailFixo: {
    fontSize: 10.5,
    fontWeight: 600,
    color: 'var(--text-muted)',
    background: 'var(--surface-active)',
    padding: '2px 6px',
    borderRadius: 4,
  },
  modalInputDisabled: {
    padding: '10px 12px',
    background: 'var(--surface-hover)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    fontSize: 13.5,
    color: 'var(--text-muted)',
    cursor: 'not-allowed',
    userSelect: 'none',
  },
  modalInput: {
    padding: '10px 12px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 13.5,
    color: 'var(--text-pure)',
    outline: 'none',
  },
  inputSenhaWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  modalInputSenha: {
    width: '100%',
    padding: '10px 38px 10px 12px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 13.5,
    color: 'var(--text-pure)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  btnMostrarSenha: {
    position: 'absolute',
    right: 8,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  dicaCampo: {
    fontSize: 11,
    color: 'var(--text-muted)',
  },
  erroModal: {
    color: '#EF4444',
    fontSize: 12.5,
    background: 'rgba(239, 68, 68, 0.1)',
    padding: '8px 12px',
    borderRadius: 6,
  },
  modalBotoes: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  btnCancelarModal: {
    background: 'none',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnSalvarModal: {
    background: 'var(--primary)',
    border: 'none',
    color: '#0A0F0D',
    padding: '8px 18px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
}
