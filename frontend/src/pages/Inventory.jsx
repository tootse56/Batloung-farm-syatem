import { useState } from 'react';
import { api, useData } from '../api.js';
import { Badge, ErrorBox, Field, Loading, FruitMark, Modal, PageHeader, SIZES, money, sizeLabel, useToast } from '../components/ui.jsx';

export default function Inventory() {
  const fruits = useData('/fruits?all=true');
  const stock = useData('/stock');
  const [threshold, setThreshold] = useState(15);
  const low = useData(`/stock/low?threshold=${threshold}`);
  const toast = useToast();
  const [form, setForm] = useState(null);

  const reload = () => { fruits.reload(); stock.reload(); low.reload(); };
  const lowIds = new Set(low.data.map((l) => l.stock_id));
  const rowsFor = (id) => SIZES.map((sz) => stock.data.find((s) => s.fruit_id === id && s.packaging_size === sz)).filter(Boolean);

  const openEdit = (f) => {
    const prices = {};
    rowsFor(f.fruit_id).forEach((r) => { prices[r.packaging_size] = r.selling_price; });
    setForm({ ...f, prices });
  };
  const save = async (e) => {
    e.preventDefault();
    try {
      if (form.fruit_id) await api.put(`/fruits/${form.fruit_id}`, form);
      else await api.post('/fruits', form);
      toast.success(form.fruit_id ? 'Fruit updated' : 'Fruit registered');
      setForm(null); reload();
    } catch (err) { toast.error(err); }
  };

  if (fruits.loading && !fruits.data.length) return <Loading />;
  if (fruits.error) return <ErrorBox message={fruits.error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Fruits & stock" subtitle="Every fruit is stocked and priced separately for small, medium and large boxes.">
        <label className="muted" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>Low stock at or below
          <input type="number" min="0" style={{ width: 80 }} value={threshold} onChange={(e) => setThreshold(Math.max(0, Number(e.target.value) || 0))} />
        </label>
        <button className="btn" onClick={() => setForm({ fruit_name: '', description: '', status: 'ACTIVE', prices: { SMALL: '', MEDIUM: '', LARGE: '' } })}>Register fruit</button>
      </PageHeader>
      {low.data.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: '#ecc9d3' }}>
          <h2>Low stock ({low.data.length})</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {low.data.map((l) => <span key={l.stock_id} className="badge bad">{l.fruit_name} · {sizeLabel(l.packaging_size)}: {l.available_quantity}</span>)}
          </div>
        </div>
      )}
      <div className="fruit-grid">
        {fruits.data.map((f) => (
          <div className={`fruit-card ${f.status === 'INACTIVE' ? 'inactive' : ''}`} key={f.fruit_id}>
            <div className="fruit-top">
              <FruitMark name={f.fruit_name} size="lg" />
              <div style={{ flex: 1 }}><h3>{f.fruit_name}</h3><p>{f.description || 'No description'}</p></div>
              <Badge value={f.status} />
            </div>
            <div className="crates">
              {rowsFor(f.fruit_id).map((r) => (
                <div key={r.stock_id} className={`crate ${lowIds.has(r.stock_id) ? 'low' : ''}`}>
                  <span className="size">{sizeLabel(r.packaging_size)}</span>
                  <span className="muted">{lowIds.has(r.stock_id) ? 'Running low' : 'In stock'}</span>
                  <div><div className="qty">{r.available_quantity} boxes</div><div className="price">{money(r.selling_price)} / box</div></div>
                </div>
              ))}
            </div>
            <div className="fruit-foot"><span className="muted">{rowsFor(f.fruit_id).reduce((a, r) => a + r.available_quantity, 0)} boxes total</span><button className="btn ghost sm" onClick={() => openEdit(f)}>Edit fruit & prices</button></div>
          </div>
        ))}
      </div>
      {form && (
        <Modal title={form.fruit_id ? 'Edit fruit' : 'Register fruit'} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <Field label="Fruit name"><input required value={form.fruit_name} onChange={(e) => setForm({ ...form, fruit_name: e.target.value })} /></Field>
            <Field label="Description"><input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>ACTIVE</option><option>INACTIVE</option></select></Field>
            <div className="row3">
              {SIZES.map((sz) => (
                <Field key={sz} label={`${sizeLabel(sz)} price (M)`}>
                  <input type="number" min="0" step="0.01" value={form.prices[sz] ?? ''} onChange={(e) => setForm({ ...form, prices: { ...form.prices, [sz]: e.target.value } })} />
                </Field>
              ))}
            </div>
            <div className="modal-foot"><button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn">Save fruit</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
