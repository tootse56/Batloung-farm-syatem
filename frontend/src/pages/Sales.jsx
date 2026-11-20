import { useState } from 'react';
import { api, useData } from '../api.js';
import LineItems, { emptyLine } from '../components/LineItems.jsx';
import PaymentModal from '../components/PaymentModal.jsx';
import { Badge, Empty, Field, Modal, PageHeader, fmtDate, money, sizeLabel, useToast } from '../components/ui.jsx';

const METHODS = [['CASH', 'Cash'], ['MOBILE_MONEY', 'Mobile money'], ['CREDIT', 'Credit']];

export default function Sales() {
  const vendors = useData('/vendors');
  const fruits = useData('/fruits');
  const stock = useData('/stock');
  const history = useData('/sales');
  const toast = useToast();
  const [vendorId, setVendorId] = useState('');
  const [lines, setLines] = useState([emptyLine()]);
  const [method, setMethod] = useState('CASH');
  const [paid, setPaid] = useState('');
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState(null);
  const [paying, setPaying] = useState(null);

  const priceOf = (l) => stock.data.find((s) => s.fruit_id === Number(l.fruit_id) && s.packaging_size === l.packaging_size)?.selling_price || 0;
  const total = lines.reduce((a, l) => a + (Number(l.quantity) || 0) * priceOf(l), 0);
  const paidNow = method === 'CREDIT' ? 0 : paid === '' ? total : Number(paid);
  const complete = vendorId && lines.every((l) => l.fruit_id && Number(l.quantity) > 0 && priceOf(l) > 0) && paidNow <= total;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/sales', {
        vendor_id: Number(vendorId), payment_method: method,
        ...(method !== 'CREDIT' && paid !== '' ? { amount_paid: Number(paid) } : {}),
        items: lines.map((l) => ({ fruit_id: Number(l.fruit_id), packaging_size: l.packaging_size, quantity: Number(l.quantity) })),
      });
      toast.success('Sale recorded and stock reduced');
      setLines([emptyLine()]); setVendorId(''); setPaid(''); setMethod('CASH');
      history.reload(); stock.reload(); vendors.reload();
    } catch (err) { toast.error(err); stock.reload(); } finally { setBusy(false); }
  };
  const open = async (id) => { try { setDetail((await api.get(`/sales/${id}`)).data); } catch (err) { toast.error(err); } };
  const afterPay = () => { setPaying(null); setDetail(null); history.reload(); vendors.reload(); };

  return (
    <>
      <PageHeader title="Sales" subtitle="Sell boxes to vendors. Totals are calculated and stock is checked before anything is saved." />
      <div className="grid-2">
        <form className="card" onSubmit={submit}>
          <h2>New sale</h2>
          <Field label="Vendor">
            <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} required>
              <option value="">Choose vendor…</option>
              {vendors.data.map((v) => <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}{v.outstanding_balance > 0 ? ` (owes ${money(v.outstanding_balance)})` : ''}</option>)}
            </select>
          </Field>
          <LineItems lines={lines} setLines={setLines} fruits={fruits.data} stock={stock.data} mode="sale" />
          <div className="total-bar"><span>Total payable (calculated)</span><b>{money(total)}</b></div>
          <div className="segmented">{METHODS.map(([v, l]) => <button type="button" key={v} className={method === v ? 'on' : ''} onClick={() => setMethod(v)}>{l}</button>)}</div>
          {method !== 'CREDIT' ? (
            <Field label="Amount received now (M)" hint="Leave empty to take the full amount. A smaller amount leaves a balance owing.">
              <input type="number" min="0" step="0.01" value={paid} placeholder={String(total)} onChange={(e) => setPaid(e.target.value)} />
            </Field>
          ) : <p className="muted" style={{ marginTop: 0 }}>Nothing is collected now. The full amount is added to the vendor's balance.</p>}
          <p className="muted" style={{ marginTop: 0 }}>Balance after this sale: <b>{money(Math.max(0, total - paidNow))}</b></p>
          <button className="btn accent" disabled={!complete || busy}>{busy ? 'Saving…' : 'Record sale'}</button>
        </form>
        <div className="card">
          <h2>Sales history</h2>
          {history.data.length === 0 ? <Empty>No sales recorded yet.</Empty> : (
            <div className="table-wrap"><table>
              <thead><tr><th>#</th><th>Vendor</th><th>Date</th><th className="num">Total</th><th>Status</th></tr></thead>
              <tbody>{history.data.map((s) => (
                <tr key={s.sale_id} onClick={() => open(s.sale_id)} style={{ cursor: 'pointer' }}>
                  <td>{s.sale_id}</td><td className="strong">{s.vendor_name}</td><td>{fmtDate(s.sale_date)}</td><td className="num">{money(s.total_amount)}</td><td><Badge value={s.payment_status} /></td>
                </tr>))}</tbody>
            </table></div>
          )}
        </div>
      </div>
      {detail && (
        <Modal title={`Sale #${detail.sale_id}`} onClose={() => setDetail(null)} wide>
          <p className="muted" style={{ marginTop: 0 }}>{detail.vendor_name} · {fmtDate(detail.sale_date)} · <Badge value={detail.payment_status} /></p>
          <table><thead><tr><th>Fruit</th><th>Size</th><th className="num">Boxes</th><th className="num">Price</th><th className="num">Line</th></tr></thead>
            <tbody>{detail.items.map((i) => (<tr key={i.sales_detail_id}><td>{i.fruit_name}</td><td>{sizeLabel(i.packaging_size)}</td><td className="num">{i.quantity}</td><td className="num">{money(i.unit_price)}</td><td className="num">{money(i.line_total)}</td></tr>))}</tbody></table>
          <div className="row" style={{ marginTop: 14 }}>
            <div><div className="muted">Total</div><b>{money(detail.total_amount)}</b></div>
            <div><div className="muted">Paid / Outstanding</div><b>{money(detail.amount_paid)} / {money(detail.outstanding_balance)}</b></div>
          </div>
          {detail.payments.length > 0 && <><h3 style={{ margin: '16px 0 6px', fontSize: 16 }}>Payments</h3>{detail.payments.map((p) => <div key={p.payment_id} className="alert-item"><span>{fmtDate(p.payment_date)} · {p.method.replace('_', ' ').toLowerCase()}</span><b>{money(p.amount)}</b></div>)}</>}
          {detail.outstanding_balance > 0 && <div className="modal-foot"><button className="btn accent" onClick={() => setPaying(detail)}>Record payment</button></div>}
        </Modal>
      )}
      {paying && <PaymentModal sale={paying} onClose={() => setPaying(null)} onDone={afterPay} />}
    </>
  );
}
