const { SessaoTreinamento } = require('./models');
const { Op } = require('sequelize');

class LimpezaSessoes {
  
  // Limpar sessões antigas (mais de 7 dias inativas)
  static async limparSessoesAntigas() {
    try {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

      const sessoesRemovidas = await SessaoTreinamento.destroy({
        where: {
          [Op.or]: [
            { ativo: false },
            { ultimaAtualizacao: { [Op.lt]: seteDiasAtras } }
          ]
        }
      });

      console.log(`🧹 Limpeza automática: ${sessoesRemovidas} sessões antigas removidas`);
      return sessoesRemovidas;
    } catch (error) {
      console.error('❌ Erro na limpeza de sessões:', error);
      return 0;
    }
  }

  // Limpar sessões duplicadas (mesmo telefone)
  static async limparSessoesDuplicadas() {
    try {
      const { sequelize } = require('./database');
      const telefones = await SessaoTreinamento.findAll({
        attributes: ['telefone'],
        group: ['telefone'],
        having: sequelize.literal('COUNT(*) > 1')
      });

      let totalRemovidas = 0;

      for (const item of telefones) {
        const sessoes = await SessaoTreinamento.findAll({
          where: { telefone: item.telefone },
          order: [['ultimaAtualizacao', 'DESC']]
        });

        // Manter apenas a mais recente
        if (sessoes.length > 1) {
          const paraRemover = sessoes.slice(1);
          for (const sessao of paraRemover) {
            await sessao.destroy();
            totalRemovidas++;
          }
        }
      }

      console.log(`🧹 Duplicatas removidas: ${totalRemovidas} sessões`);
      return totalRemovidas;
    } catch (error) {
      console.error('❌ Erro ao limpar duplicatas:', error);
      return 0;
    }
  }

  // Executar limpeza completa
  static async executarLimpeza() {
    console.log('🚀 Iniciando limpeza da tabela sessoes_treinamentos...');
    
    const antigas = await this.limparSessoesAntigas();
    const duplicadas = await this.limparSessoesDuplicadas();
    
    const total = antigas + duplicadas;
    console.log(`✅ Limpeza concluída: ${total} registros removidos`);
    
    return { antigas, duplicadas, total };
  }

  // Agendar limpeza automática (executar a cada 6 horas)
  static iniciarLimpezaAutomatica() {
    console.log('⏰ Limpeza automática de sessões iniciada (a cada 6 horas)');
    
    // Executar imediatamente
    this.executarLimpeza();
    
    // Agendar para repetir a cada 6 horas
    setInterval(() => {
      this.executarLimpeza();
    }, 6 * 60 * 60 * 1000); // 6 horas em ms
  }
}

module.exports = LimpezaSessoes;