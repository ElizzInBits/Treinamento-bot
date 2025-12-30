document.getElementById('cpf').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = value;
});

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const cpf = document.getElementById('cpf').value.replace(/\D/g, '');

    try {
        const response = await fetch('/api/usuario/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, cpf })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('userData', JSON.stringify(data.usuario));
            window.location.href = '/editar-usuario';
        } else {
            alert('Dados não encontrados. Verifique seu email e CPF.');
        }
    } catch (error) {
        alert('Erro ao acessar dados. Tente novamente.');
    }
});