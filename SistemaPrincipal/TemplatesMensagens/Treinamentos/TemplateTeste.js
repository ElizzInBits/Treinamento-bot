// Template de mensagens para o treinamento: Marketing Digital
// Arquivo gerado automaticamente em 16/07/2025 10:30:15

const marketing_digital = {
  // Mensagens de boas-vindas
  boasVindas: {
    inicial: `Olá! Bem-vindo(a) ao treinamento "Marketing Digital"! 🎉`,
    confirmacao: `Sua inscrição no treinamento "Marketing Digital" foi confirmada com sucesso!`,
    instrucoes: `Você receberá todas as informações e materiais sobre o treinamento "Marketing Digital" em breve.`
  },

  // Mensagens de lembrete
  lembretes: {
    inicio: `⏰ Lembrete: O treinamento "Marketing Digital" começará em breve!`,
    material: `📚 Não se esqueça de baixar o material do treinamento "Marketing Digital".`,
    participacao: `Sua participação no treinamento "Marketing Digital" é muito importante!`
  },

  // Mensagens de acompanhamento
  acompanhamento: {
    progresso: `Como está sendo sua experiência no treinamento "Marketing Digital"?`,
    feedback: `Gostaríamos de saber sua opinião sobre o treinamento "Marketing Digital".`,
    suporte: `Precisa de ajuda com o treinamento "Marketing Digital"? Estamos aqui para ajudar!`
  },

  // Mensagens de encerramento
  encerramento: {
    conclusao: `Parabéns por concluir o treinamento "Marketing Digital"! 🎊`,
    certificado: `Seu certificado do treinamento "Marketing Digital" está disponível.`,
    agradecimento: `Obrigado por participar do treinamento "Marketing Digital"!`
  },

  // Mensagens personalizadas (adicione suas próprias mensagens aqui)
  personalizadas: {
    // Exemplo:
    // motivacional: `Continue firme no treinamento "Marketing Digital"! Você está indo muito bem!`
  }
};

// Função para obter mensagem por categoria e tipo
function obterMensagem(categoria, tipo) {
  if (marketing_digital[categoria] && marketing_digital[categoria][tipo]) {
    return marketing_digital[categoria][tipo];
  }
  return `Mensagem não encontrada para o treinamento "Marketing Digital".`;
}

// Função para obter todas as mensagens de uma categoria
function obterMensagensCategoria(categoria) {
  return marketing_digital[categoria] || {};
}

// Função para adicionar mensagem personalizada
function adicionarMensagemPersonalizada(chave, mensagem) {
  marketing_digital.personalizadas[chave] = mensagem;
}

module.exports = {
  templates: marketing_digital,
  obterMensagem,
  obterMensagensCategoria,
  adicionarMensagemPersonalizada,
  nomeTreinamento: "Marketing Digital",
  nomeArquivo: "marketing_digital",
  dataCriacao: "2025-07-16T13:30:15.000Z"
};