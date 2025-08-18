// Sistema de autenticação para proteger páginas
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
        window.location.href = '/login/login.html';
        return false;
    }
    
    // Verificar se o token é válido (opcional - pode fazer uma chamada para o servidor)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Date.now() / 1000;
        
        if (payload.exp < now) {
            localStorage.removeItem('adminToken');
            window.location.href = '/login/login.html';
            return false;
        }
    } catch (error) {
        localStorage.removeItem('adminToken');
        window.location.href = '/login/login.html';
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
    
    return fetch(url, { ...options, headers });
}

// Função de logout
function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/login/login.html';
}

// Verificar autenticação ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});