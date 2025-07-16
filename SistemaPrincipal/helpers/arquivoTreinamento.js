const fs = require('fs');
const path = require('path');
function criarArquivoTreinamento(nomeArquivo, nomeTreinamento, descricaoTreinamento = '') {
  const pasta = path.join(__dirname, '..', 'SistemaPrincipal', 'TemplatesMensagens', 'Treinamentos');

  if (!fs.existsSync(pasta)) {
    fs.mkdirSync(pasta, { recursive: true });
  }

  const caminhoCompleto = path.join(pasta, `${nomeArquivo}.js`);
  const conteudo = `// Treinamento: ${nomeTreinamento}
// Descrição: ${descricaoTreinamento}
// Gerado automaticamente em ${new Date().toLocaleString('pt-BR')}

module.exports = {
  nome: "${nomeTreinamento}",
  descricao: "${descricaoTreinamento.replace(/"/g, '\\"')}"
};
`;

  fs.writeFileSync(caminhoCompleto, conteudo, 'utf8');
  return caminhoCompleto;
}
