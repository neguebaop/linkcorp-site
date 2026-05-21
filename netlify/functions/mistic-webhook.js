const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function paidStatus(status) {
  const s = String(status || '').toLowerCase();
  return ['paid','approved','completed','confirmed','success','succeeded','aprovado','pago','concluido','liquidated'].includes(s);
}

async function updateOrderById(id, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${id}`, {
    method: 'PATCH',
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.ok;
}

async function updateOrderByExternal(externalId, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?external_id=eq.${externalId}`, {
    method: 'PATCH',
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.ok;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  try {
    const body = JSON.parse(event.body || '{}');
    const transactionId = body.transactionId || body.transaction_id || body.externalId || body.external_id || body.txid || body.id;
    const status = body.status || body.paymentStatus || body.payment_status;
    const payload = {
      payment_status: status || 'webhook_received',
      payment_payload: body,
      status: paidStatus(status) ? 'pago' : 'aguardando_pagamento',
      paid_at: paidStatus(status) ? new Date().toISOString() : null
    };
    if (!transactionId) return json(400, { error: 'transactionId não encontrado no webhook' });
    await updateOrderById(transactionId, payload);
    await updateOrderByExternal(transactionId, payload);
    return json(200, { ok: true });
  } catch (err) {
    return json(500, { error: err.message });
  }
};
