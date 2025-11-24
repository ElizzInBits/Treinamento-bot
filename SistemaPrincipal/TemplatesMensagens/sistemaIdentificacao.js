const { Usuario, Interacao } = require('../BancoDeDados/models');
const treinamentoApresentacao = require('./Treinamentos/Apresentacao/treinamentoApresentacao');
const epcEpi = require('./Treinamentos/EPC_EPI/epc_epi');
const { encurtarNome } = require('./utils/formatarNome');
const { Op } = require('sequelize');

// Função principal de identificação e roteamento
async function processarMensagemInicial(telefone, mensagem, sendMessage, buscarContato) {
    try {
        console.log(`🔍 [IDENTIFICAÇÃO] Processando mensagem de ${telefone}: "${mensagem}"`);
        
        // Buscar contato no banco
        const contato = await buscarContato();
        
        // USUÁRIO NÃO CADASTRADO
        if (!contato) {
            console.log(`⚠️ [IDENTIFICAÇÃO] Usuário não cadastrado`);
            
            // Verificar se há interação recente (últimos 5 minutos)
            const interacaoRecente = await Interacao.findOne({
                where: { 
                    telefone: telefone,
                    tipo: { [Op.ne]: 'mensagem_usuario' },
                    createdAt: {
                        [Op.gte]: new Date(Date.now() - 5 * 60 * 1000) // 5 minutos
                    }
                },
                order: [['createdAt', 'DESC']]
            });
            
            // Se não há interação recente, limpar histórico antigo
            if (!interacaoRecente) {
                console.log(`🧹 [IDENTIFICAÇÃO] Limpando interações antigas`);
                await Interacao.destroy({
                    where: { telefone: telefone }
                });
            }
            
            console.log(`🆕 [IDENTIFICAÇÃO] Processando mensagem de usuário não cadastrado`);
            await treinamentoApresentacao.processarRespostaApresentacao(
                telefone,
                mensagem,
                null,
                null,
                sendMessage,
                buscarContato
            );
            return;
        }
        
        console.log(`✅ [IDENTIFICAÇÃO] Usuário cadastrado: ${contato.nome} (ID: ${contato.id}, Empresa: ${contato.empresaId})`);
        
        // Buscar última interação (excluindo mensagens do usuário)
        const ultimaInteracao = await Interacao.findOne({
            where: { 
                telefone: telefone,
                tipo: { [Op.ne]: 'mensagem_usuario' }
            },
            order: [['createdAt', 'DESC']]
        });
        
        // PRIMEIRA INTERAÇÃO OU SEM HISTÓRICO
        if (!ultimaInteracao) {
            console.log(`🆕 [IDENTIFICAÇÃO] Primeira interação - mostrando menu de treinamentos`);
            const treinamentosPendentes = await treinamentoApresentacao.verificarTreinamentosEmpresa(contato.empresaId, contato.id);
            if (treinamentosPendentes && treinamentosPendentes.length > 0) {
                await treinamentoApresentacao.direcionarParaTreinamentos(telefone, sendMessage, treinamentosPendentes, contato);
            } else {
                await sendMessage(telefone, 'send-message', {
                    message: `Parabéns, ${encurtarNome(contato.nome)}! Você não possui treinamentos pendentes no momento.\n\nℹ️ Não há treinamentos pendentes para você.\n👉 O que você gostaria de fazer?\n\n1️⃣ Fazer meus treinamentos agora\n2️⃣ Ver como a ferramenta funciona\n3️⃣ Acessar meus certificados\n4️⃣ Lembrar depois\n5️⃣ Falar com o comercial\n6️⃣ Falar com o suporte\n\n💡 Dica: Digite MENU a qualquer momento para voltar a este menu.`
                });
            }
            return;
        }
        
        // PROCESSAR BASEADO NA ÚLTIMA INTERAÇÃO
        const dados = JSON.parse(ultimaInteracao.mensagem || '{}');
        const etapa = dados.etapa;
        
        // USUÁRIO ESTAVA AGUARDANDO CADASTRO E VOLTOU
        if (etapa === 'aguardando_cadastro' || etapa === 'opcao_inicial') {
            console.log(`✅ [IDENTIFICAÇÃO] Usuário voltou após cadastro - mostrando menu`);
            const treinamentosPendentes = await treinamentoApresentacao.verificarTreinamentosEmpresa(contato.empresaId, contato.id);
            if (treinamentosPendentes && treinamentosPendentes.length > 0) {
                await treinamentoApresentacao.direcionarParaTreinamentos(telefone, sendMessage, treinamentosPendentes, contato);
            } else {
                await sendMessage(telefone, 'send-message', {
                    message: `Parabéns, ${encurtarNome(contato.nome)}! Você não possui treinamentos pendentes no momento.\n\nℹ️ Não há treinamentos pendentes para você.\n👉 O que você gostaria de fazer?\n\n1️⃣ Fazer meus treinamentos agora\n2️⃣ Ver como a ferramenta funciona\n3️⃣ Acessar meus certificados\n4️⃣ Lembrar depois\n5️⃣ Falar com o comercial\n6️⃣ Falar com o suporte\n\n💡 Dica: Digite MENU a qualquer momento para voltar a este menu.`
                });
            }
            return;
        }
        
        console.log(`📍 [IDENTIFICAÇÃO] Última etapa: ${etapa}`);
        
        // CONVERSA FINALIZADA - REINICIAR
        if (etapa === 'finalizado') {
            console.log(`🔄 [IDENTIFICAÇÃO] Conversa finalizada - mostrando menu`);
            const treinamentosPendentes = await treinamentoApresentacao.verificarTreinamentosEmpresa(contato.empresaId, contato.id);
            if (treinamentosPendentes && treinamentosPendentes.length > 0) {
                await treinamentoApresentacao.direcionarParaTreinamentos(telefone, sendMessage, treinamentosPendentes, contato);
            } else {
                await sendMessage(telefone, 'send-message', {
                    message: `Parabéns, ${encurtarNome(contato.nome)}! Você não possui treinamentos pendentes no momento.\n\nℹ️ Não há treinamentos pendentes para você.\n👉 O que você gostaria de fazer?\n\n1️⃣ Fazer meus treinamentos agora\n2️⃣ Ver como a ferramenta funciona\n3️⃣ Acessar meus certificados\n4️⃣ Lembrar depois\n5️⃣ Falar com o comercial\n6️⃣ Falar com o suporte\n\n💡 Dica: Digite MENU a qualquer momento para voltar a este menu.`
                });
            }
            return;
        }
        
        // TREINAMENTO EPC/EPI
        if (etapa && etapa.includes('epc_epi')) {
            console.log(`🛡️ [IDENTIFICAÇÃO] Roteando para treinamento EPC/EPI`);
            await epcEpi.processarTreinamentoEpcEpi(
                telefone,
                mensagem,
                null,
                contato,
                sendMessage,
                buscarContato
            );
            return;
        }
        
        // APRESENTAÇÃO OU MENU DE TREINAMENTOS
        const etapasApresentacao = [
            'apresentacao',
            'treinamentos_pendentes',
            'mostrar_recursos',
            'opcao_inicial',
            'aguardando_cadastro',
            'aguardando_opcao_inicial',
            'processando_cadastrado',
            'processando_recursos',
            'testes_avaliacoes',
            'perguntar_quando_onde',
            'exemplos_treinamentos',
            'outras_aplicacoes',
            'confirmar_dados_certificado',
            'pergunta_conteudo_restante',
            'contato_comercial',
            'finalizando',
            'epc_epi_iniciado'
        ];
        
        if (etapa && etapasApresentacao.some(e => etapa.includes(e))) {
            console.log(`🎬 [IDENTIFICAÇÃO] Roteando para apresentação`);
            await treinamentoApresentacao.processarRespostaApresentacao(
                telefone,
                mensagem,
                null,
                contato,
                sendMessage,
                buscarContato
            );
            return;
        }
        
        // FLUXO PADRÃO - MOSTRAR MENU
        console.log(`🔄 [IDENTIFICAÇÃO] Etapa desconhecida (${etapa}) - mostrando menu`);
        const treinamentosPendentes = await treinamentoApresentacao.verificarTreinamentosEmpresa(contato.empresaId, contato.id);
        if (treinamentosPendentes && treinamentosPendentes.length > 0) {
            await treinamentoApresentacao.direcionarParaTreinamentos(telefone, sendMessage, treinamentosPendentes, contato);
        } else {
            await sendMessage(telefone, 'send-message', {
                message: `Parabéns, ${encurtarNome(contato.nome)}! Você não possui treinamentos pendentes no momento.\n\nℹ️ Não há treinamentos pendentes para você.\n👉 O que você gostaria de fazer?\n\n1️⃣ Fazer meus treinamentos agora\n2️⃣ Ver como a ferramenta funciona\n3️⃣ Acessar meus certificados\n4️⃣ Lembrar depois\n5️⃣ Falar com o comercial\n6️⃣ Falar com o suporte\n\n💡 Dica: Digite MENU a qualquer momento para voltar a este menu.`
            });
        }
        
    } catch (error) {
        console.error('❌ [IDENTIFICAÇÃO] Erro:', error);
        await sendMessage(telefone, 'send-message', {
            message: '❌ Erro ao processar mensagem. Tente novamente.'
        });
    }
}

module.exports = {
    processarMensagemInicial
};
