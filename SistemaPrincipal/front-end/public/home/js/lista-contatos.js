// Conectar ao WebSocket
const socket = io();

function adicionarContatoNaTabela(contato) {
  const tbody = document.querySelector("#tabelaContatos tbody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="checkbox" class="contato-checkbox" data-id="${contato.id}"></td>
    <td>${contato.nome || '-'}</td>
    <td>${contato.telefone || '-'}</td>
    <td>${contato.email || '-'}</td>
    <td>${contato.cpf || '-'}</td>
    <td><span class="status-${(contato.statusTreinamento || '').replace(/\s+/g, '-')}">${contato.statusTreinamento || '-'}</span></td>
    <td>${contato.nomeEmpresa || '—'}</td>
    <td>${contato.ultimaInteracao || '—'}</td>
    <td>
      <button class="btn-restart" onclick="reiniciarContato(${contato.id}, '${contato.nome}')">
        🔄 Restart
      </button>
    </td>
  `;
  tbody.appendChild(tr);
}

// Função para reiniciar contato individual
async function reiniciarContato(id, nome) {
  if (!confirm(`Tem certeza que deseja reiniciar o treinamento de ${nome}?\n\nIsso irá apagar todo o progresso atual.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/contatos/${id}/restart-treinamento`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (response.ok) {
      alert(`✅ Treinamento de ${nome} reiniciado com sucesso!`);
      location.reload(); // Recarregar a página para atualizar os dados
    } else {
      alert(`❌ Erro: ${result.error}`);
    }
  } catch (error) {
    console.error('Erro ao reiniciar contato:', error);
    alert('❌ Erro ao reiniciar contato. Tente novamente.');
  }
}

// Função para reiniciar contatos em lote
async function reiniciarSelecionados() {
  const checkboxes = document.querySelectorAll('.contato-checkbox:checked');
  const ids = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));

  if (ids.length === 0) {
    alert('Selecione pelo menos um contato para reiniciar.');
    return;
  }

  if (!confirm(`Tem certeza que deseja reiniciar ${ids.length} contato(s)?\n\nIsso irá apagar todo o progresso atual dos contatos selecionados.`)) {
    return;
  }

  try {
    const response = await fetch('/api/contatos/restart-lote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ contatoIds: ids })
    });

    const result = await response.json();

    if (response.ok) {
      alert(`✅ Restart concluído!\n\nSucessos: ${result.sucessos}\nErros: ${result.erros}\nTotal: ${result.total}`);
      location.reload();
    } else {
      alert(`❌ Erro: ${result.error}`);
    }
  } catch (error) {
    console.error('Erro no restart em lote:', error);
    alert('❌ Erro no restart em lote. Tente novamente.');
  }
}

// Função para atualizar contador de selecionados
function atualizarContador() {
  const checkboxes = document.querySelectorAll('.contato-checkbox:checked');
  const contador = document.getElementById('contadorSelecionados');
  const btnRestart = document.getElementById('btnRestartSelecionados');
  
  contador.textContent = `${checkboxes.length} selecionados`;
  btnRestart.disabled = checkboxes.length === 0;
}

document.addEventListener("DOMContentLoaded", () => {
  // Carregar contatos iniciais
  fetch("/api/contatos")
    .then(res => res.json())
    .then(contatos => {
      contatos.forEach(contato => {
        adicionarContatoNaTabela(contato);
      });
      
      // Configurar eventos após carregar contatos
      configurarEventos();
    })
    .catch(err => {
      console.error("Erro ao buscar contatos:", err);
      alert("Erro ao carregar contatos.");
    });

  // Escutar novos contatos via WebSocket
  socket.on('novoContato', (data) => {
    console.log('Novo contato recebido:', data.contato);
    adicionarContatoNaTabela(data.contato);
    configurarEventos();
    
    // Mostrar notificação
    if (Notification.permission === 'granted') {
      new Notification('Novo contato cadastrado!', {
        body: `${data.contato.nome} foi cadastrado`,
        icon: '/favicon.ico'
      });
    }
  });

  // Escutar eventos de restart
  socket.on('contatoReiniciado', (data) => {
    console.log('Contato reiniciado:', data.contato.nome);
    if (Notification.permission === 'granted') {
      new Notification('Contato reiniciado!', {
        body: `${data.contato.nome} teve o treinamento reiniciado`,
        icon: '/favicon.ico'
      });
    }
  });

  socket.on('contatosReiniciados', (data) => {
    console.log('Restart em lote concluído:', data);
    if (Notification.permission === 'granted') {
      new Notification('Restart em lote concluído!', {
        body: `${data.sucessos}/${data.total} contatos reiniciados com sucesso`,
        icon: '/favicon.ico'
      });
    }
  });

  // Solicitar permissão para notificações
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
});

// Configurar eventos dos checkboxes e botões
function configurarEventos() {
  // Selecionar/deselecionar todos
  const selectAll = document.getElementById('selectAll');
  if (selectAll) {
    selectAll.addEventListener('change', function() {
      const checkboxes = document.querySelectorAll('.contato-checkbox');
      checkboxes.forEach(cb => cb.checked = this.checked);
      atualizarContador();
    });
  }

  // Atualizar contador quando checkboxes individuais mudam
  const checkboxes = document.querySelectorAll('.contato-checkbox');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', atualizarContador);
  });

  // Botão de restart em lote
  const btnRestart = document.getElementById('btnRestartSelecionados');
  if (btnRestart) {
    btnRestart.addEventListener('click', reiniciarSelecionados);
  }

  atualizarContador();
}
