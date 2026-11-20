import { useState } from 'react';
import { api } from '../api.js';
import { Field, Modal, money, useToast } from './ui.jsx';

export default function PaymentModal({ sale, onClose, onDone }) {
  const toast = useToast();
  const [amount, setAmount] = useState(String(sale.outstanding_balance));
  const [method, setMethod] = useState('CASH');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/sales/${sale.sale_id}/payments`, { amount: Number(amount), method });
      toast.success('Payment recorded');
      onDone();
    } catch (err) { toast.error(err); } finally { setBusy(false); }
  };
  return (
    <Modal title={`Record payment · Sale #${sale.sale_id}`} onClose={onClose}>
      <p className="muted" style={{ marginTop: 0 }}>{sale.vendor_name} owes <b>{money(sale.outstanding_balance)}</b> on this sale.</p>
      <form onSubmit={submit}>
        <div className="segmented">
          {[['CASH', 'Cash'], ['MOBILE_MONEY', 'Mobile money']].map(([v, l]) => (
            <button type="button" key={v} className={method === v ? 'on' : ''} onClick={() => setMethod(v)}>{l}</button>
          ))}
        </div>
        <Field label="Amount received (M)"><input type="number" min="0.01" step="0.01" max={sale.outstanding_balance} required value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Record payment'}</button>
        </div>
      </form>
    </Modal>
  );
}
