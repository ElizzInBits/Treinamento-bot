let userData = null;

// CARREGAR DADOS DO USUÁRIO
window.addEventListener('load', function () {
    const storedData = localStorage.getItem('userData');
    if (!storedData) {
        alert('Sessão expirada. Faça login novamente.');
        window.location.href = '/usuario-login';
        return;
    }

    userData = JSON.parse(storedData);
    displayUserData();
});

function displayUserData() {
    document.getElementById('viewNome').textContent = userData.nomeCompleto || '-';
    document.getElementById('viewCpf').textContent = formatCpf(userData.cpf) || '-';
    document.getElementById('viewEmail').textContent = userData.email || '-';
    document.getElementById('viewTelefone').textContent = formatTelefone(userData.ddi, userData.telefone) || '-';
    document.getElementById('viewEmpresa').textContent = userData.nomeEmpresa || '-';
}

function toggleEditMode() {
    const viewMode = document.getElementById('viewMode');
    const editMode = document.getElementById('editMode');
    const title = document.getElementById('pageTitle');

    if (viewMode.style.display === 'none') {
        viewMode.style.display = 'block';
        editMode.style.display = 'none';
        title.textContent = "Meus Dados";
    } else {
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
        fillEditForm();
    }
}

function fillEditForm() {
    document.getElementById('editNome').value = userData.nomeCompleto || '';
    document.getElementById('editEmail').value = userData.email || '';
    document.getElementById('editTelefone').value = userData.telefone || '';
    document.getElementById('editEmpresa').value = userData.nomeEmpresa || '';
}

document.getElementById('editForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const updatedData = {
        nomeCompleto: document.getElementById('editNome').value,
        email: document.getElementById('editEmail').value,
        telefone: document.getElementById('editTelefone').value,
        nomeEmpresa: document.getElementById('editEmpresa').value
    };

    try {
        const response = await fetch('/api/usuario/atualizar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...updatedData, cpf: userData.cpf })
        });

        const result = await response.json();

        if (result.success) {
            userData = { ...userData, ...updatedData };
            localStorage.setItem('userData', JSON.stringify(userData));
            displayUserData();
            toggleEditMode();
            alert('Dados atualizados com sucesso!');
        } else {
            alert('Erro ao atualizar dados: ' + result.message);
        }
    } catch (error) {
        alert('Erro ao atualizar dados. Tente novamente.');
    }
});

function formatCpf(cpf) {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatTelefone(ddi, telefone) {
    if (!telefone) return '';

    telefone = telefone.replace(/\D/g, '');

    if (telefone.length === 13 && telefone.startsWith('55')) {
        telefone = telefone.substring(2);
    }

    if (telefone.length === 12 && telefone.startsWith('55')) {
        telefone = telefone.substring(2);
    }

    if (telefone.length === 11) {
        const ddd = telefone.substring(0, 2);
        const parte1 = telefone.substring(2, 7);
        const parte2 = telefone.substring(7);
        return `${ddi || '+55'} (${ddd}) ${parte1}-${parte2}`;
    }

    return telefone;
}