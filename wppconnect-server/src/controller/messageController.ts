import { Request, Response } from 'express';
import { unlinkAsync } from '../util/functions';

function returnError(req: Request, res: Response, error: any) {
  req.logger?.error?.(error);

  if (res.headersSent) {
    return;
  }

  return res.status(500).json({
    status: 'Error',
    message: 'Erro ao enviar a mensagem.',
    error: error?.message || error,
  });
}

function returnSucess(res: Response, data: any) {
  if (res.headersSent) {
    return;
  }
  return res.status(201).json({ status: 'success', response: data, mapper: 'return' });
}

export async function sendMessage(req: Request, res: Response) {
  const { phone, message } = req.body;
  const options = req.body.options || {};

  if (!req.client) {
    return res.status(500).json({ error: 'Cliente WPPConnect não está disponível' });
  }

  const phones = Array.isArray(phone) ? phone : [phone];

  try {
    const results: any = [];

    for (const contato of phones) {
      const result = await req.client.sendText(contato, message, options);
      results.push(result);
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'Nenhuma mensagem foi enviada.' });
    }

    req.io.emit('mensagem-enviada', results);
    return returnSucess(res, results);
  } catch (error) {
    return returnError(req, res, error);
  }
}

export async function editMessage(req: Request, res: Response) {
  const { id, newText } = req.body;
  const options = req.body.options || {};

  if (!req.client) {
    return res.status(500).json({ error: 'Cliente WPPConnect não está disponível' });
  }

  try {
    const edited = await (req.client as any).editMessage(id, newText, options);
    req.io.emit('edited-message', edited);
    return returnSucess(res, edited);
  } catch (error) {
    return returnError(req, res, error);
  }
}

export async function sendFile(req: Request, res: Response) {
  const {
    phone,
    path,
    base64,
    filename = 'file',
    message,
    caption,
    quotedMessageId,
  } = req.body;

  const options = req.body.options || {};

  if (!req.client) {
    return res.status(500).json({ error: 'Cliente WPPConnect não está disponível' });
  }

  if (!path && !req.file && !base64) {
    return res.status(401).send({
      message: 'Sending the file is mandatory',
    });
  }

  const pathFile = path || base64 || req.file?.path;
  const msg = message || caption;

  try {
    const results: any = [];
    const phones = Array.isArray(phone) ? phone : [phone];
    
    for (const contact of phones) {
      results.push(
        await req.client.sendFile(contact, pathFile, {
          filename: filename,
          caption: msg,
          quotedMsg: quotedMessageId,
          ...options,
        })
      );
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'Error sending message' });
    }
    
    if (req.file) await unlinkAsync(pathFile);
    return returnSucess(res, results);
  } catch (error) {
    return returnError(req, res, error);
  }
}

export async function sendVoice(req: Request, res: Response) {
  const {
    phone,
    path,
    filename = 'Voice Audio',
    message,
    quotedMessageId,
  } = req.body;

  if (!req.client) {
    return res.status(500).json({ error: 'Client not initialized' });
  }
  
  if (!phone || !path) {
    return res.status(400).json({ error: 'Missing phone or path' });
  }

  const phones = Array.isArray(phone) ? phone : [phone];

  try {
    const results: any = [];

    for (const contato of phones) {
      const result = await req.client.sendPtt(
        contato,
        path,
        filename,
        message,
        quotedMessageId
      );
      results.push(result);
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'Error sending message' });
    }

    return returnSucess(res, results);
  } catch (error) {
    console.error('Error in sendVoice:', error);
    return returnError(req, res, error);
  }
}

export async function sendVoice64(req: Request, res: Response) {
  const { phone, base64Ptt, quotedMessageId } = req.body;

  if (!req.client) {
    return res.status(500).json({ error: 'Cliente WPPConnect não está disponível' });
  }

  try {
    const results: any = [];
    const phones = Array.isArray(phone) ? phone : [phone];
    
    for (const contato of phones) {
      results.push(
        await req.client.sendPttFromBase64(
          contato,
          base64Ptt,
          'Voice Audio',
          '',
          quotedMessageId
        )
      );
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'Error sending message' });
    }
    
    return returnSucess(res, results);
  } catch (error) {
    return returnError(req, res, error);
  }
}

export async function sendLinkPreview(req: Request, res: Response) {
  const { phone, url, caption } = req.body;

  if (!req.client) {
    return res.status(500).json({ error: 'Cliente WPPConnect não está disponível' });
  }

  try {
    const results: any = [];
    const phones = Array.isArray(phone) ? phone : [phone];
    
    for (const contato of phones) {
      results.push(
        await req.client.sendLinkPreview(`${contato}`, url, caption)
      );
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'Error sending message' });
    }
    
    return returnSucess(res, results);
  } catch (error) {
    return returnError(req, res, error);
  }
}

export async function sendLocation(req: Request, res: Response) {
  const { phone, lat, lng, title, address } = req.body;

  if (!req.client) {
    return res.status(500).json({ error: 'Cliente WPPConnect não está disponível' });
  }

  try {
    const results: any = [];
    const phones = Array.isArray(phone) ? phone : [phone];
    
    for (const contato of phones) {
      results.push(
        await req.client.sendLocation(contato, {
          lat: lat,
          lng: lng,
          address: address,
          name: title,
        })
      );
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'Error sending message' });
    }
    
    return returnSucess(res, results);
  } catch (error) {
    return returnError(req, res, error);
  }
}

export async function sendButtons(req: Request, res: Response) {
  const { phone, message, options } = req.body;

  if (!req.client) {
    return res.status(500).json({ error: 'Cliente WPPConnect não está disponível' });
  }

  try {
    const results: any = [];
    const phones = Array.isArray(phone) ? phone : [phone];

    for (const contact of phones) {
      results.push(await req.client.sendText(contact, message, options));
    }

    if (results.length === 0) {
      return returnError(req, res, 'Error sending message with buttons');
    }

    return returnSucess(res, results);
  } catch (error) {
    return returnError(req, res, error);
  }
}

export async function sendListMessage(req: Request, res: Response) {
  const {
    phone,
    description = '',
    sections,
    buttonText = 'SELECIONE UMA OPÇÃO',
  } = req.body;

  if (!req.client) {
    return res.status(500).json({ error: 'Cliente WPPConnect não está disponível' });
  }

  try {
    const results: any = [];
    const phones = Array.isArray(phone) ? phone : [phone];

    for (const contact of phones) {
      results.push(
        await req.client.sendListMessage(contact, {
          buttonText: buttonText,
          description: description,
          sections: sections,
        })
      );
    }

    if (results.length === 0) {
      return returnError(req, res, 'Error sending list buttons');
    }

    return returnSucess(res, results);
  } catch (error) {
    return returnError(req, res, error);
  }
}

export async function sendOrderMessage(req: Request, res: Response) {
  const { phone, items } = req.body;
  const options = req.body.options || {};

  if (!req.client) {
    return res.status(500).json({ error: 'Cliente WPPConnect não está disponível' });
  }

  try {
    const results: any = [];
    const phones = Array.isArray(phone) ? phone : [phone];
    
    for (const contato of phones) {
      results.push(await req.client.sendOrderMessage(contato, items, options));
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'Error sending order message' });
    }
    
    req.io.emit('mensagem-enviada', results);
    return returnSucess(res, results);
  } catch (error) {
    return returnError(req, res, error);
  }
}

export async function sendPollMessage(req: Request, res: Response) {
  const { phone, name, choices, options } = req.body;

  if (!req.client) {
    return res.status(500).json({ error: 'Cliente WPPConnect não está disponível' });
  }

  try {
    const results: any = [];
    const phones = Array.isArray(phone) ? phone : [phone];

    for (const contact of phones) {
      results.push(
        await req.client.sendPollMessage(contact, name, choices, options)
      );
    }

    if (results.length === 0) {
      return returnError(req, res, 'Error sending poll message');
    }

    return returnSucess(res, results);
  } catch (error) {
    return returnError(req, res, error);
  }
}

export async function sendStatusText(req: Request, res: Response) {
  const { message } = req.body;

  if (!req.client) {
    return res.status(500).json({ error: 'Cliente WPPConnect não está disponível' });
  }

  try {
    const results: any = [];
    results.push(await req.client.sendText('status@broadcast', message));

    if (results.length === 0) {
      return res.status(400).json({ error: 'Error sending message' });
    }
    
    return returnSucess(res, results);
  } catch (error) {
    return returnError(req, res, error);
  }
}

export async function replyMessage(req: Request, res: Response) {
  const { phone, message, messageId } = req.body;

  if (!req.client) {
    return res.status(500).json({ error: 'Cliente WPPConnect não está disponível' });
  }

  try {
    const results: any = [];
    const phones = Array.isArray(phone) ? phone : [phone];
    
    for (const contato of phones) {
      results.push(await req.client.reply(contato, message, messageId));
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'Error sending message' });
    }
    
    req.io.emit('mensagem-enviada', { message: message, to: phone });
    return returnSucess(res, results);
  } catch (error) {
    return returnError(req, res, error);
  }
}

export async function sendMentioned(req: Request, res: Response) {
  const { phone, message, mentioned } = req.body;

  if (!req.client) {
    return res.status(500).json({ error: 'Cliente WPPConnect não está disponível' });
  }

  try {
    const results: any = [];
    const phones = Array.isArray(phone) ? phone : [phone];
    
    for (const contato of phones) {
      const response = await req.client.sendMentioned(
        `${contato}`,
        message,
        mentioned
      );
      results.push(response);
    }

    return res.status(201).json({ status: 'success', response: results });
  } catch (error) {
    return returnError(req, res, error);
  }
}

export async function sendImageAsSticker(req: Request, res: Response) {
  const { phone, path } = req.body;

  if (!req.client) {
    return res.status(500).json({ error: 'Cliente WPPConnect não está disponível' });
  }

  if (!path && !req.file) {
    return res.status(401).send({
      message: 'Sending the file is mandatory',
    });
  }

  const pathFile = path || req.file?.path;

  try {
    const results: any = [];
    const phones = Array.isArray(phone) ? phone : [phone];
    
    for (const contato of phones) {
      results.push(await req.client.sendImageAsSticker(contato, pathFile));
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'Error sending message' });
    }
    
    if (req.file) await unlinkAsync(pathFile);
    return returnSucess(res, results);
  } catch (error) {
    return returnError(req, res, error);
  }
}

export async function sendImageAsStickerGif(req: Request, res: Response) {
  const { phone, path } = req.body;

  if (!req.client) {
    return res.status(500).json({ error: 'Cliente WPPConnect não está disponível' });
  }

  if (!path && !req.file) {
    return res.status(401).send({
      message: 'Sending the file is mandatory',
    });
  }

  const pathFile = path || req.file?.path;

  try {
    const results: any = [];
    const phones = Array.isArray(phone) ? phone : [phone];
    
    for (const contato of phones) {
      results.push(await req.client.sendImageAsStickerGif(contato, pathFile));
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'Error sending message' });
    }
    
    if (req.file) await unlinkAsync(pathFile);
    return returnSucess(res, results);
  } catch (error) {
    return returnError(req, res, error);
  }
}