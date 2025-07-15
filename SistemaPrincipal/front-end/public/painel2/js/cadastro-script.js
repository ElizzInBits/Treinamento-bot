let treinamentos = [];

// Inicializar auto cadastro
document.addEventListener('DOMContentLoaded', function () {
  carregarTreinamentos();

  const form = document.getElementById('autoCadastroForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      cadastrarUsuario();
    });
  }
});

// Carrega treinamentos para o <select>
function carregarTreinamentos() {
  fetch('/api/treinamentos')
    .then(res => res.json())
    .then(data => {
      treinamentos = data;
      preencherSelectTreinamentos();
    })
    .catch(err => {
      console.error('Erro ao carregar treinamentos:', err);
      exibirMensagem('Erro ao carregar opções de treinamento.', 'error');
    });
}

function preencherSelectTreinamentos() {
  const select = document.getElementById('treinamento');
  if (!select) return;

  select.innerHTML = `<option value="">Selecione um treinamento (opcional)</option>`;
  treinamentos.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.nome;
    select.appendChild(opt);
  });
}

// Validação de telefone (reutilizada)
function validarTelefone(telefone) {
  const cleaned = telefone.replace(/\D/g, '');
  return cleaned.length === 12 || cleaned.length === 13;
}

// Exibe alertas
function exibirMensagem(mensagem, tipo = 'success') {
  const msgBox = document.getElementById('mensagem');
  if (!msgBox) return;

  msgBox.className = `alert ${tipo === 'error' ? 'alert-danger' : 'alert-success'}`;
  msgBox.textContent = mensagem;
  msgBox.style.display = 'block';

  setTimeout(() => {
    msgBox.style.display = 'none';
  }, 5000);
}

// Cadastra o usuário
function cadastrarUsuario() {
  const nome = document.getElementById('nome').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const treinamentoId = document.getElementById('treinamento').value;

  if (!nome || !telefone) {
    exibirMensagem('Preencha todos os campos obrigatórios.', 'error');
    return;
  }

  if (!validarTelefone(telefone)) {
    exibirMensagem('Telefone inválido. Use 12 ou 13 dígitos.', 'error');
    return;
  }

  const dados = {
    nome,
    telefone,
    treinamentoId: treinamentoId || null
  };

  fetch('/api/contatos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dados)
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        exibirMensagem(data.error, 'error');
        return;
      }

      exibirMensagem('Cadastro realizado com sucesso!');
      document.getElementById('autoCadastroForm').reset();
    })
    .catch(err => {
      console.error('Erro ao cadastrar:', err);
      exibirMensagem('Erro ao realizar cadastro.', 'error');
    });
}
