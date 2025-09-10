const resourceManager = require('./resourceManager');

// Script para configurar novos treinamentos
function setupSSMA() {
    console.log('🔧 Configurando treinamento SSMA...');
    
    resourceManager.addTraining('ssma', {
        templates: {
            modulo1_inicio: "📖 *MÓDULO 1 - FUNDAMENTOS E PREVENÇÃO*\n\nVamos começar com os conceitos básicos de segurança.",
            modulo2_inicio: "🛡️ *MÓDULO 2 - CONTROLES E EQUIPAMENTOS*\n\nAgora vamos aprender sobre equipamentos de proteção.",
            treinamento_finalizado: "🎉 *TREINAMENTO SSMA CONCLUÍDO COM SUCESSO!*\n\n🏆 Parabéns! Você completou os 2 módulos do treinamento SSMA.",
            consideracoes_finais: "🎆 *CONSIDERAÇÕES FINAIS*\n\n🛡️ *Sua Segurança Depende de Você*\n• A Responsabilidade é individual e intransferível"
        },
        images: {
            SEGURANCA: "SEU_ID_SEGURANCA_AQUI",
            SSMA: "SEU_ID_SSMA_AQUI",
            CIPA: "SEU_ID_CIPA_AQUI",
            PCMSO: "SEU_ID_PCMSO_AQUI",
            LEI: "SEU_ID_LEI_AQUI",
            "NR 06": "SEU_ID_NR06_AQUI",
            SST: "SEU_ID_SST_AQUI",
            MAPARISCO: "SEU_ID_MAPARISCO_AQUI"
        }
    });
}

function setupNR35() {
    console.log('🔧 Configurando treinamento NR-35...');
    
    resourceManager.addTraining('nr35', {
        templates: {
            modulo1_inicio: "🏗️ *MÓDULO 1 - TRABALHO EM ALTURA*\n\nVamos aprender sobre segurança em trabalhos em altura.",
            treinamento_finalizado: "🎉 *TREINAMENTO NR-35 CONCLUÍDO!*\n\n🏆 Agora você está capacitado para trabalhos em altura com segurança!"
        },
        images: {
            ALTURA: "SEU_ID_ALTURA_AQUI",
            EPI_ALTURA: "SEU_ID_EPI_ALTURA_AQUI",
            ANCORAGEM: "SEU_ID_ANCORAGEM_AQUI"
        }
    });
}

// Executar configurações
if (require.main === module) {
    setupSSMA();
    setupNR35();
    console.log('✅ Treinamentos configurados!');
    console.log('📝 Edite o arquivo resources.json para adicionar os IDs das imagens do Google Drive');
}

module.exports = { setupSSMA, setupNR35 };