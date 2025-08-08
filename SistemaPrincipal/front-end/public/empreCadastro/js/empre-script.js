document.addEventListener('DOMContentLoaded', () => {
  const contatoInput = document.getElementById('contato');
  const ddiSelect = document.getElementById('ddi');

  function formatarTelefoneBrasil(value) {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.substring(0, 2)} ${numbers.substring(2)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.substring(0, 2)} ${numbers.substring(2, 7)}-${numbers.substring(7)}`;
    } else {
      return `${numbers.substring(0, 2)} ${numbers.substring(2, 7)}-${numbers.substring(7, 11)}`;
    }
  }

  function formatarTelefoneInternacional(value) {
    const numbers = value.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < numbers.length; i++) {
      if (i > 0 && i % 3 === 0 && i < numbers.length - 1) {
        formatted += '-';
      }
      formatted += numbers[i];
    }
    return formatted;
  }

  contatoInput.addEventListener('input', function (e) {
    const ddiSelecionado = ddiSelect.value;
    let formatted;

    if (ddiSelecionado === '+55') {
      formatted = formatarTelefoneBrasil(e.target.value);
    } else {
      formatted = formatarTelefoneInternacional(e.target.value);
    }

    e.target.value = formatted;
  });

  ddiSelect.addEventListener('change', function () {
    contatoInput.value = '';
    if (this.value === '+55') {
      contatoInput.placeholder = 'Ex: 11999990000';
    } else {
      contatoInput.placeholder = 'Ex: 1234567890';
    }
  });

  // SUBMIT
  document.getElementById('cadastroEmpresaForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const razaoSocial = document.getElementById('razaoSocial').value.trim();
    const cnpj = document.getElementById('cnpj').value.trim();
    const porte = document.getElementById('porte').value;
    const endereco = document.getElementById('endereco').value.trim();
    const cep = document.getElementById('cep').value.trim();
    const contato = document.getElementById('contato').value.trim();
    const ddi = document.getElementById('ddi').value;
    const email = document.getElementById('email').value.trim();

    if (!razaoSocial || !cnpj || !porte || !endereco || !cep || !contato || !email) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // ✅ Remove símbolos e + do telefone final
    const contatoCompleto = `${ddi.replace('+', '')}${contato.replace(/\D/g, '')}`;

    const novaEmpresa = {
      razaoSocial,
      cnpj,
      porte,
      endereco,
      cep,
      contato: contatoCompleto,
      email
    };

    fetch('http://localhost:3000/api/empresas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaEmpresa)
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Erro ao cadastrar empresa.');
        }
        return res.json();
      })
      .then(data => {
        alert('Cadastro realizado com sucesso!');
        document.getElementById('cadastroEmpresaForm').reset();
        ddiSelect.value = '+55';
        contatoInput.placeholder = 'Ex: 11999990000';
        // Empresa cadastrada com sucesso
      })
      .catch(error => {
        alert('Erro: ' + error.message);
      });
  });

  // Inicialização completa
});

// Variável global para empresa selecionada
let selectedCompanyId = null;



// Função para gerenciar treinamentos de uma empresa
async function manageTrainings(companyId, companyName) {
  selectedCompanyId = companyId;
  
  // Mostrar seção de gerenciamento
  const trainingSection = document.getElementById('trainingSection');
  trainingSection.style.display = 'block';
  
  // Atualizar título
  const title = trainingSection.querySelector('h2');
  title.innerHTML = `<span>🎓</span> Gerenciar Treinamentos - ${companyName}`;
  
  // Carregar treinamentos
  await loadAssignedTrainings(companyId);
  await loadAvailableTrainings(companyId);
  
  // Scroll para a seção
  trainingSection.scrollIntoView({ behavior: 'smooth' });
}

// Função para carregar treinamentos atribuídos
async function loadAssignedTrainings(companyId) {
  try {
    const response = await fetch(`http://localhost:3000/api/empresas/${companyId}/treinamentos/atribuidos`);
    const trainings = await response.json();
    
    const assignedList = document.getElementById('assignedTrainingsList');
    
    if (trainings.length === 0) {
      assignedList.innerHTML = '<div class="loading">Nenhum treinamento atribuído</div>';
      return;
    }
    
    assignedList.innerHTML = trainings.map(training => `
      <div class="training-item">
        <h4>${training.nome}</h4>
        <p><strong>Modalidade:</strong> EAD - Ensino à Distância</p>
        <p><strong>Carga Horária:</strong> 4h</p>
        <div class="training-actions">
          <button class="btn-remove" onclick="removeTraining(${companyId}, ${training.id})">
            ❌ Remover
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erro ao carregar treinamentos atribuídos:', error);
    document.getElementById('assignedTrainingsList').innerHTML = '<div class="loading">Erro ao carregar</div>';
  }
}

// Função para carregar treinamentos disponíveis
async function loadAvailableTrainings(companyId) {
  try {
    const response = await fetch(`http://localhost:3000/api/empresas/${companyId}/treinamentos/disponiveis`);
    const trainings = await response.json();
    
    const availableList = document.getElementById('availableTrainingsList');
    
    if (trainings.length === 0) {
      availableList.innerHTML = '<div class="loading">Todos os treinamentos já foram atribuídos</div>';
      return;
    }
    
    availableList.innerHTML = trainings.map(training => `
      <div class="training-item">
        <h4>${training.nome}</h4>
        <p><strong>Modalidade:</strong> EAD - Ensino à Distância</p>
        <p><strong>Carga Horária:</strong> 4h</p>
        <div class="training-actions">
          <button class="btn-assign" onclick="assignTraining(${companyId}, ${training.id})">
            ➕ Atribuir
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erro ao carregar treinamentos disponíveis:', error);
    document.getElementById('availableTrainingsList').innerHTML = '<div class="loading">Erro ao carregar</div>';
  }
}

// Função para atribuir treinamento
async function assignTraining(companyId, trainingId) {
  try {
    const response = await fetch(`http://localhost:3000/api/empresas/${companyId}/treinamentos/${trainingId}`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    // Recarregar listas
    await loadAssignedTrainings(companyId);
    await loadAvailableTrainings(companyId);
    
    // Feedback visual
    showNotification('Treinamento atribuído com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao atribuir treinamento:', error);
    showNotification('Erro ao atribuir treinamento: ' + error.message, 'error');
  }
}

// Função para remover treinamento
async function removeTraining(companyId, trainingId) {
  if (!confirm('Tem certeza que deseja remover este treinamento?')) {
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:3000/api/empresas/${companyId}/treinamentos/${trainingId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    // Recarregar listas
    await loadAssignedTrainings(companyId);
    await loadAvailableTrainings(companyId);
    
    // Feedback visual
    showNotification('Treinamento removido com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao remover treinamento:', error);
    showNotification('Erro ao remover treinamento: ' + error.message, 'error');
  }
}

// Função para formatar CNPJ
function formatCNPJ(cnpj) {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Função para mostrar notificações
function showNotification(message, type) {
  // Criar elemento de notificação
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Estilos da notificação
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
  `;
  
  // Adicionar ao DOM
  document.body.appendChild(notification);
  
  // Remover após 3 segundos
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Adicionar estilos de animação
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
