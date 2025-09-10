const fs = require('fs');
const path = require('path');

class TemplateManager {
    constructor() {
        this.templates = {};
        this.loadTemplates();
    }

    loadTemplates() {
        try {
            const templatesPath = path.join(__dirname, 'templates.json');
            const templatesData = fs.readFileSync(templatesPath, 'utf8');
            this.templates = JSON.parse(templatesData);
            console.log('✅ Templates carregados do arquivo JSON');
        } catch (error) {
            console.error('❌ Erro ao carregar templates:', error);
            this.templates = {};
        }
    }

    getMessage(templateKey, variables = {}) {
        let template = this.templates[templateKey];
        if (!template) {
            console.warn(`⚠️ Template não encontrado: ${templateKey}`);
            return `Template não encontrado: ${templateKey}`;
        }

        // Substituir variáveis no template
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            template = template.replace(regex, variables[key]);
        });

        return template;
    }

    reloadTemplates() {
        this.loadTemplates();
    }

    saveTemplate(chave, conteudo) {
        this.templates[chave] = conteudo;
        console.log(`✅ Template salvo em memória: ${chave}`);
    }
}

module.exports = new TemplateManager();