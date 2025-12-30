#!/usr/bin/env node

/**
 * Script para listar todos os telefones cadastrados no sistema
 * Uso: node listar-telefones.js
 */

const { Usuario } = require('./SistemaPrincipal/BancoDeDados/models');

async function listarTelefones() {
    try {
        console.log('\n📋 ===== TELEFONES CADASTRADOS =====\n');
        
        const contatos = await Usuario.findAll({
            attributes: ['id', 'nome', 'telefone', 'email', 'statusTreinamento'],
            order: [['nome', 'ASC']]
        });
        
        if (contatos.length === 0) {
            console.log('❌ Nenhum contato cadastrado no sistema\n');
            process.exit(0);
        }
        
        console.log(`✅ Total de ${contatos.length} contato(s) cadastrado(s):\n`);
        
        contatos.forEach((c, i) => {
            console.log(`${i + 1}. ${c.nome}`);
            console.log(`   ID: ${c.id}`);
            console.log(`   Telefone: ${c.telefone} (${c.telefone.length} dígitos)`);
            console.log(`   Email: ${c.email}`);
            console.log(`   Status: ${c.statusTreinamento}`);
            console.log('');
        });
        
        // Estatísticas
        const porTamanho = {};
        contatos.forEach(c => {
            const tamanho = c.telefone.length;
            porTamanho[tamanho] = (porTamanho[tamanho] || 0) + 1;
        });
        
        console.log('📊 Estatísticas por tamanho de telefone:');
        Object.keys(porTamanho).sort().forEach(tamanho => {
            console.log(`   ${tamanho} dígitos: ${porTamanho[tamanho]} contato(s)`);
        });
        
        console.log('\n✅ Listagem concluída!\n');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Erro ao listar telefones:', error);
        process.exit(1);
    }
}

listarTelefones();
