// integracao-bot.js
// Exemplo de como integrar o sistema de cadastro com seu bot existente

const express = require('express');
const { sendMessage } = require('../TemplatesMensagens/conexao/wppConnectTemplate');
const Contato = require('../BancoDeDados/models/contato');

// Função para sincronizar contatos do bot com o sistema web
async function sincronizarContatosBot() {
    try {
        console.log('🔄 Sincronizando contatos do bot...');
        
        // Buscar todos os contatos do sistema
        const contatos = await Contato.findAll();
        
        // Atualizar status baseado na última interação
        for (const contato of contatos) {
            // Aqui você pode adicionar lógica para verificar último status
            console.log(`📞 Contato: ${contato.nome} - Status: ${contato.statusTreinamento}`);
        }
        
        console.log('✅ Sincronização concluída!');
        return contatos;
        
    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
        throw error;
    }
}

// Função para adicionar novo contato via bot
async function adicionarContatoViaBot(sender, nome) {
    try {
        const telefoneLimpo = limparNumero(sender);
        
        // Verificar se já existe
        const contatos = await Contato.findAll();
        const senderVariacoes = gerarVariacoes(telefoneLimpo);
        
        const jaExiste = contatos.some(contato => {
            const variacoesContato = gerarVariacoes(contato.telefone);
            return senderVariacoes.some(num => variacoesContato.includes(num));
        });
        
        if (jaExiste) {
            console.log(`⚠️ Contato ${telefoneLimpo} já existe no sistema`);
            return null;
        }
        
        // Criar novo contato
        const novoContato = await Contato.create({
            nome: nome,
            telefone: telefoneLimpo,
            statusTreinamento: 'não iniciado'
        });
        
        console.log(`✅ Novo contato adicionado: ${nome} (${telefoneLimpo})`);
        return novoContato;
        
    } catch (error) {
        console.error('❌ Erro ao adicionar contato via bot:', error);
        throw error;
    }
}

// Função para atualizar status do treinamento
async function atualizarStatusTreinamento(sender, novoStatus) {
    try {
        const telefoneLimpo = limparNumero(sender);
        const senderVariacoes = gerarVariacoes(telefoneLimpo);
        
        // Buscar contato
        const contatos = await Contato.findAll();
        const contato = contatos.find(c => {
            const variacoesContato = gerarVariacoes(c.telefone);
            return senderVariacoes.some(num => variacoesContato.includes(num));
        });
        
        if (!contato) {
            console.log(`⚠️ Contato ${telefoneLimpo} não encontrado`);
            return null;
        }
        
        // Atualizar status
        await contato.update({ statusTreinamento: novoStatus });
        
        console.log(`✅ Status atualizado: ${contato.nome} -> ${novoStatus}`);
        return contato;
        
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
        throw error;
    }
}

// Função para salvar nome completo e email
async function salvarDadosCompletos(sender, nomeCompleto, email) {
    try {
        const telefoneLimpo = limparNumero(sender);
        const senderVariacoes = gerarVariacoes(telefoneLimpo);
        
        // Buscar contato
        const contatos = await Contato.findAll();
        const contato = contatos.find(c => {
            const variacoesContato = gerarVariacoes(c.telefone);
            return senderVariacoes.some(num => variacoesContato.includes(num));
        });
        
        if (!contato) {
            console.log(`⚠️ Contato ${telefoneLimpo} não encontrado`);
            return null;
        }
        
        // Atualizar dados
        const dadosAtualizados = {};
        if (nomeCompleto) dadosAtualizados.nomeCompleto = nomeCompleto;
        if (email) dadosAtualizados.email = email;
        
        await contato.update(dadosAtualizados);
        
        console.log(`✅ Dados salvos: ${contato.nome}`);
        return contato;
        
    } catch (error) {
        console.error('❌ Erro ao salvar dados completos:', error);
        throw error;
    }
}

// Função para gerar relatório de contatos
async function gerarRelatorioContatos() {
    try {
        const contatos = await Contato.findAll();
        
        const relatorio = {
            total: contatos.length,
            naoIniciados: contatos.filter(c => c.statusTreinamento === 'não iniciado').length,
            emAndamento: contatos.filter(c => c.statusTreinamento === 'em andamento').length,
            concluidos: contatos.filter(c => c.statusTreinamento === 'concluído').length,
            comEmail: contatos.filter(c => c.email).length,
            semEmail: contatos.filter(c => !c.email).length
        };
        
        console.log('📊 Relatório de Contatos:');
        console.log(`📞 Total: ${relatorio.total}`);
        console.log(`🔴 Não iniciados: ${relatorio.naoIniciados}`);
        console.log(`🟡 Em andamento: ${relatorio.emAndamento}`);
        console.log(`🟢 Concluídos: ${relatorio.concluidos}`);
        console.log(`📧 Com email: ${relatorio.comEmail}`);
        console.log(`❌ Sem email: ${relatorio.semEmail}`);
        
        return relatorio;
        
    } catch (error) {
        console.error('❌ Erro ao gerar relatório:', error);
        throw error;
    }
}

// API para notificar o bot sobre novos cadastros
async function notificarBotNovoCadastro(contato) {
    try {
        // Enviar mensagem de boas-vindas para o novo contato
        await sendMessage(contato.telefone, 'send-message', {
            message: `👋 Olá, ${contato.nome}! Você foi cadastrado no sistema de treinamento LCM. Em breve entraremos em contato!`
        });
        
        console.log(`📤 Notificação enviada para ${contato.nome}`);
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao notificar bot:', error);
        return false;
    }
}

// Middleware para integração com API web
function criarMiddlewareIntegracao() {
    return async (req, res, next) => {
        // Adicionar funções de integração ao request
        req.botIntegracao = {
            sincronizarContatos: sincronizarContatosBot,
            adicionarContato: adicionarContatoViaBot,
            atualizarStatus: atualizarStatusTreinamento,
            salvarDados: salvarDadosCompletos,
            gerarRelatorio: gerarRelatorioContatos,
            notificarBot: notificarBotNovoCadastro
        };
        next();
    };
}

// Webhook para receber atualizações do sistema web
async function webhookAtualizacoes(req, res) {
    try {
        const { tipo, dados } = req.body;
        
        switch (tipo) {
            case 'NOVO_CONTATO':
                await notificarBotNovoCadastro(dados);
                break;
                
            case 'STATUS_ATUALIZADO':
                console.log(`📊 Status atualizado via web: ${dados.nome} -> ${dados.statusTreinamento}`);
                break;
                
            case 'SINCRONIZAR':
                await sincronizarContatosBot();
                break;
                
            default:
                console.log('🤷 Tipo de webhook não reconhecido:', tipo);
        }
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('❌ Erro no webhook:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
}

// Função utilitária para limpar número (do seu código original)
function limparNumero(numero) {
    return numero.replace(/\D/g, '').replace(/@c\.us$/, '');
}

// Função utilitária para gerar variações (do seu código original)
function gerarVariacoes(numeroCompleto) {
    const limpo = limparNumero(numeroCompleto);
    if (!limpo.startsWith('55') || limpo.length < 10) return [limpo];
    const ddd = limpo.slice(2, 4);
    const base = limpo.slice(4);
    let var1 = limpo;
    let var2 = limpo;
    if (base.length === 9 && base[0] === '9') {
        var2 = '55' + ddd + base.slice(1);
    } else if (base.length === 8) {
        var2 = '55' + ddd + '9' + base;
    }
    return [var1, var2];
}

module.exports = {
    sincronizarContatosBot,
    adicionarContatoViaBot,
    atualizarStatusTreinamento,
    salvarDadosCompletos,
    gerarRelatorioContatos,
    notificarBotNovoCadastro,
    criarMiddlewareIntegracao,
    webhookAtualizacoes
};

// Exemplo de uso no seu bot principal:
/*
// No início do seu arquivo principal do bot
const {
    atualizarStatusTreinamento,
    salvarDadosCompletos,
    gerarRelatorioContatos
} = require('./integracao-bot');

// Quando o contato inicia treinamento
if (contato.statusTreinamento === 'não iniciado') {
    await atualizarStatusTreinamento(sender, 'em andamento');
    // ... resto do código
}

// Quando o contato conclui treinamento
if (text === 'b' && contato.statusTreinamento === 'em andamento') {
    await atualizarStatusTreinamento(sender, 'concluído');
    // ... resto do código
}

// Quando recebe nome completo
if (contato.statusTreinamento === 'concluído' && !contato.nomeCompleto) {
    await salvarDadosCompletos(sender, rawText.trim(), null);
    // ... resto do código
}

// Quando recebe email
if (contato.nomeCompleto && !contato.email) {
    await salvarDadosCompletos(sender, null, text);
    // ... resto do código
}
*/