const fs = require('fs');
const path = require('path');
const { SessaoTreinamento, Interacao } = require('../../../BancoDeDados/models');

class FlowEngine {
    constructor(flowPath) {
        this.flowPath = flowPath;
        this.flow = null;
        this.sessions = new Map();
        this.loadFlow();
    }

    loadFlow() {
        const flowData = fs.readFileSync(this.flowPath, 'utf8');
        this.flow = JSON.parse(flowData);
    }

    async iniciarFluxo(client, message, contato) {
        const sessionKey = `${contato.numero}_${this.flow.id}`;
        
        this.sessions.set(sessionKey, {
            etapa: this.flow.inicio,
            dados: {},
            inicioFluxo: new Date()
        });

        await this.salvarSessao(contato.numero, this.sessions.get(sessionKey));
        await this.executarNo(this.flow.inicio, client, message, contato);
    }

    async processarResposta(client, message, contato) {
        const sessionKey = `${contato.numero}_${this.flow.id}`;
        let session = this.sessions.get(sessionKey);

        if (!session) {
            session = await this.recuperarSessao(contato.numero);
            if (session) {
                this.sessions.set(sessionKey, session);
            } else {
                await this.iniciarFluxo(client, message, contato);
                return;
            }
        }

        const noAtual = this.flow.nos[session.etapa];
        if (!noAtual) return;

        const resposta = message.selectedButtonId || message.body;
        const proximoNo = await this.avaliarResposta(noAtual, resposta, session);

        if (proximoNo) {
            session.etapa = proximoNo;
            await this.salvarSessao(contato.numero, session);
            await this.executarNo(proximoNo, client, message, contato);
        }
    }

    async executarNo(noId, client, message, contato) {
        const no = this.flow.nos[noId];
        if (!no) return;

        switch (no.tipo) {
            case 'mensagem':
                await client.sendMessage(message.from, { text: no.conteudo });
                if (no.proximo) {
                    setTimeout(() => this.executarNo(no.proximo, client, message, contato), no.delay || 1000);
                }
                break;

            case 'pergunta':
                await client.sendMessage(message.from, { text: no.pergunta });
                if (no.opcoes) {
                    const sections = [{
                        title: no.titulo || 'Escolha uma opção:',
                        rows: no.opcoes.map(op => ({
                            rowId: op.id,
                            title: op.texto,
                            description: op.descricao || ''
                        }))
                    }];
                    await client.sendMessage(message.from, {
                        buttonText: 'SELECIONE',
                        description: 'Opções:',
                        sections: sections
                    });
                }
                break;

            case 'midia':
                const mediaPath = path.join(path.dirname(this.flowPath), no.arquivo);
                if (fs.existsSync(mediaPath)) {
                    if (no.tipoMidia === 'imagem') {
                        await client.sendMessage(message.from, { image: { url: mediaPath }, caption: no.legenda || '' });
                    } else if (no.tipoMidia === 'audio') {
                        await client.sendMessage(message.from, { audio: { url: mediaPath } });
                    } else if (no.tipoMidia === 'video') {
                        await client.sendMessage(message.from, { video: { path: mediaPath }, caption: no.legenda || '' });
                    }
                }
                if (no.proximo) {
                    setTimeout(() => this.executarNo(no.proximo, client, message, contato), no.delay || 2000);
                }
                break;

            case 'finalizar':
                await client.sendMessage(message.from, { text: no.mensagem || 'Fluxo concluído!' });
                await this.removerSessao(contato.numero);
                break;
        }
    }

    async avaliarResposta(no, resposta, session) {
        if (no.tipo !== 'pergunta') return no.proximo;

        const respostaNorm = resposta.toLowerCase().trim();
        
        for (const opcao of no.opcoes) {
            if (opcao.id === resposta || 
                respostaNorm.includes(opcao.texto.toLowerCase()) ||
                opcao.palavrasChave?.some(p => respostaNorm.includes(p.toLowerCase()))) {
                
                if (opcao.feedback) {
                    // Feedback será enviado no próximo nó
                }
                return opcao.proximo;
            }
        }

        return no.erroProximo || no.id;
    }

    async salvarSessao(telefone, session) {
        await SessaoTreinamento.create({
            telefone: telefone,
            tipo_treinamento: this.flow.id,
            etapa_atual: session.etapa,
            dados_sessao: JSON.stringify(session),
            ativo: true,
            ultima_atualizacao: new Date()
        });
    }

    async recuperarSessao(telefone) {
        const sessao = await SessaoTreinamento.findOne({
            where: { telefone: telefone, tipo_treinamento: this.flow.id, ativo: true },
            order: [['ultima_atualizacao', 'DESC']]
        });
        return sessao ? JSON.parse(sessao.dadosSessao) : null;
    }

    async removerSessao(telefone) {
        await SessaoTreinamento.update(
            { ativo: false },
            { where: { telefone: telefone, tipo_treinamento: this.flow.id } }
        );
    }
}

module.exports = FlowEngine;
