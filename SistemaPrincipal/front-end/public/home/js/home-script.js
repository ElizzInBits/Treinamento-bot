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
  // Definir aba ativa imediatamente para evitar flash
  const activeTab = localStorage.getItem('activeTab') || 'mapeamento';
  showTab(activeTab);
  
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
        atualizarEstatisticasMapeamento();
        atualizarEstatisticasEmpresas();
      }, 500);
    })
    .catch(error => {
      console.error('Erro ao inicializar sistema:', error);
      mostrarAlerta('Erro ao carregar dados do sistema.', 'error');
    });
});


//dashboard
document.addEventListener("DOMContentLoaded", function () {
  // Verificar se Chart.js está carregado
  if (typeof Chart === 'undefined') {
    console.error('Chart.js não está carregado');
    return;
  }
  
  // Gráfico de Contatos por Empresa
  setTimeout(() => {
    criarGraficoEmpresas();
  }, 1000);

  // Gráficos do Dashboard
  setTimeout(() => {
    criarGraficoEmpresas();
    criarGraficoStatus();
    criarGraficoModalidades();
    criarGraficoEvolucao();
  }, 2000);
});

let graficoStatusInstance = null;

async function criarGraficoStatus() {
  if (typeof Chart === 'undefined') {
    console.error('Chart.js não está carregado para gráfico de status');
    return;
  }
  
  const ctx = document.getElementById("graficoStatus");
  if (!ctx) {
    console.log('Elemento graficoStatus não encontrado');
    return;
  }
  
  // Destruir gráfico anterior se existir
  if (graficoStatusInstance) {
    graficoStatusInstance.destroy();
  }
  
  try {
    const response = await fetch('http://92.112.178.26:3000/api/dashboard/status-treinamento');
    const dados = await response.json();
    
    if (dados.length === 0) {
      ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
      return;
    }
    
    const labels = dados.map(d => d.status);
    const valores = dados.map(d => parseInt(d.total));
    const total = valores.reduce((a, b) => a + b, 0);
    
    graficoStatusInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: valores,
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',  // Verde para "Com Treinamento"
            'rgba(239, 68, 68, 0.8)'    // Vermelho para "Sem Treinamento"
          ],
          borderColor: [
            'rgba(16, 185, 129, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '60%'
      }
    });
  } catch (error) {
    console.error('Erro ao carregar dados do gráfico de status:', error);
  }
}



// Funções de navegação
function showTab(tabName) {
  const tabs = document.querySelectorAll('.nav-tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => tab.classList.remove('active'));
  contents.forEach(content => content.classList.remove('active'));

  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(tabName).classList.add('active');

  // Salvar aba ativa no localStorage
  localStorage.setItem('activeTab', tabName);

  if (tabName === 'mapeamento') {
    atualizarEstatisticasMapeamento();
  } else if (tabName === 'empresas') {
    Promise.all([carregarEmpresas(), carregarContatos()]).then(() => {
      renderizarEmpresas();
      atualizarEstatisticasEmpresas();
    });
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

// Atualizar estatísticas da aba Mapeamento com dados da API
async function atualizarEstatisticasMapeamento() {
  try {
    const response = await fetch('http://92.112.178.26:3000/api/dashboard/stats');
    const stats = await response.json();
    
    // Atualizar os elementos da aba Mapeamento
    const elementos = {
      'mapTotalContatos': stats.totalContatos || 0,
      'mapContatosComTreinamento': stats.contatosComTreinamento || 0,
      'mapEmpresasAtivas': stats.empresasAtivas || 0,
      'mapTreinamentosDisponiveis': stats.totalTreinamentos || 0,
      'mapPercentualTreinados': (stats.taxaTreinamento || 0) + '%',
      'mapMediaContatos': stats.mediaContatosPorEmpresa || 0
    };
    
    Object.entries(elementos).forEach(([id, valor]) => {
      const elemento = document.getElementById(id);
      if (elemento) {
        elemento.textContent = valor;
        // Adicionar animação de atualização
        elemento.style.transform = 'scale(1.1)';
        setTimeout(() => {
          elemento.style.transform = 'scale(1)';
        }, 200);
      }
    });
    
    // Atualizar gráficos e insights com dados reais
    await Promise.all([
      atualizarGraficos(),
      carregarInsights()
    ]);
    
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
    // Fallback para dados locais se a API falhar
    atualizarEstatisticasLocal();
  }
}

// Carregar insights avançados
async function carregarInsights() {
  try {
    // Top empresas por engajamento
    const topEmpresasResponse = await fetch('http://92.112.178.26:3000/api/dashboard/top-empresas');
    const topEmpresas = await topEmpresasResponse.json();
    
    const topEmpresasElement = document.getElementById('topEmpresas');
    if (topEmpresasElement && topEmpresas.length > 0) {
      topEmpresasElement.innerHTML = topEmpresas.map((empresa, index) => `
        <div class="top-item">
          <span class="rank">#${index + 1}</span>
          <span class="name">${empresa.razao_social}</span>
          <span class="value">${empresa.taxaEngajamento}%</span>
        </div>
      `).join('');
    }
    
    // Calcular tendência de crescimento
    const evolucaoResponse = await fetch('http://92.112.178.26:3000/api/dashboard/evolucao-mensal');
    const evolucao = await evolucaoResponse.json();
    
    const tendenciaElement = document.getElementById('tendenciaCrescimento');
    if (tendenciaElement && evolucao.contatos.length >= 2) {
      const ultimoMes = evolucao.contatos[evolucao.contatos.length - 1];
      const penultimoMes = evolucao.contatos[evolucao.contatos.length - 2];
      const crescimento = ultimoMes.total - penultimoMes.total;
      const percentual = penultimoMes.total > 0 ? ((crescimento / penultimoMes.total) * 100).toFixed(1) : 0;
      
      tendenciaElement.innerHTML = `
        <div class="metric-main">${crescimento > 0 ? '+' : ''}${crescimento}</div>
        <div class="metric-sub">${percentual}% vs mês anterior</div>
      `;
      tendenciaElement.className = `metric-value ${crescimento >= 0 ? 'positive' : 'negative'}`;
    }
    
    // Calcular eficiência do sistema
    const statsResponse = await fetch('http://92.112.178.26:3000/api/dashboard/stats');
    const stats = await statsResponse.json();
    
    const eficienciaElement = document.getElementById('eficienciaSistema');
    if (eficienciaElement) {
      const eficiencia = stats.totalContatos > 0 ? 
        ((stats.contatosComTreinamento / stats.totalContatos) * 100).toFixed(1) : 0;
      
      eficienciaElement.innerHTML = `
        <div class="metric-main">${eficiencia}%</div>
        <div class="metric-sub">Taxa de conclusão</div>
      `;
      
      // Definir cor baseada na eficiência
      let className = 'metric-value ';
      if (eficiencia >= 80) className += 'excellent';
      else if (eficiencia >= 60) className += 'good';
      else if (eficiencia >= 40) className += 'average';
      else className += 'poor';
      
      eficienciaElement.className = className;
    }
    
  } catch (error) {
    console.error('Erro ao carregar insights:', error);
  }
}

// Função de fallback com dados locais
function atualizarEstatisticasLocal() {
  const totalContatos = contatos.length;
  const contatosComTreinamento = contatos.filter(c => c.treinamentoId).length;
  const empresasAtivas = empresas.length;
  const treinamentosDisponiveis = treinamentos.length;
  const percentualTreinados = totalContatos > 0 ? Math.round((contatosComTreinamento / totalContatos) * 100) : 0;
  const mediaContatosPorEmpresa = empresasAtivas > 0 ? Math.round(totalContatos / empresasAtivas) : 0;

  const elementos = {
    'mapTotalContatos': totalContatos,
    'mapContatosComTreinamento': contatosComTreinamento,
    'mapEmpresasAtivas': empresasAtivas,
    'mapTreinamentosDisponiveis': treinamentosDisponiveis,
    'mapPercentualTreinados': percentualTreinados + '%',
    'mapMediaContatos': mediaContatosPorEmpresa
  };
  
  Object.entries(elementos).forEach(([id, valor]) => {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.textContent = valor;
    }
  });
}





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

  const listaTreinamentos = Array.isArray(treinamentos) ? treinamentos : [];

  selects.forEach(select => {
    if (select) {
      const currentValue = select.value;
      select.innerHTML = '<option value="">Selecione um treinamento</option>';

      listaTreinamentos.forEach(treinamento => {
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
      let contatosArray = [];
      
      if (Array.isArray(data)) {
        contatosArray = data;
      } else if (data && Array.isArray(data.contatos)) {
        contatosArray = data.contatos;
      } else if (data && data.data && Array.isArray(data.data)) {
        contatosArray = data.data;
      } else {
        console.error('Dados de contatos não são um array:', data);
        contatosArray = [];
      }
      
      contatos = contatosArray.map(c => ({
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
          <h3>${empresa.razao_social || empresa.razaoSocial || 'Empresa'}</h3>
          <span class="company-type">${empresa.porte_empresa || empresa.tipo || empresa.porte || 'Empresa'}</span>
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
          <button class="btn-info" onclick="abrirDetalhesEmpresa(${empresa.id})">
            Detalhes/Editar
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
        // Atualizar estatísticas do mapeamento
        atualizarEstatisticasMapeamento();

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
        // Atualizar estatísticas do mapeamento
        atualizarEstatisticasMapeamento();

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
    <p><strong>Empresa:</strong> ${empresa ? (empresa.razao_social || empresa.razaoSocial || 'Nome não informado') : 'Empresa não encontrada'}</p>
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
      let treinamentosArray = [];
      
      if (Array.isArray(data)) {
        treinamentosArray = data;
      } else if (data && Array.isArray(data.treinamentos)) {
        treinamentosArray = data.treinamentos;
      } else if (data && data.data && Array.isArray(data.data)) {
        treinamentosArray = data.data;
      } else {
        console.error('Dados de treinamentos inválidos:', data);
        treinamentosArray = [];
      }
      
      treinamentos = treinamentosArray;
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
          <p class="training-description">${treinamento.conteudo || 'Sem descrição'}</p>
          <div class="training-details">
            <p><strong>Modalidade:</strong> ${treinamento.modalidade || 'N/A'}</p>
            <p><strong>Carga Horária:</strong> ${treinamento.cargaHoraria || 'N/A'} h</p>
            <p><strong>Tipo:</strong> ${treinamento.tipo || 'N/A'}</p>
            <p><strong>Instrutor:</strong> ${treinamento.instrutor || 'N/A'}</p>
            <p><strong>Área Responsável:</strong> ${treinamento.areaResponsavel || 'N/A'}</p>
          </div>
          <div class="training-stats">
            <span class="stat-label">Participantes: ${contatosComTreinamento.length}</span>
          </div>
        </div>
        <div class="training-actions">
          <button class="btn-primary" onclick="visualizarContatosTreinamento(${treinamento.id})">
            Ver Contatos
          </button>
          <button class="btn-info" onclick="abrirDetalhesTreinamento(${treinamento.id})">
            Detalhes / Editar
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

  // Dados do formulário (exceto arquivos)
  const nome = document.getElementById('novoTreinamento').value.trim();
  const modalidade = document.getElementById('modalidadeTreinamento').value;
  const cargaHoraria = parseInt(document.getElementById('cargaHoraria').value);
  const tipo = document.getElementById('tipoTreinamento').value;
  const emConformidade = document.getElementById('emConformidade').value.trim();
  const aproveitamento = document.getElementById('aproveitamentoConteudo').value.trim();
  const conteudo = document.getElementById('conteudoProgramatico').value.trim();
  const instrutor = document.getElementById('nomeInstrutor').value.trim();
  const qualificacaoInstrutor = document.getElementById('qualificacaoInstrutor').value.trim();
  const registroInstrutor = document.getElementById('registroInstrutor').value.trim();
  const responsavel = document.getElementById('responsavelTreinamento').value.trim();
  const cargoResponsavel = document.getElementById('cargoResponsavel').value.trim();
  const areaResponsavel = document.getElementById('areaResponsavel').value;
  const registroResponsavel = document.getElementById('registroResponsavel').value.trim();

  if (!nome || !modalidade || !cargaHoraria || !tipo || !emConformidade || !aproveitamento || !conteudo || !instrutor || !registroInstrutor || !responsavel || !registroResponsavel || !areaResponsavel) {
    mostrarAlerta('Por favor, preencha todos os campos obrigatórios.', 'error');
    return;
  }

  // Pega os arquivos do input
  const arquivos = document.getElementById('midiasTreinamento').files;
  
  // Mostrar arquivos selecionados
  mostrarArquivosSelecionados(arquivos);

  // Validar arquivos se houver
  if (arquivos.length > 0) {
    const tiposPermitidos = ['image/', 'video/', 'audio/', 'application/pdf'];
    const tamanhoMaximo = 20 * 1024 * 1024; // 20MB

    for (let i = 0; i < arquivos.length; i++) {
      const arquivo = arquivos[i];
      
      // Verificar tipo de arquivo
      if (!tiposPermitidos.some(tipo => arquivo.type.startsWith(tipo))) {
        mostrarAlerta(`Arquivo "${arquivo.name}" não é suportado. Tipos permitidos: imagens, vídeos, áudios e PDFs.`, 'error');
        return;
      }
      
      // Verificar tamanho do arquivo
      if (arquivo.size > tamanhoMaximo) {
        mostrarAlerta(`Arquivo "${arquivo.name}" é muito grande. Tamanho máximo: 20MB.`, 'error');
        return;
      }
    }
  }

  const formData = new FormData();
  formData.append('nome', nome);
  formData.append('descricao', conteudo);
  formData.append('modalidade', modalidade);
  formData.append('cargaHoraria', cargaHoraria);
  formData.append('tipo', tipo);
  formData.append('emConformidade', emConformidade);
  formData.append('aproveitamento', aproveitamento);
  formData.append('conteudoProgramatico', conteudo);
  formData.append('instrutor', instrutor);
  formData.append('qualificacaoInstrutor', qualificacaoInstrutor);
  formData.append('registroInstrutor', registroInstrutor);
  formData.append('responsavel', responsavel);
  formData.append('cargoResponsavel', cargoResponsavel);
  formData.append('areaResponsavel', areaResponsavel);
  formData.append('registroResponsavel', registroResponsavel);

  // Adiciona cada arquivo individualmente com o nome correto esperado pelo backend
  for (let i = 0; i < arquivos.length; i++) {
    formData.append('midias', arquivos[i]);
  }

  // Mostrar indicador de carregamento
  const submitButton = document.querySelector('#treinamentoForm button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.textContent = 'Criando treinamento...';
  submitButton.disabled = true;

  fetch('http://92.112.178.26:3000/api/treinamentos', {
    method: 'POST',
    body: formData, // Atenção: não colocar headers 'Content-Type' com JSON aqui
  })
    .then(res => {
      if (!res.ok) {
        return res.json().then(errorData => {
          throw new Error(errorData.error || 'Erro desconhecido');
        });
      }
      return res.json();
    })
    .then(data => {
      mostrarAlerta(`Treinamento ${data.treinamento?.nome || 'novo'} criado com sucesso!`);
      document.getElementById('treinamentoForm').reset();
      document.querySelectorAll('#treinamentoForm .error').forEach(campo => {
        campo.classList.remove('error');
      });
      // Limpar dados salvos do sessionStorage
      sessionStorage.removeItem('form_treinamentoForm');
      carregarTreinamentos().then(() => {
        atualizarSelectTreinamento();
        atualizarEstatisticasMapeamento();
        atualizarGraficos();
      });
    })
    .catch(error => {
      console.error('Erro detalhado:', error);
      mostrarAlerta(error.message || 'Erro ao criar treinamento.', 'error');
    })
    .finally(() => {
      // Restaurar botão
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    });
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
        carregarContatos().then(() => {
          atualizarEstatisticasMapeamento();
        });
      });
    })
    .catch(() => mostrarAlerta('Erro ao remover treinamento.', 'error'));
}
// Formata os dados dos treinamentos
const treinamentosSheet = treinamentos.map(treinamento => ({
  ID: treinamento.id,
  Nome: treinamento.nome,
  Descricao: treinamento.descricao,
  Total_Contatos: contatos.filter(c => c.treinamentoId === treinamento.id).length
}));

// Exportar dados em XLS
function exportarDadosXLS() {
  // Mapeia as empresas pelo id para facilitar o lookup
  const mapaEmpresas = Object.fromEntries(empresas.map(e => [e.id, e]));
  const mapaTreinamentos = Object.fromEntries(treinamentos.map(t => [t.id, t]));

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
    const treinamento = mapaTreinamentos[contato.treinamentoId] || {};
    return {
      ID: contato.id,
      Nome: contato.nome,
      Telefone: contato.telefone,
      Email: contato.email,
      CPF: contato.cpf,
      Status_Treinamento: contato.statusTreinamento,
      Treinamento_ID: contato.treinamentoId,
      Treinamento_Nome: treinamento.nome || "Sem treinamento",
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
  const wsTreinamentos = XLSX.utils.json_to_sheet(treinamentosSheet);

  // Adiciona as abas no arquivo
  XLSX.utils.book_append_sheet(wb, wsEmpresas, "Empresas");
  XLSX.utils.book_append_sheet(wb, wsContatos, "Contatos");
  XLSX.utils.book_append_sheet(wb, wsTreinamentos, "Treinamentos");

  // Salva o arquivo XLS com nome baseado na data atual
  XLSX.writeFile(wb, `gestao-treinamentos-${new Date().toISOString().split('T')[0]}.xlsx`);

  mostrarAlerta('Dados exportados com sucesso!', 'success');
}

// Carregar empresas
function carregarEmpresas() {
  const loading = document.getElementById('loadingEmpresas');
  if (loading) loading.style.display = 'block';

  return fetch('http://92.112.178.26:3000/api/empresas')
    .then(res => {
      if (!res.ok) throw new Error('Erro ao carregar empresas');
      return res.json();
    })
    .then(data => {
      console.log('Empresas carregadas:', data);
      let empresasArray = [];
      
      if (Array.isArray(data)) {
        empresasArray = data;
      } else if (data && Array.isArray(data.empresas)) {
        empresasArray = data.empresas;
      } else if (data && data.data && Array.isArray(data.data)) {
        empresasArray = data.data;
      } else {
        console.error('Dados de empresas não são um array:', data);
        empresasArray = [];
      }
      
      empresas = empresasArray.map(e => ({
        ...e,
        id: parseInt(e.id, 10)
      }));

      // Debug: mostrar empresas carregadas
      console.log('Empresas processadas:', empresas.map(e => ({
        id: e.id,
        razao_social: e.razao_social
      })));
    })
    .catch(error => {
      console.error('Erro ao carregar empresas:', error);
      mostrarAlerta('Erro ao carregar empresas.', 'error');
    })
    .finally(() => {
      if (loading) loading.style.display = 'none';
    });
}

// Fechar modais ao clicar fora deles
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

// Aplicar máscara de telefone em tempo real
document.addEventListener('input', function (e) {
  if (e.target.id === 'editarTelefone') {
    let value = e.target.value.replace(/\D/g, '');

    if (value.length <= 11) {
      // Formato nacional: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
      if (value.length === 11) {
        value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      } else if (value.length === 10) {
        value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      }
    } else {
      // Formato internacional: +XX (XX) XXXXX-XXXX
      if (value.length === 13) {
        value = value.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4');
      } else if (value.length === 12) {
        value = value.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 ($2) $3-$4');
      }
    }

    e.target.value = value;
  }
});

// Validação adicional para campos obrigatórios
function validarCamposObrigatorios(form) {
  const camposObrigatorios = form.querySelectorAll('[required]');
  let valido = true;

  camposObrigatorios.forEach(campo => {
    if (!campo.value.trim()) {
      campo.classList.add('error');
      valido = false;
    } else {
      campo.classList.remove('error');
    }
  });

  return valido;
}

// Função para limpar formulários
function limparFormulario(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.reset();
    // Remover classes de erro
    form.querySelectorAll('.error').forEach(campo => {
      campo.classList.remove('error');
    });
  }
}

// Event listeners adicionais para melhorar UX
document.addEventListener('DOMContentLoaded', function () {
  // Adicionar event listener para tecla ESC fechar modais
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const modals = document.querySelectorAll('.modal-overlay');
      modals.forEach(modal => {
        if (modal.style.display === 'block') {
          modal.style.display = 'none';
          if (modal.id === 'modalContatosEmpresa') {
            empresaSelecionada = null;
            contatosEmpresaSelecionada = [];
          }
        }
      });
    }
  });
  // Melhorar responsividade das tabs
  const tabButtons = document.querySelectorAll('.nav-tab');
  tabButtons.forEach(button => {
    button.addEventListener('click', function () {
      // Scroll suave para o topo quando trocar de aba
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
});

// Função para atualizar todas as estatísticas
function atualizarTodasEstatisticas() {
  atualizarEstatisticasMapeamento();
  atualizarEstatisticasEmpresas();
}

// Função de debounce para pesquisa
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Aplicar debounce na pesquisa do modal
const filtrarContatosModalDebounced = debounce(filtrarContatosModal, 300);

// Substituir o evento onkeyup por um event listener com debounce
document.addEventListener('DOMContentLoaded', function () {
  const searchInputModal = document.getElementById('searchInputModal');
  if (searchInputModal) {
    searchInputModal.removeAttribute('onkeyup');
    searchInputModal.addEventListener('input', filtrarContatosModalDebounced);
  }
});

// Função para logging de debug (pode ser desabilitada em produção)
function debugLog(message, data = null) {
  if (console && console.log) {
    if (data) {
      console.log(`[DEBUG] ${message}`, data);
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }
}

// Interceptar erros não tratados
window.addEventListener('error', function (e) {
  if (e.error) {
    console.error('Erro não tratado:', e.error);
    mostrarAlerta('Ocorreu um erro inesperado. Tente recarregar a página.', 'error');
  }
});

// Função para verificar conectividade com a API
function verificarConectividadeAPI() {
  return fetch('http://92.112.178.26:3000/api/health', {
    method: 'GET',
    timeout: 5000
  })
    .then(response => response.ok)
    .catch(() => false);
}

// Inicializar verificação de conectividade periodicamente
setInterval(function () {
  verificarConectividadeAPI().then(isConnected => {
    if (!isConnected) {
      mostrarAlerta('Problemas de conectividade detectados. Algumas funcionalidades podem estar indisponíveis.', 'error');
    }
  });
}, 60000); // Verificar a cada minuto

// Adicionar funcionalidades de cadastro que estavam faltando

// Formulário de cadastro de empresa
document.getElementById('empresaForm')?.addEventListener('submit', function (e) {
  e.preventDefault();

  const razaoSocial = document.getElementById('novaEmpresa').value.trim();
  const cnpj = document.getElementById('cnpjEmpresa').value.trim();
  const email = document.getElementById('emailEmpresa').value.trim();
  const telefone = document.getElementById('telefoneEmpresa').value.trim();
  const endereco = document.getElementById('enderecoEmpresa').value.trim();
  const cep = document.getElementById('cepEmpresa').value.trim();
  const porte = document.getElementById('porteEmpresa').value;

  if (!razaoSocial) {
    mostrarAlerta('Por favor, preencha a razão social.', 'error');
    return;
  }

  if (cnpj && !validarCNPJ(cnpj)) {
    mostrarAlerta('CNPJ inválido.', 'error');
    return;
  }

  if (email && !validarEmail(email)) {
    mostrarAlerta('Email inválido.', 'error');
    return;
  }

  const novaEmpresa = {
    razao_social: razaoSocial,
    cnpj: cnpj || null,
    email: email || null,
    contato: telefone || null,
    endereco: endereco || null,
    cep: cep || null,
    porte_empresa: porte || null
  };

  fetch('http://92.112.178.26:3000/api/empresas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(novaEmpresa)
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(data => {
      mostrarAlerta(`Empresa ${data.razao_social} cadastrada com sucesso!`);
      document.getElementById('empresaForm').reset();
      carregarEmpresas().then(() => {
        atualizarSelectEmpresa();
        atualizarEstatisticasMapeamento();
        if (document.getElementById('empresas').classList.contains('active')) {
          renderizarEmpresas();
          atualizarEstatisticasEmpresas();
        }
      });
    })
    .catch(() => mostrarAlerta('Erro ao cadastrar empresa.', 'error'));
});

// Formulário de cadastro de contato
document.getElementById('contatoForm')?.addEventListener('submit', function (e) {
  e.preventDefault();

  const nome = document.getElementById('novoContato').value.trim();
  const telefone = document.getElementById('telefoneContato').value.trim();
  const email = document.getElementById('emailContato').value.trim();
  const cpf = document.getElementById('cpfContato').value.trim();
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

  if (email && !validarEmail(email)) {
    mostrarAlerta('Email inválido.', 'error');
    return;
  }

  if (cpf && !validarCPF(cpf)) {
    mostrarAlerta('CPF inválido.', 'error');
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
    email: email || null,
    cpf: cpf || null,
    empresaId: parseInt(empresaId),
    treinamentoId: treinamentoId ? parseInt(treinamentoId) : null,
    statusTreinamento: treinamentoId ? 'ativo' : 'sem_treinamento'
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
      document.getElementById('contatoForm').reset();
      carregarContatos().then(() => {
        atualizarEstatisticasMapeamento();
        if (document.getElementById('empresas').classList.contains('active')) {
          renderizarEmpresas();
          atualizarEstatisticasEmpresas();
        }
      });
    })
    .catch(() => mostrarAlerta('Erro ao cadastrar contato.', 'error'));
});

// Funções de validação
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validarCNPJ(cnpj) {
  const cleaned = cnpj.replace(/\D/g, '');

  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false; // Todos os dígitos iguais

  let soma = 0;
  let resto;

  // Validação do primeiro dígito verificador
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cleaned.charAt(i)) * pesos1[i];
  }

  resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;

  if (parseInt(cleaned.charAt(12)) !== digito1) return false;

  // Validação do segundo dígito verificador
  soma = 0;
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cleaned.charAt(i)) * pesos2[i];
  }

  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;

  return parseInt(cleaned.charAt(13)) === digito2;
}

function validarCPF(cpf) {
  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false; // Todos os dígitos iguais

  let soma = 0;
  let resto;

  // Validação do primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleaned.substring(9, 10))) return false;

  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;

  return resto === parseInt(cleaned.substring(10, 11));
}

// Aplicar máscaras em tempo real nos formulários
document.addEventListener('input', function (e) {
  // Máscara de telefone
  if (e.target.matches('#telefoneContato, #telefoneEmpresa')) {
    aplicarMascaraTelefone(e.target);
  }

  // Máscara de CNPJ
  if (e.target.id === 'cnpjEmpresa') {
    aplicarMascaraCNPJ(e.target);
  }

  // Máscara de CPF
  if (e.target.id === 'cpfContato') {
    aplicarMascaraCPF(e.target);
  }

  // Máscara de CEP
  if (e.target.id === 'cepEmpresa') {
    aplicarMascaraCEP(e.target);
  }
});

function aplicarMascaraTelefone(input) {
  let value = input.value.replace(/\D/g, '');

  if (value.length <= 11) {
    if (value.length === 11) {
      value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length === 10) {
      value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
  } else {
    if (value.length === 13) {
      value = value.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4');
    } else if (value.length === 12) {
      value = value.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 ($2) $3-$4');
    }
  }

  input.value = value;
}

function aplicarMascaraCNPJ(input) {
  let value = input.value.replace(/\D/g, '');
  value = value.replace(/^(\d{2})(\d)/, '$1.$2');
  value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
  value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
  value = value.replace(/(\d{4})(\d)/, '$1-$2');
  input.value = value;
}

function aplicarMascaraCPF(input) {
  let value = input.value.replace(/\D/g, '');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  input.value = value;
}

function aplicarMascaraCEP(input) {
  let value = input.value.replace(/\D/g, '');
  value = value.replace(/^(\d{5})(\d)/, '$1-$2');
  input.value = value;
}

// Buscar CEP automaticamente
document.getElementById('cepEmpresa')?.addEventListener('blur', function (e) {
  const cep = e.target.value.replace(/\D/g, '');

  if (cep.length === 8) {
    buscarCEP(cep);
  }
});

function buscarCEP(cep) {
  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(response => response.json())
    .then(data => {
      if (!data.erro) {
        const enderecoInput = document.getElementById('enderecoEmpresa');
        if (enderecoInput && !enderecoInput.value) {
          enderecoInput.value = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
        }
      }
    })
    .catch(error => {
      console.error('Erro ao buscar CEP:', error);
    });
}

// Funcionalidade de pesquisa global
function implementarPesquisaGlobal() {
  const searchInput = document.getElementById('searchGlobal');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(function (e) {
      const termo = e.target.value.toLowerCase().trim();

      if (termo.length >= 2) {
        pesquisarGlobal(termo);
      } else {
        limparResultadosPesquisa();
      }
    }, 300));
  }
}

function pesquisarGlobal(termo) {
  const resultados = {
    contatos: contatos.filter(c =>
      c.nome.toLowerCase().includes(termo) ||
      c.telefone.includes(termo) ||
      c.email?.toLowerCase().includes(termo)
    ),
    empresas: empresas.filter(e =>
      e.razao_social.toLowerCase().includes(termo) ||
      e.cnpj?.includes(termo) ||
      e.email?.toLowerCase().includes(termo)
    ),
    treinamentos: treinamentos.filter(t =>
      t.nome.toLowerCase().includes(termo) ||
      t.descricao?.toLowerCase().includes(termo)
    )
  };

  exibirResultadosPesquisa(resultados);
}

function exibirResultadosPesquisa(resultados) {
  const container = document.getElementById('resultadosPesquisa');
  if (!container) return;

  let html = '';

  if (resultados.contatos.length > 0) {
    html += `<h4>Contatos (${resultados.contatos.length})</h4>`;
    html += '<div class="search-results-section">';
    resultados.contatos.forEach(contato => {
      const empresa = empresas.find(e => e.id === contato.empresaId);
      html += `
        <div class="search-result-item" onclick="abrirDetalhesContato(${contato.id})">
          <strong>${contato.nome}</strong>
          <p>${formatarTelefone(contato.telefone)} - ${empresa ? empresa.razao_social : 'Empresa não encontrada'}</p>
        </div>
      `;
    });
    html += '</div>';
  }

  if (resultados.empresas.length > 0) {
    html += `<h4>Empresas (${resultados.empresas.length})</h4>`;
    html += '<div class="search-results-section">';
    resultados.empresas.forEach(empresa => {
      html += `
        <div class="search-result-item" onclick="visualizarContatosEmpresa(${empresa.id})">
          <strong>${empresa.razao_social}</strong>
          <p>${empresa.cnpj || 'Sem CNPJ'}</p>
        </div>
      `;
    });
    html += '</div>';
  }

  if (resultados.treinamentos.length > 0) {
    html += `<h4>Treinamentos (${resultados.treinamentos.length})</h4>`;
    html += '<div class="search-results-section">';
    resultados.treinamentos.forEach(treinamento => {
      html += `
        <div class="search-result-item" onclick="visualizarContatosTreinamento(${treinamento.id})">
          <strong>${treinamento.nome}</strong>
          <p>${treinamento.conteudo || 'Sem descrição'}</p>
        </div>
      `;
    });
    html += '</div>';
  }

  if (html === '') {
    html = '<p>Nenhum resultado encontrado.</p>';
  }

  container.innerHTML = html;
  container.style.display = 'block';
}

function limparResultadosPesquisa() {
  const container = document.getElementById('resultadosPesquisa');
  if (container) {
    container.style.display = 'none';
    container.innerHTML = '';
  }
}

// Funcionalidades de filtro e ordenação
function implementarFiltros() {
  // Filtro por status de treinamento
  const filtroStatus = document.getElementById('filtroStatus');
  if (filtroStatus) {
    filtroStatus.addEventListener('change', function (e) {
      const status = e.target.value;
      filtrarPorStatus(status);
    });
  }

  // Filtro por empresa
  const filtroEmpresa = document.getElementById('filtroEmpresa');
  if (filtroEmpresa) {
    filtroEmpresa.addEventListener('change', function (e) {
      const empresaId = e.target.value;
      filtrarPorEmpresa(empresaId);
    });
  }

  // Ordenação
  const ordenacao = document.getElementById('ordenacao');
  if (ordenacao) {
    ordenacao.addEventListener('change', function (e) {
      const criterio = e.target.value;
      ordenarResultados(criterio);
    });
  }
}

function filtrarPorStatus(status) {
  let contatosFiltrados = contatos;

  if (status === 'com_treinamento') {
    contatosFiltrados = contatos.filter(c => c.treinamentoId);
  } else if (status === 'sem_treinamento') {
    contatosFiltrados = contatos.filter(c => !c.treinamentoId);
  }

  // Atualizar visualização baseada na aba atual
  if (document.getElementById('empresas').classList.contains('active')) {
    renderizarEmpresasComFiltro(contatosFiltrados);
  }
}

function filtrarPorEmpresa(empresaId) {
  if (!empresaId) {
    renderizarEmpresas();
    return;
  }

  const contatosFiltrados = contatos.filter(c => c.empresaId === parseInt(empresaId));
  renderizarEmpresasComFiltro(contatosFiltrados);
}

function renderizarEmpresasComFiltro(contatosFiltrados) {
  const empresasComContatos = empresas.filter(empresa =>
    contatosFiltrados.some(c => c.empresaId === empresa.id)
  );

  const empresasGrid = document.getElementById('empresasGrid');

  if (empresasComContatos.length === 0) {
    empresasGrid.innerHTML = `
      <div class="empty-state">
        <h3>Nenhuma empresa encontrada</h3>
        <p>Nenhuma empresa corresponde aos filtros aplicados.</p>
      </div>
    `;
    return;
  }

  // Renderizar empresas filtradas (usar mesma lógica da função original)
  empresasGrid.innerHTML = empresasComContatos.map(empresa => {
    const contatosEmpresa = contatosFiltrados.filter(c => c.empresaId === empresa.id);
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

// Inicializar funcionalidades adicionais
document.addEventListener('DOMContentLoaded', function () {
  implementarPesquisaGlobal();
  implementarFiltros();

  // Melhorar acessibilidade
  implementarNavegacaoTeclado();

  // Auto-save de formulários
  implementarAutoSave();

  // Notificações de sistema
  verificarNotificacoes();
});

function implementarNavegacaoTeclado() {
  document.addEventListener('keydown', function (e) {
    // Ctrl + 1, 2, 3 para alternar entre abas
    if (e.ctrlKey && e.key >= '1' && e.key <= '3') {
      e.preventDefault();
      const tabs = ['mapeamento', 'empresas', 'treinamentos'];
      const tabIndex = parseInt(e.key) - 1;
      if (tabs[tabIndex]) {
        showTab(tabs[tabIndex]);
      }
    }

    // Enter para submeter formulários
    if (e.key === 'Enter' && e.target.matches('input:not([type="submit"])')) {
      const form = e.target.closest('form');
      if (form) {
        e.preventDefault();
        form.requestSubmit();
      }
    }
  });
}

function implementarAutoSave() {
  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    // Pular auto-save para formulário de treinamento
    if (form.id === 'treinamentoForm') return;
    const inputs = form.querySelectorAll('input, select, textarea');

    // Restaurar dados ao carregar a página
    const savedData = sessionStorage.getItem(`form_${form.id}`);
    if (savedData) {
      try {
        const data = JSON.parse(savedData);

        Object.entries(data).forEach(([name, value]) => {
          const input = form.querySelector(`[name="${name}"]`);
          
          // ❗ Ignorar campos do tipo file na restauração
          if (input && input.type !== 'file') {
            input.value = value;
          }
        });
      } catch (e) {
        console.error('Erro ao restaurar dados do formulário:', e);
      }
    }

    // Salvar dados ao alterar qualquer campo
    inputs.forEach(input => {
      // ❗ Ignorar campos file na escuta também
      if (input.type === 'file') return;

      input.addEventListener('change', function () {
        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
          const campo = form.querySelector(`[name="${key}"]`);
          // ❗ Ignorar campos file no salvamento
          if (campo && campo.type !== 'file') {
            data[key] = value;
          }
        }

        sessionStorage.setItem(`form_${form.id}`, JSON.stringify(data));
      });
    });
  });
}


function verificarNotificacoes() {
  // Verificar contatos sem treinamento há muito tempo
  const contatosSemTreinamento = contatos.filter(c => !c.treinamentoId);
  if (contatosSemTreinamento.length > 0) {
    // Mostrar notificação discreta
    setTimeout(() => {
      const notification = document.createElement('div');
      notification.className = 'notification warning';
      notification.innerHTML = `
        <p><strong>Atenção:</strong> ${contatosSemTreinamento.length} contatos estão sem treinamento.</p>
        <button onclick="this.parentElement.remove()">×</button>
      `;
      document.body.appendChild(notification);

      // Auto-remover após 10 segundos
      setTimeout(() => notification.remove(), 10000);
    }, 3000);
  }
}

// Funcionalidade de backup e restore
function exportarBackup() {
  const backup = {
    contatos,
    empresas,
    treinamentos,
    timestamp: new Date().toISOString(),
    version: '1.0'
  };

  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `backup-gestao-treinamentos-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  mostrarAlerta('Backup exportado com sucesso!', 'success');
}

function importarBackup(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const backup = JSON.parse(e.target.result);

      if (!backup.version || !backup.timestamp) {
        throw new Error('Arquivo de backup inválido');
      }

      if (confirm('Tem certeza que deseja importar este backup? Todos os dados atuais serão substituídos.')) {
        // Aqui você implementaria a lógica para restaurar os dados
        // Por segurança, seria melhor fazer isso através da API
        mostrarAlerta('Funcionalidade de importação em desenvolvimento.', 'info');
      }
    } catch (error) {
      console.error('Erro ao importar backup:', error);
      mostrarAlerta('Erro ao importar backup. Arquivo inválido.', 'error');
    }
  };
  reader.readAsText(file);
}

function abrirDetalhesTreinamento(treinamentoId) {
  const treinamento = treinamentos.find(t => t.id === treinamentoId);
  if (!treinamento) return;
  document.body.classList.add('modal-open');
  document.getElementById('tituloModalTreinamento').textContent = `Treinamento: ${treinamento.nome}`;
  
  // Parse das mídias existentes
  let midiasExistentes = [];
  try {
    if (treinamento.midias && typeof treinamento.midias === 'string' && treinamento.midias.trim() !== '') {
      midiasExistentes = JSON.parse(treinamento.midias);
    } else if (Array.isArray(treinamento.midias)) {
      midiasExistentes = treinamento.midias;
    }
  } catch (e) {
    console.error('Erro ao parsear mídias:', e);
    midiasExistentes = [];
  }
  
  document.getElementById('conteudoModalTreinamento').innerHTML = `
  <form id="editarTreinamentoForm" class="professional-form">
    <div class="form-row">
      <div class="form-group">
        <label for="editarNomeTreinamento">Nome <span class="required">*</span></label>
        <input type="text" id="editarNomeTreinamento" class="form-control" value="${treinamento.nome}" required />
      </div>
      <div class="form-group">
        <label for="editarModalidadeTreinamento">Modalidade <span class="required">*</span></label>
        <input type="text" id="editarModalidadeTreinamento" class="form-control" value="${treinamento.modalidade || ''}" required />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="editarCargaHoraria">Carga Horária <span class="required">*</span></label>
        <input type="number" id="editarCargaHoraria" class="form-control" value="${treinamento.cargaHoraria || ''}" required />
      </div>
      <div class="form-group">
        <label for="editarTipoTreinamento">Tipo <span class="required">*</span></label>
        <input type="text" id="editarTipoTreinamento" class="form-control" value="${treinamento.tipo || ''}" required />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="editarInstrutor">Instrutor</label>
        <input type="text" id="editarInstrutor" class="form-control" value="${treinamento.instrutor || ''}" />
      </div>
      <div class="form-group">
        <label for="editarQualificacaoInstrutor">Qualificação Instrutor</label>
        <input type="text" id="editarQualificacaoInstrutor" class="form-control" value="${treinamento.qualificacaoInstrutor || ''}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="editarRegistroInstrutor">Registro do Instrutor</label>
        <input type="text" id="editarRegistroInstrutor" class="form-control" value="${treinamento.registroInstrutor || ''}" />
      </div>
      <div class="form-group">
        <label for="editarResponsavel">Responsável</label>
        <input type="text" id="editarResponsavel" class="form-control" value="${treinamento.responsavel || ''}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="editarCargoResponsavel">Cargo Responsável</label>
        <input type="text" id="editarCargoResponsavel" class="form-control" value="${treinamento.cargoResponsavel || ''}" />
      </div>
      <div class="form-group">
        <label for="editarAreaResponsavel">Área Responsável</label>
        <input type="text" id="editarAreaResponsavel" class="form-control" value="${treinamento.areaResponsavel || ''}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="editarEmConformidade">Em Conformidade</label>
        <input type="text" id="editarEmConformidade" class="form-control" value="${treinamento.emConformidade || ''}" />
      </div>
      <div class="form-group">
        <label for="editarAproveitamento">Aproveitamento</label>
        <input type="text" id="editarAproveitamento" class="form-control" value="${treinamento.aproveitamento || ''}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex: 1 1 100%;">
        <label for="editarConteudoTreinamento">Conteúdo Programático</label>
        <textarea id="editarConteudoTreinamento" rows="4" class="form-control">${treinamento.conteudoProgramatico || treinamento.conteudo || ''}</textarea>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="editarRegistroResponsavel">Registro do Responsável</label>
        <input type="text" id="editarRegistroResponsavel" class="form-control" value="${treinamento.registroResponsavel || ''}" />
      </div>
    </div>
    
    <!-- Seção de Mídias -->
    <div class="form-section">
      <h4>Mídias do Treinamento</h4>
      <div id="midiasExistentes">
        ${midiasExistentes.length > 0 ? `
          <div class="midias-grid">
            ${midiasExistentes.map(midia => `
              <div class="midia-item">
                <div class="midia-preview">
                  ${getMidiaPreview(midia)}
                </div>
                <div class="midia-info">
                  <span class="midia-nome">${midia}</span>
                  <button type="button" class="btn-error btn-small" onclick="removerMidia('${midia}', ${treinamentoId})">Remover</button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p>Nenhuma mídia anexada</p>'}
      </div>
      
      <div class="form-group">
        <label for="novasMidias">Adicionar Novas Mídias</label>
        <input type="file" id="novasMidias" multiple accept="image/*,video/*,audio/*,application/pdf" class="form-control" />
        <small>Tipos permitidos: imagens, vídeos, áudios e PDFs (máx. 20MB cada)</small>
      </div>
    </div>
    
    <div class="form-actions">
      <button type="button" class="btn-secondary" onclick="fecharModalDetalhesTreinamento()">Cancelar</button>
      <button type="submit" class="btn-primary">Salvar Alterações</button>
    </div>
  </form>
`;

  document.getElementById('editarTreinamentoForm').onsubmit = function (e) {
    e.preventDefault();
    
    const novasMidias = document.getElementById('novasMidias').files;
    const formData = new FormData();
    
    // Adicionar dados do formulário
    formData.append('nome', document.getElementById('editarNomeTreinamento').value);
    formData.append('modalidade', document.getElementById('editarModalidadeTreinamento').value);
    formData.append('cargaHoraria', document.getElementById('editarCargaHoraria').value);
    formData.append('tipo', document.getElementById('editarTipoTreinamento').value);
    formData.append('instrutor', document.getElementById('editarInstrutor').value);
    formData.append('qualificacaoInstrutor', document.getElementById('editarQualificacaoInstrutor').value);
    formData.append('registroInstrutor', document.getElementById('editarRegistroInstrutor').value);
    formData.append('responsavel', document.getElementById('editarResponsavel').value);
    formData.append('cargoResponsavel', document.getElementById('editarCargoResponsavel').value);
    formData.append('areaResponsavel', document.getElementById('editarAreaResponsavel').value);
    formData.append('registroResponsavel', document.getElementById('editarRegistroResponsavel').value);
    formData.append('emConformidade', document.getElementById('editarEmConformidade').value);
    formData.append('aproveitamento', document.getElementById('editarAproveitamento').value);
    formData.append('conteudoProgramatico', document.getElementById('editarConteudoTreinamento').value);
    
    // Adicionar novas mídias se houver
    for (let i = 0; i < novasMidias.length; i++) {
      formData.append('midias', novasMidias[i]);
    }

    fetch(`http://92.112.178.26:3000/api/treinamentos/${treinamentoId}`, {
      method: 'PUT',
      body: formData
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => {
        mostrarAlerta('Treinamento atualizado com sucesso!');
        fecharModalDetalhesTreinamento();
        carregarTreinamentos().then(() => {
          atualizarSelectTreinamento();
          atualizarEstatisticasMapeamento();
        });
      })
      .catch(() => mostrarAlerta('Erro ao atualizar treinamento.', 'error'));
  };

  document.getElementById('modalDetalhesTreinamento').style.display = 'block';
}

function fecharModalDetalhesTreinamento() {
  document.body.classList.remove('modal-open');
  document.getElementById('modalDetalhesTreinamento').style.display = 'none';
}

// Função para gerar preview de mídia
function getMidiaPreview(nomeArquivo) {
  const extensao = nomeArquivo.split('.').pop().toLowerCase();
  const caminho = `/media/treinamentos/${nomeArquivo}`;
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extensao)) {
    return `<img src="${caminho}" alt="${nomeArquivo}" style="max-width: 100px; max-height: 100px; object-fit: cover; cursor: pointer;" onclick="downloadMidia('${nomeArquivo}')" />`;
  } else if (['mp4', 'avi', 'mov', 'webm'].includes(extensao)) {
    return `<video controls style="max-width: 100px; max-height: 100px;"><source src="${caminho}" type="video/${extensao}"></video>`;
  } else if (['mp3', 'wav', 'ogg'].includes(extensao)) {
    return `<audio controls style="width: 100px;"><source src="${caminho}" type="audio/${extensao}"></audio>`;
  } else if (extensao === 'pdf') {
    return `<div style="width: 100px; height: 100px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border: 1px solid #ddd; cursor: pointer;" onclick="downloadMidia('${nomeArquivo}')"><span>📄 PDF</span></div>`;
  }
  return `<div style="width: 100px; height: 100px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border: 1px solid #ddd; cursor: pointer;" onclick="downloadMidia('${nomeArquivo}')"><span>📁</span></div>`;
}

function downloadMidia(nomeArquivo) {
  const link = document.createElement('a');
  link.href = `/media/treinamentos/${nomeArquivo}`;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Função para remover mídia
function removerMidia(nomeArquivo, treinamentoId) {
  if (!confirm(`Tem certeza que deseja remover a mídia "${nomeArquivo}"?`)) return;
  
  fetch(`http://92.112.178.26:3000/api/treinamentos/${treinamentoId}/midia/${nomeArquivo}`, {
    method: 'DELETE'
  })
  .then(res => {
    if (!res.ok) throw new Error();
    mostrarAlerta('Mídia removida com sucesso!');
    // Reabrir o modal para atualizar a lista
    abrirDetalhesTreinamento(treinamentoId);
  })
  .catch(() => mostrarAlerta('Erro ao remover mídia.', 'error'));
}

// Performance monitoring
function monitorarPerformance() {
  const start = performance.now();

  return function (operacao) {
    const end = performance.now();
    const tempo = end - start;

    if (tempo > 1000) {
      console.warn(`Operação lenta detectada: ${operacao} levou ${tempo.toFixed(2)}ms`);
    }

    return tempo;
  };
}

// Cache simples para melhorar performance
const cache = {
  data: new Map(),
  set(key, value, ttl = 300000) { // TTL padrão: 5 minutos
    this.data.set(key, {
      value,
      expires: Date.now() + ttl
    });
  },
  get(key) {
    const item = this.data.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.data.delete(key);
      return null;
    }

    return item.value;
  },
  clear() {
    this.data.clear();
  }
};

// Otimizar carregamento de dados com cache
const carregarDadosComCache = {
  async contatos() {
    const cached = cache.get('contatos');
    if (cached) return cached;

    const dados = await carregarContatos();
    cache.set('contatos', dados);
    return dados;
  },

  async empresas() {
    const cached = cache.get('empresas');
    if (cached) return cached;

    const dados = await carregarEmpresas();
    cache.set('empresas', dados);
    return dados;
  },

  async treinamentos() {
    const cached = cache.get('treinamentos');
    if (cached) return cached;

    const dados = await carregarTreinamentos();
    cache.set('treinamentos', dados);
    return dados;
  }
};

// Função para mostrar arquivos selecionados
function mostrarArquivosSelecionados(arquivos) {
  const container = document.getElementById('selectedFiles');
  if (arquivos.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'block';
  container.innerHTML = `
    <h5>Arquivos Selecionados (${arquivos.length}):</h5>
    ${Array.from(arquivos).map((arquivo, index) => `
      <div class="file-item">
        <div class="file-info">
          <span class="file-icon">${getFileIcon(arquivo.type)}</span>
          <span class="file-name">${arquivo.name}</span>
          <span class="file-size">(${formatFileSize(arquivo.size)})</span>
        </div>
      </div>
    `).join('')}
  `;
}

function getFileIcon(mimeType) {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎧';
  if (mimeType === 'application/pdf') return '📄';
  return '📁';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Event listeners para drag and drop
document.addEventListener('DOMContentLoaded', function() {
  const uploadArea = document.querySelector('.file-upload-area');
  const fileInput = document.getElementById('midiasTreinamento');
  
  if (uploadArea && fileInput) {
    uploadArea.addEventListener('dragover', function(e) {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      fileInput.files = files;
      mostrarArquivosSelecionados(files);
    });
    
    fileInput.addEventListener('change', function() {
      mostrarArquivosSelecionados(this.files);
    });
  }
});

// Gráfico de Empresas com dados da API
let graficoEmpresasInstance = null;

async function criarGraficoEmpresas() {
  if (typeof Chart === 'undefined') return;
  
  const ctx = document.getElementById('graficoEmpresas');
  if (!ctx) return;
  
  if (graficoEmpresasInstance) {
    graficoEmpresasInstance.destroy();
  }
  
  try {
    const response = await fetch('http://92.112.178.26:3000/api/dashboard/empresas-contatos');
    const dadosEmpresas = await response.json();
    
    if (dadosEmpresas.length === 0) {
      ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
      return;
    }
    
    const labels = dadosEmpresas.map(e => e.razao_social.length > 20 ? e.razao_social.substring(0, 20) + '...' : e.razao_social);
    const valores = dadosEmpresas.map(e => parseInt(e.totalContatos));
    const valoresComTreinamento = dadosEmpresas.map(e => parseInt(e.contatosComTreinamento));
    
    graficoEmpresasInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total de Contatos',
          data: valores,
          backgroundColor: 'rgba(15, 76, 92, 0.8)',
          borderColor: 'rgba(15, 76, 92, 1)',
          borderWidth: 2,
          borderRadius: 4
        }, {
          label: 'Com Treinamento',
          data: valoresComTreinamento,
          backgroundColor: 'rgba(110, 198, 202, 0.8)',
          borderColor: 'rgba(110, 198, 202, 1)',
          borderWidth: 2,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const empresa = dadosEmpresas[context.dataIndex];
                const taxa = empresa.totalContatos > 0 ? 
                  Math.round((empresa.contatosComTreinamento / empresa.totalContatos) * 100) : 0;
                return `Taxa de treinamento: ${taxa}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            },
            ticks: {
              stepSize: 1
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxRotation: 45
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Erro ao carregar dados do gráfico de empresas:', error);
  }
}

// Gráfico de Modalidades com dados da API
let graficoModalidadesInstance = null;

async function criarGraficoModalidades() {
  if (typeof Chart === 'undefined') return;
  
  const ctx = document.getElementById('graficoModalidades');
  if (!ctx) return;
  
  if (graficoModalidadesInstance) {
    graficoModalidadesInstance.destroy();
  }
  
  try {
    const response = await fetch('http://92.112.178.26:3000/api/dashboard/modalidades');
    const modalidades = await response.json();
    
    if (modalidades.length === 0) {
      ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
      return;
    }
    
    const labels = modalidades.map(m => m.modalidade);
    const dados = modalidades.map(m => parseInt(m.total));
    
    const cores = [
      'rgba(15, 76, 92, 0.8)',
      'rgba(110, 198, 202, 0.8)',
      'rgba(230, 165, 0, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(139, 92, 246, 0.8)'
    ];
    
    graficoModalidadesInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dados,
          backgroundColor: cores.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = dados.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Erro ao carregar dados do gráfico de modalidades:', error);
  }
}

// Gráfico de Evolução com dados da API
let graficoEvolucaoInstance = null;

async function criarGraficoEvolucao() {
  if (typeof Chart === 'undefined') return;
  
  const ctx = document.getElementById('graficoEvolucao');
  if (!ctx) return;
  
  if (graficoEvolucaoInstance) {
    graficoEvolucaoInstance.destroy();
  }
  
  try {
    const response = await fetch('http://92.112.178.26:3000/api/dashboard/evolucao-mensal');
    const dados = await response.json();
    
    // Processar dados para o gráfico
    const mesesMap = new Map();
    
    // Adicionar dados de contatos
    dados.contatos.forEach(item => {
      const mesFormatado = formatarMes(item.mes);
      if (!mesesMap.has(mesFormatado)) {
        mesesMap.set(mesFormatado, { contatos: 0, treinamentos: 0 });
      }
      mesesMap.get(mesFormatado).contatos = parseInt(item.total);
    });
    
    // Adicionar dados de treinamentos
    dados.treinamentos.forEach(item => {
      const mesFormatado = formatarMes(item.mes);
      if (!mesesMap.has(mesFormatado)) {
        mesesMap.set(mesFormatado, { contatos: 0, treinamentos: 0 });
      }
      mesesMap.get(mesFormatado).treinamentos = parseInt(item.total);
    });
    
    // Converter para arrays ordenados
    const mesesOrdenados = Array.from(mesesMap.keys()).sort();
    const contatosData = mesesOrdenados.map(mes => mesesMap.get(mes).contatos);
    const treinamentosData = mesesOrdenados.map(mes => mesesMap.get(mes).treinamentos);
    
    graficoEvolucaoInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: mesesOrdenados,
        datasets: [{
          label: 'Novos Contatos',
          data: contatosData,
          borderColor: 'rgba(15, 76, 92, 1)',
          backgroundColor: 'rgba(15, 76, 92, 0.1)',
          tension: 0.4,
          fill: true
        }, {
          label: 'Novos Treinamentos',
          data: treinamentosData,
          borderColor: 'rgba(110, 198, 202, 1)',
          backgroundColor: 'rgba(110, 198, 202, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            },
            ticks: {
              stepSize: 1
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: 'white',
            bodyColor: 'white'
          }
        }
      }
    });
  } catch (error) {
    console.error('Erro ao carregar dados do gráfico de evolução:', error);
  }
}

// Função auxiliar para formatar mês
function formatarMes(mesAno) {
  const [ano, mes] = mesAno.split('-');
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${meses[parseInt(mes) - 1]} ${ano.slice(-2)}`;
}

// Atualizar todos os gráficos com dados da API
async function atualizarGraficos() {
  try {
    // Mostrar indicador de carregamento
    mostrarCarregandoGraficos(true);
    
    // Atualizar todos os gráficos em paralelo
    await Promise.all([
      criarGraficoEmpresas(),
      criarGraficoStatus(),
      criarGraficoModalidades(),
      criarGraficoEvolucao()
    ]);
    
    // Ocultar indicador de carregamento
    mostrarCarregandoGraficos(false);
    
  } catch (error) {
    console.error('Erro ao atualizar gráficos:', error);
    mostrarCarregandoGraficos(false);
  }
}

// Função para mostrar/ocultar indicador de carregamento dos gráficos
function mostrarCarregandoGraficos(mostrar) {
  const graficos = ['graficoEmpresas', 'graficoStatus', 'graficoModalidades', 'graficoEvolucao'];
  
  graficos.forEach(id => {
    const canvas = document.getElementById(id);
    if (canvas) {
      const container = canvas.parentElement;
      let loader = container.querySelector('.chart-loader');
      
      if (mostrar) {
        if (!loader) {
          loader = document.createElement('div');
          loader.className = 'chart-loader';
          loader.innerHTML = '<div class="loading-spinner"></div><p>Carregando dados...</p>';
          loader.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 10;
          `;
          container.style.position = 'relative';
          container.appendChild(loader);
        }
        canvas.style.opacity = '0.3';
      } else {
        if (loader) {
          loader.remove();
        }
        canvas.style.opacity = '1';
      }
    }
  });
}

// Funções para gerenciar treinamentos das empresas
function abrirModalTreinamentosEmpresa(empresaId) {
  const empresa = empresas.find(e => e.id === empresaId);
  if (!empresa) return;

  document.getElementById('modalTituloTreinamentosEmpresa').textContent = `Treinamentos - ${empresa.razao_social || empresa.razaoSocial || 'Empresa'}`;
  
  // Carregar treinamentos disponíveis e da empresa
  Promise.all([
    fetch(`http://92.112.178.26:3000/api/empresas/${empresaId}/treinamentos/disponiveis`).then(r => r.json()),
    fetch(`http://92.112.178.26:3000/api/empresas/${empresaId}/treinamentos/atribuidos`).then(r => r.json())
  ])
  .then(([treinamentosDisponiveis, treinamentosEmpresa]) => {
    
    document.getElementById('conteudoTreinamentosEmpresa').innerHTML = `
      <div class="treinamentos-empresa-container">
        <div class="treinamentos-disponiveis">
          <h4>Treinamentos Disponíveis</h4>
          <div class="treinamentos-list">
            ${treinamentosDisponiveis.map(t => `
              <div class="treinamento-item">
                <div class="treinamento-info">
                  <strong>${t.nome}</strong>
                  <p>${t.modalidade} - ${t.cargaHoraria}h</p>
                </div>
                <button class="btn-primary btn-small" onclick="atribuirTreinamento(${empresaId}, ${t.id})">
                  Atribuir
                </button>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="treinamentos-atribuidos">
          <h4>Treinamentos Atribuídos</h4>
          <div class="treinamentos-list">
            ${treinamentosEmpresa.length > 0 ? treinamentosEmpresa.map(t => `
              <div class="treinamento-item">
                <div class="treinamento-info">
                  <strong>${t.nome}</strong>
                  <p>${t.modalidade} - ${t.cargaHoraria}h</p>
                </div>
                <button class="btn-error btn-small" onclick="removerTreinamentoEmpresa(${empresaId}, ${t.id})">
                  Remover
                </button>
              </div>
            `).join('') : '<p>Nenhum treinamento atribuído</p>'}
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('modalTreinamentosEmpresa').style.display = 'block';
  })
  .catch(error => {
    console.error('Erro ao carregar treinamentos:', error);
    mostrarAlerta('Erro ao carregar treinamentos da empresa.', 'error');
  });
}

function atribuirTreinamento(empresaId, treinamentoId) {
  fetch(`http://92.112.178.26:3000/api/empresas/${empresaId}/treinamentos/${treinamentoId}`, {
    method: 'POST'
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(() => {
      mostrarAlerta('Treinamento atribuído com sucesso!');
      abrirModalTreinamentosEmpresa(empresaId);
    })
    .catch(() => mostrarAlerta('Erro ao atribuir treinamento.', 'error'));
}

function removerTreinamentoEmpresa(empresaId, treinamentoId) {
  if (!confirm('Tem certeza que deseja remover este treinamento da empresa?')) return;
  
  fetch(`http://92.112.178.26:3000/api/empresas/${empresaId}/treinamentos/${treinamentoId}`, {
    method: 'DELETE'
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(() => {
      mostrarAlerta('Treinamento removido da empresa!');
      abrirModalTreinamentosEmpresa(empresaId);
    })
    .catch(() => mostrarAlerta('Erro ao remover treinamento.', 'error'));
}

function fecharModalTreinamentosEmpresa() {
  document.getElementById('modalTreinamentosEmpresa').style.display = 'none';
}

// Função para abrir detalhes da empresa
function abrirDetalhesEmpresa(empresaId) {
  const empresa = empresas.find(e => e.id === empresaId);
  if (!empresa) return;

  document.getElementById('modalTituloDetalhesEmpresa').textContent = `Detalhes - ${empresa.razao_social || empresa.razaoSocial || 'Empresa'}`;
  
  // Carregar dados completos da empresa
  fetch(`http://92.112.178.26:3000/api/empresas/${empresaId}/completo`)
    .then(r => r.json())
    .then(empresaCompleta => {
      const treinamentosEmpresa = empresaCompleta.treinamentos || [];
      const contatosEmpresa = empresaCompleta.contatos || [];
      
      document.getElementById('conteudoDetalhesEmpresa').innerHTML = `
        <div class="empresa-detalhes">
          <form id="editarEmpresaForm" class="professional-form">
            <div class="form-section">
              <h4>Dados da Empresa</h4>
              <div class="form-row">
                <div class="form-group">
                  <label>Razão Social</label>
                  <input type="text" id="editRazaoSocial" value="${empresa.razao_social || empresa.razaoSocial || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>CNPJ</label>
                  <input type="text" id="editCnpj" value="${empresa.cnpj || ''}" class="form-control" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" id="editEmail" value="${empresa.email || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Telefone</label>
                  <input type="text" id="editTelefone" value="${empresa.contato || ''}" class="form-control" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Endereço</label>
                  <input type="text" id="editEndereco" value="${empresa.endereco || ''}" class="form-control" />
                </div>
                <div class="form-group">
                  <label>CEP</label>
                  <input type="text" id="editCep" value="${empresa.cep || ''}" class="form-control" />
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn-primary" onclick="salvarEmpresa(${empresaId})">
                  Salvar Alterações
                </button>
              </div>
            </div>
          </form>
          
          <div class="form-section">
            <h4>Treinamentos Atribuídos (${treinamentosEmpresa.length})</h4>
            <div class="treinamentos-atribuidos">
              ${treinamentosEmpresa.length > 0 ? treinamentosEmpresa.map(t => `
                <div class="treinamento-item">
                  <div class="treinamento-info">
                    <strong>${t.nome}</strong>
                    <p>${t.modalidade} - ${t.cargaHoraria}h</p>
                  </div>
                  <button class="btn-error btn-small" onclick="removerTreinamentoEmpresa(${empresaId}, ${t.id})">
                    Remover
                  </button>
                </div>
              `).join('') : '<p>Nenhum treinamento atribuído</p>'}
            </div>
            <button class="btn-secondary" onclick="fecharModalDetalhesEmpresa(); abrirModalTreinamentosEmpresa(${empresaId})">
              Gerenciar Treinamentos
            </button>
          </div>
          

        </div>
      `;
      
      document.getElementById('modalDetalhesEmpresa').style.display = 'block';
    })
    .catch(error => {
      console.error('Erro ao carregar detalhes:', error);
      mostrarAlerta('Erro ao carregar detalhes da empresa.', 'error');
    });
}

function salvarEmpresa(empresaId) {
  const dados = {
    razaoSocial: document.getElementById('editRazaoSocial').value,
    cnpj: document.getElementById('editCnpj').value,
    email: document.getElementById('editEmail').value,
    contato: document.getElementById('editTelefone').value,
    endereco: document.getElementById('editEndereco').value,
    cep: document.getElementById('editCep').value
  };
  
  fetch(`http://92.112.178.26:3000/api/empresas/${empresaId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  })
  .then(res => {
    if (!res.ok) throw new Error();
    return res.json();
  })
  .then(() => {
    mostrarAlerta('Empresa atualizada com sucesso!');
    fecharModalDetalhesEmpresa();
    carregarEmpresas().then(() => renderizarEmpresas());
  })
  .catch(() => mostrarAlerta('Erro ao atualizar empresa.', 'error'));
}

function fecharModalDetalhesEmpresa() {
  document.getElementById('modalDetalhesEmpresa').style.display = 'none';
}