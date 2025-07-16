document.getElementById('cadastroEmpresaForm').addEventListener('submit', function (e) {
  e.preventDefault();

  // Capturar os dados do formulário
  const razaoSocial = document.getElementById('razaoSocial').value.trim();
  const cnpj = document.getElementById('cnpj').value.trim();
  const porte = document.getElementById('porte').value;
  const endereco = document.getElementById('endereco').value.trim();
  const cep = document.getElementById('cep').value.trim();
  const contato = document.getElementById('contato').value.trim();

  // Validação básica
  if (!razaoSocial || !cnpj || !porte || !endereco || !cep || !contato) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  // Montar objeto para envio
  const novaEmpresa = {
    razaoSocial,
    cnpj,
    porte,
    endereco,
    cep,
    contato
  };

  // Enviar para a API
  fetch('http://92.112.178.26:3000/api/empresas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(novaEmpresa)
  })
    .then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao cadastrar empresa.');
      }
      return res.json();
    })
    .then(data => {
      alert(`Empresa "${data.razaoSocial}" cadastrada com sucesso!`);
      document.getElementById('cadastroEmpresaForm').reset();
    })
    .catch(error => {
      alert('Erro: ' + error.message);
    });
});
