// Conectar ao WebSocket
const socket = io();

function adicionarContatoNaTabela(contato) {
  const tbody = document.querySelector("#tabelaContatos tbody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${contato.nome || '-'}</td>
    <td>${contato.telefone || '-'}</td>
    <td>${contato.email || '-'}</td>
    <td>${contato.cpf || '-'}</td>
    <td>${contato.statusTreinamento || '-'}</td>
    <td>${contato.empresaId || '—'}</td>
    <td>${contato.ultimaInteracao || '—'}</td>
  `;
  tbody.appendChild(tr);
}

document.addEventListener("DOMContentLoaded", () => {
  // Carregar contatos iniciais
  fetch("/api/contatos")
    .then(res => res.json())
    .then(contatos => {
      contatos.forEach(contato => {
        adicionarContatoNaTabela(contato);
      });
    })
    .catch(err => {
      console.error("Erro ao buscar contatos:", err);
      alert("Erro ao carregar contatos.");
    });

  // Escutar novos contatos via WebSocket
  socket.on('novoContato', (data) => {
    console.log('Novo contato recebido:', data.contato);
    adicionarContatoNaTabela(data.contato);
    
    // Mostrar notificação
    if (Notification.permission === 'granted') {
      new Notification('Novo contato cadastrado!', {
        body: `${data.contato.nome} foi cadastrado`,
        icon: '/favicon.ico'
      });
    }
  });

  // Solicitar permissão para notificações
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
});
