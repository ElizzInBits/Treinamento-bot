const { Usuario, Empresa } = require('../../BancoDeDados/models');

/**
 * Verifica se o horário atual está dentro do horário de funcionamento da empresa
 * @param {string} telefone - Telefone do usuário
 * @returns {Promise<{permitido: boolean, mensagem: string, horario: string}>}
 */
async function verificarHorarioFuncionamento(telefone) {
    try {
        // Remover @c.us se presente
        const telefoneLimpo = telefone.replace('@c.us', '');
        
        // Buscar usuário
        const formatosTelefone = [
            telefoneLimpo,
            telefoneLimpo.substring(2),
            `${telefoneLimpo.substring(0, 4)}9${telefoneLimpo.substring(4)}`,
            telefoneLimpo.length === 13 ? telefoneLimpo.substring(0, 4) + telefoneLimpo.substring(5) : telefoneLimpo,
        ];
        
        let usuario = null;
        for (const formato of formatosTelefone) {
            usuario = await Usuario.findOne({ 
                where: { telefone: formato },
                include: [{ model: Empresa, as: 'empresa' }]
            });
            if (usuario) break;
        }
        
        // Se não encontrou usuário ou empresa, permitir acesso
        if (!usuario || !usuario.empresa) {
            return {
                permitido: true,
                mensagem: null,
                horario: null
            };
        }
        
        const horarioFuncionamento = usuario.empresa.horarioFuncionamento;
        
        // Se não tem horário definido, permitir 24h
        if (!horarioFuncionamento || horarioFuncionamento.trim() === '') {
            return {
                permitido: true,
                mensagem: null,
                horario: '24h'
            };
        }
        
        // Parsear horário (formato: "08:00-18:00")
        const [inicio, fim] = horarioFuncionamento.split('-').map(h => h.trim());
        
        if (!inicio || !fim) {
            console.log(`⚠️ [HORARIO] Formato inválido: ${horarioFuncionamento}`);
            return {
                permitido: true,
                mensagem: null,
                horario: horarioFuncionamento
            };
        }
        
        // Obter hora atual (horário de Brasília - UTC-3)
        const agora = new Date();
        const horaAtual = agora.toLocaleTimeString('pt-BR', { 
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        // Converter para minutos para comparação
        const converterParaMinutos = (hora) => {
            const [h, m] = hora.split(':').map(Number);
            return h * 60 + m;
        };
        
        const minutosAtual = converterParaMinutos(horaAtual);
        const minutosInicio = converterParaMinutos(inicio);
        const minutosFim = converterParaMinutos(fim);
        
        // Verificar se está dentro do horário
        const dentroDoHorario = minutosAtual >= minutosInicio && minutosAtual <= minutosFim;
        
        if (dentroDoHorario) {
            console.log(`✅ [HORARIO] Dentro do horário: ${horaAtual} (${inicio}-${fim})`);
            return {
                permitido: true,
                mensagem: null,
                horario: horarioFuncionamento
            };
        } else {
            console.log(`⏰ [HORARIO] Fora do horário: ${horaAtual} (${inicio}-${fim})`);
            return {
                permitido: false,
                mensagem: `🎓 *Treinamento Disponível em Horário Específico*\n\nOlá! Os treinamentos da sua empresa estão disponíveis das *${inicio}* às *${fim}*.\n\n🕐 Horário atual: ${horaAtual}\n\n📚 Retorne no horário de treinamento para dar continuidade ao seu aprendizado.\n\n✨ *Importante:* Você pode acessar e realizar os treinamentos apenas durante este período!`,
                horario: horarioFuncionamento
            };
        }
        
    } catch (error) {
        console.error('❌ [HORARIO] Erro ao verificar horário:', error);
        // Em caso de erro, permitir acesso
        return {
            permitido: true,
            mensagem: null,
            horario: null
        };
    }
}

module.exports = { verificarHorarioFuncionamento };
