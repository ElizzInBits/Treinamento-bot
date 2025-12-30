#!/usr/bin/env node

/**
 * Script para testar se um telefone está cadastrado no sistema
 * Uso: node testar-telefone.js 5533999595511
 */

const { Usuario } = require('./SistemaPrincipal/BancoDeDados/models');
const { Op } = require('sequelize');

function limparNumero(numero) {
    return numero.replace(/\D/g, '').replace(/@c\.us$/, '');
}

function gerarVariacoes(numeroCompleto) {
    const limpo = limparNumero(numeroCompleto);
    const variacoes = [limpo];
    
    if (limpo.length === 10) {
        variacoes.push(limpo.slice(0, 2) + '9' + limpo.slice(2));
        variacoes.push('55' + limpo);
        variacoes.push('55' + limpo.slice(0, 2) + '9' + limpo.slice(2));
    }
    else if (limpo.length === 11 && limpo.charAt(2) === '9') {
        variacoes.push(limpo.slice(0, 2) + limpo.slice(3));
        variacoes.push('55' + limpo);
        variacoes.push('55' + limpo.slice(0, 2) + limpo.slice(3));
    }
    else if (limpo.length === 12 && limpo.startsWith('55')) {
        variacoes.push(limpo.slice(2));
        variacoes.push(limpo.slice(0, 4) + '9' + limpo.slice(4));
        variacoes.push(limpo.slice(2, 4) + '9' + limpo.slice(4));
    }
    else if (limpo.length === 13 && limpo.startsWith('55') && limpo.charAt(4) === '9') {
        variacoes.push(limpo.slice(2));
        variacoes.push(limpo.slice(0, 4) + limpo.slice(5));
        variacoes.push(limpo.slice(2, 4) + limpo.slice(5));
    }

    return [...new Set(variacoes)];
}

async function testarTelefone(telefone) {
    try {
        console.log('\n🔍 ===== TESTE DE TELEFONE =====');
        console.log(`📞 Telefone informado: ${telefone}`);
        
        const telefoneLimpo = limparNumero(telefone);
        console.log(`🧹 Telefone limpo: ${telefoneLimpo} (${telefoneLimpo.length} dígitos)`);
        
        const variacoes = gerarVariacoes(telefoneLimpo);
        console.log(`🔢 Variações geradas (${variacoes.length}):`);
        variacoes.forEach((v, i) => console.log(`   ${i + 1}. ${v} (${v.length} dígitos)`));
        
        console.log('\n🔎 Buscando no banco de dados...');
        
        const contatos = await Usuario.findAll({
            where: {
                telefone: {
                    [Op.in]: variacoes
                }
            }
        });
        
        console.log('\n📊 ===== RESULTADO =====');
        
        if (contatos.length > 0) {
            console.log(`✅ ${contatos.length} contato(s) encontrado(s):\n`);
            contatos.forEach((c, i) => {
                console.log(`${i + 1}. ${c.nome}`);
                console.log(`   ID: ${c.id}`);
                console.log(`   Telefone: ${c.telefone}`);
                console.log(`   Email: ${c.email}`);
                console.log(`   Status: ${c.statusTreinamento}`);
                console.log(`   Empresa ID: ${c.empresaId}`);
                console.log('');
            });
        } else {
            console.log('❌ Nenhum contato encontrado com este telefone');
            console.log('\n💡 Dicas:');
            console.log('   - Verifique se o telefone está cadastrado corretamente');
            console.log('   - Tente buscar diretamente no banco de dados');
            console.log('   - Verifique os logs do bot para ver qual número está sendo enviado');
        }
        
        console.log('\n✅ Teste concluído!\n');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Erro ao testar telefone:', error);
        process.exit(1);
    }
}

// Pegar telefone da linha de comando
const telefone = process.argv[2];

if (!telefone) {
    console.log('\n❌ Erro: Telefone não informado');
    console.log('\n📖 Uso: node testar-telefone.js <telefone>');
    console.log('   Exemplo: node testar-telefone.js 5533999595511');
    console.log('   Exemplo: node testar-telefone.js 33999595511');
    console.log('   Exemplo: node testar-telefone.js 3399595511\n');
    process.exit(1);
}

testarTelefone(telefone);
