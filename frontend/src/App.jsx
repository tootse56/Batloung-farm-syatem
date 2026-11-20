
import { useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import Icon from './components/Icon.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Suppliers from './pages/Suppliers.jsx';
import Inventory from './pages/Inventory.jsx';
import Vendors from './pages/Vendors.jsx';
import VendorMap from './pages/VendorMap.jsx';
import Purchases from './pages/Purchases.jsx';
import Sales from './pages/Sales.jsx';
import Payments from './pages/Payments.jsx';
import Reports from './pages/Reports.jsx';
import Login from './pages/Login.jsx';
import VendorOrders from './pages/VendorOrders.jsx';
import { getStoredUser, setAuthToken } from './api.js';

const GROUPS = [
  ['Overview', [['/', 'Dashboard', 'dashboard'], ['/reports', 'Reports', 'chart']]],
  ['Trading', [['/inventory', 'Fruits and stock', 'box'], ['/purchases', 'Purchases', 'truck'], ['/sales', 'Sales', 'receipt'], ['/payments', 'Payments', 'wallet']]],
  ['Network', [['/vendors', 'Vendors', 'users'], ['/map', 'Vendor map', 'map'], ['/suppliers', 'Suppliers', 'building']]],
];

export default function App() {
  const [user, setUser] = useState(getStoredUser);
  const logout = () => { setAuthToken(''); setUser(null); };
  if (!user) return <Login onLogin={setUser} />;
  if (user.role === 'vendor') return <div className="vendor-shell"><VendorOrders user={user} onLogout={logout} /></div>;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Icon name="fruit" size={22} /></div>
          <div><h1>Batloung Farm</h1><span>Distribution management</span></div>
        </div>
        <nav className="nav" aria-label="Main">
          {GROUPS.map(([group, links]) => (
            <div className="nav-group" key={group}>
              <span className="nav-label">{group}</span>
              {links.map(([to, label, ico]) => (
                <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
                  <Icon name={ico} size={18} />{label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot">Signed in as {user.role}<br />Maseru, Lesotho<br />Amounts in Maloti (M)<button className="btn ghost sm" style={{ marginTop: 12 }} onClick={logout}>Log out</button></div>
      </aside>
      <main className="main">
        <button
          className="btn ghost sm"
          onClick={logout}
          style={{ position: 'fixed', top: 14, right: 20, zIndex: 1000 }}
          type="button"
        >
          Log out
        </button>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/map" element={<VendorMap />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<div className="card">Page not found.</div>} />
        </Routes>
      </main>
    </div>
  );
}
