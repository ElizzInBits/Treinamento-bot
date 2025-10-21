const LimpezaSessoes = require('../limpezaSessoes');

// Iniciar limpeza automática usando o sistema unificado
LimpezaSessoes.iniciarLimpezaAutomatica();

module.exports = { limparSessoesAntigas: LimpezaSessoes.executarLimpeza };