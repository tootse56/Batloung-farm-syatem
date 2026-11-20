import { useState } from 'react';
import { api, useData } from '../api.js';
import { Empty, ErrorBox, Field, Loading, Modal, PROVINCES, PageHeader, useToast } from '../components/ui.jsx';

const blank = { business_name: '', contact_person: '', phone: '', province: PROVINCES[0], address: '' };

export default function Suppliers() {
  const { data, loading, error, reload } = useData('/suppliers');
  const toast = useToast();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);

  const rows = data.filter((s) => `${s.business_name} ${s.contact_person} ${s.province}`.toLowerCase().includes(q.toLowerCase()));

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing.supplier_id) await api.put(`/suppliers/${editing.supplier_id}`, editing);
      else await api.post('/suppliers', editing);
      toast.success(editing.supplier_id ? 'Supplier updated' : 'Supplier registered');
      setEditing(null); reload();
    } catch (err) { toast.error(err); }
  };
  const remove = async (s) => {
    if (!window.confirm(`Delete ${s.business_name}?`)) return;
    try { await api.del(`/suppliers/${s.supplier_id}`); toast.success('Supplier deleted'); reload(); } catch (err) { toast.error(err); }
  };
  const bind = (k) => ({ value: editing[k], onChange: (e) => setEditing({ ...editing, [k]: e.target.value }) });

  return (
    <>
      <PageHeader title="Suppliers" subtitle="Farms and traders in South Africa that you buy fruit from.">
        <input className="search" placeholder="Search suppliers…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search suppliers" />
        <button className="btn" onClick={() => setEditing({ ...blank })}>Register supplier</button>
      </PageHeader>
      <div className="card">
        {loading ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : rows.length === 0 ? <Empty>No suppliers match. Register your first supplier to get started.</Empty> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Business</th><th>Contact</th><th>Phone</th><th>Province</th><th>Address</th><th /></tr></thead>
            <tbody>{rows.map((s) => (
              <tr key={s.supplier_id}>
                <td className="strong">{s.business_name}</td><td>{s.contact_person}</td><td>{s.phone}</td><td>{s.province}</td><td className="muted">{s.address}</td>
                <td><div className="actions"><button className="btn ghost sm" onClick={() => setEditing(s)}>Edit</button><button className="btn danger sm" onClick={() => remove(s)}>Delete</button></div></td>
              </tr>))}</tbody>
          </table></div>
        )}
      </div>
      {editing && (
        <Modal title={editing.supplier_id ? 'Edit supplier' : 'Register supplier'} onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <Field label="Business name"><input required {...bind('business_name')} /></Field>
            <div className="row">
              <Field label="Contact person"><input required {...bind('contact_person')} /></Field>
              <Field label="Phone"><input required placeholder="+27 11 555 0100" {...bind('phone')} /></Field>
            </div>
            <Field label="Province"><select {...bind('province')}>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></Field>
            <Field label="Address"><input required {...bind('address')} /></Field>
            <div className="modal-foot"><button type="button" className="btn ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn">Save supplier</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
