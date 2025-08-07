const wppconnect = require('@wppconnect-team/wppconnect');
const { connectDB, sequelize } = require('./BancoDeDados/database');
const Message = require('./BancoDeDados/models/message');
const Contato = require('./BancoDeDados/models/contato');

// Conectar ao banco
(async () => {
  await connectDB();
  await sequelize.sync();
  console.log('✅ Banco conectado');
})();

console.log('🚀 Iniciando bot...');

wppconnect.create({
  session: 'NERDWHATS_AMERICA',
  headless: true,
  catchQR: (base64Qr, asciiQR) => {
    console.log('\n📱 ESCANEIE O QR CODE:');
    console.log(asciiQR);
  },
  statusFind: (status) => {
    console.log('📶 Status:', status);
  }
}).then(client => {
  console.log('✅ Bot conectado!');
  
  client.onMessage(async (message) => {
    if (message.isGroupMsg) return;
    
    const sender = message.from.replace('@c.us', '');
    const text = message.body?.toLowerCase() || '';
    
    const contato = await Contato.findOne({ where: { telefone: sender } });
    if (!contato) return;
    
    console.log(`📩 ${sender}: ${text}`);
    
    await Message.create({ sender, body: text });
    
    if (text === 'oi') {
      await client.sendListMessage(sender, {
        title: 'Menu',
        description: 'Escolha uma opção:',
        buttonText: 'Ver opções',
        sections: [{
          title: 'Opções',
          rows: [
            { id: 'img', title: '📷 Imagem' },
            { id: 'vid', title: '🎥 Vídeo' },
            { id: 'pdf', title: '📄 PDF' }
          ]
        }]
      });
    }
  });
}).catch(err => {
  console.error('❌ Erro:', err);
});