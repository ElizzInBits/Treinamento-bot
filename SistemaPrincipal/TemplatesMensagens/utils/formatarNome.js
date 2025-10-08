// Função para encurtar nome completo para primeiro e segundo nome
function encurtarNome(nomeCompleto) {
    if (!nomeCompleto || typeof nomeCompleto !== 'string') {
        return nomeCompleto;
    }
    
    const partes = nomeCompleto.trim().split(' ').filter(parte => parte.length > 0);
    
    if (partes.length <= 2) {
        return nomeCompleto; // Já é curto
    }
    
    // Retorna primeiro e segundo nome
    return `${partes[0]} ${partes[1]}`;
}

module.exports = { encurtarNome };