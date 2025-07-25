// wppConnectTemplate.js

const axios = require('axios');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');

const BASE_URL = 'http://92.112.178.26:21465';
const SESSION = 'NERDWHATS_AMERICA';
const TOKEN = '$2b$10$RH.nxhsrH3Abrb30YskW2uHuFUMZGv5OKulj17hxLTCvLAF05qIhG'; 

async function sendMessage(phone, endpoint, body = {}) {
  try {
    console.log(`📤 API: Enviando para ${phone} via ${endpoint}:`, body);
    const payload = { phone, ...body };
    let response;

    if (body.path) {
      // Enviando arquivo via path com FormData
      const form = new FormData();
      form.append('phone', phone);
      form.append('caption', body.caption || '');
      form.append('filename', body.filename || 'file');
      form.append('file', fs.createReadStream(path.resolve(body.path)));

      response = await axios.post(
        `${BASE_URL}/api/${SESSION}/${endpoint}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${TOKEN}`,
          },
        }
      );
    } else {
      // Enviando texto, localização etc.
      response = await axios.post(
        `${BASE_URL}/api/${SESSION}/${endpoint}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${TOKEN}`,
          },
          timeout: 15000,
        }
      );
    }

    console.log(`✅ API: Mensagem enviada para ${phone}`);
    return { success: true, data: response.data };
  } catch (err) {
    console.error(`❌ API: Erro ao enviar para ${phone}:`, err.message);
    if (err.code === 'ECONNABORTED') {
      console.error('⏰ Timeout na requisição');
    }
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    }
    return {
      success: false,
      error: err.response?.data || err.message,
    };
  }
}

module.exports = { sendMessage };