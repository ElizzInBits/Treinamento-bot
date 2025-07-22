document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/contatos")
    .then(res => res.json())
    .then(contatos => {
      const tbody = document.querySelector("#tabelaContatos tbody");

      contatos.forEach(contato => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${contato.nome || '-'}</td>
          <td>${contato.telefone || '-'}</td>
          <td>${contato.email || '-'}</td>
          <td>${contato.cpf || '-'}</td>
          <td>${contato.statusTreinamento || '-'}</td>
          <td>${contato.empresaId || '—'}</td>
          <td>${contato.ultimaInteracao || '—'}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => {
      console.error("Erro ao buscar contatos:", err);
      alert("Erro ao carregar contatos.");
    });
});
