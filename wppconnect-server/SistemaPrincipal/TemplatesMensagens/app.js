const { sendMessage } = require('./conexao/wppConnectTemplate');

async function main() {
  // ✅ Envio de texto simples
  const textoSimples = await sendMessage(
    ['553399595511'],
    'send-message',
    { message: 'Olá! Teste mensagem texto simples.' }
  );
  console.log('Resultado mensagem simples:', textoSimples);

  // ✅ Envio de imagem via path (sem base64)
  const envioArquivo = await sendMessage(
    '553399595511',
    'send-file',
    {
      path: './media/foto.jpg', // caminho relativo à pasta onde o script está
      filename: 'foto.jpg',
      caption: 'Imagem test'
    }
  );
  console.log('Resultado envio arquivo por path:', envioArquivo);

  const envioArquivoVideo = await sendMessage(
    '553399595511',
    'send-file',
    {
      path: './media/video.mp4', // caminho relativo à pasta onde o script está
      filename: 'foto.jpg',
      caption: 'Imagem test'
    }
  );
  console.log('Resultado envio arquivo por path:', envioArquivo);

  const envioPDF= await sendMessage(
    '553399595511',
    'send-file',
    {
      path: './media/Treinamento-no-whatsapp-ferramnetas.pdf', // caminho relativo à pasta onde o script está
      filename: 'foto.jpg',
      caption: 'Imagem test'
    }
  );
  console.log('Resultado envio arquivo por path:', envioArquivo);

  // ✅ Envio de localização
  const envioLocalizacao = await sendMessage(
    '553399595511',
    'send-location',
    {
      lat: '-22.9068',
      lng: '-43.1729',
      title: 'Rio de Janeiro',
      address: 'Av. Atlântica, Copacabana'
    }
  );
  console.log('Resultado envio localização:', envioLocalizacao);

  // ✅ Envio de lista
  const listMessage = await sendMessage(
    '553399595511',
    'send-list-message',
    {
      title: 'Menu de Opções',
      description: 'Escolha uma das opções abaixo:',
      buttonText: 'Abrir lista',
      listType: 'SINGLE_SELECT',
      sections: [
        {
          title: 'Frutas',
          rows: [
            { id: 'id_1', title: 'Maçã', description: 'Deliciosa maçã vermelha' },
            { id: 'id_2', title: 'Banana', description: 'Banana madura' }
          ]
        },
        {
          title: 'Legumes',
          rows: [
            { id: 'id_3', title: 'Cenoura', description: 'Cenoura fresca' },
            { id: 'id_4', title: 'Alface', description: 'Alface crocante' }
          ]
        }
      ]
    }
  );
  console.log('Resultado envio lista:', listMessage);
}

main();
