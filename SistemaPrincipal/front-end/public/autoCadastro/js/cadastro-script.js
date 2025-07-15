document.getElementById('autoCadastroForm').addEventListener('submit', function (e) {
  e.preventDefault();

  // Capturar os dados do formulário
  const nomeCompleto = document.getElementById('nomeCompleto').value.trim();
  const cpf = document.getElementById('cpf').value.trim();
  const email = document.getElementById('email').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const empresa = document.getElementById('empresa').value.trim();

  // Validação básica (pode melhorar depois)
  if (!nomeCompleto || !cpf || !email || !telefone || !empresa) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  // Montar objeto para enviar
  const novoUsuario = {
    nomeCompleto,
    cpf,
    email,
    telefone,
    empresa
  };

  // Enviar para API
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
      alert(`Usuário ${data.nomeCompleto} cadastrado com sucesso!`);
      document.getElementById('autoCadastroForm').reset();
    })
    .catch(error => {
      alert('Erro: ' + error.message);
    });
});
