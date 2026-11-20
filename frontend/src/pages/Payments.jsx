import { useState } from 'react';
import { useData } from '../api.js';
import PaymentModal from '../components/PaymentModal.jsx';
import { Badge, Empty, ErrorBox, Loading, PageHeader, fmtDate, money } from '../components/ui.jsx';

export default function Payments() {
  const vendors = useData('/vendors');
  const sales = useData('/sales');
  const [paying, setPaying] = useState(null);

  if ((vendors.loading || sales.loading) && !sales.data.length) return <Loading />;
  if (vendors.error || sales.error) return <ErrorBox message={vendors.error || sales.error} onRetry={() => { vendors.reload(); sales.reload(); }} />;

  const owing = vendors.data.filter((v) => v.outstanding_balance > 0).sort((a, b) => b.outstanding_balance - a.outstanding_balance);
  const open = sales.data.filter((s) => s.payment_status !== 'PAID');
  const totalOwed = owing.reduce((a, v) => a + v.outstanding_balance, 0);
  const done = () => { setPaying(null); vendors.reload(); sales.reload(); };

  return (
    <>
      <PageHeader title="Payments" subtitle="See who owes you and record cash or mobile money as it arrives.">
        <div className="mini"><b>{money(totalOwed)}</b><span>Total outstanding from {owing.length} vendor(s)</span></div>
      </PageHeader>
      <div className="grid-2">
        <div className="card">
          <h2>Outstanding balance by vendor</h2>
          {owing.length === 0 ? <Empty>Every vendor is settled.</Empty> : (
            <table><thead><tr><th>Vendor</th><th className="num">Billed</th><th className="num">Paid</th><th className="num">Owes</th></tr></thead>
              <tbody>{owing.map((v) => (<tr key={v.vendor_id}><td className="strong">{v.vendor_name}<div className="muted">{v.phone_number}</div></td><td className="num">{money(v.total_billed)}</td><td className="num">{money(v.total_paid)}</td><td className="num"><span className="badge bad">{money(v.outstanding_balance)}</span></td></tr>))}</tbody></table>
          )}
        </div>
        <div className="card">
          <h2>Sales awaiting payment</h2>
          {open.length === 0 ? <Empty>No unpaid sales.</Empty> : (
            <div className="table-wrap"><table><thead><tr><th>#</th><th>Vendor</th><th>Date</th><th>Status</th><th className="num">Balance</th><th /></tr></thead>
              <tbody>{open.map((s) => (<tr key={s.sale_id}><td>{s.sale_id}</td><td className="strong">{s.vendor_name}</td><td>{fmtDate(s.sale_date)}</td><td><Badge value={s.payment_status} /></td><td className="num">{money(s.outstanding_balance)}</td>
                <td><button className="btn sm" onClick={() => setPaying(s)}>Receive</button></td></tr>))}</tbody></table></div>
          )}
        </div>
      </div>
      {paying && <PaymentModal sale={paying} onClose={() => setPaying(null)} onDone={done} />}
    </>
  );
}
