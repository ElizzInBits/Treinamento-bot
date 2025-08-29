// Limpar dados de sessão ao carregar a página de login
window.addEventListener('load', function() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('loginTime');
});

// Limpar dados quando a página é recarregada ou o usuário volta
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('loginTime');
    }
});

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    
    try {
        const response = await fetch('https://salubrita-bot.ddns.net/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('loginTime', Date.now().toString());
            window.location.href = '/home/home-index.html';
        } else {
            errorMessage.textContent = data.message || 'Credenciais inválidas';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        errorMessage.textContent = 'Erro ao conectar com o servidor';
        errorMessage.style.display = 'block';
    }
});
