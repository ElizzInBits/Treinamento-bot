// Sistema de Notificações do Navegador
class BrowserNotifications {
    constructor() {
        this.permission = 'default';
        this.socket = null;
        this.init();
    }

    async init() {
        // Verificar se o navegador suporta notificações
        if (!('Notification' in window)) {
            console.warn('Este navegador não suporta notificações');
            return;
        }

        // Verificar permissão atual
        this.permission = Notification.permission;
        console.log('Permissão atual para notificações:', this.permission);

        // Conectar ao WebSocket
        this.connectWebSocket();

        // Solicitar permissão automaticamente se ainda não foi concedida
        if (this.permission === 'default') {
            await this.requestPermission();
        }
    }

    async requestPermission() {
        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                console.log('✅ Permissão para notificações concedida');
                this.showTestNotification();
            } else {
                console.log('❌ Permissão para notificações negada');
            }
            
            return permission;
        } catch (error) {
            console.error('Erro ao solicitar permissão:', error);
            return 'denied';
        }
    }

    connectWebSocket() {
        try {
            // Conectar ao Socket.IO
            this.socket = io();
            
            this.socket.on('connect', () => {
                console.log('✅ Conectado ao WebSocket para notificações');
            });

            // Escutar notificações de novo cadastro
            this.socket.on('browser-notification', (data) => {
                console.log('📱 Notificação recebida:', data);
                this.showNotification(data.titulo, data.mensagem, data.dados);
            });

            this.socket.on('disconnect', () => {
                console.log('❌ Desconectado do WebSocket');
            });

        } catch (error) {
            console.error('Erro ao conectar WebSocket:', error);
        }
    }

    showTestNotification() {
        this.showNotification(
            '🔔 Notificações Ativadas',
            'Você receberá notificações de novos cadastros',
            { tipo: 'test' }
        );
    }

    showNotification(title, message, data = {}) {
        if (this.permission !== 'granted') {
            console.warn('Permissão para notificações não concedida');
            return;
        }

        try {
            const notification = new Notification(title, {
                body: message,
                icon: '/home/Imagens/logo.png', // Usar logo da Salubritá
                badge: '/home/Imagens/logo.png',
                tag: data.tipo || 'default',
                requireInteraction: true, // Manter visível até o usuário interagir
                data: data
            });

            // Eventos da notificação
            notification.onclick = () => {
                console.log('Notificação clicada:', data);
                window.focus(); // Focar na janela
                notification.close();
                
                // Se for notificação de cadastro, pode redirecionar para lista de contatos
                if (data.tipo === 'novo_cadastro') {
                    // Opcional: redirecionar para página de contatos
                    // window.location.href = '/home/lista-contatos.html';
                }
            };

            notification.onclose = () => {
                console.log('Notificação fechada');
            };

            notification.onerror = (error) => {
                console.error('Erro na notificação:', error);
            };

            // Auto-fechar após 10 segundos se não for interativa
            if (!notification.requireInteraction) {
                setTimeout(() => {
                    notification.close();
                }, 10000);
            }

        } catch (error) {
            console.error('Erro ao mostrar notificação:', error);
        }
    }

    // Método para solicitar permissão manualmente
    async enableNotifications() {
        const permission = await this.requestPermission();
        return permission === 'granted';
    }

    // Verificar se notificações estão habilitadas
    isEnabled() {
        return this.permission === 'granted';
    }
    
    // Mostrar instruções para ativar notificações
    showInstructions() {
        const userAgent = navigator.userAgent;
        let instructions = '';
        
        if (userAgent.includes('Chrome')) {
            instructions = `
🔔 **Como ativar notificações no Chrome:**

1. Clique no ícone de cadeado 🔒 na barra de endereços
2. Clique em "Notificações"
3. Selecione "Permitir"
4. Recarregue a página

OU

1. Vá em Configurações > Privacidade e segurança > Configurações do site
2. Clique em "Notificações"
3. Adicione este site à lista de permitidos`;
        } else if (userAgent.includes('Firefox')) {
            instructions = `
🔔 **Como ativar notificações no Firefox:**

1. Clique no ícone de escudo 🛡️ na barra de endereços
2. Clique em "Notificações bloqueadas"
3. Selecione "Permitir"
4. Recarregue a página`;
        } else if (userAgent.includes('Safari')) {
            instructions = `
🔔 **Como ativar notificações no Safari:**

1. Vá em Safari > Preferências
2. Clique na aba "Sites"
3. Selecione "Notificações" na barra lateral
4. Encontre este site e altere para "Permitir"`;
        } else {
            instructions = `
🔔 **Como ativar notificações:**

1. Procure o ícone de notificações na barra de endereços
2. Clique e selecione "Permitir"
3. Recarregue a página

Ou vá nas configurações do navegador e permita notificações para este site.`;
        }
        
        return instructions;
    }
}

// Inicializar sistema de notificações
let browserNotifications;

// Função para inicializar
function initBrowserNotifications() {
    try {
        browserNotifications = new BrowserNotifications();
        window.browserNotifications = browserNotifications;
        console.log('✅ Sistema de notificações inicializado');
    } catch (error) {
        console.error('❌ Erro ao inicializar notificações:', error);
    }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBrowserNotifications);
} else {
    // DOM já carregado
    initBrowserNotifications();
}

// Exportar para uso global
window.BrowserNotifications = BrowserNotifications;