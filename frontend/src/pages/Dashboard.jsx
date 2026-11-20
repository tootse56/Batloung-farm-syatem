import { Link } from 'react-router-dom';
import { useData } from '../api.js';
import { Badge, Empty, ErrorBox, Loading, FruitMark, PageHeader, fmtDate, money, sizeLabel } from '../components/ui.jsx';

export default function Dashboard() {
  const summary = useData('/reports/summary', null);
  const top = useData('/reports/top-fruits');
  const low = useData('/stock/low');
  const sales = useData('/sales?limit=6');

  if (summary.loading && !summary.data) return <Loading />;
  if (summary.error) return <ErrorBox message={summary.error} onRetry={summary.reload} />;
  const s = summary.data;
  const max = Math.max(1, ...top.data.map((t) => t.boxes_sold));

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Sales, collections and stock at a glance." />
      <section className="kpi-strip">
        <div className="kpi"><span>Total sales</span><b>{money(s.total_revenue)}</b></div>
        <div className="kpi owed"><span>Owed by vendors</span><b>{money(s.outstanding)}</b></div>
        <div className="kpi"><span>Sales minus purchases</span><b>{money(s.total_revenue - s.total_purchased)}</b></div>
        <div className="kpi"><span>Boxes in stock</span><b>{s.boxes_in_stock}</b></div>
      </section>
      <div className="mini-stats">
        <div className="mini"><b>{s.boxes_sold}</b><span>Boxes sold</span></div>
        <div className="mini"><b>{s.vendors}</b><span>Registered vendors</span></div>
        <div className="mini"><b>{s.suppliers}</b><span>Suppliers</span></div>
        <div className="mini"><b>{s.low_stock_count}</b><span>Low-stock lines</span></div>
      </div>
      <div className="grid-2">
        <div className="card">
          <h2>Best-selling fruits</h2>
          {top.data.length === 0 ? <Empty>No sales recorded yet.</Empty> : (
            <div className="bar-list">
              {top.data.map((t) => (
                <div className="bar-item" key={t.fruit_id}>
                  <div className="top"><span className="with-mark"><FruitMark name={t.fruit_name} size="sm" />{t.fruit_name}</span><span>{t.boxes_sold} boxes</span></div>
                  <div className="bar"><i style={{ width: `${(t.boxes_sold / max) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h2>Running low ({s.low_stock_count})</h2>
          {low.data.length === 0 ? <Empty>All stock levels look healthy.</Empty> : low.data.slice(0, 6).map((l) => (
            <div className="alert-item" key={l.stock_id}>
              <span className="with-mark"><FruitMark name={l.fruit_name} size="sm" />{l.fruit_name}, {sizeLabel(l.packaging_size)}</span>
              <span className="badge bad">{l.available_quantity} left</span>
            </div>
          ))}
          <p style={{ marginBottom: 0 }}><Link to="/purchases">Record a purchase to restock</Link></p>
        </div>
      </div>
      <div className="card">
        <h2>Recent sales</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Sale</th><th>Vendor</th><th>Date</th><th className="num">Total</th><th className="num">Owing</th><th>Status</th></tr></thead>
            <tbody>
              {sales.data.map((x) => (
                <tr key={x.sale_id}><td>#{x.sale_id}</td><td className="strong">{x.vendor_name}</td><td>{fmtDate(x.sale_date)}</td>
                  <td className="num">{money(x.total_amount)}</td><td className="num">{money(x.outstanding_balance)}</td><td><Badge value={x.payment_status} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
