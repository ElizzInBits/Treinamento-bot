class FlowBuilder {
    constructor() {
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.nodeCounter = 0;
        this.canvas = document.getElementById('canvas');
        this.svg = document.getElementById('connections');
        this.properties = document.getElementById('properties');
        this.scale = 1;
        this.isDragging = false;
        this.dragNode = null;
        this.connectingFrom = null;
        this.init();
    }

    init() {
        document.querySelectorAll('.node-type').forEach(type => {
            type.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('nodeType', e.target.dataset.type);
            });
        });

        this.canvas.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('nodeType');
            const rect = this.canvas.getBoundingClientRect();
            this.criarNo(type, (e.clientX - rect.left) / this.scale, (e.clientY - rect.top) / this.scale);
        });

        this.canvas.addEventListener('click', (e) => {
            if (e.target === this.canvas) this.deselecionarNo();
        });
    }

    criarNo(tipo, x, y) {
        const id = `no_${++this.nodeCounter}`;
        const node = { id, tipo, x, y, conteudo: '', proximo: null, opcoes: [] };
        this.nodes.push(node);
        this.renderizarNo(node);
        this.ocultarEmptyState();
    }

    renderizarNo(node) {
        const div = document.createElement('div');
        div.className = `flow-node ${node.tipo}`;
        div.id = node.id;
        div.style.left = node.x + 'px';
        div.style.top = node.y + 'px';
        
        const icon = { mensagem: '💬', pergunta: '❓', midia: '🖼️', finalizar: '🏁' }[node.tipo] || '📄';
        const preview = node.conteudo || node.pergunta || 'Clique para configurar';
        
        div.innerHTML = `
            <div class="node-header">
                <span>${icon} ${node.tipo.toUpperCase()}</span>
                <span class="node-delete" onclick="flowBuilder.deletarNo('${node.id}')">×</span>
            </div>
            <div class="node-content">${preview.substring(0, 60)}${preview.length > 60 ? '...' : ''}</div>
            ${node.tipo !== 'finalizar' ? '<div class="node-connector" onclick="flowBuilder.iniciarConexao(event, \'' + node.id + '\')"></div>' : ''}
        `;
        
        div.addEventListener('click', (e) => {
            if (!e.target.classList.contains('node-delete') && !e.target.classList.contains('node-connector')) {
                this.selecionarNo(node);
            }
        });

        div.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('node-connector')) return;
            this.isDragging = true;
            this.dragNode = node;
            this.offsetX = e.clientX / this.scale - node.x;
            this.offsetY = e.clientY / this.scale - node.y;
        });

        this.canvas.appendChild(div);
    }

    selecionarNo(node) {
        document.querySelectorAll('.flow-node').forEach(n => n.classList.remove('selected'));
        document.getElementById(node.id).classList.add('selected');
        this.selectedNode = node;
        this.mostrarPropriedades(node);
    }

    deselecionarNo() {
        document.querySelectorAll('.flow-node').forEach(n => n.classList.remove('selected'));
        this.selectedNode = null;
        this.properties.innerHTML = '<h3>⚙️ Propriedades</h3><p style="color: #858585;">Selecione um nó para editar</p>';
    }

    deletarNo(id) {
        if (confirm('Deletar este nó?')) {
            this.nodes = this.nodes.filter(n => n.id !== id);
            this.connections = this.connections.filter(c => c.from !== id && c.to !== id);
            document.getElementById(id)?.remove();
            this.redesenharConexoes();
            if (this.selectedNode?.id === id) this.deselecionarNo();
            if (this.nodes.length === 0) this.mostrarEmptyState();
        }
    }

    mostrarPropriedades(node) {
        let html = `<h3>⚙️ Propriedades - ${node.tipo}</h3>`;
        
        if (node.tipo === 'mensagem') {
            html += `
                <div class="form-group">
                    <label>Conteúdo da Mensagem:</label>
                    <textarea id="prop_conteudo" placeholder="Digite a mensagem...">${node.conteudo || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Delay (ms):</label>
                    <input type="number" id="prop_delay" value="${node.delay || 1000}">
                </div>
            `;
        } else if (node.tipo === 'pergunta') {
            html += `
                <div class="form-group">
                    <label>Pergunta:</label>
                    <textarea id="prop_pergunta" placeholder="Digite a pergunta...">${node.pergunta || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Título das Opções:</label>
                    <input type="text" id="prop_titulo" value="${node.titulo || 'Escolha uma opção'}">
                </div>
                <div class="form-group">
                    <label>Opções:</label>
                    <div id="opcoes_container"></div>
                    <button class="btn btn-small" onclick="flowBuilder.adicionarOpcao()">+ Adicionar Opção</button>
                </div>
            `;
        } else if (node.tipo === 'midia') {
            html += `
                <div class="form-group">
                    <label>Tipo de Mídia:</label>
                    <select id="prop_tipoMidia">
                        <option value="imagem" ${node.tipoMidia === 'imagem' ? 'selected' : ''}>Imagem</option>
                        <option value="audio" ${node.tipoMidia === 'audio' ? 'selected' : ''}>Áudio</option>
                        <option value="video" ${node.tipoMidia === 'video' ? 'selected' : ''}>Vídeo</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Caminho do Arquivo:</label>
                    <input type="text" id="prop_arquivo" value="${node.arquivo || ''}" placeholder="ex: media/imagem.jpg">
                </div>
                <div class="form-group">
                    <label>Legenda:</label>
                    <input type="text" id="prop_legenda" value="${node.legenda || ''}">
                </div>
                <div class="form-group">
                    <label>Delay (ms):</label>
                    <input type="number" id="prop_delay" value="${node.delay || 2000}">
                </div>
            `;
        } else if (node.tipo === 'finalizar') {
            html += `
                <div class="form-group">
                    <label>Mensagem Final:</label>
                    <textarea id="prop_mensagem" placeholder="Mensagem de conclusão...">${node.mensagem || 'Fluxo concluído!'}</textarea>
                </div>
            `;
        }
        
        html += '<button class="btn btn-success" onclick="flowBuilder.salvarPropriedades()">✓ Salvar Propriedades</button>';
        this.properties.innerHTML = html;
        
        if (node.tipo === 'pergunta') this.renderizarOpcoes(node);
    }

    renderizarOpcoes(node) {
        const container = document.getElementById('opcoes_container');
        container.innerHTML = '';
        (node.opcoes || []).forEach((op, i) => {
            container.innerHTML += `
                <div class="option-item">
                    <input type="text" placeholder="ID da opção" value="${op.id || ''}" onchange="flowBuilder.selectedNode.opcoes[${i}].id = this.value">
                    <input type="text" placeholder="Texto da opção" value="${op.texto || ''}" onchange="flowBuilder.selectedNode.opcoes[${i}].texto = this.value">
                    <input type="text" placeholder="Próximo nó" value="${op.proximo || ''}" onchange="flowBuilder.selectedNode.opcoes[${i}].proximo = this.value">
                    <button class="btn btn-danger btn-small" onclick="flowBuilder.removerOpcao(${i})">× Remover</button>
                </div>
            `;
        });
    }

    adicionarOpcao() {
        if (!this.selectedNode) return;
        this.selectedNode.opcoes = this.selectedNode.opcoes || [];
        this.selectedNode.opcoes.push({ id: '', texto: '', proximo: '' });
        this.renderizarOpcoes(this.selectedNode);
    }

    removerOpcao(index) {
        if (!this.selectedNode) return;
        this.selectedNode.opcoes.splice(index, 1);
        this.renderizarOpcoes(this.selectedNode);
    }

    salvarPropriedades() {
        if (!this.selectedNode) return;
        
        const node = this.selectedNode;
        if (node.tipo === 'mensagem') {
            node.conteudo = document.getElementById('prop_conteudo').value;
            node.delay = parseInt(document.getElementById('prop_delay').value) || 1000;
        } else if (node.tipo === 'pergunta') {
            node.pergunta = document.getElementById('prop_pergunta').value;
            node.titulo = document.getElementById('prop_titulo').value;
        } else if (node.tipo === 'midia') {
            node.tipoMidia = document.getElementById('prop_tipoMidia').value;
            node.arquivo = document.getElementById('prop_arquivo').value;
            node.legenda = document.getElementById('prop_legenda').value;
            node.delay = parseInt(document.getElementById('prop_delay').value) || 2000;
        } else if (node.tipo === 'finalizar') {
            node.mensagem = document.getElementById('prop_mensagem').value;
        }
        
        const preview = node.conteudo || node.pergunta || node.mensagem || 'Configurado';
        document.querySelector(`#${node.id} .node-content`).textContent = preview.substring(0, 60) + (preview.length > 60 ? '...' : '');
    }

    iniciarConexao(e, fromId) {
        e.stopPropagation();
        this.connectingFrom = fromId;
        const targetNodes = this.nodes.filter(n => n.id !== fromId);
        targetNodes.forEach(n => document.getElementById(n.id).style.borderColor = '#4ec9b0');
        
        const handler = (e) => {
            if (e.target.closest('.flow-node') && e.target.closest('.flow-node').id !== fromId) {
                const toId = e.target.closest('.flow-node').id;
                this.criarConexao(fromId, toId);
            }
            this.nodes.forEach(n => document.getElementById(n.id).style.borderColor = '');
            this.connectingFrom = null;
            this.canvas.removeEventListener('click', handler);
        };
        
        setTimeout(() => this.canvas.addEventListener('click', handler), 100);
    }

    criarConexao(from, to) {
        if (!this.connections.find(c => c.from === from && c.to === to)) {
            this.connections.push({ from, to });
            const fromNode = this.nodes.find(n => n.id === from);
            if (fromNode) fromNode.proximo = to;
            this.redesenharConexoes();
        }
    }

    redesenharConexoes() {
        this.svg.innerHTML = '';
        this.connections.forEach(conn => {
            const fromEl = document.getElementById(conn.from);
            const toEl = document.getElementById(conn.to);
            if (!fromEl || !toEl) return;
            
            const fromRect = fromEl.getBoundingClientRect();
            const toRect = toEl.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            
            const x1 = (fromRect.left + fromRect.width / 2 - canvasRect.left) / this.scale;
            const y1 = (fromRect.bottom - canvasRect.top) / this.scale;
            const x2 = (toRect.left + toRect.width / 2 - canvasRect.left) / this.scale;
            const y2 = (toRect.top - canvasRect.top) / this.scale;
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const d = `M ${x1} ${y1} C ${x1} ${y1 + 50}, ${x2} ${y2 - 50}, ${x2} ${y2}`;
            path.setAttribute('d', d);
            path.setAttribute('stroke', '#4ec9b0');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('fill', 'none');
            path.setAttribute('opacity', '0.6');
            this.svg.appendChild(path);
        });
    }

    zoom(delta) {
        this.scale = Math.max(0.3, Math.min(2, this.scale + delta));
        this.canvas.style.transform = `scale(${this.scale})`;
    }

    resetZoom() {
        this.scale = 1;
        this.canvas.style.transform = 'scale(1)';
    }

    async exportarJSON() {
        const nome = prompt('Nome do fluxo:', 'meu_fluxo');
        if (!nome) return;
        
        const descricao = prompt('Descrição do fluxo (opcional):') || '';
        
        const flow = {
            flowId: nome.toLowerCase().replace(/\s+/g, '_'),
            nome: nome,
            descricao: descricao,
            versao: '1.0',
            inicio: this.nodes[0]?.id || '',
            nos: {}
        };
        
        this.nodes.forEach(node => {
            const { x, y, ...nodeData } = node;
            flow.nos[node.id] = nodeData;
        });
        
        // Salvar no banco
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const res = await fetch('/api/fluxos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(flow)
                });
                
                if (res.ok) {
                    alert('✅ Fluxo salvo no banco de dados!');
                } else {
                    throw new Error('Erro ao salvar');
                }
            } catch (error) {
                alert('❌ Erro ao salvar no banco. Exportando arquivo...');
                this.downloadJSON(flow);
            }
        } else {
            this.downloadJSON(flow);
        }
    }
    
    downloadJSON(flow) {
        const blob = new Blob([JSON.stringify(flow, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${flow.flowId}.json`;
        a.click();
    }

    async listarFluxos() {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('❌ Faça login para acessar seus fluxos');
            return;
        }
        
        try {
            const res = await fetch('/api/fluxos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error('Erro ao carregar fluxos');
            
            const fluxos = await res.json();
            
            if (fluxos.length === 0) {
                alert('ℹ️ Nenhum fluxo salvo ainda');
                return;
            }
            
            const lista = fluxos.map((f, i) => `${i + 1}. ${f.nome} (${f.flowId})${f.descricao ? ' - ' + f.descricao : ''}`).join('\n');
            const escolha = prompt(`Escolha um fluxo (digite o número):\n\n${lista}`);
            
            if (escolha) {
                const index = parseInt(escolha) - 1;
                if (index >= 0 && index < fluxos.length) {
                    this.carregarFluxo(fluxos[index]);
                }
            }
        } catch (error) {
            alert('❌ Erro ao listar fluxos: ' + error.message);
        }
    }
    
    carregarFluxo(fluxo) {
        this.limparCanvas(true);
        let x = 100, y = 100;
        Object.values(fluxo.nos).forEach((node, i) => {
            node.x = x;
            node.y = y;
            this.nodes.push(node);
            this.renderizarNo(node);
            y += 150;
            if (i % 4 === 3) { x += 300; y = 100; }
        });
        this.ocultarEmptyState();
    }
    
    importarJSON() {
        const input = document.getElementById('fileInput');
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const flow = JSON.parse(event.target.result);
                    this.carregarFluxo(flow);
                } catch (err) {
                    alert('Erro ao importar: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    limparCanvas(silent = false) {
        if (!silent && !confirm('Limpar todo o canvas?')) return;
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.nodeCounter = 0;
        this.canvas.querySelectorAll('.flow-node').forEach(n => n.remove());
        this.svg.innerHTML = '';
        this.deselecionarNo();
        this.mostrarEmptyState();
    }

    ocultarEmptyState() {
        const empty = this.canvas.querySelector('.empty-state');
        if (empty) empty.style.display = 'none';
    }

    mostrarEmptyState() {
        const empty = this.canvas.querySelector('.empty-state');
        if (empty) empty.style.display = 'block';
    }
}

const flowBuilder = new FlowBuilder();

document.addEventListener('mousemove', (e) => {
    if (flowBuilder.isDragging && flowBuilder.dragNode) {
        const node = flowBuilder.dragNode;
        node.x = e.clientX / flowBuilder.scale - flowBuilder.offsetX;
        node.y = e.clientY / flowBuilder.scale - flowBuilder.offsetY;
        const el = document.getElementById(node.id);
        el.style.left = node.x + 'px';
        el.style.top = node.y + 'px';
        flowBuilder.redesenharConexoes();
    }
});

document.addEventListener('mouseup', () => {
    flowBuilder.isDragging = false;
    flowBuilder.dragNode = null;
});
