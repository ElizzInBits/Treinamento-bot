// wppConnectTemplate.js

const axios = require('axios');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');

const BASE_URL = 'http://92.112.178.26:21465';
const SESSION = 'NERDWHATS_AMERICA';
const TOKEN = '$2b$10$AqzeJt3CjST58yFhGSxCS.mIZSE_lR7ja9XCSiv0BoU8np4Hh_mpm'; 

async function sendMessage(phone, endpoint, body = {}) {
  console.log('🚀 CHAMANDO API:', phone, endpoint, body);
  try {
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
        }
      );
    }

    console.log('✅ SUCESSO NA API');
    return { success: true, data: response.data };
  } catch (err) {
    console.error('❌ ERRO NA API:', err.message);
    return {
      success: false,
      error: err.response?.data || err.message,
    };
  }
}

module.exports = { sendMessage };