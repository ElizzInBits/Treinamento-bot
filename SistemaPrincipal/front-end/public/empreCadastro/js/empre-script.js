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

    fetch('http://92.112.178.26:3000/api/empresas', {
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
        alert(`Cadastro feito com sucesso! ID: ${data.id}`);
        document.getElementById('cadastroEmpresaForm').reset();
        ddiSelect.value = '+55';
        contatoInput.placeholder = 'Ex: 11999990000';
      })
      .catch(error => {
        alert('Erro: ' + error.message);
      });
  });
});
