import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useData } from '../api.js';
import Icon from '../components/Icon.jsx';
import { Badge, ErrorBox, Loading, PageHeader, money } from '../components/ui.jsx';
import {
  FARM, MODES, directionsUrl, driveTable, fmtDistance, fmtDuration, haversine, hasCoords, nearbyPlaces, routeAll,
} from '../lib/geo.js';
import { TILES, farmIcon, meIcon, placeIcon, vendorIcon } from '../lib/mapIcons.js';

const RADII = [1000, 2000, 5000, 10000];
const MODE_ICON = { driving: 'car', cycling: 'bike', walking: 'walk' };
const timeOf = (d) => d && new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export default function VendorMap() {
  const q = useData('/vendors');
  if (q.loading && !q.data.length) return <Loading />;
  if (q.error && !q.data.length) return <ErrorBox message={q.error} onRetry={q.reload} />;
  return <MapView vendors={q.data} />;
}

function MapView({ vendors }) {
  const [params, setParams] = useSearchParams();

  // ---- state ----------------------------------------------------------------
  const [me, setMe] = useState(null);                   // { lat, lng, accuracy, manual, ts }
  const [geo, setGeo] = useState('idle');               // idle | locating | ok | denied | unavailable | insecure
  const [placing, setPlacing] = useState(false);        // click-the-map to set my position
  const [tab, setTab] = useState('vendors');
  const [q, setQ] = useState('');
  const [mode, setMode] = useState('driving');
  const [radius, setRadius] = useState(2000);
  const [around, setAround] = useState('me');           // me | vendor
  const [sel, setSel] = useState(null);                 // { type: vendor|hospital|shop, id }
  const [routes, setRoutes] = useState(null);
  const [routing, setRouting] = useState(false);
  const [places, setPlaces] = useState({ hospitals: [], shops: [] });
  const [placesState, setPlacesState] = useState({ loading: false, error: '' });
  const [show, setShow] = useState({ vendors: true, hospitals: true, shops: true });
  const [times, setTimes] = useState({});               // vendor_id -> { duration, distance }

  const origin = useMemo(() => (me ? { lat: me.lat, lng: me.lng } : { lat: FARM.lat, lng: FARM.lng }), [me]);
  const originKey = `${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}`;
  const originLabel = me ? (me.manual ? 'your chosen position' : 'your location') : FARM.name;

  // ---- map refs -------------------------------------------------------------
  const el = useRef(null), map = useRef(null), L_ = useRef({}), watchId = useRef(null);
  const placingRef = useRef(false), firstFix = useRef(true);
  placingRef.current = placing;

  // ---- derived ----------------------------------------------------------------
  const mapped = useMemo(() => vendors.filter(hasCoords).map((v) => ({ ...v, lat: Number(v.latitude), lng: Number(v.longitude) })), [vendors]);
  const withDist = useMemo(() => mapped.map((v) => ({ ...v, straight: haversine(origin, v) })), [mapped, origin]);
  const unmapped = vendors.filter((v) => !hasCoords(v));
  const selVendor = sel?.type === 'vendor' ? withDist.find((v) => v.vendor_id === sel.id) : null;
  const selPlace = sel && sel.type !== 'vendor' ? (sel.type === 'hospital' ? places.hospitals : places.shops).find((p) => p.id === sel.id) : null;
  const target = selVendor || selPlace;
  const aroundCenter = around === 'vendor' && selVendor ? { lat: selVendor.lat, lng: selVendor.lng } : origin;
  const aroundKey = `${aroundCenter.lat.toFixed(3)},${aroundCenter.lng.toFixed(3)}`;

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const byTime = withDist.every((v) => times[v.vendor_id]?.duration != null);
    const key = (v) => (byTime ? times[v.vendor_id].duration : v.straight);
    return withDist.filter((v) => !t || `${v.vendor_name} ${v.location}`.toLowerCase().includes(t)).sort((a, b) => key(a) - key(b));
  }, [withDist, q, times]);

  // ---- map setup ------------------------------------------------------------
  useEffect(() => {
    const m = L.map(el.current, { zoomControl: false, preferCanvas: true }).setView([FARM.lat, FARM.lng], 12);
    map.current = m;
    L.control.zoom({ position: 'bottomright' }).addTo(m);
    L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(m);
    const street = L.tileLayer(...TILES.street).addTo(m);
    const light = L.tileLayer(...TILES.light);
    L.control.layers({ Street: street, Light: light }, null, { position: 'topright', collapsed: true }).addTo(m);
    L_.current = {
      radius: L.layerGroup().addTo(m), route: L.layerGroup().addTo(m), places: L.layerGroup().addTo(m),
      vendors: L.layerGroup().addTo(m), farm: L.layerGroup().addTo(m), me: L.layerGroup().addTo(m),
    };
    L.marker([FARM.lat, FARM.lng], { icon: farmIcon(), zIndexOffset: 100 }).bindTooltip(`${FARM.name} (base)`, { direction: 'top', offset: [0, -14] }).addTo(L_.current.farm);
    m.on('click', (e) => {
      if (!placingRef.current) return;
      setMe({ lat: e.latlng.lat, lng: e.latlng.lng, accuracy: null, manual: true, ts: Date.now() });
      setGeo('ok'); setPlacing(false);
    });
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => { ro.disconnect(); m.remove(); map.current = null; };
  }, []);

  // ---- my location (live) ---------------------------------------------------
  const stopWatch = () => { if (watchId.current != null) { navigator.geolocation.clearWatch(watchId.current); watchId.current = null; } };
  const locate = useCallback(() => {
    if (!window.isSecureContext) return setGeo('insecure');
    if (!navigator.geolocation) return setGeo('unavailable');
    stopWatch();
    firstFix.current = true;
    setGeo('locating');
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        setMe({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, manual: false, ts: p.timestamp });
        setGeo('ok');
      },
      (err) => { setGeo(err.code === 1 ? 'denied' : 'unavailable'); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 25000 },
    );
  }, []);
  useEffect(() => { locate(); return stopWatch; }, [locate]);

  const flyToMe = useCallback(() => { if (me && map.current) map.current.flyTo([me.lat, me.lng], Math.max(map.current.getZoom(), 15), { duration: 0.8 }); }, [me]);

  // draw my position: pulsing dot + accuracy ring + label
  useEffect(() => {
    const g = L_.current.me; if (!g) return;
    g.clearLayers();
    if (!me) return;
    if (me.accuracy) L.circle([me.lat, me.lng], { radius: me.accuracy, color: '#1a6ee0', weight: 1, fillColor: '#1a6ee0', fillOpacity: 0.12, interactive: false }).addTo(g);
    L.marker([me.lat, me.lng], { icon: meIcon(), zIndexOffset: 1000, keyboard: false })
      .bindTooltip(me.manual ? 'You (placed manually)' : 'You are here', { permanent: true, direction: 'bottom', offset: [0, 14], className: 'me-tip' }).addTo(g);
  }, [me]);

  // first GPS fix: frame me (and the selected vendor if any)
  useEffect(() => {
    if (me && !me.manual && firstFix.current && map.current) {
      firstFix.current = false;
      if (!sel) map.current.flyTo([me.lat, me.lng], 14, { duration: 0.8 });
    }
  }, [me, sel]);

  // manual placement: give map a crosshair
  useEffect(() => { el.current?.classList.toggle('placing', placing); }, [placing]);

  // ---- vendor preselect from ?vendor= --------------------------------------
  const preselected = useRef(false);
  useEffect(() => {
    const id = Number(params.get('vendor'));
    if (!id || preselected.current || !mapped.length) return;
    preselected.current = true;
    if (mapped.some((v) => v.vendor_id === id)) setSel({ type: 'vendor', id });
  }, [params, mapped]);

  // ---- travel times for the vendor list (best effort) ----------------------
  useEffect(() => {
    let live = true;
    if (mapped.length) driveTable(origin, mapped).then((t) => live && setTimes(t));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originKey, mapped]);

  // ---- nearby hospitals & shops --------------------------------------------
  useEffect(() => {
    let live = true;
    setPlacesState({ loading: true, error: '' });
    const t = setTimeout(() => {
      nearbyPlaces(aroundCenter, radius)
        .then((r) => { if (live) { setPlaces(r); setPlacesState({ loading: false, error: '' }); } })
        .catch((e) => { if (live) setPlacesState({ loading: false, error: e.message }); });
    }, 400);
    return () => { live = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aroundKey, radius]);

  // ---- route to the selection ----------------------------------------------
  const targetKey = target ? `${target.lat},${target.lng}` : '';
  useEffect(() => {
    let live = true;
    if (!target) { setRoutes(null); return undefined; }
    setRouting(true);
    routeAll(origin, { lat: target.lat, lng: target.lng }).then((r) => { if (live) { setRoutes(r); setRouting(false); } });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey, originKey]);

  const framedFor = useRef('');
  useEffect(() => {
    const g = L_.current.route; if (!g) return;
    g.clearLayers();
    const r = routes?.[mode];
    if (!r || !target) return;
    const style = r.approx ? { dashArray: '8 8' } : {};
    L.polyline(r.geometry, { color: '#fff', weight: 9, opacity: 0.95, lineCap: 'round', ...style }).addTo(g);
    const line = L.polyline(r.geometry, { color: '#1a6ee0', weight: 5, opacity: 0.95, lineCap: 'round', ...style }).addTo(g);
    if (framedFor.current !== `${targetKey}|${originKey}`) {
      framedFor.current = `${targetKey}|${originKey}`;
      map.current.fitBounds(line.getBounds(), { padding: [70, 70], maxZoom: 16 });
    }
  }, [routes, mode, target, targetKey, originKey]);

  // ---- markers --------------------------------------------------------------
  useEffect(() => {
    const g = L_.current.vendors; if (!g) return;
    g.clearLayers();
    if (!show.vendors) return;
    withDist.forEach((v) => {
      const s = sel?.type === 'vendor' && sel.id === v.vendor_id;
      L.marker([v.lat, v.lng], { icon: vendorIcon(s), zIndexOffset: s ? 700 : 300 })
        .bindTooltip(v.vendor_name, { direction: 'top', offset: [0, -16] })
        .on('click', () => pick('vendor', v.vendor_id)).addTo(g);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withDist, sel, show.vendors]);

  useEffect(() => {
    const g = L_.current.places, rg = L_.current.radius; if (!g) return;
    g.clearLayers(); rg.clearLayers();
    L.circle([aroundCenter.lat, aroundCenter.lng], { radius, color: '#1d5a43', weight: 1.5, dashArray: '6 6', fillColor: '#1d5a43', fillOpacity: 0.04, interactive: false }).addTo(rg);
    const add = (p, type) => {
      const s = sel?.type === type && sel.id === p.id;
      L.marker([p.lat, p.lng], { icon: placeIcon(p.kind, s), zIndexOffset: s ? 650 : type === 'hospital' ? 400 : 200 })
        .bindTooltip(`${p.name} (${p.label})`, { direction: 'top', offset: [0, -12] })
        .on('click', () => pick(type, p.id)).addTo(g);
    };
    if (show.hospitals) places.hospitals.forEach((p) => add(p, 'hospital'));
    if (show.shops) places.shops.slice(0, 80).forEach((p) => add(p, 'shop'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, sel, show.hospitals, show.shops, aroundKey, radius]);

  useEffect(() => { const f = L_.current.farm; if (f && map.current) { if (me) map.current.removeLayer(f); else map.current.addLayer(f); } }, [me]);

  // ---- actions ---------------------------------------------------------------
  function pick(type, id) {
    setSel({ type, id });
    if (type === 'vendor') setParams({ vendor: String(id) }, { replace: true });
    else setParams({}, { replace: true });
  }
  const clearSel = () => { setSel(null); setRoutes(null); setParams({}, { replace: true }); L_.current.route?.clearLayers(); };
  const fitAll = () => {
    const pts = [[origin.lat, origin.lng], ...withDist.map((v) => [v.lat, v.lng])];
    if (pts.length > 1) map.current.fitBounds(pts, { padding: [60, 60] });
  };
  const focus = (type, item) => { pick(type, type === 'vendor' ? item.vendor_id : item.id); map.current.flyTo([item.lat, item.lng], Math.max(map.current.getZoom(), 15), { duration: 0.7 }); };

  const route = routes?.[mode];
  const status = {
    locating: ['pending', 'Finding your location…'],
    ok: me?.manual ? ['manual', 'Using the position you placed on the map'] : ['live', `Live location${me?.accuracy ? `, accurate to about ${Math.round(me.accuracy)} m` : ''}${me?.ts ? `, updated ${timeOf(me.ts)}` : ''}`],
    denied: ['warn', 'Location permission was blocked. Showing distances from the farm.'],
    unavailable: ['warn', 'Your device could not determine a location. Showing distances from the farm.'],
    insecure: ['warn', 'Location needs a secure (https) page. Showing distances from the farm.'],
    idle: ['pending', 'Waiting for location…'],
  }[geo];

  return (
    <>
      <PageHeader title="Vendor map" subtitle="Where vendors are, how long it takes to reach them, and the hospitals and shops around you.">
        <div className="seg" role="group" aria-label="Travel mode">
          {MODES.map((m) => (
            <button key={m.id} className={mode === m.id ? 'on' : ''} onClick={() => setMode(m.id)}><Icon name={MODE_ICON[m.id]} size={15} />{m.label}</button>
          ))}
        </div>
      </PageHeader>

      <div className={`geo-bar ${status[0]}`} role="status">
        <span className="geo-dot" />
        <span className="geo-text">{status[1]}</span>
        <span className="geo-actions">
          <button className="btn ghost sm" onClick={() => { locate(); setPlacing(false); }}><Icon name="locate" size={14} /> {geo === 'ok' && !me?.manual ? 'Refresh' : 'Locate me'}</button>
          <button className={`btn sm ${placing ? '' : 'ghost'}`} onClick={() => setPlacing((p) => !p)}><Icon name="pin" size={14} /> {placing ? 'Click the map…' : 'Set position manually'}</button>
        </span>
      </div>

      <div className="map-page">
        <aside className="map-side">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'vendors'} className={tab === 'vendors' ? 'on' : ''} onClick={() => setTab('vendors')}>Vendors <i>{vendors.length}</i></button>
            <button role="tab" aria-selected={tab === 'hospitals'} className={tab === 'hospitals' ? 'on' : ''} onClick={() => setTab('hospitals')}>Hospitals <i>{places.hospitals.length}</i></button>
            <button role="tab" aria-selected={tab === 'shops'} className={tab === 'shops' ? 'on' : ''} onClick={() => setTab('shops')}>Shops <i>{places.shops.length}</i></button>
          </div>

          {tab === 'vendors' ? (
            <>
              <div className="side-tools"><input className="search" placeholder="Search vendors or areas…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search vendors" /></div>
              {unmapped.length > 0 && !q && (
                <div className="p-note"><Icon name="alert" size={15} /> <span>{unmapped.length} vendor{unmapped.length > 1 ? 's have' : ' has'} no pin yet: {unmapped.map((v) => v.vendor_name).join(', ')}. <Link to="/vendors">Add locations</Link></span></div>
              )}
              <ul className="plist">
                {list.map((v) => {
                  const t = times[v.vendor_id];
                  return (
                    <li key={v.vendor_id}>
                      <button className={sel?.type === 'vendor' && sel.id === v.vendor_id ? 'on' : ''} onClick={() => focus('vendor', v)}>
                        <span className="p-ico vendor"><Icon name="pin" size={16} /></span>
                        <span className="p-main"><b>{v.vendor_name}</b><small>{v.location}</small></span>
                        <span className="p-meta"><b>{t?.duration != null ? fmtDuration(t.duration) : fmtDistance(v.straight)}</b><small>{t?.duration != null ? fmtDistance(t.distance ?? v.straight) : 'straight line'}</small></span>
                      </button>
                    </li>
                  );
                })}
                {list.length === 0 && <li className="p-empty">No mapped vendors match.</li>}
              </ul>
              <div className="side-foot-note">Times shown are driving from {originLabel}. Select a vendor for walking and cycling too.</div>
            </>
          ) : (
            <>
              <div className="side-tools stack">
                <div className="seg full" role="group" aria-label="Search around">
                  <button className={around === 'me' ? 'on' : ''} onClick={() => setAround('me')}>Around {me ? 'me' : 'the farm'}</button>
                  <button className={around === 'vendor' ? 'on' : ''} disabled={!selVendor} onClick={() => setAround('vendor')} title={selVendor ? '' : 'Select a vendor first'}>Around vendor</button>
                </div>
                <label className="radius">Within
                  <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>{RADII.map((r) => <option key={r} value={r}>{r / 1000} km</option>)}</select>
                </label>
              </div>
              <ul className="plist">
                {placesState.loading && <li className="p-empty"><span className="spinner sm" /> Searching nearby…</li>}
                {placesState.error && <li className="p-empty err">{placesState.error}</li>}
                {!placesState.loading && !placesState.error && (tab === 'hospitals' ? places.hospitals : places.shops).length === 0 && (
                  <li className="p-empty">Nothing found within {radius / 1000} km. Try a larger radius.</li>
                )}
                {!placesState.loading && (tab === 'hospitals' ? places.hospitals : places.shops).slice(0, 40).map((p) => (
                  <li key={p.id}>
                    <button className={sel?.id === p.id ? 'on' : ''} onClick={() => focus(tab === 'hospitals' ? 'hospital' : 'shop', p)}>
                      <span className={`p-ico ${tab === 'hospitals' ? 'med' : 'shop'}`}><Icon name={tab === 'hospitals' ? 'cross' : 'bag'} size={16} /></span>
                      <span className="p-main"><b>{p.name}</b><small>{p.label}{p.emergency ? ', emergency' : ''}</small></span>
                      <span className="p-meta"><b>{fmtDistance(p.distance)}</b><small>from {around === 'vendor' && selVendor ? 'vendor' : me ? 'you' : 'farm'}</small></span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="side-foot-note">Place data from OpenStreetMap contributors, so small shops may be missing.</div>
            </>
          )}
        </aside>

        <section className="map-wrap">
          <div ref={el} className="map" />

          <div className="map-chips" role="group" aria-label="Map layers">
            {[['vendors', 'Vendors', 'vendor'], ['hospitals', 'Hospitals', 'med'], ['shops', 'Shops', 'shop']].map(([k, l, c]) => (
              <button key={k} className={`chip ${show[k] ? 'on' : ''}`} onClick={() => setShow({ ...show, [k]: !show[k] })} aria-pressed={show[k]}><i className={`sw ${c}`} />{l}</button>
            ))}
          </div>
          <div className="map-fabs">
            <button className="fab" onClick={flyToMe} disabled={!me} title="Centre on my location" aria-label="Centre on my location"><Icon name="locate" size={20} /></button>
            <button className="fab" onClick={fitAll} title="Show all vendors" aria-label="Show all vendors"><Icon name="map" size={20} /></button>
          </div>
          {placing && <div className="map-banner">Click anywhere on the map to set your position</div>}

          {target && (
            <div className="detail">
              <button className="icon-btn detail-x" onClick={clearSel} aria-label="Close details"><Icon name="close" size={16} /></button>
              <div className="detail-head">
                <span className={`p-ico ${selVendor ? 'vendor' : selPlace.kind === 'hospital' || selPlace.kind === 'clinic' ? 'med' : 'shop'}`}><Icon name={selVendor ? 'pin' : sel.type === 'hospital' ? 'cross' : 'bag'} size={18} /></span>
                <div>
                  <h3>{selVendor ? selVendor.vendor_name : selPlace.name}</h3>
                  <p>{selVendor ? selVendor.location : selPlace.label}</p>
                </div>
              </div>

              <div className="modes">
                {MODES.map((m) => {
                  const r = routes?.[m.id];
                  return (
                    <button key={m.id} className={mode === m.id ? 'on' : ''} onClick={() => setMode(m.id)}>
                      <Icon name={MODE_ICON[m.id]} size={16} />
                      <b>{routing || !r ? '…' : fmtDuration(r.duration)}</b>
                      <small>{routing || !r ? 'calculating' : `${fmtDistance(r.distance)}${r.approx ? ' est.' : ''}`}</small>
                    </button>
                  );
                })}
              </div>
              <p className="detail-from">From {originLabel}{route?.approx ? '. Road routing is unavailable, so this is an estimate.' : ''}</p>

              {selVendor && (
                <div className="detail-rows">
                  <div><span>Phone</span><a href={`tel:${selVendor.phone_number.replace(/\s/g, '')}`}>{selVendor.phone_number}</a></div>
                  <div><span>Owes you</span>{selVendor.outstanding_balance > 0 ? <b className="bad-text">{money(selVendor.outstanding_balance)}</b> : <Badge value="PAID" />}</div>
                </div>
              )}
              {selPlace && (selPlace.phone || selPlace.hours) && (
                <div className="detail-rows">
                  {selPlace.phone && <div><span>Phone</span><a href={`tel:${selPlace.phone.replace(/\s/g, '')}`}>{selPlace.phone}</a></div>}
                  {selPlace.hours && <div><span>Hours</span><b>{selPlace.hours}</b></div>}
                </div>
              )}
              <div className="detail-foot">
                <a className="btn sm" href={directionsUrl(origin, target, mode)} target="_blank" rel="noreferrer">Open directions <Icon name="external" size={14} /></a>
                {selVendor && <button className="btn ghost sm" onClick={() => { setAround('vendor'); setTab('hospitals'); }}>Hospitals near vendor</button>}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
