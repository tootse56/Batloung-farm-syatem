// Minimal stroke icon set (24x24). Replaces all emoji in the interface.
const P = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  box: <><path d="M21 8l-9-5-9 5v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></>,
  truck: <><path d="M2 6h11v10H2zM13 9h4l4 4v3h-8z" /><circle cx="6.5" cy="17.5" r="1.8" /><circle cx="17.5" cy="17.5" r="1.8" /></>,
  receipt: <><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
  wallet: <><path d="M3 7a2 2 0 012-2h13v4" /><path d="M3 7v11a2 2 0 002 2h15V9H5a2 2 0 01-2-2z" /><circle cx="16.5" cy="14.5" r="1.2" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" /><path d="M16 4.7a3.5 3.5 0 010 6.6M18.5 14.8c1.8.7 2.8 2.3 3 5.2" /></>,
  building: <><path d="M4 21V5l8-2v18M12 9l8 2v10M3 21h18" /><path d="M8 8h1M8 12h1M8 16h1M16 15h1M16 18h1" /></>,
  chart: <><path d="M4 20V4M4 20h16" /><path d="M8 16v-4M12 16V8M16 16v-7" /></>,
  map: <><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>,
  pin: <><path d="M12 21s7-6.2 7-11.5a7 7 0 10-14 0C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  locate: <><circle cx="12" cy="12" r="3.5" /><circle cx="12" cy="12" r="8" /><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" /></>,
  cross: <><rect x="3.5" y="3.5" width="17" height="17" rx="3" /><path d="M12 8v8M8 12h8" /></>,
  bag: <><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 016 0v2" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1.5 1.5 0 01-1.5 1.5C10.5 20.5 3.5 13.5 3.5 5.5A1.5 1.5 0 015 4z" />,
  car: <><path d="M4 16v-4l2-5h12l2 5v4zM4 16v2.5M20 16v2.5" /><circle cx="8" cy="13.5" r=".8" /><circle cx="16" cy="13.5" r=".8" /></>,
  walk: <><circle cx="13" cy="4.5" r="1.8" /><path d="M10 21l2-6-2.5-2.5L11 8l-3 2v3M14 8l2 4 3 1M12 15l3 2v4" /></>,
  bike: <><circle cx="6" cy="16" r="3.5" /><circle cx="18" cy="16" r="3.5" /><path d="M6 16l4-8h5l3 8M10 8H8M13 12H8.5" /></>,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />,
  alert: <><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></>,
  fruit: <><path d="M12 8c-3-2-8-1-8 5 0 4 3 8 6 8 1 0 1.5-.5 2-.5s1 .5 2 .5c3 0 6-4 6-8 0-6-5-7-8-5z" /><path d="M12 8c0-2 1-4 3-5" /></>,
};
export default function Icon({ name, size = 18, className = '', ...rest }) {
  return (
    <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {P[name]}
    </svg>
  );
}
