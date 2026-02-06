// Variáveis globais
let treinamentoAtualVariantes = null;
let variantesAtuais = [];

// Abrir modal de variantes
async function gerenciarVariantes(treinamentoId) {
  treinamentoAtualVariantes = treinamentoId;
  const treinamento = treinamentos.find(t => t.id === treinamentoId);
  
  document.getElementById('nomeTreinamentoVariante').textContent = treinamento.nome;
  document.getElementById('modalVariantes').style.display = 'flex';
  
  await carregarVariantes(treinamentoId);
}

// Carregar variantes
async function carregarVariantes(treinamentoId) {
  try {
    const response = await authenticatedFetch(`/api/variantes/${treinamentoId}`);
    const data = await response.json();
    variantesAtuais = Array.isArray(data) ? data : [];
    renderizarVariantes();
  } catch (error) {
    console.error('Erro ao carregar variantes:', error);
    variantesAtuais = [];
    renderizarVariantes();
  }
}

// Renderizar lista de variantes
function renderizarVariantes() {
  const lista = document.getElementById('listaVariantes');
  
  if (variantesAtuais.length === 0) {
    lista.innerHTML = '<p style="text-align: center; color: #666;">Nenhuma variante criada</p>';
    return;
  }
  
  lista.innerHTML = variantesAtuais.map(v => `
    <div class="variante-item" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div style="flex: 1;">
          <h4 style="margin: 0 0 5px 0;">${v.nomeVariante}</h4>
          <p style="margin: 0; color: #666; font-size: 14px;">
            <i class="fa-solid fa-building"></i> ${v.empresa?.nome || 'Empresa não encontrada'}
          </p>
          ${v.descricao ? `<p style="margin: 10px 0 0 0; font-size: 13px;">${v.descricao}</p>` : ''}
        </div>
        <div style="display: flex; gap: 5px;">
          <button onclick="editarVariante(${v.id})" style="padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button onclick="excluirVariante(${v.id})" style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Abrir modal de nova variante
async function abrirNovaVariante() {
  document.getElementById('tituloFormVariante').textContent = 'Nova Variante';
  document.getElementById('varianteId').value = '';
  document.getElementById('varianteTreinamentoBaseId').value = treinamentoAtualVariantes;
  document.getElementById('formVariante').reset();
  
  await carregarEmpresasSelect();
  document.getElementById('modalFormVariante').style.display = 'flex';
}

// Carregar empresas no select
async function carregarEmpresasSelect() {
  try {
    const response = await authenticatedFetch('/api/empresas');
    const data = await response.json();
    const empresas = Array.isArray(data) ? data : [];
    
    const select = document.getElementById('varianteEmpresaId');
    select.innerHTML = '<option value="">Selecione uma empresa</option>' +
      empresas.map(e => `<option value="${e.id}">${e.nome}</option>`).join('');
  } catch (error) {
    console.error('Erro ao carregar empresas:', error);
  }
}

// Editar variante
async function editarVariante(varianteId) {
  const variante = variantesAtuais.find(v => v.id === varianteId);
  
  document.getElementById('tituloFormVariante').textContent = 'Editar Variante';
  document.getElementById('varianteId').value = variante.id;
  document.getElementById('varianteTreinamentoBaseId').value = variante.treinamentoBaseId;
  document.getElementById('varianteNome').value = variante.nomeVariante;
  document.getElementById('varianteDescricao').value = variante.descricao || '';
  document.getElementById('varianteConteudo').value = variante.conteudoCustomizado ? JSON.stringify(variante.conteudoCustomizado, null, 2) : '';
  
  await carregarEmpresasSelect();
  document.getElementById('varianteEmpresaId').value = variante.empresaId;
  
  document.getElementById('modalFormVariante').style.display = 'flex';
}

// Salvar variante
async function salvarVariante(event) {
  event.preventDefault();
  
  const varianteId = document.getElementById('varianteId').value;
  const dados = {
    treinamentoBaseId: parseInt(document.getElementById('varianteTreinamentoBaseId').value),
    empresaId: parseInt(document.getElementById('varianteEmpresaId').value),
    nomeVariante: document.getElementById('varianteNome').value,
    descricao: document.getElementById('varianteDescricao').value,
    conteudoCustomizado: null
  };
  
  // Parse JSON se fornecido
  const conteudoText = document.getElementById('varianteConteudo').value.trim();
  if (conteudoText) {
    try {
      dados.conteudoCustomizado = JSON.parse(conteudoText);
    } catch (e) {
      alert('JSON inválido no campo Conteúdo Customizado');
      return;
    }
  }
  
  try {
    const url = varianteId ? `/api/variantes/${varianteId}` : '/api/variantes';
    const method = varianteId ? 'PUT' : 'POST';
    
    const response = await authenticatedFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    
    if (response.ok) {
      fecharModalFormVariante();
      await carregarVariantes(treinamentoAtualVariantes);
      alert(varianteId ? 'Variante atualizada!' : 'Variante criada!');
    }
  } catch (error) {
    console.error('Erro ao salvar variante:', error);
    alert('Erro ao salvar variante');
  }
}

// Excluir variante
async function excluirVariante(varianteId) {
  if (!confirm('Deseja realmente excluir esta variante?')) return;
  
  try {
    const response = await authenticatedFetch(`/api/variantes/${varianteId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      await carregarVariantes(treinamentoAtualVariantes);
      alert('Variante excluída!');
    }
  } catch (error) {
    console.error('Erro ao excluir variante:', error);
    alert('Erro ao excluir variante');
  }
}

// Fechar modais
function fecharModalVariantes() {
  document.getElementById('modalVariantes').style.display = 'none';
  treinamentoAtualVariantes = null;
}

function fecharModalFormVariante() {
  document.getElementById('modalFormVariante').style.display = 'none';
}
