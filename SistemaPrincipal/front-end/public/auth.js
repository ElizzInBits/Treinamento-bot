// Sistema de autenticação para proteger páginas
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
        if (!window.location.pathname.includes('login')) {
            window.location.href = '/login/login.html';
        }
        return false;
    }
    
    return true;
}

/*
// Verificar se o usuário voltou para a página (back/forward)
window.addEventListener('pageshow', function(event) {
    if (event.persisted && !window.location.pathname.includes('login')) {
        // Página foi carregada do cache, forçar nova autenticação
        localStorage.removeItem('adminToken');
        localStorage.removeItem('loginTime');
        window.location.href = '/login/login.html';
    }
});

// Limpar sessão quando a aba é fechada ou navegador é fechado
window.addEventListener('beforeunload', function() {
    if (!window.location.pathname.includes('login')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('loginTime');
    }
});*/

// Configurações de retry
const RETRY_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000,
    timeoutMs: 10000
};

// Função para fazer requisições autenticadas com retry
function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
        window.location.href = '/login/login.html';
        return Promise.reject('No token');
    }
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    // Só adicionar Content-Type se não for FormData e se body for string/objeto
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    
    return retryFetch(url, { ...options, headers }, 0)
        .catch(error => {
            console.error('Erro na requisição:', error);
            handleConnectionError(error);
            throw error;
        });
}

// Função de retry com backoff exponencial
async function retryFetch(url, options, attempt) {
    try {
        const response = await fetch(url, options);
        
        if (response.ok) {
            resetConnectionStatus();
        }
        
        return response;
    } catch (error) {
        if (attempt < RETRY_CONFIG.maxRetries && isRetryableError(error)) {
            console.warn(`Tentativa ${attempt + 1}/${RETRY_CONFIG.maxRetries} falhou. Tentando novamente...`);
            
            const delay = RETRY_CONFIG.retryDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return retryFetch(url, options, attempt + 1);
        }
        
        throw error;
    }
}

// Verificar se o erro é passível de retry
function isRetryableError(error) {
    return (
        error.name === 'TypeError' ||
        error.name === 'AbortError' ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('timeout')
    );
}

// Gerenciar status de conexão
let connectionStatus = {
    isOnline: true,
    consecutiveErrors: 0,
    lastErrorTime: null
};

function handleConnectionError(error) {
    connectionStatus.consecutiveErrors++;
    connectionStatus.lastErrorTime = Date.now();
    
    if (connectionStatus.consecutiveErrors >= 3) {
        connectionStatus.isOnline = false;
        showConnectionAlert();
    }
}

function resetConnectionStatus() {
    if (!connectionStatus.isOnline) {
        connectionStatus.isOnline = true;
        connectionStatus.consecutiveErrors = 0;
        hideConnectionAlert();
    }
}

function showConnectionAlert() {
    const existingAlert = document.getElementById('connectionAlert');
    if (existingAlert) return;
    
    const alert = document.createElement('div');
    alert.id = 'connectionAlert';
    alert.className = 'connection-alert';
    alert.innerHTML = `
        <div class="alert-content">
            <span class="alert-icon">⚠️</span>
            <div class="alert-text">
                <strong>Problemas de Conectividade</strong>
                <p>Verificando conexão com o servidor...</p>
            </div>
            <button onclick="retryConnection()" class="retry-btn">🔄 Tentar Novamente</button>
        </div>
    `;
    
    document.body.appendChild(alert);
}

function hideConnectionAlert() {
    const alert = document.getElementById('connectionAlert');
    if (alert) {
        alert.remove();
    }
}

function retryConnection() {
    hideConnectionAlert();
    verificarConectividadeAPI();
}

// Função de logout
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('loginTime');
    sessionStorage.clear();
    hideConnectionAlert();
    window.location.href = '/login/login.html';
}

// Função para verificar conectividade
function verificarConectividadeAPI() {
    return fetch('/api/health', {
        method: 'GET'
    })
    .then(response => {
        if (response.ok) {
            resetConnectionStatus();
            return true;
        }
        return false;
    })
    .catch((error) => {
        console.warn('API não está disponível:', error.message);
        handleConnectionError(error);
        return false;
    });
}

// Verificar autenticação ao carregar a página
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // Só verificar auth se não estiver na página de login
        if (!window.location.pathname.includes('login')) {
            checkAuth();
        }
    });
    
    // Verificar periodicamente se o token ainda existe
    setInterval(function() {
        if (!window.location.pathname.includes('login')) {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                window.location.href = '/login/login.html';
            }
        }
    }, 5000); // Verificar a cada 5 segundos
}
