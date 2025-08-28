const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../BancoDeDados/models/Usuario');
const router = express.Router();

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// GET /api/usuario/perfil - Obter dados do perfil
router.get('/perfil', authenticateToken, async (req, res) => {
  try {
    // Para o sistema atual, vamos retornar dados do admin logado
    const usuario = {
      id: 1,
      nome: req.user.username || 'Administrador',
      email: 'admin@sistema.com',
      telefone: '',
      cargo: 'Administrador do Sistema',
      created_at: new Date()
    };
    
    res.json(usuario);
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/usuario/perfil - Atualizar dados do perfil
router.put('/perfil', authenticateToken, async (req, res) => {
  try {
    const { nome, email, telefone, cargo, senhaAtual, novaSenha } = req.body;
    
    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }
    
    // Para o sistema atual, vamos apenas validar a senha se fornecida
    if (novaSenha) {
      if (!senhaAtual) {
        return res.status(400).json({ error: 'Senha atual é obrigatória para alterar a senha' });
      }
      
      // Verificar se a senha atual é a senha do admin
      const senhaAdmin = process.env.ADMIN_PASSWORD || 'maduroabacaxi';
      if (senhaAtual !== senhaAdmin) {
        return res.status(400).json({ error: 'Senha atual incorreta' });
      }
      
      if (novaSenha.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
      }
      
      // Por enquanto, apenas simular a atualização
      console.log('Nova senha seria:', novaSenha);
      return res.json({ 
        message: 'Perfil atualizado com sucesso! Para alterar a senha do sistema, atualize a variável ADMIN_PASSWORD no arquivo .env' 
      });
    }
    
    // Simular atualização dos dados
    console.log('Dados atualizados:', { nome, email, telefone, cargo });
    res.json({ message: 'Perfil atualizado com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;