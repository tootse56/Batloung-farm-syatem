
import { useState } from 'react';
import { api, useData } from '../api.js';
import LineItems, { emptyLine } from '../components/LineItems.jsx';
import { Empty, ErrorBox, Loading, PageHeader, fmtDate, money, Modal, sizeLabel, useToast } from '../components/ui.jsx';

export default function VendorOrders({ user, onLogout }) {
  const { data, loading, error, reload } = useData('/my/orders');
  const [detail, setDetail] = useState(null);
  const catalog = useData('/my/catalog');
  const toast = useToast();
  const [lines, setLines] = useState([emptyLine()]);
  const [busy, setBusy] = useState(false);
  const fruits = catalog.data?.fruits || [];
  const stock = catalog.data?.stock || [];
  const priceOf = (line) => Number(stock.find((item) => item.fruit_id === Number(line.fruit_id) && item.packaging_size === line.packaging_size)?.selling_price || 0);
  const total = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * priceOf(line), 0);
  const complete = lines.length > 0 && lines.every((line) => {
    const available = stock.find((item) => item.fruit_id === Number(line.fruit_id) && item.packaging_size === line.packaging_size);
    return line.fruit_id && Number.isInteger(Number(line.quantity)) && Number(line.quantity) > 0 && available && Number(line.quantity) <= available.available_quantity && priceOf(line) > 0;
  });
  const placeOrder = async (event) => {
    event.preventDefault(); setBusy(true);
    try {
      await api.post('/my/orders', { items: lines.map((line) => ({ fruit_id: Number(line.fruit_id), packaging_size: line.packaging_size, quantity: Number(line.quantity) })) });
      toast.success('Your order has been placed successfully.');
      setLines([emptyLine()]); reload(); catalog.reload();
    } catch (err) { toast.error(err); catalog.reload(); } finally { setBusy(false); }
  };
  const open = async (id) => {
    try { setDetail((await api.get(`/my/orders/${id}`)).data); }
    catch (e) { window.alert(e.message); }
  };
  return <>
    <PageHeader title="My orders" subtitle={`Orders belonging to ${user.name} only.`}>
      <button className="btn ghost" onClick={onLogout}>Log out</button>
    </PageHeader>
    <form className="card" onSubmit={placeOrder} style={{ marginBottom: 18 }}>
      <h2>Place a new order</h2>
      {catalog.loading ? <Loading /> : catalog.error ? <ErrorBox message={catalog.error} onRetry={catalog.reload} /> : <>
        <LineItems lines={lines} setLines={setLines} fruits={fruits} stock={stock} mode="sale" />
        <div className="total-bar"><span>Order total</span><b>{money(total)}</b></div>
        <p className="muted">Orders are placed on your account as credit. Available stock is checked before the order is saved.</p>
        <button className="btn accent" disabled={!complete || busy}>{busy ? 'Placing order…' : 'Place order'}</button>
      </>}
    </form>
    <div className="card">
      {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : data.length === 0 ? <Empty>You do not have any orders yet.</Empty> : (
        <div className="table-wrap"><table><thead><tr><th>Order</th><th>Date</th><th>Status</th><th className="num">Boxes</th><th className="num">Total</th><th className="num">Paid</th><th className="num">Balance</th></tr></thead>
          <tbody>{data.map((o) => <tr key={o.sale_id} onClick={() => open(o.sale_id)} style={{ cursor: 'pointer' }}>
            <td className="strong">#{o.sale_id}</td><td>{fmtDate(o.sale_date)}</td><td><span className={`badge ${o.payment_status === 'PAID' ? 'good' : 'warn'}`}>{o.payment_status.replace('_', ' ').toLowerCase()}</span></td>
            <td className="num">{o.total_boxes || 0}</td><td className="num">{money(o.total_amount)}</td><td className="num">{money(o.amount_paid)}</td><td className="num">{money(o.outstanding_balance)}</td>
          </tr>)}</tbody></table></div>
      )}
    </div>
    {detail && <Modal title={`Order #${detail.sale_id}`} onClose={() => setDetail(null)}>
      <p className="muted">{fmtDate(detail.sale_date)} · {detail.payment_status.replace('_', ' ')}</p>
      <table><thead><tr><th>Fruit</th><th>Size</th><th className="num">Boxes</th><th className="num">Unit price</th><th className="num">Total</th></tr></thead>
        <tbody>{detail.items.map((i) => <tr key={i.sales_detail_id}><td>{i.fruit_name}</td><td>{sizeLabel(i.packaging_size)}</td><td className="num">{i.quantity}</td><td className="num">{money(i.unit_price)}</td><td className="num">{money(i.line_total)}</td></tr>)}</tbody></table>
      <p className="num strong">Total: {money(detail.total_amount)}</p>
      <p className="num">Paid: {money(detail.amount_paid)} · Balance: {money(detail.outstanding_balance)}</p>
    </Modal>}
  </>;
}
