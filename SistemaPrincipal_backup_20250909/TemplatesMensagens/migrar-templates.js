const templateManager = require('./templateManager');
const fs = require('fs');
const path = require('path');

function migrarTemplates() {
    console.log('✅ Templates já estão no formato JSON - nenhuma migração necessária!');
    console.log('📝 Para editar templates, modifique o arquivo templates.json');
}

// Executar se chamado diretamente
if (require.main === module) {
    migrarTemplates();
}

module.exports = { migrarTemplates };