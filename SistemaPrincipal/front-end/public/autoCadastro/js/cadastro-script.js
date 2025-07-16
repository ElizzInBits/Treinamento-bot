document.addEventListener('DOMContentLoaded', () => {
  const empresaSelect = document.getElementById('empresa');

  // 🔽 Carregar empresas do backend e popular o <select>
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
});

document.getElementById('autoCadastroForm').addEventListener('submit', function (e) {
  e.preventDefault();

  // Captura dos dados
  const nomeCompleto = document.getElementById('nomeCompleto').value.trim();
  const cpf = document.getElementById('cpf').value.trim();
  const email = document.getElementById('email').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const empresaId = document.getElementById('empresa').value;

  // Validação simples
  if (!nomeCompleto || !cpf || !email || !telefone || !empresaId) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  // Objeto para envio
const novoUsuario = {
  nome: nomeCompleto,
  cpf,
  email,
  telefone,
  empresa
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
      alert(`Usuário ${data.nome} cadastrado com sucesso!`);
      document.getElementById('autoCadastroForm').reset();
    })
    .catch(error => {
      alert('Erro: ' + error.message);
    });
});
