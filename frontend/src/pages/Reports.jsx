import { useEffect, useState } from 'react';
import { api, useData } from '../api.js';
import { Empty, FruitMark, PageHeader, SIZES, money, sizeLabel, today, useToast } from '../components/ui.jsx';

export default function Reports() {
  const top = useData('/reports/top-fruits');
  const vendor = useData('/reports/top-vendor', null);
  const levels = useData('/reports/stock-levels');
  const toast = useToast();
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(today());
  const [rev, setRev] = useState(null);

  useEffect(() => {
    if (!from || !to) return;
    api.get(`/reports/revenue?from=${from}&to=${to}`).then((r) => setRev(r.data)).catch((e) => { setRev(null); toast.error(e); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const fruitNames = [...new Set(levels.data.map((l) => l.fruit_name))];
  const cell = (f, s) => levels.data.find((l) => l.fruit_name === f && l.packaging_size === s);
  const max = Math.max(1, ...top.data.map((t) => t.boxes_sold));

  return (
    <>
      <PageHeader title="Reports" subtitle="Answers to the questions you ask about the business every week." />
      <div className="card">
        <h2>Revenue in a date range</h2>
        <div className="row" style={{ maxWidth: 440 }}>
          <label className="field"><span>From</span><input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="field"><span>To</span><input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
        {rev && (
          <div className="mini-stats" style={{ marginBottom: 0 }}>
            <div className="mini"><b>{money(rev.revenue)}</b><span>Sales revenue</span></div>
            <div className="mini"><b>{rev.sales_count}</b><span>Sales made</span></div>
            <div className="mini"><b>{money(rev.collected)}</b><span>Cash collected</span></div>
            <div className="mini"><b>{money(rev.revenue - rev.collected)}</b><span>Still owed</span></div>
          </div>
        )}
      </div>
      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h2>Five most-sold fruits</h2>
          {top.data.length === 0 ? <Empty>No sales yet.</Empty> : (
            <div className="bar-list">{top.data.map((t, i) => (
              <div className="bar-item" key={t.fruit_id}>
                <div className="top"><span className="with-mark"><FruitMark name={t.fruit_name} size="sm" />{t.fruit_name}</span><span>{t.boxes_sold} boxes · {money(t.revenue)}</span></div>
                <div className="bar"><i style={{ width: `${(t.boxes_sold / max) * 100}%` }} /></div>
              </div>))}</div>
          )}
        </div>
        <div className="card">
          <h2>Best customer</h2>
          {!vendor.data ? <Empty>No sales yet.</Empty> : (
            <>
              <h3 style={{ fontSize: 24 }}>{vendor.data.vendor_name}</h3>
              <p className="muted" style={{ margin: '4px 0 0' }}>{vendor.data.location}</p>
              <p style={{ fontSize: 18 }}><b>{vendor.data.total_boxes}</b> boxes purchased, more than any other vendor.</p>
            </>
          )}
        </div>
      </div>
      <div className="card">
        <h2>Current stock by packaging size</h2>
        <div className="table-wrap"><table className="pivot">
          <thead><tr><th>Fruit</th>{SIZES.map((s) => <th key={s}>{sizeLabel(s)} boxes</th>)}</tr></thead>
          <tbody>{fruitNames.map((f) => (
            <tr key={f}><td className="strong"><span className="with-mark"><FruitMark name={f} size="sm" />{f}</span></td>
              {SIZES.map((s) => { const c = cell(f, s); return <td key={s}>{c ? <>{c.available_quantity} <span className="muted">· {money(c.selling_price)}</span></> : '-'}</td>; })}</tr>))}</tbody>
        </table></div>
      </div>
    </>
  );
}
