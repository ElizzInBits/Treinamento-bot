// Sistema de notificações simplificado
function mostrarModalInstrucoes(titulo, tipo) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
    background: rgba(0,0,0,0.8); z-index: 10000; display: flex; 
    align-items: center; justify-content: center;
  `;
  
  let conteudo = '';
  if (tipo === 'bloqueado') {
    conteudo = `
      <h3>🔒 Notificações Bloqueadas</h3>
      <p>Para ativar as notificações, siga os passos:</p>
      <div style="text-align: left; margin: 20px 0;">
        <h4>🔧 Chrome/Edge:</h4>
        <ol>
          <li>Clique no ícone de <strong>cadeado</strong> na barra de endereço</li>
          <li>Altere "Notificações" para <strong>"Permitir"</strong></li>
          <li>Recarregue a página</li>
        </ol>
        <h4>🦊 Firefox:</h4>
        <ol>
          <li>Clique no ícone de <strong>escudo</strong> na barra de endereço</li>
          <li>Desative o bloqueio de notificações</li>
          <li>Recarregue a página</li>
        </ol>
      </div>
    `;
  } else if (tipo === 'negado') {
    conteudo = `
      <h3>❌ Permissão Negada</h3>
      <p>Você negou a permissão para notificações.</p>
      <p>Para ativar, clique em <strong>"Permitir"</strong> quando o navegador solicitar.</p>
    `;
  } else {
    conteudo = `
      <h3>⚠️ ${titulo}</h3>
      <p>Seu navegador não suporta notificações web.</p>
    `;
  }
  
  modal.innerHTML = `
    <div style="
      background: white; padding: 30px; border-radius: 15px; 
      max-width: 500px; width: 90%; text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    ">
      ${conteudo}
      <button onclick="this.closest('div').remove()" style="
        background: #0f4c5c; color: white; border: none; 
        padding: 10px 20px; border-radius: 5px; cursor: pointer;
        margin-top: 20px;
      ">Entendi</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// Função para testar notificações
async function testarNotificacoes() {
  if (!('Notification' in window)) {
    mostrarModalInstrucoes('Seu navegador não suporta notificações.', 'erro');
    return;
  }
  
  if (Notification.permission === 'denied') {
    mostrarModalInstrucoes('Notificações foram bloqueadas pelo navegador.', 'bloqueado');
    return;
  }
  
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      mostrarModalInstrucoes('Permissão negada.', 'negado');
      return;
    }
  }
  
  try {
    new Notification('🧪 Teste de Notificação', {
      body: 'Se você está vendo isso, as notificações estão funcionando!',
      icon: '/home/Imagens/logo.png'
    });
    alert('✅ Notificação de teste enviada! Verifique se apareceu no canto da tela.');
  } catch (error) {
    alert('❌ Erro ao enviar notificação: ' + error.message);
  }
}