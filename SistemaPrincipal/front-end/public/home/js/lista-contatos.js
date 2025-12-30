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
      <button class="btn-transferir" onclick="transferirEmpresa(${contato.id}, '${contato.nome}')">
        🔀 Transferir
      </button>
    </td>
  `;
  tbody.appendChild(tr);
}

// Função para transferir funcionário entre empresas
async function transferirEmpresa(id, nome) {
  try {
    // Carregar lista de empresas
    const response = await fetch('/api/empresas/select/options');
    const empresas = await response.json();
    
    if (!empresas || empresas.length === 0) {
      alert('Nenhuma empresa disponível para transferência.');
      return;
    }
    
    // Criar select com empresas
    let options = empresas.map(emp => 
      `<option value="${emp.id}">${emp.razao_social}</option>`
    ).join('');
    
    const novaEmpresaId = prompt(
      `Transferir ${nome} para qual empresa?\n\nDigite o ID da empresa:\n\n` +
      empresas.map(e => `${e.id} - ${e.razao_social}`).join('\n')
    );
    
    if (!novaEmpresaId) return;
    
    const empresaSelecionada = empresas.find(e => e.id == novaEmpresaId);
    if (!empresaSelecionada) {
      alert('ID de empresa inválido.');
      return;
    }
    
    if (!confirm(`Confirma transferência de ${nome} para ${empresaSelecionada.razao_social}?`)) {
      return;
    }
    
    const transferResponse = await fetch(`/api/usuarios/${id}/transferir-empresa`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ novaEmpresaId: parseInt(novaEmpresaId) })
    });
    
    const result = await transferResponse.json();
    
    if (transferResponse.ok) {
      alert(`✅ ${nome} transferido com sucesso para ${empresaSelecionada.razao_social}!`);
      location.reload();
    } else {
      alert(`❌ Erro: ${result.error}`);
    }
  } catch (error) {
    console.error('Erro ao transferir funcionário:', error);
    alert('❌ Erro ao transferir funcionário. Tente novamente.');
  }
}

// Função para reiniciar contato individual
async function reiniciarContato(id, nome) {
  if (!confirm(`Tem certeza que deseja reiniciar o treinamento de ${nome}?\n\nIsso irá apagar todo o progresso atual.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/usuarios/${id}/restart-treinamento`, {
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
    const response = await fetch('/api/usuarios/restart-lote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ usuarioIds: ids })
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
  // Carregar usuários iniciais
  fetch("/api/usuarios")
    .then(res => res.json())
    .then(usuarios => {
      usuarios.forEach(usuario => {
        adicionarContatoNaTabela(usuario);
      });
      
      // Configurar eventos após carregar contatos
      configurarEventos();
    })
    .catch(err => {
      console.error("Erro ao buscar usuários:", err);
      alert("Erro ao carregar usuários.");
    });

  // Escutar novos usuários via WebSocket
  socket.on('novoUsuario', (data) => {
    console.log('Novo usuário recebido:', data.usuario);
    adicionarContatoNaTabela(data.usuario);
    configurarEventos();
    
    // Mostrar notificação
    if (Notification.permission === 'granted') {
      new Notification('Novo usuário cadastrado!', {
        body: `${data.usuario.nome} foi cadastrado`,
        icon: '/favicon.ico'
      });
    }
  });

  // Escutar eventos de restart
  socket.on('usuarioReiniciado', (data) => {
    console.log('Usuário reiniciado:', data.usuario.nome);
    if (Notification.permission === 'granted') {
      new Notification('Usuário reiniciado!', {
        body: `${data.usuario.nome} teve o treinamento reiniciado`,
        icon: '/favicon.ico'
      });
    }
  });

  socket.on('usuariosReiniciados', (data) => {
    console.log('Restart em lote concluído:', data);
    if (Notification.permission === 'granted') {
      new Notification('Restart em lote concluído!', {
        body: `${data.sucessos}/${data.total} usuários reiniciados com sucesso`,
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
