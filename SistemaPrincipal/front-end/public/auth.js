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
});

// Função para fazer requisições autenticadas
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
    
    return fetch(url, { ...options, headers }).catch(error => {
        console.error('Erro na requisição:', error);
        throw error;
    });
}

// Função de logout
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('loginTime');
    sessionStorage.clear();
    window.location.href = '/login/login.html';
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