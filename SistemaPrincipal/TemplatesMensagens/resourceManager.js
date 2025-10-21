const fs = require('fs');
const path = require('path');

class ResourceManager {
    constructor() {
        this.resources = this.getDefaultResources();
    }

    getDefaultResources() {
        return {
            templates: {
                global: {
                    modulo_concluido: "🎯 *MÓDULO {{numero}} CONCLUÍDO!*\n\n📊 Resultado: {{acertos}}/{{total}} ({{percentual}}%)",
                    certificado_manutencao: "🔧 Sistema de certificados em manutenção. Certificado será enviado em breve.",
                    treinamento_interrompido: "🔄 Parece que seu treinamento foi interrompido.",
                    menu_opcoes: "📋 *MENU DE OPÇÕES*\n\nEscolha uma das opções abaixo:"
                },
                ssma: {
                    consideracoes_finais: "🎯 *CONSIDERAÇÕES FINAIS*\n\nParabéns por concluir o treinamento SSMA!",
                    treinamento_finalizado: "🎉 *TREINAMENTO SSMA FINALIZADO!*\n\nVocê concluiu com sucesso!"
                }
            },
            images: {
                ssma: {
                    NR06: "1ABC123_EXEMPLO",
                    SSMA: "1DEF456_EXEMPLO", 
                    SST: "1GHI789_EXEMPLO",
                    LEI: "1JKL012_EXEMPLO",
                    CIPA: "1MNO345_EXEMPLO",
                    PCMSO: "1PQR678_EXEMPLO",
                    MAPARISCO: "1STU901_EXEMPLO",
                    SEGURANCA: "1VWX234_EXEMPLO"
                }
            }
        };
    }

    getTemplate(treinamento, templateKey, variables = {}) {
        // Buscar template específico do treinamento
        let template = this.resources.templates?.[treinamento]?.[templateKey];
        
        // Fallback para template global
        if (!template) {
            template = this.resources.templates?.global?.[templateKey];
        }
        
        if (!template) {
            console.warn(`⚠️ Template não encontrado: ${treinamento}.${templateKey}`);
            return `Template não encontrado: ${templateKey}`;
        }

        // Substituir variáveis
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            template = template.replace(regex, variables[key]);
        });

        return template;
    }

    getImageId(treinamento, imageKey) {
        return this.resources.images?.[treinamento]?.[imageKey] || null;
    }

    getImageUrl(treinamento, imageKey) {
        const imageId = this.getImageId(treinamento, imageKey);
        return imageId ? `https://drive.google.com/uc?export=download&id=${imageId}` : null;
    }

    addTraining(treinamentoId, config) {
        if (!this.resources.templates[treinamentoId]) {
            this.resources.templates[treinamentoId] = {};
        }
        if (!this.resources.images[treinamentoId]) {
            this.resources.images[treinamentoId] = {};
        }

        // Adicionar templates
        if (config.templates) {
            Object.assign(this.resources.templates[treinamentoId], config.templates);
        }

        // Adicionar imagens
        if (config.images) {
            Object.assign(this.resources.images[treinamentoId], config.images);
        }

        this.saveResources();
        console.log(`✅ Treinamento ${treinamentoId} adicionado`);
    }

    reloadResources() {
        this.loadResources();
    }
}

module.exports = new ResourceManager();