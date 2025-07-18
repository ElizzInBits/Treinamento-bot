document.addEventListener('DOMContentLoaded', () => {
  const empresaSelect = document.getElementById('empresa');
  const telefoneInput = document.getElementById('telefone');
  const ddiSelect = document.getElementById('ddi');
  const cpfInput = document.getElementById('cpf');
  const cpfError = document.getElementById('cpfError');
  
  // 🔽 Carregar empresas do backend e popular o select
  fetch('/api/empresas/select/options')
    .then(res => res.json())
    .then(empresas => {
      empresas.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = emp.razao_social;
        empresaSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Erro ao carregar empresas:', error);
    });

  // 🔽 Função para formatar CPF
  function formatarCPF(value) {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica formatação XXX.XXX.XXX-XX
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.substring(0, 3)}.${numbers.substring(3)}`;
    } else if (numbers.length <= 9) {
      return `${numbers.substring(0, 3)}.${numbers.substring(3, 6)}.${numbers.substring(6)}`;
    } else {
      return `${numbers.substring(0, 3)}.${numbers.substring(3, 6)}.${numbers.substring(6, 9)}-${numbers.substring(9, 11)}`;
    }
  }

  // 🔽 Função para validar CPF
  function validarCPF(cpf) {
    // Remove formatação
    const numbers = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (numbers.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(numbers)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i);
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(numbers[9]) !== digit1) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i);
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    return parseInt(numbers[10]) === digit2;
  }

  // 🔽 Event listener para formatação e validação do CPF
  cpfInput.addEventListener('input', function(e) {
    const formatted = formatarCPF(e.target.value);
    e.target.value = formatted;
    
    // Validação em tempo real (apenas quando tem 11 dígitos)
    const numbers = formatted.replace(/\D/g, '');
    if (numbers.length === 11) {
      if (validarCPF(formatted)) {
        cpfError.style.display = 'none';
        cpfInput.style.borderColor = 'green';
      } else {
        cpfError.textContent = 'CPF inválido';
        cpfError.style.display = 'block';
        cpfInput.style.borderColor = 'red';
      }
    } else {
      cpfError.style.display = 'none';
      cpfInput.style.borderColor = '';
    }
  });

  // 🔽 Event listener para quando o campo perde o foco
  cpfInput.addEventListener('blur', function(e) {
    const numbers = e.target.value.replace(/\D/g, '');
    if (numbers.length > 0 && numbers.length < 11) {
      cpfError.textContent = 'CPF deve conter 11 dígitos';
      cpfError.style.display = 'block';
      cpfInput.style.borderColor = 'red';
    }
  });

  // 🔽 Função para formatar telefone brasileiro
  function formatarTelefoneBrasil(value) {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica formatação brasileira
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.substring(0, 2)} ${numbers.substring(2)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.substring(0, 2)} ${numbers.substring(2, 7)}-${numbers.substring(7)}`;
    } else {
      // Limita a 11 dígitos
      return `${numbers.substring(0, 2)} ${numbers.substring(2, 7)}-${numbers.substring(7, 11)}`;
    }
  }

  // 🔽 Função para formatar telefone internacional (formato genérico)
  function formatarTelefoneInternacional(value) {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Formato genérico: grupos de 3-4 dígitos separados por hífen
    let formatted = '';
    for (let i = 0; i < numbers.length; i++) {
      if (i > 0 && i % 3 === 0 && i < numbers.length - 1) {
        formatted += '-';
      }
      formatted += numbers[i];
    }
    
    return formatted;
  }

  // 🔽 Event listener para formatação automática do telefone
  telefoneInput.addEventListener('input', function(e) {
    const ddiSelecionado = ddiSelect.value;
    let formatted;
    
    if (ddiSelecionado === '+55') {
      // Formatação brasileira
      formatted = formatarTelefoneBrasil(e.target.value);
    } else {
      // Formatação internacional genérica
      formatted = formatarTelefoneInternacional(e.target.value);
    }
    
    e.target.value = formatted;
  });

  // 🔽 Event listener para mudança de DDI
  ddiSelect.addEventListener('change', function() {
    // Limpa o campo telefone quando muda o DDI
    telefoneInput.value = '';
    
    // Atualiza o placeholder conforme o DDI selecionado
    if (this.value === '+55') {
      telefoneInput.placeholder = 'Ex: 31999990000';
    } else {
      telefoneInput.placeholder = 'Ex: 1234567890';
    }
  });
});

// 🔽 Submit do formulário
document.getElementById('autoCadastroForm').addEventListener('submit', function (e) {
  e.preventDefault();

  // Captura dos dados
  const nomeCompleto = document.getElementById('nomeCompleto').value.trim();
  const cpf = document.getElementById('cpf').value.trim();
  const email = document.getElementById('email').value.trim();
  const ddi = document.getElementById('ddi').value;
  const telefone = document.getElementById('telefone').value.trim();
  const empresaId = document.getElementById('empresa').value;

  // Validação simples
  if (!nomeCompleto || !cpf || !email || !ddi || !telefone || !empresaId) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  // Validação específica do CPF
  if (!validarCPF(cpf)) {
    alert('Por favor, informe um CPF válido.');
    document.getElementById('cpf').focus();
    return;
  }

  // Monta o telefone completo com DDI
  const telefoneCompleto = `${ddi} ${telefone}`;

  // Objeto para envio
  const novoUsuario = {
    nome: nomeCompleto,
    cpf: cpf.replace(/\D/g, ''), // Remove formatação do CPF para envio
    email,
    telefone: telefoneCompleto, // Envia o telefone com DDI
    empresaId: parseInt(empresaId, 10)
  };

  // Enviar dados via POST
  fetch('http://92.112.178.26:3000/api/contatos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(novoUsuario)
  })
    .then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao cadastrar usuário.');
      }
      return res.json();
    })
    .then(data => {
      // Em vez de alert, redireciona para a página de sucesso
      console.log(`Cadastro feito com sucesso! ID: ${data.id}`);
      
      // Limpa o formulário
      document.getElementById('autoCadastroForm').reset();
      
      // Restaura o DDI padrão do Brasil
      document.getElementById('ddi').value = '+55';
      document.getElementById('telefone').placeholder = 'Ex: 31999990000';
      
      // Limpa mensagens de erro e estilos
      document.getElementById('cpfError').style.display = 'none';
      document.getElementById('cpf').style.borderColor = '';
      
      // Redireciona para a página voltarWhats-index.html
      try {
        window.location.href = './voltarWhats-index.html';
      } catch (error) {
        console.error('Erro no redirecionamento:', error);
        // Fallback: abre em nova aba
        window.open('./voltarWhats-index.html', '_blank');
      }
    })
    .catch(error => {
      alert('Erro: ' + error.message);
    });
});