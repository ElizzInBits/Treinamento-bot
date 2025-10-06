document.addEventListener('DOMContentLoaded', () => {
  const telefoneInput = document.getElementById('telefone');
  const ddiSelect = document.getElementById('ddi');
  const cpfInput = document.getElementById('cpf');
  const cpfError = document.getElementById('cpfError');
  const empresaSelect = document.getElementById('empresaId');
  const nomeInput = document.getElementById('nomeCompleto');

  // 🔤 Converter nome para maiúsculo automaticamente
  nomeInput.addEventListener('input', function(e) {
    const cursorPosition = e.target.selectionStart;
    const upperValue = e.target.value.toUpperCase();
    e.target.value = upperValue;
    e.target.setSelectionRange(cursorPosition, cursorPosition);
  });

  // 🏢 Carregar empresas
  async function carregarEmpresas() {
    try {
      empresaSelect.innerHTML = '<option value="">Carregando empresas...</option>';
      empresaSelect.disabled = true;
      
      const response = await fetch('/api/empresas/select/options');
      const empresas = await response.json();
      
      empresaSelect.innerHTML = '<option value="">Selecione sua empresa</option>';
      
      if (empresas && empresas.length > 0) {
        empresas.forEach(empresa => {
          const option = document.createElement('option');
          option.value = empresa.id;
          option.textContent = empresa.razao_social;
          empresaSelect.appendChild(option);
        });
      } else {
        empresaSelect.innerHTML = '<option value="">Nenhuma empresa encontrada</option>';
      }
      
      empresaSelect.disabled = false;
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      empresaSelect.innerHTML = '<option value="">Erro ao carregar empresas</option>';
      empresaSelect.disabled = false;
    }
  }

  // Carregar empresas ao inicializar
  carregarEmpresas();

  // 🔽 Função para formatar CPF
  function formatarCPF(value) {
    const numbers = value.replace(/\D/g, '');
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
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(numbers)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i);
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (parseInt(numbers[9]) !== digit1) return false;

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

  // 🔽 Função para formatar telefone internacional
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

  // 🔽 Event listener para formatação do telefone
  telefoneInput.addEventListener('input', function(e) {
    const ddiSelecionado = ddiSelect.value;
    let formatted;

    if (ddiSelecionado === '+55') {
      formatted = formatarTelefoneBrasil(e.target.value);
    } else {
      formatted = formatarTelefoneInternacional(e.target.value);
    }

    e.target.value = formatted;
  });

  // 🔽 Event listener para mudança de DDI
  ddiSelect.addEventListener('change', function() {
    telefoneInput.value = '';
    if (this.value === '+55') {
      telefoneInput.placeholder = 'Ex: 31999990000';
    } else {
      telefoneInput.placeholder = 'Ex: 1234567890';
    }
  });

  // 🔽 Submit do formulário
  document.getElementById('autoCadastroForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const nomeCompleto = document.getElementById('nomeCompleto').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const email = document.getElementById('email').value.trim();
    const ddi = document.getElementById('ddi').value;
    const telefone = document.getElementById('telefone').value.trim();
    const empresaId = document.getElementById('empresaId').value;

    if (!nomeCompleto || !cpf || !email || !ddi || !telefone || !empresaId) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (empresaId === '') {
      alert('Por favor, selecione uma empresa.');
      document.getElementById('empresaId').focus();
      return;
    }

    if (!validarCPF(cpf)) {
      alert('Por favor, informe um CPF válido.');
      document.getElementById('cpf').focus();
      return;
    }

    // ✅ Salvar telefone com DDI sem "+" e número só com dígitos
    const telefoneCompleto = `${ddi.replace('+', '')}${telefone.replace(/\D/g, '')}`;

    const novoUsuario = {
      nome: nomeCompleto,
      cpf: cpf.replace(/\D/g, ''),
      email: email,
      telefone: telefoneCompleto,
      empresaId: parseInt(empresaId)
    };

    console.log('📝 Dados sendo enviados:', novoUsuario);

    fetch('/api/contatos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(novoUsuario)
    })
      .then(async (res) => {
        console.log('📝 Status da resposta:', res.status);
        console.log('📝 Headers da resposta:', res.headers);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ Erro do servidor:', errorText);
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            throw new Error(`Erro do servidor (${res.status}): ${errorText}`);
          }
          
          throw new Error(errorData.message || errorData.error || 'Erro ao cadastrar usuário.');
        }
        return res.json();
      })
      .then(data => {
        console.log(`Cadastro feito com sucesso! ID: ${data.id}`);
        document.getElementById('autoCadastroForm').reset();
        document.getElementById('ddi').value = '+55';
        document.getElementById('telefone').placeholder = 'Ex: 31999990000';
        document.getElementById('cpfError').style.display = 'none';
        document.getElementById('cpf').style.borderColor = '';
        document.getElementById('empresaId').value = '';
        try {
          window.location.href = './voltarWhats-index.html';
        } catch (error) {
          console.error('Erro no redirecionamento:', error);
          window.open('./voltarWhats-index.html', '_blank');
        }
      })
      .catch(error => {
        alert('Erro: ' + error.message);
      });
  });
});

