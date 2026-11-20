import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FARM, geocode } from '../lib/geo.js';
import { TILES, pickIcon } from '../lib/mapIcons.js';
import Icon from './Icon.jsx';

// Small map for pinning a vendor. Click the map or drag the pin; or search by the typed location name.
export default function LocationPicker({ value, onChange, searchText }) {
  const el = useRef(null), map = useRef(null), marker = useRef(null), cb = useRef(onChange);
  const [msg, setMsg] = useState('');
  cb.current = onChange;

  const place = (lat, lng, pan = true) => {
    const ll = [lat, lng];
    if (!marker.current) {
      marker.current = L.marker(ll, { icon: pickIcon(), draggable: true }).addTo(map.current);
      marker.current.on('dragend', () => { const p = marker.current.getLatLng(); cb.current({ latitude: +p.lat.toFixed(6), longitude: +p.lng.toFixed(6) }); });
    } else marker.current.setLatLng(ll);
    if (pan) map.current.setView(ll, Math.max(map.current.getZoom(), 15));
  };

  useEffect(() => {
    const has = value && value.latitude != null && value.latitude !== '';
    map.current = L.map(el.current, { zoomControl: true }).setView(has ? [value.latitude, value.longitude] : [FARM.lat, FARM.lng], has ? 15 : 12);
    L.tileLayer(...TILES.street).addTo(map.current);
    if (has) place(Number(value.latitude), Number(value.longitude), false);
    map.current.on('click', (e) => { place(e.latlng.lat, e.latlng.lng, false); cb.current({ latitude: +e.latlng.lat.toFixed(6), longitude: +e.latlng.lng.toFixed(6) }); setMsg(''); });
    setTimeout(() => map.current && map.current.invalidateSize(), 60);
    return () => { map.current.remove(); marker.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const find = async () => {
    if (!searchText?.trim()) return setMsg('Type the vendor location above first.');
    setMsg('Searching…');
    try {
      const r = await geocode(`${searchText}, Lesotho`);
      if (!r) return setMsg('No match found. Click the map to place the pin instead.');
      place(r.lat, r.lng); onChange({ latitude: +r.lat.toFixed(6), longitude: +r.lng.toFixed(6) });
      setMsg('Pin placed. Drag it to the exact spot if needed.');
    } catch { setMsg('Search is unavailable right now. Click the map to place the pin.'); }
  };
  const mine = () => {
    if (!navigator.geolocation) return setMsg('This browser cannot share its location.');
    setMsg('Getting your position…');
    navigator.geolocation.getCurrentPosition(
      (p) => { place(p.coords.latitude, p.coords.longitude); onChange({ latitude: +p.coords.latitude.toFixed(6), longitude: +p.coords.longitude.toFixed(6) }); setMsg('Pin placed at your current position.'); },
      () => setMsg('Location permission was not granted.'), { enableHighAccuracy: true, timeout: 15000 });
  };
  const clear = () => { if (marker.current) { marker.current.remove(); marker.current = null; } onChange({ latitude: '', longitude: '' }); setMsg('Pin removed.'); };

  return (
    <div className="picker">
      <div className="picker-bar">
        <button type="button" className="btn ghost sm" onClick={find}><Icon name="search" size={14} /> Find on map</button>
        <button type="button" className="btn ghost sm" onClick={mine}><Icon name="locate" size={14} /> Use my position</button>
        {value?.latitude !== '' && value?.latitude != null && <button type="button" className="btn ghost sm" onClick={clear}>Remove pin</button>}
      </div>
      <div ref={el} className="picker-map" />
      <small className="muted">{msg || (value?.latitude !== '' && value?.latitude != null ? `Pinned at ${Number(value.latitude).toFixed(5)}, ${Number(value.longitude).toFixed(5)}` : 'Click the map to drop a pin on the vendor\'s exact position.')}</small>
    </div>
  );
}
