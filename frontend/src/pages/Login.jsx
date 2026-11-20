
import { useState } from 'react';
import { api, setAuthToken } from '../api.js';

export default function Login({ onLogin }) {
  const [role, setRole] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const body = role === 'vendor'
        ? { role, vendor_id: vendorId, phone_number: phone }
        : { role, username, password };
      const result = await api.post('/auth/login', body);
      setAuthToken(result.token, result.user);
      onLogin(result.user);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand"><div className="brand-mark">BF</div><div><h1>Batloung Farm</h1><span>Distribution management</span></div></div>
        <h2>Sign in</h2>
        <p className="muted">Choose your account type to continue.</p>
        <div className="login-roles">
          {['admin', 'sales', 'vendor'].map((r) => <button type="button" key={r} className={role === r ? 'selected' : ''} onClick={() => { setRole(r); setError(''); }}>{r === 'admin' ? 'Admin' : r === 'sales' ? 'Sales' : 'Vendor'}</button>)}
        </div>
        {role === 'vendor' ? <>
          <label className="field"><span>Vendor ID</span><input required inputMode="numeric" value={vendorId} onChange={(e) => setVendorId(e.target.value)} placeholder="Your vendor ID" /></label>
          <label className="field"><span>Registered phone number</span><input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number on your vendor record" /></label>
          <small className="muted">Use the vendor ID and phone number registered by Batloung Farm.</small>
        </> : <>
          <label className="field"><span>Username</span><input required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} /></label>
          <label className="field"><span>Password</span><input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        </>}
        {error && <div className="login-error">{error}</div>}
        <button className="btn login-submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
