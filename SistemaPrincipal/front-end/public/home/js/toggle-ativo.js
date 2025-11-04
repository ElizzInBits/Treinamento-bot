// Fun\u00e7\u00e3o para ativar/desativar contato
async function toggleAtivoContato(contatoId) {
  const contato = contatos.find(c => c.id === contatoId);
  if (!contato) {
    mostrarAlerta('Contato n\u00e3o encontrado.', 'error');
    return;
  }

  const novoStatus = contato.ativo === 1 ? 0 : 1;
  const acao = novoStatus === 1 ? 'ativar' : 'desativar';
  
  if (!confirm(`\u26a0\ufe0f Tem certeza que deseja ${acao} ${contato.nome}?\n\n${novoStatus === 0 ? '\ud83d\udeab O usu\u00e1rio n\u00e3o poder\u00e1 mais acessar treinamentos, mas poder\u00e1 visualizar certificados.' : '\u2705 O usu\u00e1rio poder\u00e1 acessar treinamentos normalmente.'}`)) {
    return;
  }

  const button = event.target;
  const originalText = button.innerHTML;
  button.innerHTML = '\u23f3 Processando...';
  button.disabled = true;

  try {
    const response = await authenticatedFetch(`/api/contatos/${contatoId}/toggle-ativo`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: novoStatus })
    });

    if (!response.ok) throw new Error();

    mostrarAlerta(`\u2705 Usu\u00e1rio ${novoStatus === 1 ? 'ativado' : 'desativado'} com sucesso!`);
    
    // Atualizar dados locais
    contato.ativo = novoStatus;
    
    // Recarregar lista
    await carregarContatos();
    if (empresaSelecionada) {
      contatosEmpresaSelecionada = contatos.filter(c => c.empresaId === empresaSelecionada.id);
      renderizarContatosEmpresa();
    }
    
  } catch (error) {
    button.innerHTML = originalText;
    button.disabled = false;
    mostrarAlerta('\u274c Erro ao alterar status do usu\u00e1rio.', 'error');
  }
}
