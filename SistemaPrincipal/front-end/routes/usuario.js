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
router.post('/login', (req, res) => {
    const { email, cpf } = req.body;
    
    if (!email || !cpf) {
        return res.status(400).json({
            success: false,
            message: 'Email e CPF são obrigatórios'
        });
    }
    
    const contatos = lerContatos();
    const usuario = contatos.find(c => 
        c.email === email && c.cpf === cpf.replace(/\D/g, '')
    );
    
    if (usuario) {
        res.json({
            success: true,
            usuario: usuario
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Usuário não encontrado'
        });
    }
});

// Rota para atualizar dados do usuário
router.put('/atualizar', (req, res) => {
    const { cpf, nomeCompleto, email, telefone, nomeEmpresa } = req.body;
    
    if (!cpf) {
        return res.status(400).json({
            success: false,
            message: 'CPF é obrigatório para identificar o usuário'
        });
    }
    
    const contatos = lerContatos();
    const index = contatos.findIndex(c => c.cpf === cpf.replace(/\D/g, ''));
    
    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: 'Usuário não encontrado'
        });
    }
    
    // Atualizar dados
    contatos[index] = {
        ...contatos[index],
        nomeCompleto: nomeCompleto || contatos[index].nomeCompleto,
        email: email || contatos[index].email,
        telefone: telefone || contatos[index].telefone,
        nomeEmpresa: nomeEmpresa || contatos[index].nomeEmpresa
    };
    
    if (salvarContatos(contatos)) {
        res.json({
            success: true,
            message: 'Dados atualizados com sucesso',
            usuario: contatos[index]
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Erro ao salvar dados'
        });
    }
});

module.exports = router;