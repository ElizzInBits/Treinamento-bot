// Configuração de URLs baseada no ambiente
const CONFIG = {
  API_BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api',
  
  WEBSOCKET_URL: window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : window.location.origin
};

// Substituir todas as URLs hardcoded
window.API_BASE_URL = CONFIG.API_BASE_URL;