import L from 'leaflet';

const svg = (inner) => `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const GLYPH = {
  vendor: svg('<path d="M4 9l1.5-5h13L20 9M4 9h16M4 9v11h16V9M9 20v-6h6v6"/>'),
  hospital: svg('<path d="M12 6v12M6 12h12"/>'),
  clinic: svg('<path d="M12 7v10M7 12h10"/>'),
  shop: svg('<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2"/>'),
  farm: svg('<path d="M3 11l9-7 9 7M5 10v10h14V10"/>'),
};

const badge = (cls, glyph, size = 30) => L.divIcon({
  className: 'mk-wrap', iconSize: [size, size], iconAnchor: [size / 2, size / 2], tooltipAnchor: [size / 2, 0],
  html: `<span class="mk ${cls}" style="width:${size}px;height:${size}px">${glyph}</span>`,
});

export const vendorIcon = (selected) => badge(`vendor${selected ? ' sel' : ''}`, GLYPH.vendor, selected ? 38 : 30);
export const placeIcon = (kind, selected) => badge(`${kind === 'hospital' || kind === 'clinic' ? 'med' : 'shop'}${selected ? ' sel' : ''}`, kind === 'hospital' ? GLYPH.hospital : kind === 'clinic' ? GLYPH.clinic : GLYPH.shop, selected ? 34 : kind === 'hospital' ? 28 : 24);
export const farmIcon = () => badge('farm', GLYPH.farm, 32);
export const pickIcon = () => badge('vendor sel', GLYPH.vendor, 36);
export const meIcon = () => L.divIcon({
  className: 'mk-wrap', iconSize: [44, 44], iconAnchor: [22, 22],
  html: '<span class="me"><i class="me-pulse"></i><i class="me-pulse d2"></i><i class="me-dot"></i></span>',
});

export const TILES = {
  street: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }],
  light: ['https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd', attribution: '&copy; OpenStreetMap contributors &copy; CARTO' }],
};
