const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  try {
    const orderId = event.queryStringParameters?.order_id;
    if (!orderId) return json(400, { error: 'order_id obrigatório' });
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=id,status,payment_status,paid_at,total`, {
      headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
    });
    const data = await res.json();
    return json(200, { ok: true, order: data[0] || null });
  } catch (err) {
    return json(500, { error: err.message });
  }
};
