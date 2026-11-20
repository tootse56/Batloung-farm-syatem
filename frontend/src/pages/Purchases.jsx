import { useState } from 'react';
import { api, useData } from '../api.js';
import LineItems, { emptyLine } from '../components/LineItems.jsx';
import { Empty, Field, Modal, PageHeader, fmtDate, money, sizeLabel, useToast } from '../components/ui.jsx';

export default function Purchases() {
  const suppliers = useData('/suppliers');
  const fruits = useData('/fruits');
  const stock = useData('/stock');
  const history = useData('/purchases');
  const toast = useToast();
  const [supplierId, setSupplierId] = useState('');
  const [lines, setLines] = useState([emptyLine()]);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState(null);

  const total = lines.reduce((a, l) => a + (Number(l.quantity) || 0) * (Number(l.price) || 0), 0);
  const complete = supplierId && lines.every((l) => l.fruit_id && Number(l.quantity) > 0 && Number(l.price) > 0);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/purchases', {
        supplier_id: Number(supplierId),
        items: lines.map((l) => ({ fruit_id: Number(l.fruit_id), packaging_size: l.packaging_size, quantity: Number(l.quantity), unit_cost: Number(l.price) })),
      });
      toast.success('Purchase recorded and stock updated');
      setLines([emptyLine()]); setSupplierId('');
      history.reload(); stock.reload();
    } catch (err) { toast.error(err); } finally { setBusy(false); }
  };
  const open = async (id) => { try { setDetail((await api.get(`/purchases/${id}`)).data); } catch (err) { toast.error(err); } };

  return (
    <>
      <PageHeader title="Purchases" subtitle="Record fruit bought from suppliers. Stock goes up automatically." />
      <div className="grid-2">
        <form className="card" onSubmit={submit}>
          <h2>New purchase</h2>
          <Field label="Supplier">
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
              <option value="">Choose supplier…</option>
              {suppliers.data.map((s) => <option key={s.supplier_id} value={s.supplier_id}>{s.business_name} ({s.province})</option>)}
            </select>
          </Field>
          <LineItems lines={lines} setLines={setLines} fruits={fruits.data} stock={stock.data} mode="purchase" />
          <div className="total-bar"><span>Total cost (calculated)</span><b>{money(total)}</b></div>
          <button className="btn accent" disabled={!complete || busy}>{busy ? 'Saving…' : 'Record purchase'}</button>
        </form>
        <div className="card">
          <h2>Purchase history</h2>
          {history.data.length === 0 ? <Empty>No purchases recorded yet.</Empty> : (
            <div className="table-wrap"><table>
              <thead><tr><th>#</th><th>Supplier</th><th>Date</th><th className="num">Boxes</th><th className="num">Total</th></tr></thead>
              <tbody>{history.data.map((p) => (
                <tr key={p.purchase_id} onClick={() => open(p.purchase_id)} style={{ cursor: 'pointer' }}>
                  <td>{p.purchase_id}</td><td className="strong">{p.business_name}</td><td>{fmtDate(p.purchase_date)}</td><td className="num">{p.total_boxes}</td><td className="num">{money(p.total_amount)}</td>
                </tr>))}</tbody>
            </table></div>
          )}
        </div>
      </div>
      {detail && (
        <Modal title={`Purchase #${detail.purchase_id}`} onClose={() => setDetail(null)}>
          <p className="muted" style={{ marginTop: 0 }}>{detail.business_name}, {detail.province} · {fmtDate(detail.purchase_date)}</p>
          <table><thead><tr><th>Fruit</th><th>Size</th><th className="num">Boxes</th><th className="num">Cost</th><th className="num">Line</th></tr></thead>
            <tbody>{detail.items.map((i) => (<tr key={i.purchase_detail_id}><td>{i.fruit_name}</td><td>{sizeLabel(i.packaging_size)}</td><td className="num">{i.quantity}</td><td className="num">{money(i.unit_cost)}</td><td className="num">{money(i.line_total)}</td></tr>))}</tbody></table>
          <p className="strong num" style={{ fontSize: 18 }}>Total {money(detail.total_amount)}</p>
        </Modal>
      )}
    </>
  );
}
