const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MISTIC_CLIENT_ID = process.env.MISTIC_CLIENT_ID;
const MISTIC_CLIENT_SECRET = process.env.MISTIC_CLIENT_SECRET;
const MISTIC_API_BASE = process.env.MISTIC_API_BASE || 'https://api.misticpay.com/api';

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

function onlyDigits(v = '') {
  return String(v).replace(/\D/g, '');
}

function normalizePixResponse(data) {
  const allStrings = [];

  function walk(value) {
    if (value == null) return;

    if (typeof value === 'string') {
      allStrings.push(value);
      return;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      allStrings.push(String(value));
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    if (typeof value === 'object') {
      Object.values(value).forEach(walk);
    }
  }

  walk(data);

  function byPaths(obj, paths) {
    for (const path of paths) {
      let cur = obj;
      for (const key of path.split('.')) {
        if (!cur || typeof cur !== 'object') {
          cur = undefined;
          break;
        }
        cur = cur[key];
      }
      if (cur) return String(cur);
    }
    return '';
  }

  const directPix = byPaths(data, [
    'pixCode',
    'copyPaste',
    'copy_paste',
    'payload',
    'pixCopiaECola',
    'pix_copia_e_cola',
    'qr_code',
    'qrcode',
    'brCode',
    'br_code',
    'emv',
    'paymentCode',
    'payment_code',
    'data.pixCode',
    'data.copyPaste',
    'data.copy_paste',
    'data.payload',
    'data.qr_code',
    'data.qrcode',
    'data.brCode',
    'data.emv',
    'transaction.pixCode',
    'transaction.copyPaste',
    'transaction.payload',
    'transaction.qr_code',
    'transaction.qrcode',
    'transaction.brCode',
    'payment.pixCode',
    'payment.copyPaste',
    'payment.payload',
    'payment.qr_code',
    'payment.qrcode'
  ]);

  const deepPix = allStrings.find(s =>
    s.includes('000201') ||
    s.toLowerCase().includes('br.gov.bcb.pix') ||
    (s.length > 80 && s.includes('BR.GOV.BCB.PIX'))
  ) || '';

  const directQrImage = byPaths(data, [
    'qrCodeImage',
    'qr_code_image',
    'qrcode_image',
    'qrCodeBase64',
    'qr_code_base64',
    'base64',
    'image',
    'data.qrCodeImage',
    'data.qr_code_image',
    'data.qrcode_image',
    'data.qrCodeBase64',
    'data.qr_code_base64',
    'data.base64',
    'data.image',
    'transaction.qrCodeImage',
    'transaction.qr_code_image',
    'transaction.qrCodeBase64',
    'transaction.qr_code_base64',
    'payment.qrCodeImage',
    'payment.qr_code_image',
    'payment.qrCodeBase64',
    'payment.qr_code_base64'
  ]);

  const deepQrImage = allStrings.find(s =>
    s.startsWith('data:image') ||
    s.startsWith('iVBOR') ||
    (s.length > 250 && /^[A-Za-z0-9+/=\r\n]+$/.test(s))
  ) || '';

  const transactionId = byPaths(data, [
    'transactionId',
    'transaction_id',
    'id',
    'txid',
    'externalId',
    'external_id',
    'data.transactionId',
    'data.transaction_id',
    'data.id',
    'data.txid',
    'transaction.id',
    'transaction.transactionId',
    'payment.id'
  ]);

  const status = byPaths(data, [
    'status',
    'paymentStatus',
    'payment_status',
    'data.status',
    'transaction.status',
    'payment.status'
  ]) || 'pending';

  return {
    qrCode: directPix || deepPix || '',
    qrCodeImage: directQrImage || deepQrImage || '',
    transactionId: transactionId || '',
    status,
    raw: data
  };
}

async function supabaseInsert(table, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase insert erro: ${text}`);
  return text ? JSON.parse(text)[0] : null;
}

async function supabasePatchOrder(id, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase update erro: ${text}`);
  return text ? JSON.parse(text)[0] : null;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(500, { error: 'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no Netlify.' });
    }
    if (!MISTIC_CLIENT_ID || !MISTIC_CLIENT_SECRET) {
      return json(500, { error: 'Configure MISTIC_CLIENT_ID e MISTIC_CLIENT_SECRET no Netlify.' });
    }

    const body = JSON.parse(event.body || '{}');
    const items = Array.isArray(body.items) ? body.items : [];
    const total = Number(body.total || items.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 1), 0));
    const payerName = String(body.customer_name || body.name || '').trim();
    const payerDocument = onlyDigits(body.cpf || body.document || body.payerDocument || '');

    if (!items.length) return json(400, { error: 'Carrinho vazio.' });
    if (!payerName) return json(400, { error: 'Informe seu nome.' });
    if (!payerDocument || payerDocument.length < 11) return json(400, { error: 'Informe CPF válido para gerar Pix automático.' });
    if (!total || total <= 0) return json(400, { error: 'Total inválido.' });

    const order = await supabaseInsert('orders', {
      customer_name: payerName,
      whatsapp: body.discord || body.contact || 'discord',
      email: body.email || null,
      notes: `Discord: ${body.discord || ''} | ${body.notes || ''}`,
      items,
      total,
      status: 'aguardando_pagamento',
      payment_provider: 'misticpay',
      payment_status: 'pending'
    });

    const description = items.map(i => `${i.name || 'Produto'} ${i.plan ? '- ' + i.plan : ''}`).join(' | ').slice(0, 180);

    const mpRes = await fetch(`${MISTIC_API_BASE}/transactions/create`, {
      method: 'POST',
      headers: {
        ci: MISTIC_CLIENT_ID,
        cs: MISTIC_CLIENT_SECRET,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Number(total.toFixed(2)),
        payerName,
        payerDocument,
        transactionId: order.id,
        description: description || `Pedido ${order.id}`
      })
    });

    const mpText = await mpRes.text();
    let mpData;
    try { mpData = mpText ? JSON.parse(mpText) : {}; } catch { mpData = { rawText: mpText }; }

    if (!mpRes.ok) {
      await supabasePatchOrder(order.id, { status: 'erro_pix', payment_status: 'error', payment_payload: mpData });
      return json(400, { error: 'Erro ao gerar Pix na Mistic Pay.', details: mpData });
    }

    const pix = normalizePixResponse(mpData);
    await supabasePatchOrder(order.id, {
      external_id: pix.transactionId || order.id,
      payment_id: pix.transactionId || order.id,
      payment_status: pix.status || 'pending',
      pix_code: pix.qrCode || '',
      payment_payload: mpData,
      qr_code: pix.qrCode || '',
      pix_qr_code: pix.qrCodeImage || '',
      qr_code_base64: pix.qrCodeImage || ''
    });

    return json(200, {
      ok: true,
      order_id: order.id,
      total,
      qrCode: pix.qrCode,
      pixCode: pix.qrCode,
      copyPaste: pix.qrCode,
      payload: pix.qrCode,
      qrCodeImage: pix.qrCodeImage,
      qr_code_base64: pix.qrCodeImage,
      transactionId: pix.transactionId,
      status: pix.status,
      raw: mpData
    });
  } catch (err) {
    return json(500, { error: err.message || 'Erro interno.' });
  }
};
