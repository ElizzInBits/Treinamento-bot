const { Usuario } = require('../../BancoDeDados/models');

/**
 * Atualiza os dados (nome e email) de um usuário no banco de dados
 * @param {string} telefone - Telefone do usuário (com ou sem código do país)
 * @param {string} nome - Novo nome completo do usuário
 * @param {string} email - Novo email do usuário
 * @returns {Promise<boolean>} - true se atualizado com sucesso, false caso contrário
 */
async function atualizarDadosUsuario(telefone, nome, email) {
    try {
        // Remover @c.us se presente
        const telefoneLimpo = telefone.replace('@c.us', '');
        
        // Tentar diferentes formatos de telefone
        const formatosTelefone = [
            telefoneLimpo,                           // 553399595511
            telefoneLimpo.substring(2),              // 3399595511  
            `${telefoneLimpo.substring(0, 4)}9${telefoneLimpo.substring(4)}`, // 5533999595511 (adicionar 9)
            telefoneLimpo.length === 13 ? telefoneLimpo.substring(0, 4) + telefoneLimpo.substring(5) : telefoneLimpo, // 5533999595511 -> 553399595511 (remover 9º dígito)
        ];
        
        let contato = null;
        let formatoEncontrado = null;
        
        for (const formato of formatosTelefone) {
            contato = await Usuario.findOne({ where: { telefone: formato } });
            if (contato) {
                formatoEncontrado = formato;
                break;
            }
        }
        
        if (contato) {
            // Atualizar nome e email
            await contato.update({
                nome: nome,
                nomeCompleto: nome,
                email: email
            });
            
            console.log(`✅ [ATUALIZAR_DADOS] Dados atualizados com sucesso:`);
            console.log(`   📞 Telefone: ${formatoEncontrado}`);
            console.log(`   👤 Nome: ${nome}`);
            console.log(`   📧 Email: ${email}`);
            
            return true;
        } else {
            console.log(`⚠️ [ATUALIZAR_DADOS] Usuário não encontrado para telefone: ${telefoneLimpo}`);
            return false;
        }
    } catch (error) {
        console.error('❌ [ATUALIZAR_DADOS] Erro ao atualizar dados do usuário:', error);
        return false;
    }
}

module.exports = { atualizarDadosUsuario };
