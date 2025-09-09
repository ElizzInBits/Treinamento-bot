const fs = require('fs');
const path = require('path');

class ResourceManager {
    constructor() {
        this.resources = {};
        this.loadResources();
    }

    loadResources() {
        try {
            const resourcesPath = path.join(__dirname, 'resources.json');
            if (fs.existsSync(resourcesPath)) {
                const resourcesData = fs.readFileSync(resourcesPath, 'utf8');
                this.resources = JSON.parse(resourcesData);
                console.log('✅ Recursos carregados do arquivo JSON');
            } else {
                console.log('⚠️ Arquivo resources.json não encontrado, criando...');
                this.createDefaultResources();
            }
        } catch (error) {
            console.error('❌ Erro ao carregar recursos:', error);
            this.resources = {};
        }
    }

    createDefaultResources() {
        this.resources = {
            templates: {
                global: {
                    boas_vindas: "Olá {{nome}}, bem-vindo ao treinamento {{treinamento}}! 🎯",
                    erro_generico: "❌ Erro inesperado. Entre em contato com o suporte."
                },
                ssma: {
                    modulo1_inicio: "📖 *MÓDULO 1 - FUNDAMENTOS E PREVENÇÃO*",
                    modulo2_inicio: "🛡️ *MÓDULO 2 - CONTROLES E EQUIPAMENTOS*",
                    treinamento_finalizado: "🎉 *TREINAMENTO SSMA CONCLUÍDO!*"
                }
            },
            images: {
                ssma: {
                    SEGURANCA: "1ABC123_EXEMPLO",
                    SSMA: "1DEF456_EXEMPLO",
                    CIPA: "1GHI789_EXEMPLO"
                }
            }
        };
        this.saveResources();
    }

    saveResources() {
        try {
            const resourcesPath = path.join(__dirname, 'resources.json');
            fs.writeFileSync(resourcesPath, JSON.stringify(this.resources, null, 2));
            console.log('✅ Recursos salvos');
        } catch (error) {
            console.error('❌ Erro ao salvar recursos:', error);
        }
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