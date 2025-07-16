document.getElementById('cadastroEmpresaForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const razaoSocial = document.getElementById('razaoSocial').value.trim();
  const cnpj = document.getElementById('cnpj').value.trim();
  const porte = document.getElementById('porte').value;
  const endereco = document.getElementById('endereco').value.trim();
  const cep = document.getElementById('cep').value.trim();
  const contato = document.getElementById('contato').value.trim();
  const email = document.getElementById('email').value.trim();

  if (!razaoSocial || !cnpj || !porte || !endereco || !cep || !contato || !email) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  const novaEmpresa = {
    razaoSocial,
    cnpj,
    porte,
    endereco,
    cep,
    contato,
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
  })
  .catch(error => {
    alert('Erro: ' + error.message);
  });
});
