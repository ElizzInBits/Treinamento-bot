const cron = require('node-cron');
const { Usuario, QuizScore } = require('../../../BancoDeDados/models');
const { Op } = require('sequelize');

const TREINAMENTO_ID = 24;

// Variável para armazenar a tarefa agendada
let tarefaAgendada = null;

// Função para gerar variações de telefone
function gerarVariacoesTelefone(telefone) {
    const numeros = telefone.replace(/\D/g, '');
    const variacoes = new Set();
    
    // Formato original
    variacoes.add(numeros);
    
    // Se tem 13 dígitos (55 + DDD + 9 + número), remover o 9 extra
    if (numeros.length === 13 && numeros.startsWith('55')) {
        const semNono = numeros.substring(0, 4) + numeros.substring(5);
        variacoes.add(semNono);
    }
    
    // Se tem 12 dígitos, adicionar o 9
    if (numeros.length === 12 && numeros.startsWith('55')) {
        const comNono = numeros.substring(0, 4) + '9' + numeros.substring(4);
        variacoes.add(comNono);
    }
    
    return Array.from(variacoes);
}

// Função para enviar quiz diário automaticamente
async function enviarQuizDiario(sendMessage) {
    try {
        console.log('🎮 [AGENDADOR] Iniciando envio automático do quiz diário...');
        
        const { Interacao } = require('../../../BancoDeDados/models');
        const { sequelize } = require('../../../BancoDeDados/database');
        const hoje = new Date().toISOString().split('T')[0];
        
        // Buscar usuários que já interagiram com o bot (enviaram mensagens)
        const usuariosAtivos = await sequelize.query(`
            SELECT DISTINCT u.id, u.nome, u.telefone
            FROM usuarios u
            INNER JOIN interacoes i ON REPLACE(REPLACE(i.telefone, '@c.us', ''), '+', '') LIKE CONCAT('%', REPLACE(u.telefone, '+', ''), '%')
                OR REPLACE(u.telefone, '+', '') LIKE CONCAT('%', REPLACE(REPLACE(i.telefone, '@c.us', ''), '+', ''), '%')
            WHERE u.ativo = 1
            AND i.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY u.id
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log(`📊 [AGENDADOR] Usuários ativos (com interações): ${usuariosAtivos.length}`);
        
        if (usuariosAtivos.length === 0) {
            console.log('📊 [AGENDADOR] Nenhum usuário ativo encontrado');
            return;
        }
        
        // Buscar quem já fez quiz hoje
        const usuariosQueJaFizeram = await QuizScore.findAll({
            where: {
                data_quiz: hoje,
                treinamento_id: TREINAMENTO_ID
            },
            attributes: ['usuario_id'],
            raw: true
        });
        
        const idsQueJaFizeram = new Set(usuariosQueJaFizeram.map(u => u.usuario_id));
        const usuariosParaEnviar = usuariosAtivos.filter(u => !idsQueJaFizeram.has(u.id));
        
        console.log(`📊 [AGENDADOR] Já fizeram hoje: ${idsQueJaFizeram.size}`);
        console.log(`📊 [AGENDADOR] Pendentes: ${usuariosParaEnviar.length}`);
        
        if (usuariosParaEnviar.length === 0) {
            console.log('✅ [AGENDADOR] Todos já fizeram o quiz hoje');
            return;
        }
        
        console.log(`📤 [AGENDADOR] Enviando para ${usuariosParaEnviar.length} usuários...`);
        
        // Enviar para cada usuário
        for (const usuario of usuariosParaEnviar) {
            const variacoes = gerarVariacoesTelefone(usuario.telefone);
            
            const mensagem = `🌅 *Bom dia!*\n\n` +
                `🎮 Seu quiz diário está disponível!\n\n` +
                `📝 5 novas perguntas te aguardam\n` +
                `⭐ Ganhe pontos e suba no ranking\n` +
                `🔥 Mantenha sua sequência de dias consecutivos!\n\n` +
                `👉 Digite *QUIZ* para começar agora!`;
            
            let enviado = false;
            
            for (const variacao of variacoes) {
                const telefoneFormatado = `${variacao}@c.us`;
                
                try {
                    await sendMessage(telefoneFormatado, 'send-message', { message: mensagem });
                    console.log(`✅ [AGENDADOR] Enviado para ${usuario.nome} (${variacao})`);
                    enviado = true;
                    break;
                } catch (error) {
                    console.log(`⚠️ [AGENDADOR] Tentativa falhou para ${variacao}`);
                }
            }
            
            if (!enviado) {
                console.error(`❌ [AGENDADOR] Falha total para ${usuario.nome}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('🎉 [AGENDADOR] Envio automático concluído!');
        
    } catch (error) {
        console.error('❌ [AGENDADOR] Erro no envio automático:', error);
    }
}

// Inicializar agendador
function iniciarAgendador(sendMessage) {
    if (tarefaAgendada) {
        console.log('⚠️ [AGENDADOR] Agendador já está ativo, ignorando nova inicialização');
        return;
    }
    
    if (!sendMessage) {
        console.error('❌ [AGENDADOR] sendMessage não foi fornecido!');
        return;
    }
    
    // Agendar para 07:00 Brasília
    tarefaAgendada = cron.schedule('0 7 * * *', () => {
        const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        console.log(`⏰ [AGENDADOR] Executando envio automático - ${agora}`);
        enviarQuizDiario(sendMessage);
    }, {
        timezone: "America/Sao_Paulo",
        scheduled: true
    });
    
    const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    console.log(`✅ [AGENDADOR] Quiz diário agendado para 07:00 (horário de Brasília)`);
    console.log(`📅 [AGENDADOR] Horário atual: ${agora}`);
    console.log(`🔧 [AGENDADOR] Status: ${tarefaAgendada ? 'ATIVO' : 'INATIVO'}`);
}

// Função para parar o agendador
function pararAgendador() {
    if (tarefaAgendada) {
        tarefaAgendada.stop();
        tarefaAgendada = null;
        console.log('🛑 [AGENDADOR] Agendador parado');
    }
}

module.exports = {
    iniciarAgendador,
    pararAgendador
};
