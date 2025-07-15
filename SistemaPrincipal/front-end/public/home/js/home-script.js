let contatos = [];
let treinamentos = [];

// Inicializar sistema
document.addEventListener('DOMContentLoaded', function () {
    atualizarSelectTreinamento();
    carregarContatos();
});

// Funções de navegação
function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    document.querySelector(`.tab[onclick="showTab('${tabName}')"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'listar') {
        carregarContatos();
    } else if (tabName === 'treinamentos') {
        carregarTreinamentos();
    }
}

// Formatação de telefone
function formatarTelefone(telefone) {
    const cleaned = telefone.replace(/\D/g, '');
    if (cleaned.length === 13) {
        return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    } else if (cleaned.length === 12) {
        return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    }
    return telefone;
}

// Validar telefone
function validarTelefone(telefone) {
    const cleaned = telefone.replace(/\D/g, '');
    return cleaned.length === 12 || cleaned.length === 13;
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
    const treinamentoId = document.getElementById('treinamento').value;

    if (!nome || !telefone) {
        mostrarAlerta('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }

    if (!validarTelefone(telefone)) {
        mostrarAlerta('Formato de telefone inválido. Use 12 ou 13 dígitos.', 'error');
        return;
    }

    // Verificar se já existe contato com este telefone
    if (contatos.some(c => c.telefone === telefone)) {
        mostrarAlerta('Já existe um contato com este telefone.', 'error');
        return;
    }

    const novoContato = {
        nome: nome,
        telefone: telefone,
        treinamentoId: treinamentoId || null
    };


    fetch('/api/contatos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nome,
            telefone,
            treinamentoId: treinamentoId || null
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                mostrarAlerta(data.error, 'error');
                return;
            }

            // Adiciona ao array local para exibir na interface
            contatos.push(data.contato || data); // depende de como a resposta vem

            mostrarAlerta(`Contato ${nome} cadastrado com sucesso!`);
            document.getElementById('cadastroForm').reset();

            if (document.getElementById('listar').classList.contains('active')) {
                carregarContatos();
            }
        })
        .catch(err => {
            console.error('Erro ao cadastrar:', err);
            mostrarAlerta('Erro ao cadastrar contato no servidor.', 'error');
        });

});

// Atualizar select de treinamentos
function atualizarSelectTreinamento() {
    const select = document.getElementById('treinamento');
    select.innerHTML = '<option value="">Selecione um treinamento (opcional)</option>';

    treinamentos.forEach(treinamento => {
        const option = document.createElement('option');
        option.value = treinamento.id;
        option.textContent = treinamento.nome;
        select.appendChild(option);
    });
}

// Carregar contatos
function carregarContatos() {
    const loading = document.getElementById('loading');
    const contatosLista = document.getElementById('contatosLista');

    loading.classList.add('show');
    contatosLista.innerHTML = '';

    fetch('/api/contatos')
        .then(res => res.json())
        .then(data => {
            contatos = data; // Substitui o array local
            renderizarContatos();
            atualizarEstatisticas();
        })
        .catch(err => {
            console.error('Erro ao carregar contatos:', err);
            mostrarAlerta('Erro ao carregar contatos do servidor.', 'error');
        })
        .finally(() => {
            loading.classList.remove('show');
        });
}


// Renderizar contatos
function renderizarContatos() {
    const contatosLista = document.getElementById('contatosLista');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    const contatosFiltrados = contatos.filter(contato =>
        contato.nome.toLowerCase().includes(searchTerm) ||
        contato.telefone.includes(searchTerm)
    );

    if (contatosFiltrados.length === 0) {
        contatosLista.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <h3>Nenhum contato encontrado</h3>
        <p>Não há contatos cadastrados ou que correspondam à sua pesquisa.</p>
      </div>
    `;
        return;
    }

    contatosLista.innerHTML = contatosFiltrados.map(contato => {
        return `
    <div class="contact-item" onclick="abrirDetalhesContato(${contato.id})">
      <div class="contact-info">
        <h3>${contato.nome}</h3>
        <p><strong>Telefone:</strong> ${formatarTelefone(contato.telefone)}</p>
        <p><strong>Treinamento:</strong> 
          <select onchange="atualizarTreinamentoContato(${contato.id}, this.value)">
            <option value="">Sem treinamento</option>
            ${treinamentos.map(t => `
              <option value="${t.id}" ${t.id === contato.treinamentoId ? 'selected' : ''}>${t.nome}</option>
            `).join('')}
          </select>
        </p>
      </div>
      <div class="contact-actions">
        <button class="btn-danger" onclick="removerContato(${contato.id})">🗑️ Remover</button>
      </div>
    </div>
  `;
    }).join('');

}

// Filtrar contatos
function filtrarContatos() {
    renderizarContatos();
}

// Remover contato
function removerContato(id) {
    if (!confirm('Tem certeza que deseja remover este contato?')) return;

    fetch(`/api/contatos/${id}`, {
        method: 'DELETE'
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                mostrarAlerta(data.error, 'error');
                return;
            }

            // Atualiza lista local
            contatos = contatos.filter(c => c.id !== id);

            renderizarContatos();
            atualizarEstatisticas();
            mostrarAlerta('Contato removido com sucesso!');
        })
        .catch(err => {
            console.error('Erro ao remover contato:', err);
            mostrarAlerta('Erro ao remover contato no servidor.', 'error');
        });
}

function abrirDetalhesContato(id) {
    const contato = contatos.find(c => c.id === id);
    if (!contato) return;

    const treinamento = treinamentos.find(t => t.id === contato.treinamentoId);

    const detalhesHTML = `
        <h4>${contato.nome}</h4>
        <p><strong>Telefone:</strong> ${formatarTelefone(contato.telefone)}</p>
        <p><strong>Treinamento Atual:</strong> ${treinamento ? treinamento.nome : 'Nenhum'}</p>
        <p><strong>Status:</strong> ${treinamento ? 'Em andamento ou concluído' : 'Sem treinamento'}</p>
    `;

    document.getElementById('detalhesContatoConteudo').innerHTML = detalhesHTML;
    document.getElementById('modalDetalhesContato').classList.add('show');
}

function fecharModalDetalhesContato() {
    document.getElementById('modalDetalhesContato').classList.remove('show');
}

// Fechar modal ao clicar fora dele
document.getElementById('modalDetalhesContato').addEventListener('click', function (e) {
    if (e.target === this) {
        fecharModalDetalhesContato();
    }
});




function atualizarEstatisticas() {
    const totalContatos = contatos.length;
    const contatosComTreinamento = contatos.filter(c => c.treinamentoId).length;
    const contatosSemTreinamento = totalContatos - contatosComTreinamento;

    document.getElementById('totalContatos').textContent = totalContatos;
    document.getElementById('contatosComTreinamento').textContent = contatosComTreinamento;
    document.getElementById('contatosSemTreinamento').textContent = contatosSemTreinamento;
}

// Carregar treinamentos
function carregarTreinamentos() {
    const loading = document.getElementById('loadingTreinamentos');
    const treinamentosGrid = document.getElementById('treinamentosGrid');

    loading.classList.add('show');
    treinamentosGrid.innerHTML = '';

    fetch('/api/treinamentos')
        .then(res => res.json())
        .then(data => {
            treinamentos = data; // Preenche com os dados da API
            renderizarTreinamentos();
            atualizarSelectTreinamento();
        })
        .catch(err => {
            console.error('Erro ao carregar treinamentos:', err);
            mostrarAlerta('Erro ao carregar treinamentos do servidor.', 'error');
        })
        .finally(() => {
            loading.classList.remove('show');
        });
}


// Renderizar treinamentos
function renderizarTreinamentos() {
    const treinamentosGrid = document.getElementById('treinamentosGrid');

    if (treinamentos.length === 0) {
        treinamentosGrid.innerHTML = `
      <div class="empty-state">
        <div class="icon">📚</div>
        <h3>Nenhum treinamento cadastrado</h3>
        <p>Crie seu primeiro treinamento usando o formulário acima.</p>
      </div>
    `;
        return;
    }

    treinamentosGrid.innerHTML = treinamentos.map(treinamento => {
        const contatosDoTreinamento = contatos.filter(c => c.treinamentoId === treinamento.id);
        return `
      <div class="training-card">
        <h4>
          <span>🎓</span>
          ${treinamento.nome}
        </h4>
        <div class="description">
          ${treinamento.descricao || 'Sem descrição disponível'}
        </div>
        <div class="contact-count">
          👥 ${contatosDoTreinamento.length} contato(s)
        </div>
        <div class="actions">
          <button class="btn-view" onclick="visualizarContatos(${treinamento.id})">
            👁️ Ver Contatos
          </button>
          <button class="btn-edit" onclick="editarTreinamento(${treinamento.id})">
            ✏️ Editar
          </button>
          <button class="btn-danger" onclick="removerTreinamento(${treinamento.id})">
            🗑️ Remover
          </button>
        </div>
      </div>
    `;
    }).join('');
}

// Criar treinamento
document.getElementById('treinamentoForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const nome = document.getElementById('novoTreinamento').value.trim();
    const descricao = document.getElementById('descricaoTreinamento').value.trim();

    if (!nome) {
        mostrarAlerta('Por favor, informe o nome do treinamento.', 'error');
        return;
    }

    // Verificar se já existe treinamento com este nome
    if (treinamentos.some(t => t.nome.toLowerCase() === nome.toLowerCase())) {
        mostrarAlerta('Já existe um treinamento com este nome.', 'error');
        return;
    }

    const novoTreinamento = {
        nome: nome,
        descricao: descricao
    };

    fetch('/api/treinamentos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(novoTreinamento)
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                mostrarAlerta(data.error, 'error');
                return;
            }

            // Recebe o treinamento criado do backend com id
            treinamentos.push(data.treinamento || data);

            mostrarAlerta(`Treinamento "${nome}" criado com sucesso!`);

            // Limpar formulário
            document.getElementById('treinamentoForm').reset();

            // Atualizar displays
            renderizarTreinamentos();
            atualizarSelectTreinamento();
        })
        .catch(err => {
            console.error('Erro ao criar treinamento:', err);
            mostrarAlerta('Erro ao salvar treinamento no servidor.', 'error');
        });

});

// Visualizar contatos do treinamento
function visualizarContatos(treinamentoId) {
    const treinamento = treinamentos.find(t => t.id === treinamentoId);
    const contatosDoTreinamento = contatos.filter(c => c.treinamentoId === treinamentoId);

    document.getElementById('modalTitulo').textContent = `Contatos - ${treinamento.nome}`;

    const modalConteudo = document.getElementById('modalConteudo');

    if (contatosDoTreinamento.length === 0) {
        modalConteudo.innerHTML = `
      <div class="empty-state">
        <div class="icon">👥</div>
        <h3>Nenhum contato inscrito</h3>
        <p>Este treinamento ainda não possui contatos inscritos.</p>
      </div>
    `;
    } else {
        modalConteudo.innerHTML = `
      <div class="contacts-list">
        ${contatosDoTreinamento.map(contato => `
          <div class="contact-item">
            <div class="contact-info">
              <h3>${contato.nome}</h3>
              <p><strong>Telefone:</strong> ${formatarTelefone(contato.telefone)}</p>
            </div>
            <div class="contact-actions">
              <button class="btn-danger" onclick="removerContatoDoTreinamento(${contato.id})">
                🗑️ Remover
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    }

    document.getElementById('modalContatos').classList.add('show');
}

// Editar treinamento
function editarTreinamento(treinamentoId) {
    const treinamento = treinamentos.find(t => t.id === treinamentoId);

    const novoNome = prompt('Novo nome do treinamento:', treinamento.nome);
    if (novoNome === null) return;

    if (!novoNome.trim()) {
        mostrarAlerta('Nome do treinamento não pode estar vazio.', 'error');
        return;
    }

    const novaDescricao = prompt('Nova descrição do treinamento:', treinamento.descricao || '');
    if (novaDescricao === null) return;

    treinamento.nome = novoNome.trim();
    treinamento.descricao = novaDescricao.trim();

    renderizarTreinamentos();
    atualizarSelectTreinamento();
    mostrarAlerta('Treinamento atualizado com sucesso!');
}

// Remover treinamento
function removerTreinamento(treinamentoId) {
  const treinamento = treinamentos.find(t => t.id === treinamentoId);
  const contatosDoTreinamento = contatos.filter(c => c.treinamentoId === treinamentoId);

  let confirmMessage = `Tem certeza que deseja remover o treinamento "${treinamento.nome}"?`;
  if (contatosDoTreinamento.length > 0) {
    confirmMessage += `\n\nEste treinamento possui ${contatosDoTreinamento.length} contato(s) vinculado(s). Eles serão desvinculados do treinamento.`;
  }

  if (confirm(confirmMessage)) {
    // Enviar requisição DELETE para o backend
    fetch(`/api/treinamentos/${treinamentoId}`, {
      method: 'DELETE',
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        mostrarAlerta(data.error, 'error');
        return;
      }

      // Remover vinculação dos contatos localmente
      contatos.forEach(contato => {
        if (contato.treinamentoId === treinamentoId) {
          contato.treinamentoId = null;
        }
      });

      // Remover do array local treinamentos
      treinamentos.splice(treinamentos.findIndex(t => t.id === treinamentoId), 1);

      renderizarTreinamentos();
      atualizarSelectTreinamento();
      mostrarAlerta('Treinamento removido com sucesso!');

      // Atualizar contatos se estiver na aba de contatos
      if (document.getElementById('listar').classList.contains('active')) {
        renderizarContatos();
      }
    })
    .catch(err => {
      console.error('Erro ao remover treinamento:', err);
      mostrarAlerta('Erro ao remover treinamento no servidor.', 'error');
    });
  }
}


// Remover contato do treinamento (no modal)
function removerContatoDoTreinamento(contatoId) {
    if (confirm('Tem certeza que deseja remover este contato do treinamento?')) {
        const contato = contatos.find(c => c.id === contatoId);
        if (contato) {
            contato.treinamentoId = null;
            mostrarAlerta('Contato removido do treinamento com sucesso!');

            // Fechar modal e atualizar displays
            fecharModal();
            renderizarTreinamentos();

            // Atualizar contatos se estiver na aba de contatos
            if (document.getElementById('listar').classList.contains('active')) {
                renderizarContatos();
                atualizarEstatisticas();
            }
        }
    }
}

// Fechar modal
function fecharModal() {
    document.getElementById('modalContatos').classList.remove('show');
}

// Fechar modal ao clicar fora
document.getElementById('modalContatos').addEventListener('click', function (e) {
    if (e.target === this) {
        fecharModal();
    }
});

// Inicializar sistema quando a página carregar
document.addEventListener('DOMContentLoaded', function () {
    atualizarSelectTreinamento();
    carregarContatos();
    atualizarEstatisticas();
});