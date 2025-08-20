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

// Função para fazer requisições autenticadas
function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
        window.location.href = '/login/login.html';
        return Promise.reject('No token');
    }
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
    };
    
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
}