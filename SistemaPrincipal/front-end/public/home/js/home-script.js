 let contatos = [];
      let treinamentos = [];
      let contatoIdCounter = 1;
      let treinamentoIdCounter = 1;

      // Inicializar sistema
      document.addEventListener('DOMContentLoaded', function () {
          atualizarSelectTreinamento();
          carregarContatos();
          carregarTreinamentos();
      });

      // Funções de navegação
      function showTab(tabName) {
          const tabs = document.querySelectorAll('.nav-tab');
          const contents = document.querySelectorAll('.tab-content');

          tabs.forEach(tab => tab.classList.remove('active'));
          contents.forEach(content => content.classList.remove('active'));

          document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
          document.getElementById(tabName).classList.add('active');

          if (tabName === 'listar') {
              renderizarContatos();
              atualizarEstatisticas();
          } else if (tabName === 'treinamentos') {
              renderizarTreinamentos();
          }
      }

      // Formatação de telefone
      function formatarTelefone(telefone) {
          const cleaned = telefone.replace(/\D/g, '');
          if (cleaned.length === 13) {
              return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
          } else if (cleaned.length === 12) {
              return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
          }
          return telefone;
      }

      // Validar telefone
      function validarTelefone(telefone) {
          const cleaned = telefone.replace(/\D/g, '');
          return cleaned.length === 12 || cleaned.length === 13;
      }

      // Funções de alerta
      function mostrarAlerta(mensagem, tipo = 'success') {
          const alertsContainer = document.getElementById('alerts');
          const alertDiv = document.createElement('div');
          alertDiv.className = `alert alert-${tipo}`;
          alertDiv.innerHTML = `
        <strong>${tipo === 'success' ? 'Sucesso!' : 'Erro!'}</strong> ${mensagem}
      `;

          alertsContainer.appendChild(alertDiv);

          setTimeout(() => {
              alertDiv.remove();
          }, 5000);
      }

      // Cadastrar contato
      document.getElementById('cadastroForm').addEventListener('submit', function (e) {
          e.preventDefault();

          const nome = document.getElementById('nome').value.trim();
          const telefone = document.getElementById('telefone').value.trim();
          const treinamentoId = document.getElementById('treinamento').value;

          if (!nome || !telefone) {
              mostrarAlerta('Por favor, preencha todos os campos obrigatórios.', 'error');
              return;
          }

          if (!validarTelefone(telefone)) {
              mostrarAlerta('Formato de telefone inválido. Use 12 ou 13 dígitos.', 'error');
              return;
          }

          // Verificar se já existe contato com este telefone
          if (contatos.some(c => c.telefone === telefone)) {
              mostrarAlerta('Já existe um contato com este telefone.', 'error');
              return;
          }

          const novoContato = {
              id: contatoIdCounter++,
              nome: nome,
              telefone: telefone,
              treinamentoId: treinamentoId ? parseInt(treinamentoId) : null
          };

          contatos.push(novoContato);
          mostrarAlerta(`Contato ${nome} cadastrado com sucesso!`);
          document.getElementById('cadastroForm').reset();

          if (document.getElementById('listar').classList.contains('active')) {
              renderizarContatos();
              atualizarEstatisticas();
          }
      });

      // Atualizar select de treinamentos
      function atualizarSelectTreinamento() {
          const selects = [
              document.getElementById('treinamento'),
              document.getElementById('editarTreinamento')
          ];

          selects.forEach(select => {
              if (select) {
                  const currentValue = select.value;
                  select.innerHTML = '<option value="">Selecione um treinamento</option>';

                  treinamentos.forEach(treinamento => {
                      const option = document.createElement('option');
                      option.value = treinamento.id;
                      option.textContent = treinamento.nome;
                      select.appendChild(option);
                  });

                  if (currentValue) select.value = currentValue;
              }
          });
      }

      // Carregar contatos
      function carregarContatos() {
          const loading = document.getElementById('loading');
          if (loading) loading.style.display = 'block';

          setTimeout(() => {
              renderizarContatos();
              atualizarEstatisticas();
              if (loading) loading.style.display = 'none';
          }, 500);
      }

      // Renderizar contatos
      function renderizarContatos() {
          const contatosLista = document.getElementById('contatosLista');
          const searchInput = document.getElementById('searchInput');
          const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

          const contatosFiltrados = contatos.filter(contato =>
              contato.nome.toLowerCase().includes(searchTerm) ||
              contato.telefone.includes(searchTerm)
          );

          if (contatosFiltrados.length === 0) {
              contatosLista.innerHTML = `
            <div class="empty-state">
              <h3>Nenhum contato encontrado</h3>
              <p>Não há contatos cadastrados ou que correspondam à sua pesquisa.</p>
            </div>
          `;
              return;
          }

          contatosLista.innerHTML = contatosFiltrados.map(contato => {
              const treinamento = treinamentos.find(t => t.id === contato.treinamentoId);
              return `
            <div class="contact-item">
              <div class="contact-info">
                <h3>${contato.nome}</h3>
                <p><strong>Telefone:</strong> ${formatarTelefone(contato.telefone)}</p>
                <p><strong>Treinamento:</strong> ${treinamento ? treinamento.nome : 'Sem treinamento'}</p>
              </div>
              <div class="contact-actions">
                <button onclick="abrirDetalhesContato(${contato.id})">Ver Detalhes</button>
                <button onclick="atualizarTreinamentoContato(${contato.id})">Alterar Treinamento</button>
                <button onclick="removerContato(${contato.id})">Remover</button>
              </div>
            </div>
          `;
          }).join('');
      }

      // Filtrar contatos
      function filtrarContatos() {
          renderizarContatos();
      }

      // Atualizar treinamento do contato
      function atualizarTreinamentoContato(contatoId) {
          const contato = contatos.find(c => c.id === contatoId);
          if (!contato) return;

          const novoTreinamentoId = prompt('Selecione o ID do treinamento (ou deixe vazio para remover):');
          if (novoTreinamentoId === null) return;

          const treinamentoIdInt = novoTreinamentoId.trim() ? parseInt(novoTreinamentoId.trim()) : null;

          if (treinamentoIdInt && !treinamentos.find(t => t.id === treinamentoIdInt)) {
              mostrarAlerta('Treinamento não encontrado.', 'error');
              return;
          }

          contato.treinamentoId = treinamentoIdInt;
          mostrarAlerta('Treinamento atualizado com sucesso!');
          renderizarContatos();
          atualizarEstatisticas();
      }

      // Remover contato
      function removerContato(id) {
          if (!confirm('Tem certeza que deseja remover este contato?')) return;

          const index = contatos.findIndex(c => c.id === id);
          if (index !== -1) {
              contatos.splice(index, 1);
              renderizarContatos();
              atualizarEstatisticas();
              mostrarAlerta('Contato removido com sucesso!');
          }
      }

      // Detalhes do contato
      function abrirDetalhesContato(id) {
          const contato = contatos.find(c => c.id === id);
          if (!contato) return;

          const treinamento = treinamentos.find(t => t.id === contato.treinamentoId);

          const detalhesHTML = `
              <h4>${contato.nome}</h4>
              <p><strong>Telefone:</strong> ${formatarTelefone(contato.telefone)}</p>
              <p><strong>Treinamento Atual:</strong> ${treinamento ? treinamento.nome : 'Nenhum'}</p>
              <p><strong>Status:</strong> ${treinamento ? 'Com treinamento' : 'Sem treinamento'}</p>
          `;

          document.getElementById('detalhesContatoConteudo').innerHTML = detalhesHTML;
          document.getElementById('modalDetalhesContato').style.display = 'block';
      }

      function fecharModalDetalhesContato() {
          document.getElementById('modalDetalhesContato').style.display = 'none';
      }

      // Atualizar estatísticas
      function atualizarEstatisticas() {
          const totalContatos = contatos.length;
          const contatosComTreinamento = contatos.filter(c => c.treinamentoId).length;
          const contatosSemTreinamento = totalContatos - contatosComTreinamento;

          document.getElementById('totalContatos').textContent = totalContatos;
          document.getElementById('contatosComTreinamento').textContent = contatosComTreinamento;
          document.getElementById('contatosSemTreinamento').textContent = contatosSemTreinamento;
      }

      // Carregar treinamentos
      function carregarTreinamentos() {
          const loading = document.getElementById('loadingTreinamentos');
          if (loading) loading.style.display = 'block';

          setTimeout(() => {
              renderizarTreinamentos();
              atualizarSelectTreinamento();
              if (loading) loading.style.display = 'none';
          }, 500);
      }

      // Renderizar treinamentos
      function renderizarTreinamentos() {
          const treinamentosGrid = document.getElementById('treinamentosGrid');

          if (treinamentos.length === 0) {
              treinamentosGrid.innerHTML = `
            <div class="empty-state">
              <h3>Nenhum treinamento cadastrado</h3>
              <p>Crie seu primeiro treinamento usando o formulário acima.</p>
            </div>
          `;
              return;
          }

          treinamentosGrid.innerHTML = treinamentos.map(treinamento => {
              const contatosDoTreinamento = contatos.filter(c => c.treinamentoId === treinamento.id);
              return `
            <div class="training-card">
              <h4>${treinamento.nome}</h4>
              <div class="description">
                ${treinamento.descricao || 'Sem descrição disponível'}
              </div>
              <div class="contact-count">
                👥 ${contatosDoTreinamento.length} contato(s)
              </div>
              <div class="actions">
                <button onclick="visualizarContatos(${treinamento.id})">Ver Contatos</button>
                <button onclick="editarTreinamento(${treinamento.id})">Editar</button>
                <button onclick="removerTreinamento(${treinamento.id})">Remover</button>
              </div>
            </div>
          `;
          }).join('');
      }

      // Criar treinamento
      document.getElementById('treinamentoForm').addEventListener('submit', function (e) {
          e.preventDefault();

          const nome = document.getElementById('novoTreinamento').value.trim();
          const descricao = document.getElementById('descricaoTreinamento').value.trim();

          if (!nome) {
              mostrarAlerta('Por favor, informe o nome do treinamento.', 'error');
              return;
          }

          // Verificar se já existe treinamento com este nome
          if (treinamentos.some(t => t.nome.toLowerCase() === nome.toLowerCase())) {
              mostrarAlerta('Já existe um treinamento com este nome.', 'error');
              return;
          }

          const novoTreinamento = {
              id: treinamentoIdCounter++,
              nome: nome,
              descricao: descricao
          };

          treinamentos.push(novoTreinamento);
          mostrarAlerta(`Treinamento "${nome}" criado com sucesso!`);

          // Limpar formulário
          document.getElementById('treinamentoForm').reset();

          // Atualizar displays
          renderizarTreinamentos();
          atualizarSelectTreinamento();
      });

      // Visualizar contatos do treinamento
      function visualizarContatos(treinamentoId) {
          const treinamento = treinamentos.find(t => t.id === treinamentoId);
          const contatosDoTreinamento = contatos.filter(c => c.treinamentoId === treinamentoId);

          document.getElementById('modalTitulo').textContent = `Contatos - ${treinamento.nome}`;

          const modalConteudo = document.getElementById('modalConteudo');

          if (contatosDoTreinamento.length === 0) {
              modalConteudo.innerHTML = `
            <div class="empty-state">
              <h3>Nenhum contato inscrito</h3>
              <p>Este treinamento ainda não possui contatos inscritos.</p>
            </div>
          `;
          } else {
              modalConteudo.innerHTML = `
            <div class="contacts-list">
              ${contatosDoTreinamento.map(contato => `
                <div class="contact-item">
                  <div class="contact-info">
                    <h3>${contato.nome}</h3>
                    <p><strong>Telefone:</strong> ${formatarTelefone(contato.telefone)}</p>
                  </div>
                  <div class="contact-actions">
                    <button onclick="removerContatoDoTreinamento(${contato.id})">Remover</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
          }

          document.getElementById('modalContatos').style.display = 'block';
      }

      // Editar treinamento
      function editarTreinamento(treinamentoId) {
          const treinamento = treinamentos.find(t => t.id === treinamentoId);

          const novoNome = prompt('Novo nome do treinamento:', treinamento.nome);
          if (novoNome === null) return;

          if (!novoNome.trim()) {
              mostrarAlerta('Nome do treinamento não pode estar vazio.', 'error');
              return;
          }

          const novaDescricao = prompt('Nova descrição do treinamento:', treinamento.descricao || '');
          if (novaDescricao === null) return;

          treinamento.nome = novoNome.trim();
          treinamento.descricao = novaDescricao.trim();

          renderizarTreinamentos();
          atualizarSelectTreinamento();
          mostrarAlerta('Treinamento atualizado com sucesso!');
      }

      // Remover treinamento
      function removerTreinamento(treinamentoId) {
          const treinamento = treinamentos.find(t => t.id === treinamentoId);
          const contatosDoTreinamento = contatos.filter(c => c.treinamentoId === treinamentoId);

          let confirmMessage = `Tem certeza que deseja remover o treinamento "${treinamento.nome}"?`;
          if (contatosDoTreinamento.length > 0) {
              confirmMessage += `\n\nEste treinamento possui ${contatosDoTreinamento.length} contato(s) vinculado(s). Eles serão desvinculados do treinamento.`;
          }

          if (confirm(confirmMessage)) {
              // Remover vinculação dos contatos
              contatos.forEach(contato => {
                  if (contato.treinamentoId === treinamentoId) {
                      contato.treinamentoId = null;
                  }
              });

              // Remover treinamento
              const index = treinamentos.findIndex(t => t.id === treinamentoId);
              if (index !== -1) {
                  treinamentos.splice(index, 1);
              }

              renderizarTreinamentos();
              atualizarSelectTreinamento();
              mostrarAlerta('Treinamento removido com sucesso!');

              // Atualizar contatos se estiver na aba de contatos
              if (document.getElementById('listar').classList.contains('active')) {
                  renderizarContatos();
                  atualizarEstatisticas();
              }
          }
      }

      // Remover contato do treinamento (no modal)
      function removerContatoDoTreinamento(contatoId) {
          if (confirm('Tem certeza que deseja remover este contato do treinamento?')) {
              const contato = contatos.find(c => c.id === contatoId);
              if (contato) {
                  contato.treinamentoId = null;
                  mostrarAlerta('Contato removido do treinamento com sucesso!');

                  // Fechar modal e atualizar displays
                  fecharModal();
                  renderizarTreinamentos();

                  // Atualizar contatos se estiver na aba de contatos
                  if (document.getElementById('listar').classList.contains('active')) {
                      renderizarContatos();
                      atualizarEstatisticas();
                  }
              }
          }
      }

      // Fechar modal
      function fecharModal() {
          document.getElementById('modalContatos').style.display = 'none';
      }

      // Fechar modal de editar contato
      function fecharModalEditarContato() {
          document.getElementById('modalEditarContato').style.display = 'none';
      }

      // Função de exportar dados (placeholder)
      function exportarDados() {
          const dados = {
              contatos: contatos,
              treinamentos: treinamentos
          };
          
          const dataStr = JSON.stringify(dados, null, 2);
          const blob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = 'dados_sistema.json';
          a.click();
          
          URL.revokeObjectURL(url);
          mostrarAlerta('Dados exportados com sucesso!');
      }

      // Fechar modais clicando fora
      window.onclick = function(event) {
          const modals = [
              document.getElementById('modalContatos'),
              document.getElementById('modalEditarContato'),
              document.getElementById('modalDetalhesContato')
          ];
          
          modals.forEach(modal => {
              if (event.target === modal) {
                  modal.style.display = 'none';
              }
          });
      }