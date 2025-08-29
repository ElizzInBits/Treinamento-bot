// Sistema de gerenciamento de inatividade
class InactivityManager {
    
    constructor(timeoutMs = 3600000) { // 1 hora padrão
        this.timeoutMs = timeoutMs;
        this.timeoutId = null;
        this.warningTimeoutId = null;
        this.lastActivity = Date.now();
        this.warningShown = false;
        
        this.init();
    }
    
    init() {
        // Eventos que indicam atividade do usuário
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => this.resetTimer(), true);
        });
        
        this.resetTimer();
    }
    
    resetTimer() {
        this.lastActivity = Date.now();
        this.warningShown = false;
        
        // Limpar timers existentes
        if (this.timeoutId) clearTimeout(this.timeoutId);
        if (this.warningTimeoutId) clearTimeout(this.warningTimeoutId);
        
        // Aviso 5 minutos antes do logout
        this.warningTimeoutId = setTimeout(() => {
            this.showWarning();
        }, this.timeoutMs - 300000); // 5 minutos antes
        
        // Logout automático
        this.timeoutId = setTimeout(() => {
            this.performLogout();
        }, this.timeoutMs);
    }
    
    showWarning() {
        if (this.warningShown) return;
        this.warningShown = true;
        
        const modal = document.createElement('div');
        modal.id = 'inactivity-warning';
        modal.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            ">
                <div style="
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    text-align: center;
                    max-width: 400px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                ">
                    <h3 style="color: #f59e0b; margin-bottom: 1rem;">⚠️ Sessão Expirando</h3>
                    <p style="margin-bottom: 1.5rem;">Sua sessão expirará em 5 minutos por inatividade.</p>
                    <div style="display: flex; gap: 1rem; justify-content: center;">
                        <button id="extend-session" style="
                            background: #10b981;
                            color: white;
                            border: none;
                            padding: 0.75rem 1.5rem;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                        ">Continuar Sessão</button>
                        <button id="logout-now" style="
                            background: #ef4444;
                            color: white;
                            border: none;
                            padding: 0.75rem 1.5rem;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                        ">Sair Agora</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('extend-session').onclick = () => {
            document.body.removeChild(modal);
            this.resetTimer();
        };
        
        document.getElementById('logout-now').onclick = () => {
            this.performLogout();
        };
    }
    
    performLogout() {
        localStorage.removeItem('token');
        sessionStorage.clear();
        window.location.href = '/';
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (localStorage.getItem('token')) {
            window.inactivityManager = new InactivityManager();
        }
    });
} else {
    if (localStorage.getItem('token')) {
        window.inactivityManager = new InactivityManager();
    }
}
