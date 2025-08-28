const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Caminho para o arquivo de contatos
const contatosPath = path.join(__dirname, '..', '..', 'BancoDeDados', 'contatos.json');

// Função para ler contatos
function lerContatos() {
    try {
        if (fs.existsSync(contatosPath)) {
            const data = fs.readFileSync(contatosPath, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Erro ao ler contatos:', error);
        return [];
    }
}

// Função para salvar contatos
function salvarContatos(contatos) {
    try {
        fs.writeFileSync(contatosPath, JSON.stringify(contatos, null, 2));
        return true;
    } catch (error) {
        console.error('Erro ao salvar contatos:', error);
        return false;
    }
}

// Rota para login do usuário
router.post('/login', async (req, res) => {
    const { email, cpf } = req.body;
    
    if (!email || !cpf) {
        return res.status(400).json({
            success: false,
            message: 'Email e CPF são obrigatórios'
        });
    }
    
    try {
        // Buscar no banco de dados Sequelize
        const { Contato } = require('../../BancoDeDados/models');
        const usuario = await Contato.findOne({
            where: {
                email: email,
                cpf: cpf.replace(/\D/g, '')
            },
            include: ['empresaRef']
        });
        
        if (usuario) {
            res.json({
                success: true,
                usuario: {
                    nomeCompleto: usuario.nome,
                    cpf: usuario.cpf,
                    email: usuario.email,
                    telefone: usuario.telefone,
                    ddi: '+55',
                    nomeEmpresa: usuario.empresaRef?.razaoSocial || 'Não informado'
                }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para atualizar dados do usuário
router.put('/atualizar', async (req, res) => {
    const { cpf, nomeCompleto, email, telefone, nomeEmpresa } = req.body;
    
    if (!cpf) {
        return res.status(400).json({
            success: false,
            message: 'CPF é obrigatório para identificar o usuário'
        });
    }
    
    try {
        const { Contato } = require('../../BancoDeDados/models');
        const usuario = await Contato.findOne({
            where: { cpf: cpf.replace(/\D/g, '') }
        });
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        
        // Atualizar dados
        await usuario.update({
            nome: nomeCompleto || usuario.nome,
            email: email || usuario.email,
            telefone: telefone || usuario.telefone
        });
        
        res.json({
            success: true,
            message: 'Dados atualizados com sucesso',
            usuario: {
                nomeCompleto: usuario.nome,
                cpf: usuario.cpf,
                email: usuario.email,
                telefone: usuario.telefone,
                nomeEmpresa: nomeEmpresa
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router;