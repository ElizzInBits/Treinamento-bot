// Módulo para notificações do Google usando Firebase Cloud Messaging
const admin = require('firebase-admin');

// Configuração do Firebase Admin SDK
let firebaseApp = null;

/**
 * Inicializa o Firebase Admin SDK
 */
function inicializarFirebase() {
    try {
        // Verificar se já foi inicializado
        if (firebaseApp) {
            return firebaseApp;
        }

        // Configuração usando variáveis de ambiente ou arquivo de configuração
        const serviceAccount = {
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID || "treinamento-bot-notifications",
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
        };

        // Inicializar Firebase Admin
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });

        console.log('✅ Firebase Admin SDK inicializado com sucesso');
        return firebaseApp;

    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        return null;
    }
}

/**
 * Notificação específica para novo cadastro
 */
async function notificarNovoCadastro(contato) {
    try {
        if (!firebaseApp) {
            firebaseApp = inicializarFirebase();
        }

        if (!firebaseApp) {
            console.log('⚠️ Firebase não configurado - notificação não enviada');
            return;
        }

        const titulo = '🆕 Novo Cadastro Realizado';
        const mensagem = `${contato.nome} se cadastrou no sistema de treinamentos`;
        
        const message = {
            notification: {
                title: titulo,
                body: mensagem
            },
            data: {
                tipo: 'novo_cadastro',
                contatoId: contato.id.toString(),
                nome: contato.nome,
                telefone: contato.telefone,
                email: contato.email,
                timestamp: new Date().toISOString()
            },
            topic: 'admin-notifications'
        };

        const response = await admin.messaging().send(message);
        console.log('✅ Notificação de novo cadastro enviada:', response);
        
    } catch (error) {
        console.error('❌ Erro ao notificar novo cadastro:', error);
        // Não propagar erro para não afetar o cadastro
    }
}

module.exports = {
    inicializarFirebase,
    notificarNovoCadastro
};