let contatos = [];
let treinamentos = [];
let empresas = [];
let contatoIdCounter = 1;
let treinamentoIdCounter = 1;
let empresaIdCounter = 1;
let empresaSelecionada = null;
let contatosEmpresaSelecionada = [];

// Inicializar sistema
document.addEventListener('DOMContentLoaded', function () {
  // Carregar dados em sequência para evitar problemas de timing
  carregarEmpresas()
    .then(() => {
      atualizarSelectEmpresa();
      return carregarTreinamentos();
    })
    .then(() => {
      atualizarSelectTreinamento();
      return carregarContatos();
    })
    .then(() => {
      // Aguardar um pouco para garantir que tudo foi carregado
      setTimeout(() => {
        atualizarEstatisticasEmpresas();
        if (document.getElementById('empresas').classList.contains('active')) {
          renderizarEmpresas();
        }
      }, 100);
    })
    .catch(error => {
      console.error('Erro ao inicializar sistema:', error);
      mostrarAlerta('Erro ao carregar dados do sistema.', 'error');
    });
});

// Funções de navegação
function showTab(tabName) {
  const tabs = document.querySelectorAll('.nav-tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => tab.classList.remove('active'));
  contents.forEach(content => content.classList.remove('active'));

  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(tabName).classList.add('active');

  if (tabName === 'empresas') {
    renderizarEmpresas();
    atualizarEstatisticasEmpresas();
  } else if (tabName === 'treinamentos') {
    renderizarTreinamentos();
  }
}

// Formatação de telefone
function formatarTelefone(telefone) {
  if (!telefone) return 'N/A';

  const cleaned = telefone.replace(/\D/g, '');
  if (cleaned.length === 13) {
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  } else if (cleaned.length === 12) {
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  } else if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return telefone;
}

// Validar telefone
function validarTelefone(telefone) {
  const cleaned = telefone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 13;
}

// Funções de alerta
function mostrarAlerta(mensagem, tipo = 'success') {
  const alertsContainer = document.getElementById('alerts');
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${tipo}`;
  alertDiv.innerHTML = `
        <strong>${tipo === 'success' ? 'Sucesso!' : 'Erro!'}</strong> ${mensagem}
      `;

  alertsContainer.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// Cadastrar contato
document.getElementById('cadastroForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const empresaId = document.getElementById('empresa').value;
  const treinamentoId = document.getElementById('treinamento').value;

  if (!nome || !telefone || !empresaId) {
    mostrarAlerta('Por favor, preencha todos os campos obrigatórios.', 'error');
    return;
  }

  if (!validarTelefone(telefone)) {
    mostrarAlerta('Formato de telefone inválido.', 'error');
    return;
  }

  // Verificar se já existe contato com este telefone
  if (contatos.some(c => c.telefone === telefone)) {
    mostrarAlerta('Já existe um contato com este telefone.', 'error');
    return;
  }

  const novoContato = {
    nome,
    telefone,
    empresaId: parseInt(empresaId),
    treinamentoId: treinamentoId ? parseInt(treinamentoId) : null
  };

  fetch('http://92.112.178.26:3000/api/contatos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(novoContato)
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      mostrarAlerta(`Contato ${data.nome} cadastrado com sucesso!`);
      document.getElementById('cadastroForm').reset();
      carregarContatos().then(() => {
        atualizarEstatisticasEmpresas();
        if (document.getElementById('empresas').classList.contains('active')) {
          renderizarEmpresas();
        }
      });
    })
    .catch(() => mostrarAlerta('Erro ao salvar contato.', 'error'));
});

// Atualizar select de empresas
function atualizarSelectEmpresa() {
  const selects = [
    document.getElementById('empresa'),
    document.getElementById('editarEmpresa')
  ];

  selects.forEach(select => {
    if (select) {
      const currentValue = select.value;
      select.innerHTML = '<option value="">Selecione uma empresa</option>';

      empresas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa.id;
        option.textContent = empresa.razao_social;
        select.appendChild(option);
      });

      if (currentValue) select.value = currentValue;
    }
  });
}

// Atualizar select de treinamentos
function atualizarSelectTreinamento() {
  const selects = [
    document.getElementById('treinamento'),
    document.getElementById('editarTreinamento')
  ];

  selects.forEach(select => {
    if (select) {
      const currentValue = select.value;
      select.innerHTML = '<option value="">Selecione um treinamento</option>';

      treinamentos.forEach(treinamento => {
        const option = document.createElement('option');
        option.value = treinamento.id;
        option.textContent = treinamento.nome;
        select.appendChild(option);
      });

      if (currentValue) select.value = currentValue;
    }
  });
}

// Carregar contatos
function carregarContatos() {
  return fetch('http://92.112.178.26:3000/api/contatos')
    .then(res => {
      if (!res.ok) throw new Error('Erro ao carregar contatos');
      return res.json();
    })
    .then(data => {
      console.log('Contatos carregados:', data);
      contatos = data.map(c => ({
        ...c,
        id: parseInt(c.id, 10),
        empresaId: parseInt(c.empresaId, 10),
        treinamentoId: c.treinamentoId ? parseInt(c.treinamentoId, 10) : null
      }));

      // Debug: mostrar associações
      console.log('Associações contato-empresa:', contatos.map(c => ({
        contatoId: c.id,
        nome: c.nome,
        empresaId: c.empresaId
      })));
    })
    .catch(error => {
      console.error('Erro ao carregar contatos:', error);
      mostrarAlerta('Erro ao carregar contatos.', 'error');
    });
}

// Renderizar empresas
function renderizarEmpresas() {
  const empresasGrid = document.getElementById('empresasGrid');

  if (empresas.length === 0) {
    empresasGrid.innerHTML = `
      <div class="empty-state">
        <h3>Nenhuma empresa cadastrada</h3>
        <p>Não há empresas cadastradas no sistema.</p>
      </div>
    `;
    return;
  }

  empresasGrid.innerHTML = empresas.map(empresa => {
    // Debug: verificar contatos da empresa
    const contatosEmpresa = contatos.filter(c => c.empresaId === empresa.id);
    console.log(`Empresa ${empresa.razao_social} (ID: ${empresa.id}) tem ${contatosEmpresa.length} contatos:`, contatosEmpresa);

    const contatosComTreinamento = contatosEmpresa.filter(c => c.treinamentoId);

    return `
      <div class="company-card">
        <div class="company-header">
          <h3>${empresa.razao_social}</h3>
          <span class="company-type">${empresa.tipo || empresa.porte || 'Empresa'}</span>
        </div>
        <div class="company-info">
          <p><strong>CNPJ:</strong> ${empresa.cnpj || 'N/A'}</p>
          <p><strong>Email:</strong> ${empresa.email || 'N/A'}</p>
          <p><strong>Telefone:</strong> ${formatarTelefone(empresa.contato)}</p>
        </div>
        <div class="company-stats">
          <div class="stat">
            <span class="stat-number">${contatosEmpresa.length}</span>
            <span class="stat-label">Contatos</span>
          </div>
          <div class="stat">
            <span class="stat-number">${contatosComTreinamento.length}</span>
            <span class="stat-label">Com Treinamento</span>
          </div>
        </div>
        <div class="company-actions">
          <button class="btn-primary" onclick="visualizarContatosEmpresa(${empresa.id})">
            Ver Contatos
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Visualizar contatos da empresa
function visualizarContatosEmpresa(empresaId) {
  const empresa = empresas.find(e => e.id === empresaId);
  const contatosEmpresa = contatos.filter(c => c.empresaId === empresaId);

  console.log(`Visualizando contatos da empresa ${empresaId}:`, contatosEmpresa);

  empresaSelecionada = empresa;
  contatosEmpresaSelecionada = contatosEmpresa;

  document.getElementById('modalTituloEmpresa').textContent = `Contatos - ${empresa.razao_social}`;
  document.getElementById('searchInputModal').value = '';

  renderizarContatosEmpresa();
  document.getElementById('modalContatosEmpresa').style.display = 'block';
}

// Renderizar contatos da empresa no modal
function renderizarContatosEmpresa() {
  const modalConteudo = document.getElementById('modalConteudoEmpresa');
  const searchInput = document.getElementById('searchInputModal');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

  const contatosFiltrados = contatosEmpresaSelecionada.filter(contato =>
    contato.nome.toLowerCase().includes(searchTerm) ||
    contato.telefone.includes(searchTerm)
  );

  if (contatosFiltrados.length === 0) {
    modalConteudo.innerHTML = `
      <div class="empty-state">
        <h3>Nenhum contato encontrado</h3>
        <p>${searchTerm ? 'Nenhum contato corresponde à sua pesquisa.' : 'Esta empresa ainda não possui contatos cadastrados.'}</p>
      </div>
    `;
    return;
  }

  modalConteudo.innerHTML = `
    <div class="contacts-list">
      ${contatosFiltrados.map(contato => {
    const treinamento = treinamentos.find(t => t.id === contato.treinamentoId);
    return `
          <div class="contact-item">
            <div class="contact-info">
              <h4>${contato.nome}</h4>
              <p><strong>Telefone:</strong> ${formatarTelefone(contato.telefone)}</p>
              <p><strong>Treinamento:</strong> ${treinamento ? treinamento.nome : 'Sem treinamento'}</p>
            </div>
            <div class="contact-actions">
              <button class="btn-info" onclick="abrirDetalhesContato(${contato.id})">Detalhes</button>
              <button class="btn-warning" onclick="abrirEditarContato(${contato.id})">Editar</button>
              <button class="btn-error" onclick="removerContato(${contato.id})">Remover</button>
            </div>

          </div>
        `;
  }).join('')}
    </div>
  `;
}

// Filtrar contatos no modal
function filtrarContatosModal() {
  renderizarContatosEmpresa();
}

// Abrir modal de editar contato
function abrirEditarContato(contatoId) {
  const contato = contatos.find(c => c.id === contatoId);
  if (!contato) return;

  document.getElementById('editarContatoId').value = contato.id;
  document.getElementById('editarNome').value = contato.nome;
  document.getElementById('editarTelefone').value = contato.telefone;
  document.getElementById('editarEmpresa').value = contato.empresaId;
  document.getElementById('editarTreinamento').value = contato.treinamentoId || '';

  document.getElementById('modalEditarContato').style.display = 'block';
}

// Editar contato
document.getElementById('editarContatoForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const contatoId = document.getElementById('editarContatoId').value;
  const nome = document.getElementById('editarNome').value.trim();
  const telefone = document.getElementById('editarTelefone').value.trim();
  const empresaId = document.getElementById('editarEmpresa').value;
  const treinamentoId = document.getElementById('editarTreinamento').value;

  if (!nome || !telefone || !empresaId) {
    mostrarAlerta('Por favor, preencha todos os campos obrigatórios.', 'error');
    return;
  }

  if (!validarTelefone(telefone)) {
    mostrarAlerta('Formato de telefone inválido.', 'error');
    return;
  }

  // Verificar se já existe outro contato com este telefone
  if (contatos.some(c => c.telefone === telefone && c.id !== parseInt(contatoId))) {
    mostrarAlerta('Já existe outro contato com este telefone.', 'error');
    return;
  }

  const dadosAtualizados = {
    nome,
    telefone,
    empresaId: parseInt(empresaId),
    treinamentoId: treinamentoId ? parseInt(treinamentoId) : null
  };

  fetch(`http://92.112.178.26:3000/api/contatos/${contatoId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dadosAtualizados)
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(() => {
      mostrarAlerta('Contato atualizado com sucesso!');
      fecharModalEditarContato();
      carregarContatos().then(() => {
        // Atualizar a lista de contatos da empresa no modal se estiver aberto
        if (empresaSelecionada) {
          contatosEmpresaSelecionada = contatos.filter(c => c.empresaId === empresaSelecionada.id);
          renderizarContatosEmpresa();
        }

        if (document.getElementById('empresas').classList.contains('active')) {
          renderizarEmpresas();
          atualizarEstatisticasEmpresas();
        }
      });
    })
    .catch(() => mostrarAlerta('Erro ao atualizar contato.', 'error'));
});

// Remover contato
function removerContato(id) {
  if (!confirm('Tem certeza que deseja remover este contato?')) return;

  fetch(`http://92.112.178.26:3000/api/contatos/${id}`, {
    method: 'DELETE'
  })
    .then(res => {
      if (!res.ok) throw new Error();
      mostrarAlerta('Contato removido com sucesso!');
      carregarContatos().then(() => {
        // Atualizar a lista de contatos da empresa no modal se estiver aberto
        if (empresaSelecionada) {
          contatosEmpresaSelecionada = contatos.filter(c => c.empresaId === empresaSelecionada.id);
          renderizarContatosEmpresa();
        }

        if (document.getElementById('empresas').classList.contains('active')) {
          renderizarEmpresas();
          atualizarEstatisticasEmpresas();
        }
      });
    })
    .catch(() => mostrarAlerta('Erro ao remover contato.', 'error'));
}

// Detalhes do contato
function abrirDetalhesContato(id) {
  const contato = contatos.find(c => c.id === id);
  if (!contato) return;

  const empresa = empresas.find(e => e.id === contato.empresaId);
  const treinamento = treinamentos.find(t => t.id === contato.treinamentoId);

  const detalhesHTML = `
    <h4>${contato.nome}</h4>
    <p><strong>Telefone:</strong> ${formatarTelefone(contato.telefone)}</p>
    <p><strong>Empresa:</strong> ${empresa ? empresa.razao_social : 'Empresa não encontrada'}</p>
    <p><strong>Treinamento Atual:</strong> ${treinamento ? treinamento.nome : 'Nenhum'}</p>
    <p><strong>Status:</strong> ${treinamento ? 'Com treinamento' : 'Sem treinamento'}</p>
  `;

  document.getElementById('detalhesContatoConteudo').innerHTML = detalhesHTML;
  document.getElementById('modalDetalhesContato').style.display = 'block';
}

// Atualizar estatísticas da aba empresas
function atualizarEstatisticasEmpresas() {
  const totalEmpresas = empresas.length;
  const totalContatos = contatos.length;
  const contatosComTreinamento = contatos.filter(c => c.treinamentoId).length;

  document.getElementById('totalEmpresas').textContent = totalEmpresas;
  document.getElementById('totalContatos').textContent = totalContatos;
  document.getElementById('contatosComTreinamento').textContent = contatosComTreinamento;
}

// Fechar modal de contatos da empresa
function fecharModalContatosEmpresa() {
  document.getElementById('modalContatosEmpresa').style.display = 'none';
  empresaSelecionada = null;
  contatosEmpresaSelecionada = [];
}

// Fechar modal de editar contato
function fecharModalEditarContato() {
  document.getElementById('modalEditarContato').style.display = 'none';
}

// Fechar modal de detalhes do contato
function fecharModalDetalhesContato() {
  document.getElementById('modalDetalhesContato').style.display = 'none';
}

// Carregar treinamentos
function carregarTreinamentos() {
  const loading = document.getElementById('loadingTreinamentos');
  if (loading) loading.style.display = 'block';

  return fetch('http://92.112.178.26:3000/api/treinamentos')
    .then(res => {
      if (!res.ok) throw new Error('Erro ao carregar treinamentos');
      return res.json();
    })
    .then(data => {
      treinamentos = data;
      renderizarTreinamentos();
    })
    .catch(error => {
      console.error('Erro ao carregar treinamentos:', error);
      mostrarAlerta('Erro ao carregar treinamentos.', 'error');
    })
    .finally(() => {
      if (loading) loading.style.display = 'none';
    });
}

// Renderizar treinamentos
function renderizarTreinamentos() {
  const treinamentosGrid = document.getElementById('treinamentosGrid');

  if (treinamentos.length === 0) {
    treinamentosGrid.innerHTML = `
      <div class="empty-state">
        <h3>Nenhum treinamento cadastrado</h3>
        <p>Crie o primeiro treinamento usando o formulário acima.</p>
      </div>
    `;
    return;
  }

  treinamentosGrid.innerHTML = treinamentos.map(treinamento => {
    const contatosComTreinamento = contatos.filter(c => c.treinamentoId === treinamento.id);

    return `
      <div class="training-card">
        <div class="training-header">
          <h4>${treinamento.nome}</h4>
          <span class="training-count">${contatosComTreinamento.length} contatos</span>
        </div>
        <div class="training-content">
          <p class="training-description">${treinamento.descricao || 'Sem descrição'}</p>
          <div class="training-stats">
            <span class="stat-label">Participantes: ${contatosComTreinamento.length}</span>
          </div>
        </div>
        <div class="training-actions">
          <button class="btn-primary" onclick="visualizarContatosTreinamento(${treinamento.id})">
            Ver Contatos
          </button>
          <button class="btn-secondary" onclick="removerTreinamento(${treinamento.id})">
            Remover
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Cadastrar novo treinamento
document.getElementById('treinamentoForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const nome = document.getElementById('novoTreinamento').value.trim();
  const descricao = document.getElementById('descricaoTreinamento').value.trim();

  if (!nome) {
    mostrarAlerta('Por favor, preencha o nome do treinamento.', 'error');
    return;
  }

  const novoTreinamento = {
    nome,
    descricao
  };

  fetch('http://92.112.178.26:3000/api/treinamentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(novoTreinamento)
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      mostrarAlerta(`Treinamento ${data.nome} criado com sucesso!`);
      document.getElementById('treinamentoForm').reset();
      carregarTreinamentos().then(() => {
        atualizarSelectTreinamento();
      });
    })
    .catch(() => mostrarAlerta('Erro ao criar treinamento.', 'error'));
});

// Visualizar contatos do treinamento
function visualizarContatosTreinamento(treinamentoId) {
  const treinamento = treinamentos.find(t => t.id === treinamentoId);
  const contatosComTreinamento = contatos.filter(c => c.treinamentoId === treinamentoId);

  document.getElementById('modalTitulo').textContent = `Contatos - ${treinamento.nome}`;

  if (contatosComTreinamento.length === 0) {
    document.getElementById('modalConteudo').innerHTML = `
      <div class="empty-state">
        <h3>Nenhum contato neste treinamento</h3>
        <p>Ainda não há contatos cadastrados para este treinamento.</p>
      </div>
    `;
  } else {
    document.getElementById('modalConteudo').innerHTML = `
      <div class="contacts-list">
        ${contatosComTreinamento.map(contato => {
      const empresa = empresas.find(e => e.id === contato.empresaId);
      return `
            <div class="contact-item">
              <div class="contact-info">
                <h4>${contato.nome}</h4>
                <p><strong>Telefone:</strong> ${formatarTelefone(contato.telefone)}</p>
                <p><strong>Empresa:</strong> ${empresa ? empresa.razao_social : 'Empresa não encontrada'}</p>
              </div>
              <div class="contact-actions">
                <button onclick="abrirDetalhesContato(${contato.id})">Detalhes</button>
                <button onclick="abrirEditarContato(${contato.id})">Editar</button>
                <button onclick="removerContato(${contato.id})">Remover</button>
              </div>
            </div>
          `;
    }).join('')}
      </div>
    `;
  }

  document.getElementById('modalContatos').style.display = 'block';
}

// Fechar modal de contatos do treinamento
function fecharModal() {
  document.getElementById('modalContatos').style.display = 'none';
}

// Remover treinamento
function removerTreinamento(id) {
  const contatosComTreinamento = contatos.filter(c => c.treinamentoId === id);

  if (contatosComTreinamento.length > 0) {
    if (!confirm(`Este treinamento possui ${contatosComTreinamento.length} contatos. Ao removê-lo, os contatos perderão a associação com o treinamento. Deseja continuar?`)) {
      return;
    }
  } else {
    if (!confirm('Tem certeza que deseja remover este treinamento?')) {
      return;
    }
  }

  fetch(`http://92.112.178.26:3000/api/treinamentos/${id}`, {
    method: 'DELETE'
  })
    .then(res => {
      if (!res.ok) throw new Error();
      mostrarAlerta('Treinamento removido com sucesso!');
      carregarTreinamentos().then(() => {
        atualizarSelectTreinamento();
        // Recarregar contatos para atualizar as estatísticas
        carregarContatos();
      });
    })
    .catch(() => mostrarAlerta('Erro ao remover treinamento.', 'error'));
}

// Exportar dados
/*function exportarDados() {
  const dados = {
    empresas: empresas,
    contatos: contatos,
    treinamentos: treinamentos,
    timestamp: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cadastro-dados-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  mostrarAlerta('Dados exportados com sucesso!');
}*/

function exportarDadosXLS() {
  // Mapeia as empresas pelo id para facilitar o lookup
  const mapaEmpresas = Object.fromEntries(empresas.map(e => [e.id, e]));

  // Formata os dados das empresas para o XLS
  const empresasSheet = empresas.map(empresa => ({
    ID: empresa.id,
    Razao_Social: empresa.razao_social,
    CNPJ: empresa.cnpj,
    Porte: empresa.porte_empresa,
    Endereco: empresa.endereco,
    CEP: empresa.cep,
    Contato: empresa.contato,
    Email: empresa.email,
    Criado_Em: empresa.criado_em
  }));

  // Formata os contatos, adicionando o nome da empresa relacionada
  const contatosSheet = contatos.map(contato => {
    const empresa = mapaEmpresas[contato.empresaId] || {};
    return {
      ID: contato.id,
      Nome: contato.nome,
      Telefone: contato.telefone,
      Email: contato.email,
      CPF: contato.cpf,
      Status_Treinamento: contato.statusTreinamento,
      Treinamento_ID: contato.treinamentoId,
      Empresa_ID: contato.empresaId,
      Empresa_Razao_Social: empresa.razao_social || "Desconhecida",
      Ultima_Interacao: contato.ultimaInteracao
    };
  });

  // Cria um novo workbook (arquivo XLS)
  const wb = XLSX.utils.book_new();

  // Converte os arrays em abas do XLS
  const wsEmpresas = XLSX.utils.json_to_sheet(empresasSheet);
  const wsContatos = XLSX.utils.json_to_sheet(contatosSheet);

  // Adiciona as abas no arquivo
  XLSX.utils.book_append_sheet(wb, wsEmpresas, "Empresas");
  XLSX.utils.book_append_sheet(wb, wsContatos, "Contatos");

  // Salva o arquivo XLS com nome baseado na data atual
  XLSX.writeFile(wb, `cadastro-dados-${new Date().toISOString().split('T')[0]}.xlsx`);

  // Exibe alerta de sucesso (presumo que você já tenha essa função)
  mostrarAlerta('Dados exportados com sucesso em XLS!');
}


// Fechar modais ao clicar fora
document.addEventListener('click', function (e) {
  const modals = [
    'modalContatosEmpresa',
    'modalContatos',
    'modalEditarContato',
    'modalDetalhesContato'
  ];

  modals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (e.target === modal) {
      modal.style.display = 'none';

      if (modalId === 'modalContatosEmpresa') {
        empresaSelecionada = null;
        contatosEmpresaSelecionada = [];
      }
    }
  });
});

// Fechar modais com tecla ESC
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    const modalsAbertos = document.querySelectorAll('.modal-overlay[style*="block"]');
    modalsAbertos.forEach(modal => {
      modal.style.display = 'none';
      if (modal.id === 'modalContatosEmpresa') {
        empresaSelecionada = null;
        contatosEmpresaSelecionada = [];
      }
    });
  }
});

// Função para sincronizar dados após operações
function sincronizarDados() {
  return Promise.all([
    carregarEmpresas(),
    carregarContatos(),
    carregarTreinamentos()
  ]).then(() => {
    atualizarSelectEmpresa();
    atualizarSelectTreinamento();

    // Se estivermos na aba empresas, atualizar a visualização
    if (document.getElementById('empresas').classList.contains('active')) {
      renderizarEmpresas();
      atualizarEstatisticasEmpresas();
    }

    // Se estivermos na aba treinamentos, atualizar a visualização
    if (document.getElementById('treinamentos').classList.contains('active')) {
      renderizarTreinamentos();
    }

    // Se houver um modal de empresa aberto, atualizar os contatos
    if (empresaSelecionada) {
      contatosEmpresaSelecionada = contatos.filter(c => c.empresaId === empresaSelecionada.id);
      renderizarContatosEmpresa();
    }
  });
}

// Função melhorada para carregar contatos
function carregarContatos() {
  return fetch('http://92.112.178.26:3000/api/contatos')
    .then(res => {
      if (!res.ok) throw new Error('Erro ao carregar contatos');
      return res.json();
    })
    .then(data => {
      // Garantir que os IDs são números inteiros
      contatos = data.map(c => ({
        ...c,
        id: parseInt(c.id, 10),
        empresaId: parseInt(c.empresaId, 10),
        treinamentoId: c.treinamentoId ? parseInt(c.treinamentoId, 10) : null
      }));

      console.log('Contatos carregados:', contatos.length);
      return contatos;
    })
    .catch(error => {
      console.error('Erro ao carregar contatos:', error);
      mostrarAlerta('Erro ao carregar contatos.', 'error');
      return [];
    });
}

// carregar empresas
function carregarEmpresas() {
  return fetch('http://92.112.178.26:3000/api/empresas')
    .then(res => {
      if (!res.ok) throw new Error('Erro ao carregar empresas');
      return res.json();
    })
    .then(data => {
      empresas = data.map(e => ({
        ...e,
        id: parseInt(e.id, 10)
      }));

      console.log('Empresas carregadas:', empresas.length);

      // Esconder loading depois de carregar com sucesso
      const loading = document.getElementById('loadingEmpresas');
      if (loading) loading.style.display = 'none';

      return empresas;
    })
    .catch(error => {
      console.error('Erro ao carregar empresas:', error);
      mostrarAlerta('Erro ao carregar empresas.', 'error');

      // Esconder loading mesmo em caso de erro
      const loading = document.getElementById('loadingEmpresas');
      if (loading) loading.style.display = 'none';

      return [];
    });
}


// Função melhorada para carregar treinamentos
function carregarTreinamentos() {
  const loading = document.getElementById('loadingTreinamentos');
  if (loading) loading.style.display = 'block';

  return fetch('http://92.112.178.26:3000/api/treinamentos')
    .then(res => {
      if (!res.ok) throw new Error('Erro ao carregar treinamentos');
      return res.json();
    })
    .then(data => {
      // Garantir que os IDs são números inteiros
      treinamentos = data.map(t => ({
        ...t,
        id: parseInt(t.id, 10)
      }));

      console.log('Treinamentos carregados:', treinamentos.length);
      return treinamentos;
    })
    .catch(error => {
      console.error('Erro ao carregar treinamentos:', error);
      mostrarAlerta('Erro ao carregar treinamentos.', 'error');
      return [];
    })
    .finally(() => {
      if (loading) loading.style.display = 'none';
    });
}

// Função para atualizar dados quando necessário
function atualizarDadosCompletos() {
  return sincronizarDados()
    .then(() => {
      console.log('Dados sincronizados com sucesso');
      console.log('Total de empresas:', empresas.length);
      console.log('Total de contatos:', contatos.length);
      console.log('Total de treinamentos:', treinamentos.length);
    })
    .catch(error => {
      console.error('Erro na sincronização:', error);
      mostrarAlerta('Erro ao sincronizar dados.', 'error');
    });
}

// Melhorar a inicialização do sistema
document.addEventListener('DOMContentLoaded', function () {
  console.log('Iniciando carregamento do sistema...');

  // Carregar dados em sequência para evitar problemas de dependência
  carregarEmpresas()
    .then(() => {
      console.log('Empresas carregadas, atualizando select...');
      atualizarSelectEmpresa();
      return carregarTreinamentos();
    })
    .then(() => {
      console.log('Treinamentos carregados, atualizando select...');
      atualizarSelectTreinamento();
      return carregarContatos();
    })
    .then(() => {
      console.log('Contatos carregados, atualizando estatísticas...');
      atualizarEstatisticasEmpresas();

      // Se estivermos na aba empresas por padrão, renderizar
      if (document.getElementById('empresas').classList.contains('active')) {
        renderizarEmpresas();
      }

      console.log('Sistema inicializado com sucesso!');
    })
    .catch(error => {
      console.error('Erro na inicialização:', error);
      mostrarAlerta('Erro ao inicializar o sistema.', 'error');
    });
});

// Adicionar debug para verificar dados
function debugDados() {
  console.log('=== DEBUG DOS DADOS ===');
  console.log('Empresas:', empresas);
  console.log('Contatos:', contatos);
  console.log('Treinamentos:', treinamentos);

  // Verificar associações
  empresas.forEach(empresa => {
    const contatosEmpresa = contatos.filter(c => c.empresaId === empresa.id);
    console.log(`Empresa ${empresa.razao_social} (ID: ${empresa.id}) tem ${contatosEmpresa.length} contatos`);
  });
}