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
  const qrCode = data?.qrCode || data?.qrcode || data?.pixQrCode || data?.pixQRCode || data?.qr_code || data?.payload || data?.copyPaste || data?.pixCopyPaste || data?.brCode || data?.emv || data?.paymentCode || data?.code || '';
  const qrCodeImage = data?.qrCodeImage || data?.qr_code_image || data?.qrcode_image || data?.qrCodeBase64 || data?.qr_code_base64 || data?.image || data?.base64 || '';
  const transactionId = data?.transactionId || data?.transaction_id || data?.id || data?.txid || data?.externalId || data?.external_id || '';
  const status = data?.status || data?.paymentStatus || 'pending';
  return { qrCode, qrCodeImage, transactionId, status, raw: data };
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
      payment_status: pix.status || 'pending',
      payment_payload: mpData
    });

    return json(200, {
      ok: true,
      order_id: order.id,
      total,
      qrCode: pix.qrCode,
      qrCodeImage: pix.qrCodeImage,
      transactionId: pix.transactionId,
      status: pix.status,
      raw: mpData
    });
  } catch (err) {
    return json(500, { error: err.message || 'Erro interno.' });
  }
};
