const { Usuario } = require('../../BancoDeDados/models');

/**
 * Verifica se o usu\u00e1rio est\u00e1 ativo no sistema
 * @param {string} telefone - Telefone do usu\u00e1rio
 * @returns {Promise<{ativo: boolean, mensagem: string}>}
 */
async function verificarUsuarioAtivo(telefone) {
    try {
        const telefoneLimpo = telefone.replace('@c.us', '');
        
        const formatosTelefone = [
            telefoneLimpo,
            telefoneLimpo.substring(2),
            `${telefoneLimpo.substring(0, 4)}9${telefoneLimpo.substring(4)}`,
            telefoneLimpo.length === 13 ? telefoneLimpo.substring(0, 4) + telefoneLimpo.substring(5) : telefoneLimpo,
        ];
        
        let usuario = null;
        for (const formato of formatosTelefone) {
            usuario = await Usuario.findOne({ where: { telefone: formato } });
            if (usuario) break;
        }
        
        // Se n\u00e3o encontrou usu\u00e1rio, permitir acesso (ser\u00e1 tratado em outro lugar)
        if (!usuario) {
            return {
                ativo: true,
                mensagem: null
            };
        }
        
        // Verificar se usu\u00e1rio est\u00e1 ativo (1 = ativo, 0 = inativo)
        if (usuario.ativo === 0) {
            console.log(`\u26d4 [USUARIO_INATIVO] Usu\u00e1rio inativo: ${usuario.nome}`);
            return {
                ativo: false,
                mensagem: `\ud83d\udeab *Acesso aos Treinamentos Suspenso*\n\nOl\u00e1, ${usuario.nome}!\n\nSeu acesso aos treinamentos foi desativado pela empresa.\n\n\ud83d\udcdc *Voc\u00ea ainda pode:*\n\u2022 Acessar seus certificados j\u00e1 emitidos\n\u2022 Digite: *#meus_certificados*\n\n\ud83d\udcde Para mais informa\u00e7\u00f5es, entre em contato com o RH da sua empresa.`
            };
        }
        
        console.log(`\u2705 [USUARIO_ATIVO] Usu\u00e1rio ativo: ${usuario.nome}`);
        return {
            ativo: true,
            mensagem: null
        };
        
    } catch (error) {
        console.error('\u274c [USUARIO_ATIVO] Erro ao verificar status:', error);
        // Em caso de erro, permitir acesso
        return {
            ativo: true,
            mensagem: null
        };
    }
}

module.exports = { verificarUsuarioAtivo };
