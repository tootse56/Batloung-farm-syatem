import Icon from './Icon.jsx';
import { SIZES, sizeLabel, money } from './ui.jsx';

export const emptyLine = () => ({ fruit_id: '', packaging_size: 'MEDIUM', quantity: '', price: '' });

// Shared editor for purchase (unit cost) and sale (unit price) lines.
export default function LineItems({ lines, setLines, fruits, stock, mode }) {
  const set = (i, patch) => setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const find = (l) => stock.find((s) => s.fruit_id === Number(l.fruit_id) && s.packaging_size === l.packaging_size);
  return (
    <div className="lines">
      {lines.map((l, i) => {
        const st = find(l);
        const qty = Number(l.quantity) || 0;
        const over = mode === 'sale' && st && qty > st.available_quantity;
        return (
          <div className="line" key={i}>
            <select value={l.fruit_id} onChange={(e) => set(i, { fruit_id: e.target.value })} aria-label="Fruit">
              <option value="">Choose fruit…</option>
              {fruits.map((f) => <option key={f.fruit_id} value={f.fruit_id}>{f.fruit_name}</option>)}
            </select>
            <select value={l.packaging_size} onChange={(e) => set(i, { packaging_size: e.target.value })} aria-label="Packaging size">
              {SIZES.map((s) => <option key={s} value={s}>{sizeLabel(s)} box</option>)}
            </select>
            <input type="number" min="1" step="1" placeholder="Boxes" value={l.quantity} onChange={(e) => set(i, { quantity: e.target.value })} aria-label="Quantity" />
            {mode === 'purchase'
              ? <input type="number" min="0" step="0.01" placeholder="Cost / box" value={l.price} onChange={(e) => set(i, { price: e.target.value })} aria-label="Unit cost" />
              : <input readOnly value={st ? money(st.selling_price) : ''} placeholder="Price" aria-label="Unit price" />}
            <button type="button" className="icon-btn" onClick={() => setLines(lines.length > 1 ? lines.filter((_, x) => x !== i) : [emptyLine()])} aria-label="Remove line"><Icon name="close" size={14} /></button>
            {mode === 'sale' && st && (
              <div className={`hint ${over ? 'bad' : ''}`}>
                {over ? `Only ${st.available_quantity} ${sizeLabel(l.packaging_size).toLowerCase()} boxes available` : `${st.available_quantity} boxes available`}
              </div>
            )}
          </div>
        );
      })}
      <div><button type="button" className="btn ghost sm" onClick={() => setLines([...lines, emptyLine()])}>+ Add another fruit</button></div>
    </div>
  );
}
