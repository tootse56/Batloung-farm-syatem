import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import { api, useData } from '../api.js';
import { Empty, ErrorBox, Field, Loading, Modal, PageHeader, fmtDate, money, useToast } from '../components/ui.jsx';

const blank = { vendor_name: '', phone_number: '', location: '', latitude: '', longitude: '' };
const pinned = (v) => v.latitude != null && v.latitude !== '';

export default function Vendors() {
  const [q, setQ] = useState('');
  const term = q.trim();
  const { data, loading, error, reload } = useData(term ? `/vendors/search?q=${encodeURIComponent(term)}` : '/vendors');
  const toast = useToast();
  const [editing, setEditing] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing.vendor_id) await api.put(`/vendors/${editing.vendor_id}`, editing);
      else await api.post('/vendors', editing);
      toast.success(editing.vendor_id ? 'Vendor updated' : 'Vendor registered');
      setEditing(null); reload();
    } catch (err) { toast.error(err); }
  };
  const bind = (k) => ({ value: editing[k], onChange: (e) => setEditing({ ...editing, [k]: e.target.value }) });

  return (
    <>
      <PageHeader title="Vendors" subtitle="Street vendors and small retailers who buy from you.">
        <input className="search" placeholder="Search by name or phone…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search vendors" />
        <button className="btn" onClick={() => setEditing({ ...blank })}>Register vendor</button>
      </PageHeader>
      <div className="card">
        {loading && !data.length ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : data.length === 0 ? <Empty>{term ? `No vendor matches “${term}”.` : 'No vendors yet. Register your first vendor.'}</Empty> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Vendor</th><th>Phone</th><th>Location</th><th>Map</th><th className="num">Total bought</th><th className="num">Outstanding</th><th /></tr></thead>
            <tbody>{data.map((v) => (
              <tr key={v.vendor_id}>
                <td className="strong">{v.vendor_name}</td><td>{v.phone_number}</td><td>{v.location}</td><td>{pinned(v) ? <Link className="maplink" to={`/map?vendor=${v.vendor_id}`}><Icon name="pin" size={14} /> View on map</Link> : <span className="badge muted">Not pinned</span>}</td>
                <td className="num">{money(v.total_billed)}</td>
                <td className="num">{v.outstanding_balance > 0 ? <span className="badge bad">{money(v.outstanding_balance)}</span> : <span className="badge good">Settled</span>}</td>
                <td><div className="actions"><button className="btn ghost sm" onClick={() => setEditing(v)}>Edit</button></div></td>
              </tr>))}</tbody>
          </table></div>
        )}
      </div>
      {editing && (
        <Modal title={editing.vendor_id ? 'Edit vendor' : 'Register vendor'} onClose={() => setEditing(null)} wide>
          <form onSubmit={save}>
            <Field label="Vendor name"><input required {...bind('vendor_name')} /></Field>
            <Field label="Phone number"><input required placeholder="+266 5800 0000" {...bind('phone_number')} /></Field>
            <Field label="Location"><input required placeholder="e.g. Maseru Bus Rank" {...bind('location')} /></Field>
            <div className="field">
              <span>Map position</span>
              <LocationPicker value={editing} searchText={editing.location} onChange={(c) => setEditing((cur) => ({ ...cur, ...c }))} />
              <small>Used for travel times and for finding nearby hospitals and shops.</small>
            </div>
            <div className="modal-foot"><button type="button" className="btn ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn">Save vendor</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
