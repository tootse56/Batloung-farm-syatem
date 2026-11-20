// Demonstrates transaction rollback: a multi-item sale where ONE item fails validation.
// Usage: start the API, then `npm run demo:transactions`.
const BASE = process.env.API_URL || 'http://localhost:5000/api';
const get = async (p) => (await (await fetch(BASE + p)).json()).data;
const post = async (p, body) => { const r = await fetch(BASE + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { status: r.status, body: await r.json() }; };

(async () => {
  const snap = async () => (await get('/stock')).map((s) => `${s.fruit_name}/${s.packaging_size}=${s.available_quantity}`).join('  ');
  console.log('STOCK BEFORE:\n' + (await snap()), '\n');
  // Item 1 is fine (1 small apple box). Item 2 requests far more large mangoes than exist.
  const res = await post('/sales', { vendor_id: 1, payment_method: 'CASH', items: [
    { fruit_id: 1, packaging_size: 'SMALL', quantity: 1 },
    { fruit_id: 4, packaging_size: 'LARGE', quantity: 9999 } ] });
  console.log(`SALE RESPONSE -> HTTP ${res.status}`, JSON.stringify(res.body, null, 2), '\n');
  console.log('STOCK AFTER (must be identical):\n' + (await snap()));
})().catch((e) => console.error('Demo failed - is the API running?', e.message));
