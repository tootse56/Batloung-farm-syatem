// Geo helpers: distance maths, routing (OSRM), nearby places (Overpass) and geocoding (Nominatim).
// All services are free, key-less OpenStreetMap-ecosystem endpoints.

// Starting point used when the device location is unavailable. Override in frontend/.env.
export const FARM = {
  name: 'Batloung Farm',
  lat: Number(import.meta.env.VITE_FARM_LAT) || -29.3167,
  lng: Number(import.meta.env.VITE_FARM_LNG) || 27.4833,
};

export const hasCoords = (v) => v && v.latitude != null && v.longitude != null && !Number.isNaN(Number(v.latitude));

export function haversine(a, b) {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const fmtDistance = (m) => (m == null ? '-' : m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`);
export function fmtDuration(s) {
  if (s == null) return '-';
  const min = Math.max(1, Math.round(s / 60));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export const MODES = [
  { id: 'driving', label: 'Drive', host: 'routed-car', speed: 45 },
  { id: 'cycling', label: 'Cycle', host: 'routed-bike', speed: 15 },
  { id: 'walking', label: 'Walk', host: 'routed-foot', speed: 5 },
];

// Straight-line estimate used only when the routing service cannot be reached.
const estimate = (a, b, mode) => {
  const dist = haversine(a, b) * 1.3;
  return { distance: dist, duration: (dist / 1000 / MODES.find((m) => m.id === mode).speed) * 3600, geometry: [[a.lat, a.lng], [b.lat, b.lng]], approx: true };
};

async function routeOne(a, b, mode) {
  const host = MODES.find((m) => m.id === mode).host;
  const url = `https://routing.openstreetmap.de/${host}/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 12000);
    const res = await fetch(url, { signal: ctl.signal });
    clearTimeout(t);
    const json = await res.json();
    const r = json.routes?.[0];
    if (!r) throw new Error('no route');
    return { distance: r.distance, duration: r.duration, geometry: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]), approx: false };
  } catch {
    return estimate(a, b, mode);
  }
}

// Returns { driving, cycling, walking } each with distance (m), duration (s), geometry ([lat,lng][]).
export async function routeAll(a, b) {
  const [driving, cycling, walking] = await Promise.all(MODES.map((m) => routeOne(a, b, m.id)));
  return { driving, cycling, walking };
}

const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const cache = new Map();

export const SHOP_LABELS = {
  supermarket: 'Supermarket', convenience: 'Convenience store', general: 'General store', greengrocer: 'Greengrocer', chemist: 'Pharmacy',
  bakery: 'Bakery', butcher: 'Butcher', clothes: 'Clothing', hardware: 'Hardware', mobile_phone: 'Mobile phones', kiosk: 'Kiosk', wholesale: 'Wholesale',
};

// Hospitals/clinics and shops within `radius` metres of `center`, nearest first.
export async function nearbyPlaces(center, radius) {
  const key = `${center.lat.toFixed(3)},${center.lng.toFixed(3)},${radius}`;
  if (cache.has(key)) return cache.get(key);
  const q = `[out:json][timeout:25];(nwr["amenity"~"^(hospital|clinic)$"](around:${radius},${center.lat},${center.lng});nwr["shop"](around:${radius},${center.lat},${center.lng}););out center tags 250;`;
  let json = null;
  for (const ep of OVERPASS) {
    try {
      const res = await fetch(ep, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (res.ok) { json = await res.json(); break; }
    } catch { /* try next endpoint */ }
  }
  if (!json) throw new Error('The nearby-places service is not responding. Try again in a moment.');
  const out = { hospitals: [], shops: [] };
  for (const el of json.elements || []) {
    const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon;
    if (lat == null) continue;
    const t = el.tags || {};
    const isMed = t.amenity === 'hospital' || t.amenity === 'clinic';
    const place = {
      id: `${el.type}/${el.id}`, lat, lng, distance: haversine(center, { lat, lng }),
      name: t.name || (isMed ? (t.amenity === 'hospital' ? 'Hospital' : 'Clinic') : SHOP_LABELS[t.shop] || 'Shop'),
      kind: isMed ? t.amenity : t.shop,
      label: isMed ? (t.amenity === 'hospital' ? 'Hospital' : 'Clinic') : SHOP_LABELS[t.shop] || 'Shop',
      phone: t.phone || t['contact:phone'] || null, hours: t.opening_hours || null, emergency: t.emergency === 'yes',
    };
    (isMed ? out.hospitals : out.shops).push(place);
  }
  out.hospitals.sort((a, b) => (a.kind === b.kind ? a.distance - b.distance : a.kind === 'hospital' ? -1 : 1));
  out.shops.sort((a, b) => a.distance - b.distance);
  cache.set(key, out);
  return out;
}

export async function geocode(text) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ls&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const json = await res.json();
  if (!json.length) return null;
  return { lat: Number(json[0].lat), lng: Number(json[0].lon), label: json[0].display_name };
}

export const directionsUrl = (from, to, mode = 'driving') =>
  `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=${mode === 'cycling' ? 'bicycling' : mode}`;

// Driving duration/distance from one origin to many vendors in a single request (best effort).
export async function driveTable(origin, vendors) {
  const pts = vendors.filter(hasCoords);
  if (!pts.length) return {};
  const coords = [origin, ...pts.map((v) => ({ lat: Number(v.latitude), lng: Number(v.longitude) }))].map((p) => `${p.lng},${p.lat}`).join(';');
  try {
    const res = await fetch(`https://routing.openstreetmap.de/routed-car/table/v1/driving/${coords}?sources=0&annotations=duration,distance`);
    const json = await res.json();
    const d = json.durations?.[0], m = json.distances?.[0];
    if (!d) return {};
    const out = {};
    pts.forEach((v, i) => { if (d[i + 1] != null) out[v.vendor_id] = { duration: d[i + 1], distance: m?.[i + 1] }; });
    return out;
  } catch { return {}; }
}
